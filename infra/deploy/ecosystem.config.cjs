// Config do PM2 pra rodar services/api e apps/web numa VPS (sem Docker).
// Ver DEPLOY.md. Rodar com: pm2 start infra/deploy/ecosystem.config.cjs
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");

module.exports = {
  apps: [
    {
      name: "conectaobra-api",
      cwd: path.join(ROOT, "services/api"),
      script: "dist/src/main.js",
      interpreter: "node",
      env: { NODE_ENV: "production" },
      max_memory_restart: "400M",
      // .env é carregado pelo próprio processo via `import "dotenv/config"`
      // (services/api/src/config/env.ts) — precisa existir services/api/.env.
    },
    {
      name: "conectaobra-web",
      cwd: path.join(ROOT, "apps/web"),
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3399",
      interpreter: "node",
      env: { NODE_ENV: "production" },
      max_memory_restart: "400M",
      // .env.local é carregado automaticamente pelo Next.js — precisa
      // existir apps/web/.env.local.
    },
  ],
};
