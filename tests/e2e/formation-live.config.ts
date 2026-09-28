import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["formation-live.spec.ts", "formation-ux.spec.ts"],
  outputDir: "../../test-results/formation-live",
  workers: 1,
  retries: 0,
  timeout: 45000,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4197",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    contextOptions: { reducedMotion: "reduce" },
  },
});
