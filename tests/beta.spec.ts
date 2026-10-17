import { expect, test } from '@playwright/test';

const betaUrl = 'http://127.0.0.1:4324';

test.beforeEach(async ({ page }) => {
  await page.goto(`${betaUrl}/intencoes`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('starts empty and saves an intention explicitly', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'O que você quer tornar um pouco mais possível?' }),
  ).toBeVisible();
  await expect(page.getByText('Nada guardado ainda.')).toBeVisible();

  await page.getByLabel('Minha intenção agora').fill('Retomar a apresentação do projeto');
  await page.getByRole('button', { name: 'Guardar intenção' }).click();

  await expect(page.getByRole('status')).toContainText('Intenção guardada neste navegador.');
  await expect(page.getByRole('listitem')).toContainText('Retomar a apresentação do projeto');

  await page.reload();
  await expect(page.getByRole('listitem')).toContainText('Retomar a apresentação do projeto');
});

test('uses real routes and keeps history honest', async ({ page }) => {
  const isMobile = page.viewportSize()!.width < 760;
  await expect(page.getByRole('button', { name: 'Ativar modo noturno' })).toBeVisible();
  await expect(page.locator('.app-header')).toHaveCSS('position', 'sticky');
  if (isMobile) {
    await page.getByRole('button', { name: 'Abrir navegação' }).click();
  }
  const navigation = page.getByRole('navigation', { name: 'Navegação principal' });
  await navigation.getByText('Meu caminho', { exact: true }).click();
  await navigation.getByRole('link', { name: 'Passos registrados' }).click();
  await expect(page).toHaveURL(`${betaUrl}/historico`);
  await expect(page.getByText('Seu primeiro passo vai aparecer aqui.')).toBeVisible();
  await expect(page.getByLabel('0% da meta do período')).toBeVisible();

  await page.goto(`${betaUrl}/entrar`);
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
  await expect(page.getByText('Continue de onde você parou.')).toBeVisible();
});
