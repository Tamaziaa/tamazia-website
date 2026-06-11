import { defineConfig } from '@playwright/test';

// Remodel P2 · single chromium project; specs manage their own viewports
// (matches tests/visual/overflow.spec.ts's internal breakpoint loop).
// The webServer block is ALSO the fix for the visual.yml CI failures:
// the workflow previously ran Playwright with no server attached.
export default defineConfig({
  testDir: './tests/visual',
  timeout: 90_000,
  retries: 0,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4321',
    screenshot: 'off',
    trace: 'off',
  },
  webServer: {
    command: 'npm run preview',
    port: 4321,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
