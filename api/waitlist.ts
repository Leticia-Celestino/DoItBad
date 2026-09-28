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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_LOCALES = new Set(['pt-BR', 'en', 'es', 'de']);

function env(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function verifyTurnstile(token: string, remoteIp?: string) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: env('TURNSTILE_SECRET_KEY'),
      response: token,
      ...(remoteIp ? { remoteip: remoteIp } : {}),
    }),
  });
  const result = (await response.json()) as {
    success?: boolean;
    hostname?: string;
    'error-codes'?: string[];
  };
  return {
    valid: response.ok && result.success === true,
    hostname: result.hostname,
    errors: result['error-codes'] ?? [],
  };
}

async function saveSignup(input: { name: string | null; email: string; locale: string }) {
  const response = await fetch(`${env('SUPABASE_URL')}/rest/v1/waitlist_signups`, {
    method: 'POST',
    headers: {
      apikey: env('SUPABASE_SERVICE_ROLE_KEY'),
      Authorization: `Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(input),
  });

  return { ok: response.ok, duplicate: response.status === 409 };
}

async function sendConfirmation(input: { name: string | null; email: string }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) return;

  const safeName = input.name?.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[character];
  });

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [input.email],
      reply_to: process.env.RESEND_REPLY_TO?.trim() || undefined,
      subject: 'Você está na lista do DoItBad',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#34332f"><h1 style="font-size:24px">Um começo pequeno já conta.</h1><p>Olá${safeName ? `, ${safeName}` : ''}! Recebemos seu cadastro.</p><p>Vamos avisar quando houver novidades e quando o beta web estiver pronto para os primeiros testes.</p><p>Até logo,<br><strong>Equipe DoItBad</strong></p></div>`,
    }),
  });
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.status(405).json({ ok: false });
    return;
  }

  try {
    const input = (request.body ?? {}) as WaitlistInput;
    const name = typeof input.name === 'string' ? input.name.trim().slice(0, 80) || null : null;
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const locale =
      typeof input.locale === 'string' && ALLOWED_LOCALES.has(input.locale)
        ? input.locale
        : 'pt-BR';
    const token = typeof input.turnstileToken === 'string' ? input.turnstileToken : '';

    if (!EMAIL_PATTERN.test(email) || email.length > 254 || !token) {
      console.warn('Waitlist input rejected', {
        validEmail: EMAIL_PATTERN.test(email) && email.length <= 254,
        hasTurnstileToken: Boolean(token),
      });
      response.status(400).json({ ok: false });
      return;
    }

    const forwarded = request.headers['x-forwarded-for'];
    const remoteIp = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim() || request.socket?.remoteAddress;
    const turnstile = await verifyTurnstile(token, remoteIp);
    if (!turnstile.valid) {
      console.warn('Turnstile validation rejected', {
        hostname: turnstile.hostname,
        errors: turnstile.errors,
      });
      response.status(400).json({ ok: false });
      return;
    }

    const saved = await saveSignup({ name, email, locale });
    if (saved.duplicate) {
      response.status(200).json({ ok: true, duplicate: true });
      return;
    }
    if (!saved.ok) throw new Error('Supabase insert failed');

    await sendConfirmation({ name, email }).catch(() => undefined);
    response.status(201).json({ ok: true });
  } catch (error) {
    console.error('Waitlist request failed', error instanceof Error ? error.message : 'unknown');
    response.status(500).json({ ok: false });
  }
}
