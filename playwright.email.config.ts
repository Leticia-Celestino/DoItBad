import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'confirmation-email.spec.ts',
  workers: 2,
  use: { launchOptions: { args: ['--disable-gpu'] } },
  projects: [
    { name: 'desktop-email', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-email', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 800 } } },
  ],
});
