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
  const slug = 'return-to-a-project-after-weeks';
  await page.goto(`/en/artigos/${slug}/`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'How to return to a project after weeks',
  );
  expect(
    await page.locator('script[type="application/ld+json"]').evaluate((node) => node.textContent),
  ).toContain('Article');
  await expect(page.locator('.locale-picker a[href^="/de/"]')).toHaveAttribute(
    'href',
    '/de/artigos/nach-wochen-zu-einem-projekt-zurueckkehren/',
  );
  await expect(page.locator('.article-cover img')).toBeVisible();
});

test('presents the editorial index with optimized photographic covers', async ({ page }) => {
  await page.goto('/pt-br/artigos/');
  const cards = page.locator('.article-index-card');

  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toHaveClass(/article-index-card--featured/);
  await expect(page.locator('.article-index-art img')).toHaveCount(3);
  await expect(page.locator('.article-index-art img').first()).toHaveAttribute(
    'src',
    /(\/editorial\/.+\.webp$|cdn\.sanity\.io\/.+auto=format)/,
  );
});

test('opens internal pages immediately without the cinematic intro', async ({ page }) => {
  await page.goto('/pt-br/artigos/');
  await expect(page.locator('.intro-curtain')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
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

test('keeps the dark mobile theme accessible', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('doitbad-theme', 'dark'));
  await page.goto('/pt-br/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const blocking = results.violations.filter(
    ({ impact }) => impact === 'serious' || impact === 'critical',
  );

  expect(blocking, blocking.map((item) => item.id).join(', ')).toEqual([]);
});

test('keeps every localized public page inside a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });

  for (const [locale] of locales) {
    const routes = [
      `/${locale}/`,
      `/${locale}/artigos/`,
      `/${locale}/artigos/${
        locale === 'pt-br'
          ? 'voltar-a-um-projeto-depois-de-semanas'
          : locale === 'en'
            ? 'return-to-a-project-after-weeks'
            : locale === 'es'
              ? 'volver-a-un-proyecto-despues-de-semanas'
              : 'nach-wochen-zu-einem-projekt-zurueckkehren'
      }/`,
      `/${locale}/privacidade/`,
      `/${locale}/nao-existe/`,
    ];

    for (const route of routes) {
      await page.goto(route);
      const layout = await page.evaluate(() => ({
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        mainRight: Math.ceil(document.querySelector('main')?.getBoundingClientRect().right ?? 0),
      }));

      expect(layout.documentWidth, route).toBeLessThanOrEqual(layout.viewportWidth);
      expect(layout.mainRight, route).toBeLessThanOrEqual(layout.viewportWidth);
      await expect(page.locator('main')).toBeVisible();
    }
  }
});
