import { createHash } from 'node:crypto';

type ApiRequest = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};
type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: Record<string, unknown>) => void;
  setHeader: (name: string, value: string) => void;
};

function env(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
function originAllowed(request: ApiRequest) {
  const origin = firstHeader(request.headers.origin);
  if (!origin) return true;
  try {
    return ['doitbad.tech', 'www.doitbad.tech', process.env.VERCEL_URL]
      .filter(Boolean)
      .includes(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ ok: false });
    return;
  }
  if (!originAllowed(request)) {
    response.status(403).json({ ok: false });
    return;
  }

  const input = (request.body ?? {}) as { action?: unknown; token?: unknown };
  const queryAction = firstHeader(request.query?.action);
  const queryToken = firstHeader(request.query?.token);
  const rawAction = input.action ?? queryAction;
  const action = rawAction === 'confirm' || rawAction === 'unsubscribe' ? rawAction : null;
  const rawToken = input.token ?? queryToken;
  const token = typeof rawToken === 'string' ? rawToken : '';
  if (!action || token.length < 32 || token.length > 128) {
    response.status(400).json({ ok: false });
    return;
  }

  try {
    const key = env('SUPABASE_SERVICE_ROLE_KEY');
    const rpc = action === 'confirm' ? 'confirm_waitlist_signup' : 'unsubscribe_waitlist_signup';
    const upstream = await fetch(`${env('SUPABASE_URL')}/rest/v1/rpc/${rpc}`, {
      method: 'POST',
      signal: AbortSignal.timeout(8_000),
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_token_hash: createHash('sha256').update(token).digest('hex'),
      }),
    });
    if (!upstream.ok) throw new Error('Preference update failed');
    const changed = (await upstream.json()) as boolean;
    response.status(changed ? 200 : 404).json({ ok: changed });
  } catch {
    console.error('Waitlist preference request failed');
    response.status(500).json({ ok: false });
  }
}
