# PENDENCIAS.md — ConectaObra 2.0
> Quadro vivo de pendências. **Atualizar a cada sessão de trabalho** (humano ou Claude).
> Formato: mover itens entre seções; nunca apagar histórico — usar ~~riscado~~ + data.
> Última atualização: 2026-07-27 · Branch: `feat/S0-05-prisma-schema`

---

## 🔴 BLOQUEADORES (impedem progresso — resolver primeiro)

| ID | Pendência | Tarefa afetada | Responsável | Desde |
|---|---|---|---|---|
| P-001 | **Validar stack tecnológico final** — visão citava "decisões fechadas" mas a lista não foi anexada. Confirmar proposta do doc 02 ou substituir. Registrar em `docs/adr/ADR-0001-stack.md` | Todas | Fundador/Tech Lead | 2026-07-24 |
| P-002 | **Escolher PSP/BaaS do escrow** (Asaas / Pagar.me / Iugu / Dock / QI Tech) + abrir conta sandbox | S0-07, todo épico E4 | Tech Lead | 2026-07-24 |
| P-003 | Confirmar **cidade-piloto** (sugerida: Vitória/ES) | Matching E3-03, GTM E10-02 | Fundador | 2026-07-24 |

## 🟡 PENDÊNCIAS ATIVAS (Sprint 0)

| ID | Pendência | Tarefa | Status | Observações |
|---|---|---|---|---|
| P-004 | Push da branch `sprint-0` para o GitHub e abertura do PR | S0-01 | Aguardando | Pacote preparado localmente; comandos no fim deste arquivo |
| P-005 | Decidir destino da pasta legada `app/` do commit inicial (migrar conteúdo ou remover) | S0-01 | Aberto | Conteúdo original não inspecionado |
| P-006 | Escolher provedor de assinatura eletrônica (Clicksign/ZapSign/D4Sign) e de KYC (idwall/CAF) | S0-08 | Aberto | Pode rodar em paralelo ao P-002 |
| P-007 | Rodar `pnpm install` e validar `docker compose up` no ambiente local do time | S0-02 | Parcial | `pnpm install` já roda limpo (lockfile gerado e commitado); `docker compose up` **ainda não validado** — Docker não estava disponível no ambiente desta sessão |
| P-008 | Configurar secrets do GitHub Actions (deploy staging) | S0-03 | Aberto | Workflow de CI criado; job de deploy comentado até definir infra |
| P-009 | Design System v0: 15 componentes base implementados em `packages/ui`, branch `feat/S0-04-design-system-v0` (ainda não mesclada) | S0-04 | Em revisão | Faltam `Table`, `Tooltip`, `RadioGroup`, `Switch`, `Spinner`/`Skeleton`, Storybook e revisão do Product Designer |
| P-010 | Schema Prisma inicial + migração + seed em `services/api`, branch `feat/S0-05-prisma-schema` (ainda não mesclada) | S0-05 | Em revisão | `prisma validate`/`generate`/`tsc --noEmit` passaram; migração **nunca foi aplicada** a um Postgres real (sem Docker no ambiente) — validar com `docker compose up` + `pnpm --filter @conectaobra/api prisma:deploy` antes do merge |
| P-011 | Sentry DSN + logger estruturado + tabela `audit_log` | S0-06 | Aberto | Tabela `audit_log` já existe no schema Prisma (P-010), com trigger de imutabilidade; falta Sentry + logger estruturado |
| P-012 | Contratar engenheiro civil consultor (pré-requisito do épico E5 — base da IA) | E5-02 | Aberto | Também apoia mediação de disputas |
| P-013 | Imagem `pgvector/pgvector:pg16` do `docker-compose.local.yml` provavelmente não tem a extensão PostGIS — `init-extensions.sql` roda `CREATE EXTENSION postgis` e pode falhar no primeiro `docker compose up`. Não verificado nesta sessão (sem Docker disponível) | S0-02 | Aberto | Se confirmado, trocar a imagem por uma com Postgres+PostGIS+pgvector (ex: Dockerfile próprio a partir de `postgis/postgis` + `CREATE EXTENSION vector` via pacote `pgvector` compilado) |

## 🟢 DÍVIDAS TÉCNICAS / MELHORIAS (não bloqueiam)

| ID | Item | Contexto |
|---|---|---|
| D-001 | Avaliar tRPC vs REST puro para contratos web↔api | Decidir até Sprint 2; registrar ADR |
| D-002 | Estratégia de testes de carga do matching (k6) | Antes do go-live (E10-04) |
| D-003 | Wireframes → protótipo navegável de alta fidelidade no Figma | Após validação dos fluxos com 5 usuários |

## ✅ CONCLUÍDAS

| Data | Item |
|---|---|
| 2026-07-24 | Pacote de kickoff (PRD, spec, estrutura, backlog, checklists, wireframes) criado em `docs/prd/` |
| 2026-07-24 | Branch `sprint-0` criada com scaffold do monorepo (S0-01 parcial) |
| 2026-07-24 | Docker Compose local: Postgres 16 + PostGIS + pgvector, Redis, Meilisearch (S0-02 parcial) |
| 2026-07-24 | Workflow de CI (lint/test/build) criado (S0-03 parcial) |
| 2026-07-24 | `CLAUDE.md` e `PENDENCIAS.md` criados na raiz |
| 2026-07-27 | `pnpm install` executado com sucesso na raiz — `pnpm-lock.yaml` gerado e commitado (parcial de P-007) |
| 2026-07-27 | Design System v0 (S0-04, parcial): tokens + preset Tailwind + 15 componentes base em `packages/ui`, branch `feat/S0-04-design-system-v0` — ver P-009 |
| 2026-07-27 | Schema Prisma inicial (S0-05, parcial): 24 modelos/enums traduzidos do doc 02 §3, migração inicial + trigger append-only (`escrow_transactions`, `audit_log`) e seed de desenvolvimento, branch `feat/S0-05-prisma-schema` — ver P-010 |

---

## 📌 Como publicar esta branch (P-004)

```bash
# na sua máquina, dentro do clone de https://github.com/lkohler1979/ConectaObra20
git checkout -b sprint-0
# copie o conteúdo do pacote sprint0 por cima do repositório (preservando .git)
git add -A
git commit -m "chore(sprint-0): scaffold monorepo, CLAUDE.md, PENDENCIAS.md e docs de kickoff"
git push -u origin sprint-0
# abra o PR: sprint-0 → main
```
