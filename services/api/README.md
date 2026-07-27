# @conectaobra/api

NestJS monólito modular. Ver `docs/prd/03_Estrutura_Projeto.md` para a
estrutura-alvo completa (módulos de domínio em `src/modules/*`, ainda não
criados — apenas a base de observabilidade da task S0-06 existe hoje).

## Conteúdo desta sessão (S0-05 + S0-06)

- `prisma/schema.prisma` — schema inicial (ver `PENDENCIAS.md` P-010).
- `src/config/env.ts` — env validado com zod (`@conectaobra/config/env`), falha
  rápido no boot se faltar `DATABASE_URL` etc.
- `src/common/prisma/` — `PrismaService`/`PrismaModule` (global).
- `src/common/audit/` — `AuditLogService`, grava em `audit_log` (imutável,
  trigger no banco) sanitizando CPF/CNPJ/senha/token antes do insert
  (`sanitize-payload.ts`, CLAUDE.md §5 regra 4).
- `src/common/observability/` — logger estruturado (`nestjs-pino`, com
  `redact` dos mesmos campos sensíveis) + Sentry (`initSentry()` em
  `main.ts`, no-op sem `SENTRY_DSN`) + `SentryExceptionFilter` global (só
  reporta 5xx ao Sentry, não erros de negócio 4xx).
- `src/health/health.controller.ts` — `GET /health`, único endpoint real por
  enquanto; serve para confirmar que o boot (env → Nest → logger → Prisma)
  funciona de ponta a ponta.

## Rodando localmente

```bash
cp .env.example .env
docker compose -f ../../infra/docker/docker-compose.local.yml up -d
pnpm --filter @conectaobra/api prisma:generate
pnpm --filter @conectaobra/api prisma:deploy   # aplica prisma/migrations/*
pnpm --filter @conectaobra/api seed            # opcional
pnpm --filter @conectaobra/api dev
curl localhost:3333/health
```

## Status

Todo o bootstrap (`env → Nest → logger → Prisma`) foi validado nesta sessão
com `tsc --noEmit`, `nest build` e execução real do `dist/src/main.js` — a
única falha observada foi a esperada, "Can't reach database server", porque
não havia Postgres disponível no ambiente (sem Docker). **Ninguém rodou isso
contra um banco real ainda** — validar com `docker compose up` antes do
merge (ver `PENDENCIAS.md` P-010/P-011/P-013).
