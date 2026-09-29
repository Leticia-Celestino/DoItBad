import { expect, test } from '@playwright/test';

import { buildConfirmationEmail } from '../api/confirmation-email';

test('builds a branded localized confirmation with a plain-text fallback', () => {
  const email = buildConfirmationEmail({ name: 'Ada', locale: 'pt-BR' });

  expect(email.subject).toContain('Seu lugar está guardado');
  expect(email.html).toContain('DoIt<span style="color:#985033;">B</span>ad');
  expect(email.html).toContain('Olá, Ada!');
  expect(email.html).toContain('https://doitbad.tech/pt-br/');
  expect(email.text).toContain('ENQUANTO ISSO:');
  expect(email.text).toContain('https://doitbad.tech/pt-br/');
});

test('localizes content and escapes an untrusted display name', () => {
  const email = buildConfirmationEmail({ name: '<script>alert(1)</script>', locale: 'es' });

  expect(email.subject).toContain('Tu lugar está guardado');
  expect(email.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  expect(email.html).not.toContain('<script>alert(1)</script>');
  expect(email.html).toContain('https://doitbad.tech/es/');
});

test('renders the artistic composition without horizontal overflow', async ({ page }) => {
  const email = buildConfirmationEmail({ name: 'Ada', locale: 'pt-BR' });
  await page.setContent(email.html);

  await expect(page.getByRole('heading', { name: 'Seu lugar está guardado.' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Conhecer o DoItBad/ })).toBeVisible();

  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport);
});
