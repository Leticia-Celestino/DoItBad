import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const base = 'http://127.0.0.1:4324';
test.beforeEach(async ({ page }) => {
  await page.goto(`${base}/atividade`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('splash, welcome, sign-up and sign-in are connected', async ({ page }) => {
  await page.goto(`${base}/abertura`);
  await expect(page.getByLabel('Pessoa sentada numa colina sob a lua')).toBeVisible();
  await expect(page).toHaveURL(/\/atividade$/, { timeout: 4000 });
  await page.goto(`${base}/boas-vindas`);
  await page.getByRole('link', { name: 'Vamos começar' }).click();
  await expect(page).toHaveURL(/\/entrar\?mode=signup$/);
  await expect(page.getByRole('heading', { name: 'Comece do jeitinho leve' })).toBeVisible();
  await page.getByRole('link', { name: 'Voltar' }).click();
  await page.getByRole('link', { name: 'Já tenho uma conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
});

test('complete focus cycle survives reload, pause and retry without duplicate history', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Dar o primeiro passo' }).click();
  await page.getByLabel('Sua tarefa', { exact: true }).fill('Revisar o capítulo');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Parece coisa demais').check();
  await page.getByRole('button', { name: 'Encontrar meu passo' }).click();
  await page.getByLabel('Um passo que cabe hoje').fill('Ler uma página');
  await page.getByRole('button', { name: 'Iniciar 2 minutos' }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ler uma página' })).toBeVisible();
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  const paused = await page.getByRole('timer').textContent();
  await page.reload();
  await expect(page.getByRole('timer')).toHaveText(paused!);
  await page.getByRole('button', { name: 'Retomar', exact: true }).click();
  await page.getByRole('button', { name: 'Encerrar e registrar' }).click();
  await expect(page.getByRole('heading', { name: 'Você começou.' })).toBeVisible();
  await page.getByLabel('O que fica para o próximo passo?').fill('Continuar na página 2');
  await page.getByRole('button', { name: 'Guardar meu fio da meada' }).click();
  await expect(page.getByRole('status')).toHaveText('Sua anotação foi guardada.');
  await page.getByRole('link', { name: 'Ver meu histórico' }).click();
  await expect(page.getByRole('heading', { name: 'Revisar o capítulo' })).toHaveCount(1);
  await expect(page.getByText('Continuar na página 2')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Revisar o capítulo' })).toHaveCount(1);
});

test('running timer completes automatically at zero without duplicating the session', async ({
  page,
}) => {
  const id = await page.evaluate(() => {
    const focusId = crypto.randomUUID();
    localStorage.setItem(
      'doitbad-workspace-v1',
      JSON.stringify([
        {
          id: focusId,
          kind: 'focus',
          payload: {
            taskId: null,
            title: 'Timer automático',
            step: 'Esperar o tempo terminar',
            blockers: [],
            target: 60,
            elapsed: 0,
            runningSince: Date.now() - 61_000,
            status: 'active',
            note: '',
            mood: null,
          },
          revision: 1,
          created_at: new Date().toISOString(),
        },
      ]),
    );
    return focusId;
  });
  await page.goto(`${base}/foco/${id}`);
  await expect(page.getByRole('heading', { name: 'Você começou.' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Você começou.' })).toBeVisible();
  const records = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('doitbad-workspace-v1') ?? '[]'),
  );
  expect(records).toHaveLength(1);
  expect(records[0].payload.status).toBe('complete');
  expect(records[0].payload.elapsed).toBe(60);
});

test('tasks feed calendar and map; emotional records persist', async ({ page }) => {
  await page.goto(`${base}/tarefas`);
  await page.getByLabel('O que você quer fazer?').fill('Preparar apresentação');
  await page.getByLabel('Projeto (opcional)').fill('Trabalho');
  await page.getByLabel('Pequenos passos (um por linha)').fill('Abrir slides\nEscrever uma frase');
  await page.getByRole('button', { name: 'Adicionar tarefa' }).click();
  await expect(page.getByRole('heading', { name: 'Preparar apresentação' })).toBeVisible();
  const localRecords = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('doitbad-workspace-v1') ?? '[]'),
  );
  const project = localRecords.find(
    (item: { kind: string; payload: { title: string } }) =>
      item.kind === 'project' && item.payload.title === 'Trabalho',
  );
  const task = localRecords.find(
    (item: { kind: string; payload: { title: string; projectId?: string } }) =>
      item.kind === 'task' && item.payload.title === 'Preparar apresentação',
  );
  expect(project.payload.color).toMatch(/^#[0-9A-F]{6}$/i);
  expect(task.payload.projectId).toBe(project.id);
  await page.goto(`${base}/mapa`);
  await expect(page.getByText('Abrir slides')).toBeVisible();
  await page.goto(`${base}/calendario`);
  await expect(page.getByRole('link', { name: 'Preparar apresentação' })).toBeVisible();
  await page.goto(`${base}/estatisticas`);
  await page.getByLabel('Seu momento').selectOption('4');
  await page.getByLabel('Quer guardar algo sobre hoje?').fill('Mais tranquilo depois de começar');
  await page.getByRole('button', { name: 'Guardar meu registro' }).click();
  await expect(page.getByText('Mais tranquilo depois de começar')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Mais tranquilo depois de começar')).toBeVisible();
});

test('navigation and desktop layout use available space with accessible empty screens', async ({
  page,
}) => {
  for (const path of [
    'atividade',
    'tarefas',
    'calendario',
    'mapa',
    'historico',
    'desafios',
    'estatisticas',
    'retomada',
    'zen',
    'intencoes',
  ]) {
    await page.goto(`${base}/${path}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations, path).toEqual([]);
  }
  if (page.viewportSize()!.width > 1000) {
    const frame = await page.locator('.app-frame').boundingBox();
    expect(frame!.width).toBeGreaterThan(1000);
  }
});

test('night theme applies to every route and persists', async ({ page }) => {
  await page.goto(`${base}/historico`);
  await page.getByRole('button', { name: 'Ativar modo noturno' }).click();
  await expect(page.locator('.app-frame')).toHaveClass(/night-theme/);
  await page.goto(`${base}/tarefas`);
  await expect(page.locator('.app-frame')).toHaveClass(/night-theme/);
  await page.reload();
  await expect(page.locator('.app-frame')).toHaveClass(/night-theme/);
  await page.goto(`${base}/historico`);
  await expect(page.getByRole('button', { name: 'Ativar modo claro' })).toBeVisible();
});

test('priority and microactions persist between task list, map and edited steps', async ({
  page,
}) => {
  await page.goto(`${base}/tarefas`);
  await page.getByLabel('O que você quer fazer?').fill('Organizar minha apresentação');
  await page.getByRole('combobox', { name: 'Prioridade', exact: true }).selectOption('alta');
  await page.getByLabel('Pequenos passos (um por linha)').fill('Abrir documento\nEscrever título');
  await page.getByRole('button', { name: 'Adicionar tarefa' }).click();
  await expect(page.getByText('Prioridade Alta')).toBeVisible();
  await page.goto(`${base}/mapa`);
  await page.getByRole('checkbox', { name: 'Escrever título', exact: true }).check();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Escrever título', exact: true })).toBeChecked();
  await page.goto(`${base}/tarefas`);
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page
    .getByLabel('Pequenos passos (um por linha)')
    .fill('Escrever título\nAbrir documento\nRevisar');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await page.goto(`${base}/mapa`);
  await expect(page.getByRole('checkbox', { name: 'Escrever título', exact: true })).toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: 'Abrir documento', exact: true }),
  ).not.toBeChecked();
  await page.goto(`${base}/calendario`);
  await page.getByRole('button', { name: 'Dia', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Próximo dia', exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Concluir Organizar minha apresentação' }).check();
  await page.reload();
  await expect(
    page.getByRole('checkbox', { name: 'Concluir Organizar minha apresentação' }),
  ).toBeChecked();
});

test('dependencies, recurrence and task removal persist', async ({ page }) => {
  await page.goto(`${base}/tarefas`);
  await page.getByLabel('O que você quer fazer?').fill('Preparar material');
  await page.getByRole('button', { name: 'Adicionar tarefa' }).click();

  await page.getByLabel('O que você quer fazer?').fill('Enviar material');
  await page.getByLabel('Só faça depois de').selectOption({ label: 'Preparar material' });
  await page.getByLabel('Repetir').selectOption('weekly');
  await page.getByRole('button', { name: 'Adicionar tarefa' }).click();

  const dependent = page.getByRole('article').filter({ hasText: 'Enviar material' });
  await expect(dependent.getByText('Semanal')).toBeVisible();
  await expect(dependent.getByText('Bloqueada por outra tarefa')).toBeVisible();
  await expect(dependent.getByRole('checkbox')).toBeDisabled();

  await page
    .getByRole('article')
    .filter({ hasText: 'Preparar material' })
    .getByRole('checkbox')
    .click();
  await expect(dependent.getByRole('checkbox')).toBeEnabled();
  await page.reload();
  await expect(dependent.getByText('Semanal')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await dependent.getByRole('button', { name: 'Remover' }).click();
  await expect(page.getByRole('heading', { name: 'Enviar material' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Enviar material' })).toHaveCount(0);
});

test('compact, landscape and large layouts keep content within viewport', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'Run explicit viewport matrix once.');
  test.setTimeout(90000);
  page.on('pageerror', (error) => {
    throw error;
  });
  const sizes = [
    [320, 568],
    [390, 844],
    [844, 390],
    [768, 1024],
    [1024, 768],
    [1440, 900],
  ];
  const routes = [
    'atividade',
    'tarefas',
    'calendario',
    'mapa',
    'historico',
    'desafios',
    'estatisticas',
    'retomada',
    'zen',
    'intencoes',
    'boas-vindas',
    'tarefa',
  ];
  for (const [width, height] of sizes) {
    const sizedPage = await page.context().newPage();
    await sizedPage.setViewportSize({ width, height });
    for (const route of routes) {
      const response = await sizedPage.goto(`${base}/${route}`);
      expect(response?.status(), `${route}: ${await sizedPage.locator('body').innerText()}`).toBe(
        200,
      );
      await expect(
        sizedPage.getByRole('heading', { level: 1 }),
        `${route} ${width}×${height}`,
      ).toBeVisible();
      expect(
        await sizedPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${route} ${width}×${height}`,
      ).toBe(true);
    }
    await sizedPage.goto(`${base}/atividade`);
    await sizedPage.screenshot({
      path: info.outputPath(`dashboard-${width}x${height}.png`),
      fullPage: true,
    });
    await sizedPage.close();
  }
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`${base}/tarefas`);
  await page
    .getByLabel('O que você quer fazer?')
    .fill('Uma tarefa com um título muito longo para conferir a quebra de linhas no menor celular');
  await page.getByRole('button', { name: 'Adicionar tarefa' }).click();
  await expect(page.getByRole('heading', { name: /Uma tarefa com um título/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('tasks-320-long-title.png'), fullPage: true });
});
