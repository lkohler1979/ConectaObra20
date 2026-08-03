# DEPLOY.md — ConectaObra 2.0

> Passo a passo da primeira instalação numa VPS. Depois da primeira vez,
> use `./deploy.sh` (raiz do repo) pra atualizar — ver seção 14.

## 0. Contexto e limites deste guia (ler antes)

- A infra de produção final ainda **não está fechada** — `PENDENCIAS.md`
  lista isso como bloqueador aberto (P-001) e a automação de deploy via CI
  também está pendente (P-008). Este guia documenta o caminho decidido
  nesta sessão: **VPS Ubuntu própria, com Nginx e PostgreSQL já
  instalados nativamente** (sem Docker em produção, sem PaaS).
- O PSP de escrow (P-002) ainda não foi escolhido. **Não coloque o épico
  E4 (pagamentos reais) em produção antes disso** — o que existe hoje
  (E1, E3) não movimenta dinheiro de verdade.
- **Dois domínios públicos**, ambos atrás do Nginx (porta 80/443):
  `conectaon.unifyhub.com.br` → `apps/web` (porta 3399) e
  `apiconectaon.unifyhub.com.br` → `services/api` (porta 3355). Mesmo com
  a API pública no próprio domínio, as Route Handlers de `apps/web`
  continuam chamando `services/api` **internamente** via
  `127.0.0.1:3355` (ver `apps/web/lib/api-client.ts`) — mais rápido e sem
  depender de DNS/TLS pra tráfego que nunca sai da VPS. O domínio público
  da API é pra consumidores externos (apps mobile futuros, integrações,
  teste manual da API) — sem CORS habilitado hoje
  (`services/api/src/main.ts` não chama `app.enableCors()`), então uma
  chamada via browser de um domínio pro outro falharia até isso ser
  adicionado; não bloqueia o funcionamento do site em si.
- Este guia assume que você já tem a VPS provisionada e acesso SSH
  com sudo. Não cobre a criação da VPS em si.

## 1. Pré-requisitos na VPS

Confirmar o que já está instalado antes de seguir:

```bash
nginx -v
psql --version
git --version
```

Além disso:
- **Dois registros DNS tipo A** já apontando pro IP da VPS — a emissão
  do certificado TLS (seção 9) depende disso:
  - `conectaon.unifyhub.com.br` (frontend)
  - `apiconectaon.unifyhub.com.br` (backend)
- Uma porta livre pra API interna (este guia usa `3355`) e outra pro
  Next.js (`3399`).

## 2. Instalar Node.js 22 + pnpm + PM2

O projeto usa `pnpm@9.15.0` (pinado em `package.json`) e Node 22 (mesma
versão do CI, `.github/workflows/ci.yml`). PM2 é o gerenciador de
processo escolhido pra manter `services/api` e `apps/web` de pé sem
Docker.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # confirmar v22.x

sudo corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm -v   # confirmar 9.15.0

sudo npm install -g pm2
pm2 -v
```

## 3. Instalar Redis

`REDIS_URL` é obrigatório (BullMQ das notificações + fila de RFQ, ver
`services/api/src/config/env.ts`). Se a VPS já tiver Redis, pule este
passo.

```bash
sudo apt update
sudo apt install -y redis-server
sudo systemctl enable --now redis-server
redis-cli ping   # deve responder PONG
```

## 4. Banco de dados: extensões, usuário e schema

O schema usa PostGIS (matching por raio, `ST_DWithin`) e pgvector
(RAG da IA, ainda não implementado mas já no schema). Confirme a versão
major do Postgres primeiro:

```bash
psql --version
```

Instalar as extensões nativas pra essa versão (ajuste `16` se a sua
versão for outra):

```bash
sudo apt install -y postgresql-16-postgis-3
# pgvector pode não estar no repositório padrão do Ubuntu — se
# `postgresql-16-pgvector` não existir, compilar a partir do código-fonte:
# https://github.com/pgvector/pgvector#installation
sudo apt install -y postgresql-16-pgvector || echo "pgvector não disponível via apt — ver link acima"
sudo systemctl restart postgresql
```

Criar o usuário, o banco e habilitar as extensões (troque a senha):

```bash
sudo -u postgres psql <<'SQL'
CREATE USER conectaobra WITH PASSWORD 'TROQUE_ESTA_SENHA';
CREATE DATABASE conectaobra OWNER conectaobra;
\c conectaobra
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SQL
```

## 5. Clonar o repositório

```bash
sudo mkdir -p /var/www/conectaobra
sudo chown "$USER":"$USER" /var/www/conectaobra
git clone <URL_DO_SEU_REPO_GIT> /var/www/conectaobra
cd /var/www/conectaobra
git checkout main
```

## 6. Configurar variáveis de ambiente

```bash
cp services/api/.env.example services/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Editar `services/api/.env`:
- `DATABASE_URL` com o usuário/senha/banco do passo 4, ex:
  `postgresql://conectaobra:SUA_SENHA@localhost:5432/conectaobra?schema=public`
- `REDIS_URL="redis://localhost:6379"`
- `NODE_ENV=production`
- `PORT=3355`
- `JWT_SECRET` — **gerar um valor novo e forte**, nunca reaproveitar o
  do `.env.example`: `openssl rand -base64 48`
- `SENTRY_DSN` — opcional, mas recomendado em produção (sem ele, erros
  só ficam no log local, ver P-011 em `PENDENCIAS.md`)
- `S3_*` — opcional; sem eles, `POST /media/presigned-upload` responde
  503 em vez de quebrar o boot (ver P-018)

Editar `apps/web/.env.local`:
- `API_URL="http://127.0.0.1:3355"` — `services/api` só é chamado
  internamente, nunca precisa de domínio público próprio

## 7. Instalar dependências, buildar e migrar

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @conectaobra/api prisma:deploy
```

`pnpm build` roda o build de todos os workspaces via Turborepo,
respeitando a ordem de dependência (`packages/*` antes de
`services/api`/`apps/web`). `prisma:deploy` (= `prisma migrate deploy`)
aplica as migrações já existentes sem gerar novas — é o comando de
produção. **Nunca rode `prisma migrate dev` nem `pnpm --filter
@conectaobra/api seed` contra um banco com dados reais** — `seed.ts` cria
usuários fictícios com senha fixa (`senha12345`), é só pra
desenvolvimento local.

## 8. Subir os processos com PM2

```bash
pm2 start infra/deploy/ecosystem.config.cjs
pm2 save
pm2 startup   # siga as instruções impressas na tela pra sobreviver a reboot
```

Isso sobe dois processos (definidos em `infra/deploy/ecosystem.config.cjs`):
- `conectaobra-api` — `node services/api/dist/src/main.js`, porta 3355
- `conectaobra-web` — `next start` em `apps/web`, porta 3399

Conferir:

```bash
pm2 status
pm2 logs --lines 50
```

## 9. Configurar o Nginx (reverse proxy + TLS)

O arquivo de exemplo já vem com os dois domínios certos (`conectaon.unifyhub.com.br`
pro frontend, `apiconectaon.unifyhub.com.br` pro backend) — não precisa
editar nada, só copiar e habilitar:

```bash
sudo cp infra/deploy/nginx.conf.example /etc/nginx/sites-available/conectaobra
sudo ln -s /etc/nginx/sites-available/conectaobra /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

TLS com Let's Encrypt (o certbot edita o arquivo acima automaticamente
pra adicionar o bloco 443 e o redirect HTTP→HTTPS **nos dois** server
blocks, um cert cobrindo os dois domínios):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d conectaon.unifyhub.com.br -d apiconectaon.unifyhub.com.br
```

## 10. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Importante: por padrão, tanto `next start` quanto `app.listen(PORT)` do
NestJS (`services/api/src/main.ts`) escutam em **todas as interfaces**
(`0.0.0.0`), não só localhost — o firewall acima é a barreira real que
impede acesso direto às portas 3399/3355 de fora da VPS. Confirme com
`sudo ufw status` que só `OpenSSH` e `Nginx Full` estão liberados. Como
endurecimento opcional (fora do escopo deste guia, exigiria alterar
código): bindar explicitamente em `127.0.0.1` (`next start -H
127.0.0.1` e `app.listen(port, "127.0.0.1")` em `main.ts`).

## 11. Testar

```bash
curl -I https://conectaon.unifyhub.com.br
curl -I https://apiconectaon.unifyhub.com.br/health
curl http://127.0.0.1:3355/health
pm2 logs --lines 20
```

## 12. Se algo der errado

- `pm2 logs conectaobra-api --lines 100` / `conectaobra-web` pra ver o
  erro real.
- Se a migração falhar, **não rode `prisma migrate reset`** num banco
  com dados reais — investigue a migração com defeito ou restaure o
  backup (seção 13).
- `sudo nginx -t` sempre antes de `reload`, pra não derrubar o Nginx
  com um config quebrado.

## 13. Backup do banco (mínimo viável)

```bash
mkdir -p /var/backups/conectaobra
pg_dump -U conectaobra -h localhost conectaobra > /var/backups/conectaobra/$(date +%F).sql
```

Automatizar isso (cron) está fora do escopo deste guia — registrar como
pendência em `PENDENCIAS.md` antes de qualquer dado real de cliente
entrar no banco.

## 14. Deploys seguintes: use `deploy.sh`

Depois da primeira instalação, atualizações não repetem os passos 5–9 —
use `./deploy.sh` (na raiz do repo, mesmo usuário dono do diretório):

```bash
cd /var/www/conectaobra
./deploy.sh
```

Em ordem, o script:
1. **Recusa rodar** se houver alterações não commitadas em `/var/www/conectaobra`
   (`git status --porcelain` não vazio) — resolva (commit, stash ou
   descarte) antes de tentar de novo.
2. **Atualiza o código**: `git fetch` + `git checkout <branch>` + `git pull --ff-only`
   (default `main`; use `DEPLOY_BRANCH=outra ./deploy.sh` pra outra branch).
3. **Instala dependências**: `pnpm install --frozen-lockfile` (o
   `postinstall` de `services/api` já roda `prisma generate` sozinho).
4. **Builda** todos os workspaces via Turborepo (`pnpm build`), na ordem
   de dependência certa (`packages/*` antes de `services/api`/`apps/web`).
5. **Aplica migrações pendentes**: `prisma migrate deploy` (nunca gera
   migração nova, só aplica as já commitadas).
6. **Recarrega os processos no PM2** (`conectaobra-api`/`conectaobra-web`)
   — reload se já existirem, `pm2 start` na primeira vez.
7. **Checa saúde**: `curl http://127.0.0.1:3355/health` — se falhar, o
   script avisa mas não desfaz o deploy (ver `pm2 logs` pra investigar).

Se qualquer passo falhar, o script para na hora (`set -euo pipefail`) —
não continua num estado parcial. Ver como reverter manualmente nos
comentários do topo de `deploy.sh`.

## 15. Pendências conhecidas deste guia

Registradas em `PENDENCIAS.md`:
- Sem CI/CD automatizado — deploy hoje é manual via SSH (P-008 aberto).
- Sem backup automatizado do Postgres (seção 13 é manual).
- Sem ambiente de staging separado de produção.
- `services/api` e `apps/web` rodam na mesma VPS sem isolamento de
  recursos (sem containers/cgroups) — um processo com vazamento de
  memória pode afetar o outro. `max_memory_restart` no PM2 é uma rede de
  segurança parcial, não isolamento de verdade.
- `services/api` agora é público no próprio domínio
  (`apiconectaon.unifyhub.com.br`), diferente de uma versão anterior
  deste guia (API só interna). Proteção hoje é só o `ThrottlerGuard`
  global (rate-limit por instância, não distribuído — mesma limitação
  de P-027) e os guards de autenticação/tipo de usuário existentes; não
  há CORS configurado (`app.enableCors()` não é chamado em
  `services/api/src/main.ts`), então chamadas diretas via browser a
  partir de outro domínio falhariam até isso ser adicionado — só
  relevante se algum dia um cliente browser precisar chamar a API
  cross-origin diretamente, o que não acontece hoje (`apps/web` só fala
  com a API internamente).
