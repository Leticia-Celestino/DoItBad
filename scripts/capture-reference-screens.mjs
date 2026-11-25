import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = process.env.REFERENCE_URL ?? 'http://127.0.0.1:4327';
const output = process.env.REFERENCE_OUTPUT ?? '/tmp/doitbad-reference-screens';
const screens = [
  'splash',
  'welcome',
  'login',
  'signup',
  'task',
  'blockers',
  'step',
  'timer',
  'done',
  'history',
  'tasks',
  'calendar',
  'map',
  'challenges',
  'recovery',
  'intentions',
  'stats',
  'zen',
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  for (const [index, screen] of screens.entries()) {
    await page.goto(`${base}/?screen=${screen}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: `${output}/${String(index + 1).padStart(2, '0')}-${screen}.png`,
      fullPage: true,
    });
  }
  console.log(`Captured ${screens.length} reference screens in ${output}`);
} finally {
  await browser.close();
}
