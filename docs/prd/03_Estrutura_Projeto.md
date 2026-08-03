# Estrutura do Projeto — ConectaObra 2.0
**Monorepo (pnpm workspaces + Turborepo) | Versão 1.0**

```
conectaobra/
├── apps/
│   ├── web/                        # Next.js 15 — app do cliente/prestador/fornecedor
│   │   ├── app/
│   │   │   ├── (public)/           # landing, busca, perfis públicos, notícias (SEO)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── fornecedores/[slug]/
│   │   │   │   ├── profissionais/[slug]/
│   │   │   │   ├── projetos/       # catálogo de plantas
│   │   │   │   └── noticias/
│   │   │   ├── (auth)/             # login, cadastro, kyc
│   │   │   ├── (app)/              # área logada
│   │   │   │   ├── obras/[id]/     # dashboard, cronograma, financeiro, diario
│   │   │   │   ├── orcamentos/     # RFQs e comparador
│   │   │   │   ├── compras/        # listas de materiais e cotações
│   │   │   │   ├── pagamentos/     # escrow, milestones, disputas
│   │   │   │   ├── ia/             # engenheiro virtual
│   │   │   │   └── conta/          # perfil, plano, notificações
│   │   │   └── (partner)/          # painel fornecedor/prestador
│   │   │       ├── propostas/
│   │   │       ├── vitrine/        # página própria, produtos
│   │   │       ├── agenda/
│   │   │       └── financeiro/
│   │   ├── components/
│   │   ├── lib/
│   │   └── styles/
│   ├── admin/                      # Painel interno: moderação, disputas, ads, conteúdo
│   └── mobile/                     # (R2) Expo/React Native — prestador em canteiro
│
├── services/
│   └── api/                        # NestJS — monólito modular
│       ├── src/
│       │   ├── modules/
│       │   │   ├── identity/       # auth, kyc, mfa, perfis
│       │   │   ├── marketplace/    # fornecedores, produtos, busca
│       │   │   ├── labor/          # mão de obra, agenda
│       │   │   ├── rfq/            # orçamentos, matching, comparador
│       │   │   ├── contracts/      # contratos + assinatura eletrônica
│       │   │   ├── escrow/         # milestones, ledger, disputas, webhooks PSP
│       │   │   ├── works/          # obras, cronograma, diário, checklists
│       │   │   ├── procurement/    # listas de materiais, cotações
│       │   │   ├── ai/             # chat RAG, calculadoras, análise de orçamento
│       │   │   ├── catalog/        # plantas arquitetônicas
│       │   │   ├── content/        # notícias, indicadores, custos médios, biblioteca
│       │   │   ├── ranking/        # notas, selos
│       │   │   ├── ads/            # publicidade
│       │   │   ├── billing/        # assinaturas
│       │   │   └── notifications/  # push, e-mail, WhatsApp
│       │   ├── common/             # guards, interceptors, audit-log
│       │   └── main.ts
│       ├── prisma/                 # schema.prisma + migrations
│       └── test/                   # unit + e2e
│
├── packages/
│   ├── ui/                         # Design System (tokens, componentes)
│   ├── types/                      # DTOs/contratos compartilhados (zod)
│   ├── config/                     # eslint, tsconfig, tailwind preset
│   └── ai-knowledge/               # pipeline de ingestão RAG (scripts)
│
├── infra/
│   ├── docker/                     # docker-compose.local.yml (pg, redis, meili)
│   ├── terraform/                  # (fase 2) IaC AWS
│   └── github/                     # workflows CI/CD
│
├── docs/
│   ├── prd/                        # este pacote de documentos
│   ├── adr/                        # decisões de arquitetura (ADR-0001...)
│   ├── api/                        # OpenAPI gerado
│   └── legal/                      # modelos de contrato, políticas LGPD
│
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

## Convenções

- **Branches:** trunk-based; `feat/`, `fix/`, `chore/` + Conventional Commits.
- **Revisão:** todo PR com 1 aprovação; módulos `escrow` e `billing` exigem 2.
- **Migrações:** apenas via Prisma Migrate, nunca SQL manual em produção.
- **Variáveis de ambiente:** validadas com zod no boot (`packages/config/env`).
- **Definições de pronto:** ver `05_Checklists_Execucao.md`.

## Setup local (alvo do Sprint 0)

```bash
pnpm install
docker compose -f infra/docker/docker-compose.local.yml up -d
pnpm --filter api prisma migrate dev && pnpm --filter api seed
pnpm dev          # web:3399 · api:3355 · admin:3001
```
