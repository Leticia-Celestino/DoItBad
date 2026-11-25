import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const config = { mode: 'cycles', focusMinutes: 50, breakMinutes: 10, blocks: 2, eyeCare: true };
test.beforeEach(async ({ page }) => {
  await page.goto('/atividade');
  await page.evaluate((rhythm) => {
    localStorage.clear();
    const date = new Date();
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    localStorage.setItem(
      'doitbad-workspace-v1',
      JSON.stringify([
        {
          id: 'task-study',
          kind: 'task',
          revision: 1,
          created_at: date.toISOString(),
          payload: {
            title: 'Estudar Química',
            project: '',
            date: day,
            done: false,
            steps: ['Resolver a questão 8'],
            rhythm,
          },
        },
      ]),
    );
  }, config);
  await page.reload();
});

test('two entry paths, optional planning and direct rhythm start in the calendar', async ({
  page,
}) => {
  await page.goto('/calendario');
  await expect(page.getByText('2 blocos de 50 min', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Me ajude a começar', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Começar meu ritmo', exact: true }).click();
  await page.getByRole('button', { name: 'Começar meu ritmo', exact: true }).click();
  await expect(page.getByRole('timer')).toHaveText('50:00');
  await expect(page.getByRole('heading', { name: 'Estudar Química' })).toBeVisible();
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Retomar', exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('rhythm-session.png'), fullPage: true });
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('20-20-20, check-in, rest and next block keep separate totals across reload', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/ritmo?task=task-study');
  await page.getByRole('button', { name: 'Começar meu ritmo', exact: true }).click();
  await page.clock.fastForward(20 * 60 * 1000);
  await page.getByRole('button', { name: 'Começar 20 segundos' }).click();
  await page.clock.fastForward(20_000);
  await expect(page.getByText('00:20 de cuidado visual', { exact: false })).toBeVisible();
  await page.clock.fastForward(30 * 60 * 1000);
  await expect(
    page.getByRole('heading', { name: 'Você chegou ao tempo planejado.' }),
  ).toBeVisible();
  await page.clock.fastForward(5 * 60 * 1000);
  await expect(page.getByText('49:40 de foco', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Fazer pausa de 10 min' }).click();
  await page.clock.fastForward(15 * 60 * 1000);
  await expect(page.getByText('Sua pausa terminou.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Iniciar próximo bloco' })).toBeVisible();
  await expect(page.getByText('Bloco 1 de 2')).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar próximo bloco' }).click();
  await expect(page.getByText('Bloco 2 de 2')).toBeVisible();
  await page.getByRole('button', { name: 'Encerrar e registrar' }).click();
  const records = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('doitbad-workspace-v1')!),
  );
  const session = records.find((i: { kind: string }) => i.kind === 'focus');
  expect(session.payload.rhythm.focusSeconds).toBe(2980);
  expect(session.payload.rhythm.breakSeconds).toBe(600);
  expect(session.payload.rhythm.eyeSeconds).toBe(20);
  expect(records.find((i: { kind: string }) => i.kind === 'task').payload.done).toBe(false);
});

test('a small beginning offers continuation without changing the two-minute route', async ({
  page,
}) => {
  await page.evaluate(() => {
    const rows = JSON.parse(localStorage.getItem('doitbad-workspace-v1')!);
    rows.push({
      id: 'small-start',
      kind: 'focus',
      revision: 1,
      created_at: new Date().toISOString(),
      payload: {
        taskId: 'task-study',
        title: 'Estudar Química',
        step: 'Abrir o livro',
        blockers: [],
        target: 120,
        elapsed: 120,
        runningSince: null,
        status: 'complete',
        purpose: 'start',
        completedAt: Date.now(),
        note: 'Questão 8',
        mood: null,
      },
    });
    localStorage.setItem('doitbad-workspace-v1', JSON.stringify(rows));
  });
  await page.goto('/conclusao/small-start');
  await expect(page.getByRole('link', { name: 'Encerrar por agora' })).toBeVisible();
  await page.getByRole('link', { name: 'Continuar', exact: true }).click();
  await expect(page.getByLabel('O que você quer fazer neste momento?')).toHaveValue('Questão 8');
  await page.getByRole('button', { name: 'Começar meu ritmo', exact: true }).click();
  const result = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('doitbad-workspace-v1')!).find(
      (i: { kind: string; payload: { status: string } }) =>
        i.kind === 'focus' && i.payload.status === 'active',
    ),
  );
  expect(result.payload.rhythm.eyeDueIn).toBe(1080);
  expect(result.payload.previousFocusId).toBe('small-start');
  expect(result.payload.rhythm.focusSeconds).toBe(0);
});

test('personal preference, task override and no-timer mode persist', async ({ page }) => {
  await page.goto('/configuracoes?section=foco');
  await page.getByLabel('Quantidade de blocos').fill('3');
  await page.getByRole('button', { name: 'Salvar meu ritmo' }).click();
  await expect(page.getByText('Seu ritmo foi salvo.', { exact: false })).toBeVisible();
  await page.goto('/tarefas');
  await page.getByLabel('Mais opções para Estudar Química').click();
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByText('Ritmo para quando eu começar · opcional', { exact: true }).click();
  await page.getByLabel('Forma de acompanhar').selectOption('none');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await page.reload();
  await expect(page.getByText('Sem cronômetro', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Começar meu ritmo', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Voltar à atividade' })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('doitbad-workspace-v1')!).filter(
          (i: { kind: string }) => i.kind === 'focus',
        ).length,
    ),
  ).toBe(0);
});

test('another open client receives pause and resume; navigation retains a compact timer', async ({
  page,
  context,
}) => {
  await page.goto('/ritmo?task=task-study');
  await page.getByRole('button', { name: 'Começar meu ritmo', exact: true }).click();
  const second = await context.newPage();
  await second.goto(page.url());
  await page.getByLabel('Quando voltar, qual é o próximo gesto?').fill('Retomar na questão 9');
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await expect(second.getByRole('button', { name: 'Retomar', exact: true })).toBeVisible();
  await expect(second.getByLabel('Quando voltar, qual é o próximo gesto?')).toHaveValue(
    'Retomar na questão 9',
  );
  await second.getByLabel('Quando voltar, qual é o próximo gesto?').fill('Retomar na questão 10');
  await second.getByRole('button', { name: 'Retomar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pausar', exact: true })).toBeVisible();
  await expect(page.getByLabel('Quando voltar, qual é o próximo gesto?')).toHaveValue(
    'Retomar na questão 10',
  );
  await second.goto('/tarefas');
  await expect(second.locator('.rhythm-mini')).toContainText('Estudar Química');
  await second.close();
});
