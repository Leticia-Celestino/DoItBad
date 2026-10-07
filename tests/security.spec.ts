import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

import waitlistHandler from '../api/waitlist';
import preferenceHandler from '../api/waitlist-preferences';

function responseRecorder() {
  const record = { status: 200, body: {} as Record<string, unknown>, headers: new Map() };
  const response = {
    status(code: number) {
      record.status = code;
      return response;
    },
    json(body: Record<string, unknown>) {
      record.body = body;
    },
    setHeader(name: string, value: string) {
      record.headers.set(name.toLowerCase(), value);
    },
  };
  return { record, response };
}

test('declares a restrictive production security policy compatible with Turnstile', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8')) as {
    headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
  };
  const headers = new Map(config.headers?.[0]?.headers.map(({ key, value }) => [key, value]));
  const csp = headers.get('Content-Security-Policy') ?? '';

  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain('script-src');
  expect(csp).toContain('frame-src https://challenges.cloudflare.com');
  expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
  expect(headers.get('X-Frame-Options')).toBe('DENY');
  expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
});

test('binds the Turnstile challenge to the waitlist action', async ({ page }) => {
  await page.goto('/pt-br/');
  const widget = page.locator('.cf-turnstile');

  if (await widget.count()) {
    await expect(widget).toHaveAttribute('data-action', 'waitlist');
  }
});

test('rejects cross-origin waitlist requests before contacting an upstream service', async () => {
  const { record, response } = responseRecorder();
  await waitlistHandler(
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://attacker.example',
      },
      body: {},
    },
    response,
  );

  expect(record.status).toBe(403);
  expect(record.body).toEqual({ ok: false });
});

test('rejects oversized Turnstile tokens before any external request', async () => {
  const { record, response } = responseRecorder();
  await waitlistHandler(
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://doitbad.tech',
      },
      body: {
        email: 'ada@example.com',
        locale: 'pt-BR',
        turnstileToken: 'x'.repeat(2049),
      },
    },
    response,
  );

  expect(record.status).toBe(400);
  expect(record.body).toEqual({ ok: false });
});

test('rejects invalid preference tokens before contacting Supabase', async () => {
  const { record, response } = responseRecorder();
  await preferenceHandler(
    {
      method: 'POST',
      headers: { origin: 'https://doitbad.tech' },
      body: { action: 'unsubscribe', token: 'short' },
    },
    response,
  );

  expect(record.status).toBe(400);
  expect(record.body).toEqual({ ok: false });
});

test('does not report success when Resend rejects the confirmation email', async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    WAITLIST_RATE_LIMIT_SALT: process.env.WAITLIST_RATE_LIMIT_SALT,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  };
  Object.assign(process.env, {
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
    TURNSTILE_SECRET_KEY: 'turnstile-test',
    WAITLIST_RATE_LIMIT_SALT: 'rate-limit-test',
    RESEND_API_KEY: 'resend-test',
    RESEND_FROM_EMAIL: 'DoItBad <test@doitbad.tech>',
  });
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith('/rpc/consume_waitlist_rate_limit')) {
      return new Response('true', { status: 200 });
    }
    if (url.includes('turnstile/v0/siteverify')) {
      return Response.json({
        success: true,
        hostname: 'doitbad.tech',
        action: 'waitlist',
      });
    }
    if (url.endsWith('/rpc/register_waitlist_signup')) {
      return Response.json([{ result: 'created', signup_id: crypto.randomUUID() }]);
    }
    if (url === 'https://api.resend.com/emails') {
      return Response.json({ message: 'provider unavailable' }, { status: 503 });
    }
    if (url.endsWith('/rpc/release_waitlist_email_reservation')) {
      return new Response('null', { status: 200 });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const { record, response } = responseRecorder();
    await waitlistHandler(
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://doitbad.tech',
          'x-forwarded-for': '203.0.113.8',
        },
        body: {
          email: 'ada@example.com',
          locale: 'pt-BR',
          turnstileToken: 'valid-token',
        },
      },
      response,
    );
    expect(record.status).toBe(502);
    expect(record.body).toEqual({ ok: false, reason: 'email_unavailable' });
  } finally {
    globalThis.fetch = originalFetch;
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
});
