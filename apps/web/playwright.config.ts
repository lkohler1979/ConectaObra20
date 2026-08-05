import { defineConfig, devices } from "@playwright/test";

/**
 * E2E do fluxo crítico (E10-04) — precisa da stack inteira rodando:
 * Postgres + Redis (`docker compose -f infra/docker/docker-compose.local.yml
 * up -d`), `services/api` (`pnpm --filter @conectaobra/api dev`) e este app
 * (`pnpm --filter @conectaobra/web dev`). Por isso NÃO há `webServer` aqui —
 * o Next dev sozinho não é suficiente pro fluxo (RFQ, escrow, matching
 * dependem do backend + banco reais).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_WEB_URL ?? "http://localhost:3399",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
