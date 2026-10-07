import { expect, test } from '@playwright/test';

test('confirms an email automatically and removes the token from browser history', async ({
  page,
}) => {
  await page.route('**/api/waitlist-preferences', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      action: 'confirm',
      token: 'confirmation-token-that-is-long-enough',
    });
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.goto(
    '/pt-br/preferencias/?action=confirm&token=confirmation-token-that-is-long-enough',
  );
  await expect(page.locator('[data-preference-status]')).toContainText('E-mail confirmado');
  await expect(page).toHaveURL('/pt-br/preferencias/');
});

test('requires an explicit action before unsubscribing', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/waitlist-preferences', async (route) => {
    requests += 1;
    expect(route.request().postDataJSON()).toEqual({
      action: 'unsubscribe',
      token: 'unsubscribe-token-that-is-long-enough',
    });
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.goto(
    '/pt-br/preferencias/?action=unsubscribe&token=unsubscribe-token-that-is-long-enough',
  );
  expect(requests).toBe(0);
  await page.getByRole('button', { name: 'Cancelar inscrição' }).click();
  await expect(page.locator('[data-preference-status]')).toContainText('Inscrição cancelada');
  expect(requests).toBe(1);
});
