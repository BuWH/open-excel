import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "mock-ui.spec.ts",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    browserName: "chromium",
    headless: true,
    viewport: { width: 400, height: 700 },
    baseURL: "http://localhost:5174",
  },
  webServer: {
    command: "bun run dev:mock",
    url: "http://localhost:5174",
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
