import { chromium } from '@playwright/test';

const baseUrl = process.env.DOITBAD_LANDING_URL ?? 'http://127.0.0.1:4322/pt-br/';
const output = process.env.DOITBAD_LANDING_SCREENSHOT ?? 'docs/interview/assets/landing-hero.png';

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
});
const page = await context.newPage();

await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  document.querySelector('.intro-curtain')?.classList.add('intro-skip');
  document.querySelector('.intro-rive')?.classList.add('is-done');
});
await page.waitForTimeout(750);
await page.screenshot({ path: output, fullPage: false });

await browser.close();
