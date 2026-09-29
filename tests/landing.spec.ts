import { expect, test } from '@playwright/test';

test('loads and dismisses the Rive intro without runtime errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  const riveFile = page.waitForResponse((response) => response.url().endsWith('/intro.riv'));
  const riveRuntime = page.waitForResponse((response) => response.url().endsWith('/rive.wasm'));

  await page.goto('/pt-br/');
  await expect(page.locator('.intro-rive')).toHaveClass(/is-active/);
  expect((await riveFile).ok()).toBe(true);
  expect((await riveRuntime).ok()).toBe(true);

  await expect(page.locator('.intro-rive')).toHaveClass(/is-done/, { timeout: 7_000 });
  await expect(page.locator('.intro-rive')).toHaveCSS('opacity', '0');
  await expect(page.locator('.intro-curtain')).toHaveClass(/intro-curtain--rive-done/);
  expect(consoleErrors).toEqual([]);

  await page.reload();
  await expect(page.locator('body')).toHaveClass(/intro-skip/);
  await expect(page.locator('.intro-rive')).toHaveCSS('opacity', '0');
  await page.goto('/pt-br/?intro=1');
  await expect(page.locator('.intro-rive')).toHaveClass(/is-active/);
});

test('respects reduced motion even when replay is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/pt-br/?intro=1');
  await expect(page.locator('body')).toHaveClass(/intro-skip/);
  await expect(page.locator('.intro-rive')).toHaveCSS('opacity', '0');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('reveals the page when the animation asset cannot load', async ({ page }) => {
  await page.route('**/animations/intro.riv', (route) => route.abort());
  await page.goto('/pt-br/');
  await expect(page.locator('.intro-curtain')).toBeHidden({ timeout: 5_000 });
  await expect(page.locator('.intro-rive')).toHaveCSS('opacity', '0');
});

test('presents the core promise and navigates with keyboard-friendly links', async ({ page }) => {
  await page.goto('/pt-br/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('O começo pode');
  await expect(
    page.getByRole('heading', { name: 'Seu caminho não desaparece quando você pausa.' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Quero acompanhar' }).first()).toHaveAttribute(
    'href',
    '#acompanhar',
  );
});

test('persists the selected night theme', async ({ page }) => {
  await page.goto('/pt-br/');
  const toggle = page.locator('[data-theme-toggle]');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('lets a visitor choose an intention and make the step smaller', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('doitbad-intro-seen', 'true'));
  await page.goto('/pt-br/');
  await expect(page.locator('.intro-curtain')).toBeHidden();
  await expect(page.locator('astro-island:not([ssr]) .step-demo-interactive')).toBeVisible();
  await page.getByRole('button', { name: 'Voltar a estudar para a certificação' }).click();
  await expect(
    page.locator('.action-card p').getByText('Separe o material e marque uma página para começar.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ainda é muito? Diminua outra vez.' }).click();
  await expect(
    page.locator('.action-card p').getByText('Abra o material na página em que parou.'),
  ).toBeVisible();
});

test('submits the updates form and shows a success state', async ({ page }) => {
  await page.route('**/api/waitlist', async (route) => {
    const body = route.request().postDataJSON() as { name: string; email: string };
    expect(body).toMatchObject({ name: 'Ada', email: 'ada@example.com' });
    await route.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.addInitScript(() => sessionStorage.setItem('doitbad-intro-seen', 'true'));
  await page.goto('/pt-br/');

  const form = page.locator('[data-waitlist-form]');
  await form.getByPlaceholder('Como podemos chamar você? (opcional)').fill('Ada');
  await form.getByPlaceholder('Seu melhor e-mail').fill('ada@example.com');
  await form.getByRole('button', { name: 'Quero acompanhar' }).click();

  await expect(form.locator('[data-form-status]')).toHaveText('Pronto! Seu cadastro foi recebido.');
});

test('keeps the landing inside a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => sessionStorage.setItem('doitbad-intro-seen', 'true'));
  await page.goto('/pt-br/');

  const layout = await page.evaluate(() => {
    const email = document.querySelector<HTMLInputElement>(
      '[data-waitlist-form] input[type="email"]',
    );
    const bounds = email?.getBoundingClientRect();
    return {
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      emailLeft: bounds?.left ?? -1,
      emailRight: bounds?.right ?? Number.POSITIVE_INFINITY,
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.emailLeft).toBeGreaterThanOrEqual(0);
  expect(layout.emailRight).toBeLessThanOrEqual(layout.viewportWidth);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('offers the complete navigation in the mobile header', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => sessionStorage.setItem('doitbad-intro-seen', 'true'));
  await page.goto('/pt-br/');

  await page.locator('.mobile-nav > summary').click();
  const menu = page.locator('.mobile-nav__panel');
  await expect(menu.getByRole('link', { name: 'A experiência' })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Ecossistema' })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Equipe' })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'FAQ', exact: true })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Pequenos começos' })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Acompanhar', exact: true })).toBeVisible();
});
