import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60000,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/browser-results.xml' }]] : 'list',
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    timeout: 120000,
    env: { PORTFOLIO_TEST_SERVER: '1', NEXT_PUBLIC_APPWRITE_ENDPOINT: 'https://appwrite.invalid/v1', NEXT_PUBLIC_APPWRITE_PROJECT_ID: 'browser-tests' },
  },
})
