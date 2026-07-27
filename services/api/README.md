# @conectaobra/api

NestJS monólito modular. Ver `docs/prd/03_Estrutura_Projeto.md` para a
estrutura-alvo completa (módulos de domínio em `src/modules/*`).

## Conteúdo desta sessão (S0-05 + S0-06 + E1-01)

- `prisma/schema.prisma` — schema inicial (S0-05) + `senha_hash`,
  `telefone_verificado`, `refresh_tokens`, `otp_codes` (E1-01, ver
  `PENDENCIAS.md` P-010).
- `src/config/env.ts` — env validado com zod (`@conectaobra/config/env`),
  estendido com `JWT_SECRET`/TTLs/OTP; falha rápido no boot se faltar algo.
- `src/common/prisma/` — `PrismaService`/`PrismaModule` (global).
- `src/common/audit/` — `AuditLogService`, grava em `audit_log` (imutável,
  trigger no banco) sanitizando CPF/CNPJ/senha/token antes do insert
  (`sanitize-payload.ts`, CLAUDE.md §5 regra 4).
- `src/common/observability/` — logger estruturado (`nestjs-pino`, com
  `redact` dos mesmos campos sensíveis) + Sentry (`initSentry()` em
  `main.ts`, no-op sem `SENTRY_DSN`) + `SentryExceptionFilter` global (só
  reporta 5xx ao Sentry, não erros de negócio 4xx).
- `src/modules/identity/auth/` (**E1-01**) — `POST /auth/register`,
  `/login`, `/refresh` (refresh token opaco, hash em DB, rotação com
  detecção de reuso), `/logout`, `/otp/request` e `/otp/verify`
  (autenticados, verificação de telefone). DTOs em `@conectaobra/types/auth`
  (zod, compartilhável com `apps/web`). Rate limiting básico via
  `@nestjs/throttler` nos endpoints públicos. Envio de SMS é um stub que só
  loga o código (`otp-notifier.ts`) — nenhum provedor foi escolhido ainda
  (P-006).
- `src/health/health.controller.ts` — `GET /health`.

## Rodando localmente

```bash
cp .env.example .env
docker compose -f ../../infra/docker/docker-compose.local.yml up -d
pnpm --filter @conectaobra/api prisma:generate
pnpm --filter @conectaobra/api prisma:deploy   # aplica prisma/migrations/*
pnpm --filter @conectaobra/api seed            # opcional — senha "senha12345"
pnpm --filter @conectaobra/api dev
curl localhost:3333/health

curl -X POST localhost:3333/auth/register -H 'content-type: application/json' -d '{
  "tipo":"CLIENTE_PF","nome":"Teste","email":"teste@example.com",
  "telefone":"+5527999998888","cpfCnpj":"52998224725","senha":"senha12345"
}'
```

## Status

Todo o bootstrap e a árvore de injeção de dependências do `AuthModule`
(controller → service → password/token/otp services → guards → strategies →
throttler → audit log → prisma) foram validados nesta sessão com
`tsc --noEmit`, `nest build` e execução real do `dist/src/main.js` — a
única falha observada foi a esperada, "Can't reach database server", porque
não havia Postgres disponível no ambiente (sem Docker). Esse mesmo teste já
pegou e corrigiu um bug real de DI (`AuditLogModule` não importado em
`AuthModule`) que `tsc`/`nest build` sozinhos não detectam.

**Ninguém rodou isso contra um banco real ainda** — validar com
`docker compose up` + os `curl` acima antes do merge (ver `PENDENCIAS.md`
P-010/P-011/P-013/P-014).
