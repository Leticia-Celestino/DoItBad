import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildConfirmationEmail } from '../api/confirmation-email';

test('builds a branded localized confirmation with preference links and a plain-text fallback', () => {
  const email = buildConfirmationEmail({
    name: 'Ada',
    locale: 'pt-BR',
    confirmationToken: 'confirm-token',
    unsubscribeToken: 'unsubscribe-token',
  });

  expect(email.subject).toContain('Confirme seu e-mail');
  expect(email.html).toContain('DoIt<span style="color:#985033;">B</span>ad');
  expect(email.html).toContain('Olá, Ada!');
  expect(email.confirmationUrl).toContain('/pt-br/preferencias/?action=confirm');
  expect(email.unsubscribeUrl).toContain('/pt-br/preferencias/?action=unsubscribe');
  expect(email.oneClickUnsubscribeUrl).toContain('/api/waitlist-preferences?action=unsubscribe');
  expect(email.text).toContain('ENQUANTO ISSO:');
  expect(email.text).toContain('confirm-token');
});

for (const file of readdirSync(resolve('supabase/templates')).filter((name) =>
  name.endsWith('.html'),
)) {
  test(`account email ${file} preserves secure actions and fits the viewport`, async ({ page }) => {
    const html = readFileSync(resolve('supabase/templates', file), 'utf8');
    const config = readFileSync(resolve('supabase/config.toml'), 'utf8');
    expect(config).toContain(`./supabase/templates/${file}`);
    expect(html).not.toContain('preferencias/');
    expect(html).not.toContain('Cancele a inscrição');
    const actionEmails = [
      'confirmation.html',
      'recovery.html',
      'invite.html',
      'magic-link.html',
      'email-change.html',
    ];
    if (actionEmails.includes(file)) expect(html).toContain('href="{{ .ConfirmationURL }}"');
    else expect(html).not.toContain('{{ .ConfirmationURL }}');
    if (file === 'reauthentication.html') expect(html).toContain('{{ .Token }}');
    await page.setContent(
      html
        .replaceAll('{{ .ConfirmationURL }}', 'https://example.com/verify')
        .replaceAll('{{ .SiteURL }}', 'https://example.com')
        .replaceAll('{{ .Token }}', '123456'),
    );
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test('localizes content and escapes an untrusted display name', () => {
  const email = buildConfirmationEmail({ name: '<script>alert(1)</script>', locale: 'es' });

  expect(email.subject).toContain('Confirma tu correo');
  expect(email.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  expect(email.html).not.toContain('<script>alert(1)</script>');
  expect(email.html).toContain('https://doitbad.tech/es/');
});

test('renders the artistic composition without horizontal overflow', async ({ page }) => {
  const email = buildConfirmationEmail({ name: 'Ada', locale: 'pt-BR' });
  await page.setContent(email.html);

  await expect(page.getByRole('heading', { name: 'Seu lugar está guardado.' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Confirmar meu e-mail/ })).toBeVisible();

  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport);
});

test('keeps every account email connected to a branded Supabase template', () => {
  const config = readFileSync(resolve('supabase/config.toml'), 'utf8');
  const templates = [
    ['confirmation.html', true],
    ['recovery.html', true],
    ['password-changed.html', false],
  ] as const;

  for (const [file, needsAction] of templates) {
    expect(config).toContain(`./supabase/templates/${file}`);
    const html = readFileSync(resolve('supabase/templates', file), 'utf8');
    expect(html).toContain('DoIt<span style="color:#985033;">B</span>ad');
    expect(html).toContain('Equipe DoItBad');
    expect(html).toContain('#fbf6ec');
    if (needsAction) expect(html).toContain('{{ .ConfirmationURL }}');
  }
});
