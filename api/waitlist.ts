import { createHash, createHmac, randomBytes } from 'node:crypto';

import { buildConfirmationEmail } from './confirmation-email.js';

type ApiRequest = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
};
type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: Record<string, unknown>) => void;
  setHeader: (name: string, value: string) => void;
};
type WaitlistInput = {
  name?: unknown;
  email?: unknown;
  locale?: unknown;
  turnstileToken?: unknown;
};
type RegistrationResult = {
  result: 'created' | 'pending_recent' | 'already_subscribed' | 'renewed';
  signup_id: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_LOCALES = new Set(['pt-BR', 'en', 'es', 'de']);
const UPSTREAM_TIMEOUT_MS = 8_000;

function env(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
function allowedHostnames() {
  const configured = process.env.TURNSTILE_ALLOWED_HOSTNAMES?.split(',') ?? [];
  return new Set(
    ['doitbad.tech', 'www.doitbad.tech', process.env.VERCEL_URL, ...configured]
      .map((hostname) => hostname?.trim().toLowerCase())
      .filter((hostname): hostname is string => Boolean(hostname)),
  );
}
function requestOriginAllowed(request: ApiRequest) {
  const origin = firstHeader(request.headers.origin);
  if (!origin) return true;
  try {
    return allowedHostnames().has(new URL(origin).hostname.toLowerCase());
  } catch {
    return false;
  }
}
function stripControlCharacters(value: string) {
  return Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? ' ' : character;
  }).join('');
}
function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
function rateLimitKey(request: ApiRequest) {
  const forwarded = firstHeader(request.headers['x-forwarded-for']);
  const address = forwarded?.split(',')[0]?.trim() || request.socket?.remoteAddress || 'unknown';
  return createHmac('sha256', env('WAITLIST_RATE_LIMIT_SALT')).update(address).digest('hex');
}
async function supabaseRpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const result = await fetch(`${env('SUPABASE_URL')}/rest/v1/rpc/${name}`, {
    method: 'POST',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!result.ok) throw new Error(`Supabase RPC ${name} failed`);
  return (await result.json()) as T;
}
async function consumeRateLimit(request: ApiRequest) {
  return supabaseRpc<boolean>('consume_waitlist_rate_limit', {
    p_key: rateLimitKey(request),
    p_limit: 5,
    p_window_seconds: 900,
  });
}
async function verifyTurnstile(token: string, remoteIp?: string) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    body: new URLSearchParams({
      secret: env('TURNSTILE_SECRET_KEY'),
      response: token,
      ...(remoteIp ? { remoteip: remoteIp } : {}),
    }),
  });
  const result = (await response.json()) as {
    success?: boolean;
    hostname?: string;
    action?: string;
  };
  const hostname = result.hostname?.toLowerCase();
  return (
    response.ok &&
    result.success === true &&
    result.action === 'waitlist' &&
    Boolean(hostname && allowedHostnames().has(hostname))
  );
}
async function registerSignup(input: {
  name: string | null;
  email: string;
  locale: string;
  confirmationTokenHash: string;
  unsubscribeTokenHash: string;
}) {
  const rows = await supabaseRpc<RegistrationResult[]>('register_waitlist_signup', {
    p_name: input.name,
    p_email: input.email,
    p_locale: input.locale,
    p_confirmation_token_hash: input.confirmationTokenHash,
    p_unsubscribe_token_hash: input.unsubscribeTokenHash,
  });
  if (!rows[0]) throw new Error('Registration returned no result');
  return rows[0];
}
async function releaseEmailReservation(signupId: string, confirmationTokenHash: string) {
  await supabaseRpc('release_waitlist_email_reservation', {
    p_signup_id: signupId,
    p_confirmation_token_hash: confirmationTokenHash,
  });
}
async function sendConfirmation(input: {
  name: string | null;
  email: string;
  locale: string;
  confirmationToken: string;
  unsubscribeToken: string;
}) {
  const email = buildConfirmationEmail(input);
  const result = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${env('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env('RESEND_FROM_EMAIL'),
      to: [input.email],
      reply_to: process.env.RESEND_REPLY_TO?.trim() || undefined,
      subject: email.subject,
      html: email.html,
      text: email.text,
      headers: {
        'List-Unsubscribe': `<${email.oneClickUnsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });
  if (!result.ok) throw new Error('Resend delivery request failed');
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ ok: false });
    return;
  }
  const contentType = firstHeader(request.headers['content-type']);
  if (!contentType?.toLowerCase().startsWith('application/json')) {
    response.status(415).json({ ok: false });
    return;
  }
  if (!requestOriginAllowed(request)) {
    response.status(403).json({ ok: false });
    return;
  }

  try {
    const input = (request.body ?? {}) as WaitlistInput;
    const name =
      typeof input.name === 'string'
        ? stripControlCharacters(input.name).trim().slice(0, 80) || null
        : null;
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const locale =
      typeof input.locale === 'string' && ALLOWED_LOCALES.has(input.locale)
        ? input.locale
        : 'pt-BR';
    const token = typeof input.turnstileToken === 'string' ? input.turnstileToken : '';

    if (!EMAIL_PATTERN.test(email) || email.length > 254 || !token || token.length > 2048) {
      response.status(400).json({ ok: false });
      return;
    }
    if (!(await consumeRateLimit(request))) {
      response.setHeader('Retry-After', '900');
      response.status(429).json({ ok: false, reason: 'rate_limited' });
      return;
    }

    const forwarded = firstHeader(request.headers['x-forwarded-for']);
    const remoteIp = forwarded?.split(',')[0]?.trim() || request.socket?.remoteAddress;
    if (!(await verifyTurnstile(token, remoteIp))) {
      response.status(400).json({ ok: false });
      return;
    }

    const confirmationToken = randomBytes(32).toString('base64url');
    const unsubscribeToken = randomBytes(32).toString('base64url');
    const confirmationTokenHash = tokenHash(confirmationToken);
    const registration = await registerSignup({
      name,
      email,
      locale,
      confirmationTokenHash,
      unsubscribeTokenHash: tokenHash(unsubscribeToken),
    });
    if (registration.result === 'already_subscribed' || registration.result === 'pending_recent') {
      response.status(200).json({ ok: true, duplicate: true });
      return;
    }

    try {
      await sendConfirmation({ name, email, locale, confirmationToken, unsubscribeToken });
    } catch {
      await releaseEmailReservation(registration.signup_id, confirmationTokenHash).catch(
        () => undefined,
      );
      response.status(502).json({ ok: false, reason: 'email_unavailable' });
      return;
    }
    response.status(201).json({ ok: true, confirmationRequired: true });
  } catch {
    console.error('Waitlist request failed');
    response.status(500).json({ ok: false });
  }
}
