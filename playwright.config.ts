import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "e2e.spec.ts",
  timeout: 180_000,
  expect: { timeout: 60_000 },
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    browserName: "chromium",
    headless: false,
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      args: ["--disable-blink-features=AutomationControlled"],
    },
  },
});
