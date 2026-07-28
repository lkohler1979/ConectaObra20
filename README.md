# ConectaObra 2.0 — MarketPlace da Construção Civil

Marketplace + gestão de obra + IA especializada + pagamentos garantidos (escrow).

📖 **Comece por:** [`CLAUDE.md`](./CLAUDE.md) (memória do projeto) · [`PENDENCIAS.md`](./PENDENCIAS.md) (quadro vivo) · [`docs/prd/`](./docs/prd/) (PRD, spec técnica, backlog, wireframes)

## Setup local
```bash
pnpm install
docker compose -f infra/docker/docker-compose.local.yml up -d
pnpm dev
```

## Deploy em produção

Ver [`DEPLOY.md`](./DEPLOY.md) (primeira instalação numa VPS) e
`./deploy.sh` (atualizações seguintes).

Branch de trabalho atual: `sprint-0`.
