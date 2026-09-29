import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

import waitlistHandler from '../api/waitlist';

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
