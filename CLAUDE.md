# CLAUDE.md — ConectaObra 2.0

> Memória do projeto para o Claude (Claude Code / assistentes IA) e onboarding rápido de devs.
> **Leia este arquivo antes de qualquer alteração no código.**

---

## 1. O que é este projeto

**ConectaObra 2.0** — plataforma digital da construção civil (marketplace + gestão de obra + IA especializada + pagamentos garantidos via escrow) para o mercado brasileiro, com visão de expansão LatAm.

**Loop central do produto:** Cliente publica orçamento (RFQ) → profissionais/fornecedores da região respondem → cliente compara e aceita → contrato assinado digitalmente → cliente deposita em **conta garantida (escrow)** → prestador executa a etapa e entrega evidências (fotos + checklist) → cliente aprova → **pagamento liberado** (comissão 2–5% da plataforma).

**Diferencial nº 1:** Hub Financeiro com escrow. **Diferencial nº 2:** IA "Engenheiro Virtual" (RAG sobre NBR/SINAPI/CUB).

## 2. Documentos de referência (fonte de verdade)

Consultar SEMPRE antes de implementar. Estão em `docs/prd/`:

| Documento | Quando consultar |
|---|---|
| `docs/prd/00_README_Kickoff.md` | Visão geral do pacote e decisões pendentes |
| `docs/prd/01_PRD_ConectaObra_2.0.md` | Escopo funcional, personas, KPIs, roadmap, riscos |
| `docs/prd/02_Especificacao_Tecnica.md` | Stack, arquitetura, modelo de dados, APIs, compliance |
| `docs/prd/03_Estrutura_Projeto.md` | Estrutura de pastas do monorepo e convenções |
| `docs/prd/04_Tasks_Backlog.md` | Backlog por épico (E1–E10) e Sprint 0 (S0-01…S0-09) |
| `docs/prd/05_Skills_e_Checklists.md` | DoR/DoD e checklists de escrow, IA e go-live |
| `docs/prd/06_Wireframes_ConectaObra.html` | Wireframes e tokens visuais (abrir no navegador) |
| `PENDENCIAS.md` | Pendências ativas das tarefas — **atualizar a cada sessão** |

## 3. Stack `[A VALIDAR — não alterar sem discussão]`

Next.js 15 + TypeScript (web) · NestJS monólito modular (api) · PostgreSQL 16 + PostGIS + pgvector · Prisma · Redis + BullMQ · Meilisearch · S3 · Claude API (IA/RAG) · PSP/BaaS licenciado para escrow (spike S0-07 em aberto) · pnpm + Turborepo · GitHub Actions.

⚠️ O documento de visão citava um "stack fechado" nunca anexado. Tratar o stack acima como proposta até validação formal (registrar em `docs/adr/ADR-0001-stack.md`).

## 4. Estrutura do repositório

```
apps/web        → Next.js (cliente/prestador/fornecedor)
apps/admin      → painel interno (moderação, disputas)
services/api    → NestJS modular (identity, marketplace, rfq, escrow, works,
                  procurement, ai, catalog, content, ranking, ads, billing)
packages/ui     → design system  ·  packages/types → DTOs zod compartilhados
infra/docker    → docker-compose local  ·  .github/workflows → CI
docs/           → prd, adr, api, legal
app/            → [LEGADO] pasta do commit inicial — migrar/remover em S0-01
```

## 5. Regras inegociáveis (o Claude DEVE respeitar)

1. **Dinheiro:** valores sempre em **centavos (integer)**, nunca float. Toda mutação financeira é idempotente. `escrow_transactions` é **append-only** — nunca gerar UPDATE/DELETE nessa tabela.
2. **Escrow:** a plataforma nunca custodia recursos diretamente — apenas orquestra o PSP. Webhooks do PSP são a fonte de verdade; ledger interno é espelho conciliado.
3. **IA:** cálculos quantitativos usam calculadoras determinísticas (código), nunca "de cabeça" do LLM. Temas estrutural/elétrico/gás exigem disclaimer + recomendação de profissional habilitado (ART/RRT). **Nunca** incluir texto integral de NBR na base (direitos ABNT) — apenas resumos autorais + link oficial.
4. **LGPD:** dados pessoais só com base legal definida; logs de auditoria em `audit_log` para ações sensíveis; nunca logar CPF/tokens em texto claro.
5. **Idioma:** UI e textos para usuário em **PT-BR**, tom simples (público inclui prestadores de baixa familiaridade digital). Código/commits em inglês (Conventional Commits).
6. **Mobile-first:** toda jornada crítica funciona em 360 px. Contraste AA.
7. **Migrações** só via Prisma Migrate. PRs de `escrow`/`billing` exigem 2 aprovações.
8. **Segredos** nunca commitados — usar `.env` (validado com zod) e `.env.example` atualizado.

## 6. Design tokens (dos wireframes)

`--laranja:#F26A21` (ação primária) · `--grafite:#1E2A38` (texto/nav) · `--azul-planta:#1F5FA8` (escrow/confiança) · `--verde-ok:#2E8B57` (aprovado/pago) · `--amarelo-alerta:#F2B705` · `--vermelho:#C0392B` (disputa) · `--concreto:#EDEAE4` · `--areia:#FAF7F1`. Assinatura visual: faixa zebrada laranja/grafite.

## 7. Fluxo de trabalho

- Branch atual de trabalho: **`sprint-0`**. Branches: `feat/S0-XX-descricao`, `fix/...` a partir dela.
- Antes de codar: verificar a task em `docs/prd/04_Tasks_Backlog.md` e o DoR em `05_Skills_e_Checklists.md §B.1`.
- Ao concluir: cumprir o DoD (§B.2) e **atualizar `PENDENCIAS.md`** (mover item, registrar bloqueios).
- Decisão de arquitetura ⇒ criar ADR em `docs/adr/`.
- Comandos: `pnpm install` · `docker compose -f infra/docker/docker-compose.local.yml up -d` · `pnpm dev` · `pnpm test` · `pnpm lint`.

## 8. Estado atual do Sprint 0

Ver `PENDENCIAS.md` para o quadro vivo. Resumo: scaffold do monorepo, Docker local e CI criados nesta branch; decisões críticas em aberto: **stack final (ADR-0001)** e **escolha do PSP de escrow (S0-07)** — nada do épico E4 pode começar antes disso.
