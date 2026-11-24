import { defineConfig, devices } from '@playwright/test';

const port = 4173;

// The app is built in e2e mode (demo project + emulators) and served with `vite preview`,
// so the real service worker is exercised. Nothing here talks to the live Firebase project.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
    // Locally use the installed Chrome; CI installs Playwright's Chromium.
    channel: process.env.CI ? undefined : 'chrome',
  },
  projects: [
    {
      name: 'phone',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
        channel: process.env.CI ? undefined : 'chrome',
      },
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        channel: process.env.CI ? undefined : 'chrome',
      },
    },
  ],
  webServer: {
    command: `npm run build:e2e && npx firebase emulators:exec --only auth,firestore --project demo-trip-budget "npx vite preview --mode e2e --port ${port} --strictPort"`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    // Let `firebase emulators:exec` stop its emulators (a Java process) instead of orphaning them.
    gracefulShutdown: { signal: 'SIGINT', timeout: 15_000 },
  },
});
