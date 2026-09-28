import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  webServer: [
    {
      command: 'pnpm dev --port 4322 --ignore-lock',
      url: 'http://127.0.0.1:4322/pt-br/',
      reuseExistingServer: true,
    },
    {
      command: 'pnpm --filter @doitbad/web dev -- --port 4324',
      url: 'http://127.0.0.1:4324/atividade',
      reuseExistingServer: true,
    },
  ],
  use: { baseURL: 'http://127.0.0.1:4322' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
