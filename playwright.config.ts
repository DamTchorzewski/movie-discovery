import { defineConfig, devices } from "@playwright/test";

// End-to-end tests against the production build, served locally (reops/standards/testing.md).
// Every TMDB request is answered from tests/e2e/fixtures, so no key and no network are needed.
const PORT = 4173;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}/movie-discovery/`,
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // a fake key: the requests never leave the test browser
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    env: { VITE_TMDB_API_KEY: "e2e-test-key", SITE_URL: "" },
    url: `http://localhost:${PORT}/movie-discovery/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
