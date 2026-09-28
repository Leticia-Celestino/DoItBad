import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const locales = [
  ['pt-br', 'O começo pode'],
  ['en', 'The beginning can'],
  ['es', 'El comienzo puede'],
  ['de', 'Der Anfang darf'],
] as const;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('doitbad-intro-seen', 'true'));
});

test('publishes complete localized homes with equivalent metadata', async ({ page }) => {
  for (const [locale, heading] of locales) {
    await page.goto(`/${locale}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://doitbad.tech/${locale}/`,
    );
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(5);
  }
});

test('preserves the equivalent article when changing language', async ({ page }) => {
  const slug = 'voltar-a-um-projeto-depois-de-semanas';
  await page.goto(`/en/artigos/${slug}/`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'How to return to a project after weeks',
  );
  expect(
    await page.locator('script[type="application/ld+json"]').evaluate((node) => node.textContent),
  ).toContain('Article');
  await expect(page.locator('.locale-picker a[href^="/de/"]')).toHaveAttribute(
    'href',
    `/de/artigos/${slug}/`,
  );
});

test('has no serious or critical automated accessibility violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [locale] of locales) {
    await page.goto(`/${locale}/`);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const blocking = results.violations.filter(
      ({ impact }) => impact === 'serious' || impact === 'critical',
    );
    expect(blocking, `${locale}: ${blocking.map((item) => item.id).join(', ')}`).toEqual([]);
  }
});
