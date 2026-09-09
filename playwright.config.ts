import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:4173', channel: 'msedge', headless: true, viewport: { width: 390, height: 844 }, trace: 'off' },
  reporter: [['list']],
});
