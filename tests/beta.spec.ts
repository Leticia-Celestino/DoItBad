import { expect, test } from '@playwright/test';

const betaUrl = 'http://127.0.0.1:4324';

test.beforeEach(async ({ page }) => {
  await page.goto(`${betaUrl}/atividade`);
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
  await expect(page.getByRole('listitem')).toHaveText('Retomar a apresentação do projeto');

  await page.reload();
  await expect(page.getByRole('listitem')).toHaveText('Retomar a apresentação do projeto');
});

test('uses real routes and keeps history honest', async ({ page }) => {
  await page.getByRole('link', { name: 'Histórico' }).click();
  await expect(page).toHaveURL(`${betaUrl}/historico`);
  await expect(page.getByText('Ainda não há tentativas registradas.')).toBeVisible();

  await page.goto(`${betaUrl}/entrar`);
  await expect(
    page.getByRole('heading', { name: 'Entre quando o acesso estiver liberado.' }),
  ).toBeVisible();
  await expect(page.getByText('Somente para desenvolvimento.')).toBeVisible();
});
