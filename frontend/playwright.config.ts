import { defineConfig, devices } from "@playwright/test";
import {
  BACKEND_PORT,
  FRONTEND_PORT,
  backendDir,
  mailLog,
  mailStub,
  testMongoUrl,
} from "./e2e/support/environment";

// end-to-end: the real backend (throwaway database, emails written to a file instead of
// sent) behind a production build of this app
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results/artifacts",
  globalSetup: "./e2e/support/global-setup.ts",
  globalTeardown: "./e2e/support/global-teardown.ts",
  fullyParallel: true,
  workers: 4,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@responsive/ },
  ],
  webServer: [
    {
      name: "backend",
      cwd: backendDir,
      command: `node --import "${mailStub.replace(/\\/g, "/")}" src/server.js`,
      url: `http://localhost:${BACKEND_PORT}/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        PORT: String(BACKEND_PORT),
        MONGODB_URL: testMongoUrl(),
        E2E_MAIL_LOG: mailLog,
        // the tests give every browser its own X-Forwarded-For, so each test gets its own
        // rate-limit counters instead of all sharing 127.0.0.1's 5 tries
        TRUST_PROXY: "1",
        CLIENT_URL: `http://localhost:${FRONTEND_PORT}`,
      },
    },
    {
      name: "frontend",
      command: `npx next build && npx next start -p ${FRONTEND_PORT}`,
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: false,
      timeout: 300_000,
      env: {
        BACKEND_URL: `http://localhost:${BACKEND_PORT}`,
        NEXT_PUBLIC_SITE_URL: `http://localhost:${FRONTEND_PORT}`,
      },
    },
  ],
});
