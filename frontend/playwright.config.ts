import { defineConfig, devices } from "@playwright/test";
import { loadE2EEnv } from "./e2e/load-env";

loadE2EEnv();
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "next dev -H 127.0.0.1 -p 3000",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      AUTH_SECRET: process.env.AUTH_SECRET ?? "iatron-e2e-auth-secret-change-only-for-tests",
      AUTH_URL: process.env.AUTH_URL ?? baseURL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? baseURL,
      TEMP_LOGIN_ENABLED: "false"
    }
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" }
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"], channel: "chrome" }
    }
  ]
});
