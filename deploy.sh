#!/usr/bin/env bash
#
# deploy.sh — atualização do ConectaObra 2.0 numa VPS já provisionada.
# Ver DEPLOY.md para a primeira instalação (esse script não substitui isso).
#
# O que faz, em ordem:
#   1. Recusa rodar se houver alterações não commitadas no repo
#   2. git fetch + checkout + pull --ff-only da branch (default: main)
#   3. pnpm install --frozen-lockfile
#   4. pnpm build (Turborepo — todos os workspaces, na ordem certa)
#   5. prisma migrate deploy (aplica migrações pendentes; não gera novas)
#   6. pm2 reload dos dois processos (conectaobra-api / conectaobra-web)
#   7. checagem básica de saúde via GET /health
#
# O que NÃO faz: backup do banco antes de migrar, rollback automático,
# zero-downtime de verdade (é um único processo por app, não cluster).
#
# Rollback manual, se algo quebrar depois do deploy:
#   git log --oneline -10          # achar o commit anterior
#   git checkout <sha-anterior>
#   ./deploy.sh                    # reaplica build/pm2 nesse commit
#   (isso NÃO reverte migrações de banco — elas são incrementais por
#   design do Prisma Migrate; reverter dado de banco exige restaurar
#   backup, ver DEPLOY.md §13)
#
# Uso:
#   ./deploy.sh                    # branch main
#   DEPLOY_BRANCH=outra ./deploy.sh

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANCH="${DEPLOY_BRANCH:-main}"
API_PROCESS="conectaobra-api"
WEB_PROCESS="conectaobra-web"
API_PORT="${API_PORT:-3355}"
ECOSYSTEM_FILE="infra/deploy/ecosystem.config.cjs"

cd "$REPO_DIR"

echo "==> Repositório: $REPO_DIR (branch: $BRANCH)"

if [ -n "$(git status --porcelain)" ]; then
  echo "ERRO: há alterações não commitadas em $REPO_DIR — resolva antes de fazer deploy." >&2
  git status --short
  exit 1
fi

echo "==> git fetch/checkout/pull"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> pnpm install"
pnpm install --frozen-lockfile

echo "==> build (turbo)"
pnpm build

echo "==> prisma migrate deploy"
pnpm --filter @conectaobra/api prisma:deploy

echo "==> pm2 reload"
if ! command -v pm2 > /dev/null 2>&1; then
  echo "ERRO: pm2 não encontrado. Ver DEPLOY.md §2 (primeira instalação)." >&2
  exit 1
fi

for PROCESS in "$API_PROCESS" "$WEB_PROCESS"; do
  if pm2 describe "$PROCESS" > /dev/null 2>&1; then
    pm2 reload "$PROCESS"
  else
    echo "Processo $PROCESS não existe ainda no PM2 — subindo pela primeira vez."
    pm2 start "$ECOSYSTEM_FILE" --only "$PROCESS"
  fi
done

pm2 save

echo "==> checando saúde de services/api"
sleep 2
if curl -fsS "http://127.0.0.1:${API_PORT}/health" > /dev/null; then
  echo "OK: services/api respondeu em /health"
else
  echo "ATENÇÃO: services/api não respondeu em /health — ver 'pm2 logs $API_PROCESS'" >&2
fi

echo "==> deploy concluído: $(git rev-parse --short HEAD)"
