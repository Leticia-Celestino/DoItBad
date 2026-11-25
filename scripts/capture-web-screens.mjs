import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const base = process.env.DOITBAD_WEB_URL ?? 'http://127.0.0.1:4324';
const output = process.env.DOITBAD_WEB_CAPTURE_DIR ?? '/tmp/doitbad-web-screens';
const width = Number.parseInt(process.env.DOITBAD_WEB_CAPTURE_WIDTH ?? '390', 10);
const height = Number.parseInt(process.env.DOITBAD_WEB_CAPTURE_HEIGHT ?? '844', 10);
mkdirSync(output, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width, height } });
const page = await context.newPage();
const capture = async (name) => {
  await page.screenshot({ path: `${output}/${name}.png` });
  console.log(`CAPTURED ${name}`);
};

try {
  await page.goto(`${base}/abertura`);
  await capture('01-splash');
  await page.goto(`${base}/boas-vindas`);
  await capture('02-welcome');
  await page.goto(`${base}/entrar`);
  await capture('03-login');
  await page.goto(`${base}/entrar?mode=signup`);
  await capture('04-signup');

  await page.goto(`${base}/atividade`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.goto(`${base}/tarefa`);
  await capture('05-task');
  await page.getByLabel('Sua tarefa', { exact: true }).fill('Preparar apresentação');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await capture('06-blockers');
  await page.getByLabel('Parece coisa demais').check();
  await page.getByRole('button', { name: 'Encontrar meu passo' }).click();
  await page.getByLabel('Um passo que cabe hoje').fill('Abrir o documento');
  await capture('07-step');
  await page.getByRole('button', { name: 'Iniciar 2 minutos' }).click();
  await capture('08-timer');
  await page.getByRole('button', { name: 'Encerrar e registrar' }).click();
  await capture('09-done');

  for (const [route, name] of [
    ['historico', '10-history'],
    ['tarefas', '11-tasks'],
    ['calendario', '12-calendar'],
    ['mapa', '13-map'],
    ['desafios', '14-challenges'],
    ['retomada', '15-recovery'],
    ['intencoes', '16-intentions'],
    ['estatisticas', '17-stats'],
    ['zen', '18-zen'],
  ]) {
    await page.goto(`${base}/${route}`);
    await capture(name);
  }
  console.log(`Visual artifacts: ${output} (${width}×${height})`);
} finally {
  await browser.close();
}
