# PENDENCIAS.md — ConectaObra 2.0
> Quadro vivo de pendências. **Atualizar a cada sessão de trabalho** (humano ou Claude).
> Formato: mover itens entre seções; nunca apagar histórico — usar ~~riscado~~ + data.
> Última atualização: 2026-07-28 · Branch: `feat/E3-07-aceitar-proposta`

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
| P-004 | ~~Push da branch `sprint-0` para o GitHub e abertura do PR~~ | S0-01 | Obsoleto | O branch `sprint-0` nunca existiu — scaffold foi direto pra `main`, e toda a pilha S0-04→E3-02 já foi mesclada em `main` em 2026-07-28. Ver nota no rodapé deste arquivo |
| P-005 | Decidir destino da pasta legada `app/` do commit inicial (migrar conteúdo ou remover) | S0-01 | Aberto | Conteúdo original não inspecionado |
| P-006 | Escolher provedor de assinatura eletrônica (Clicksign/ZapSign/D4Sign) e de KYC (idwall/CAF) | S0-08 | Aberto | Pode rodar em paralelo ao P-002 |
| P-007 | Rodar `pnpm install` e validar `docker compose up` no ambiente local do time | S0-02 | Parcial | `pnpm install` já roda limpo (lockfile gerado e commitado); `docker compose up` **ainda não validado** — Docker não estava disponível no ambiente desta sessão |
| P-008 | Configurar secrets do GitHub Actions (deploy staging) | S0-03 | Aberto | Workflow de CI criado; job de deploy comentado até definir infra |
| P-009 | Design System v0: 15 componentes base implementados em `packages/ui` — **mesclado em `main`** | S0-04 | Mesclado | Faltam `Table`, `Tooltip`, `RadioGroup`, `Switch`, `Spinner`/`Skeleton`, Storybook e revisão do Product Designer |
| P-010 | Schema Prisma inicial + migração + seed em `services/api` — **mesclado em `main`** | S0-05 | Mesclado | `prisma validate`/`generate`/`tsc --noEmit` passaram; migração **nunca foi aplicada** a um Postgres real (sem Docker em nenhuma sessão até agora) — validar com `docker compose up` + `pnpm --filter @conectaobra/api prisma:deploy` assim que possível |
| P-011 | Sentry DSN + logger estruturado + tabela `audit_log` — **mesclado em `main`** | S0-06 | Mesclado | Bootstrap NestJS mínimo criado (`main.ts`/`app.module.ts`) só para ter algo real a observar; logger (`nestjs-pino`, redact LGPD) + `SentryExceptionFilter` + `AuditLogService` (sanitiza payload) implementados. **Falta o DSN real do Sentry** (`Sentry.init()` é no-op sem ele) e validar contra Postgres real |
| P-012 | Contratar engenheiro civil consultor (pré-requisito do épico E5 — base da IA) | E5-02 | Aberto | Também apoia mediação de disputas |
| P-013 | Imagem `pgvector/pgvector:pg16` do `docker-compose.local.yml` provavelmente não tem a extensão PostGIS — `init-extensions.sql` roda `CREATE EXTENSION postgis` e pode falhar no primeiro `docker compose up`. Não verificado nesta sessão (sem Docker disponível) | S0-02 | Aberto | Se confirmado, trocar a imagem por uma com Postgres+PostGIS+pgvector (ex: Dockerfile próprio a partir de `postgis/postgis` + `CREATE EXTENSION vector` via pacote `pgvector` compilado) |
| P-014 | Cadastro/login (e-mail+senha, OTP telefone) + refresh token — **mesclado em `main`** | E1-01 | Mesclado | `POST /auth/{register,login,refresh,logout,otp/request,otp/verify}` implementados com refresh token rotativo (hash em DB, detecta reuso) e OTP com limite de tentativas. **Envio real de SMS não implementado** (stub que só loga o código — depende de P-006). KYC via provedor (E1-03) e rate-limit distribuído (hoje é por instância, não Redis) ficam para tasks seguintes. Toda a árvore de DI foi validada rodando o app de verdade — mas nunca contra um Postgres real |
| P-015 | Onboarding por perfil (cliente PF/PJ, prestador, fornecedor, técnico) — **mesclado em `main`** | E1-02 | Mesclado | `GET /profile/me`, `PUT /profile/prestador` (TECNICO reaproveita o mesmo endpoint/model — doc 02 §3 não define profile próprio pra técnico), `PUT /profile/fornecedor`, com `UserTypeGuard` restringindo cada rota. `geo` gravado via `$executeRaw` (PostGIS). Cliente PF/PJ não tem perfil extra — o cadastro já é o onboarding dele. Validado com `tsc`/`nest build`/execução real; nunca contra um Postgres real |
| P-017 | MFA (TOTP) — setup/enable/disable + desafio no login — **mesclado em `main`** | E1-04 | Mesclado | `POST /auth/mfa/{setup,enable,disable,verify-login}` com `otplib`. Login com MFA ligado devolve `{mfaRequired:true, mfaToken}` em vez dos tokens; `JwtStrategy` rejeita tokens com `scope` != `access`. Isso é só o alicerce: **nenhum endpoint financeiro existe ainda pra de fato "exigir" MFA** (isso vem no épico E4). `otplib` testado isoladamente (generateSecret/keyuri/check); app testado de ponta a ponta (DI limpo); nunca contra um Postgres real |
| P-018 | Upload de mídia (S3 presigned) — **mesclado em `main`** | E1-07 | Mesclado | `POST /media/presigned-upload` gera URL de PUT direto pro S3 (`@aws-sdk/client-s3`). **Nenhum bucket/credencial real existe ainda** — sem isso, o endpoint responde 503 (testado: app sobe normalmente mesmo sem S3 configurado). **Compressão de fotos não implementada**: como o upload é direto client→S3, precisa de um worker assíncrono (BullMQ, já no `docker-compose.local.yml`, mas sem consumer criado) rodando depois do upload — ficou de fora do escopo desta task |
| P-019 | LGPD: consentimentos + exclusão de conta — **mesclado em `main`** | E1-08 | Mesclado | `GET /legal/versions`, `POST /legal/consent` (append-only em `consents`), `DELETE /account` (anonimização, não hard-delete). `POST /auth/register` agora exige `aceitouTermos`/`aceitouPolitica`. **Nenhum texto real de Termos de Uso ou Política de Privacidade existe ainda** (`docs/legal/` vazio) — usa uma versão única (`v0-mvp`). `register()`/`deleteAccount()` corrigidos para rodar em `$transaction` (code review desta sessão). Validado com `tsc`/`nest build`/execução real; nunca contra um Postgres real |
| P-020 | Access tokens (JWT) não são revogados na exclusão de conta nem ao desligar MFA — um token emitido pouco antes continua válido até expirar (`JWT_ACCESS_TTL_SECONDS`, 15min por padrão) | E1-04, E1-08 | Aberto | Trade-off aceitável de JWT stateless com TTL curto — não é um bug a corrigir agora, mas registrar como limitação conhecida (achado em code review). Se algum dia precisar de revogação imediata de access token, a opção padrão é uma denylist em Redis (já no stack) checada no `JwtStrategy.validate()` |
| P-021 | Criar obra (CRUD básico) — **mesclado em `main`** | E3-01 | Mesclado | `POST/GET/GET:id/PATCH /works`, restrito a `CLIENTE_PF`/`CLIENTE_PJ` para criar/editar; leitura restrita ao dono (404 se for de outro cliente). `status` fica livre (`"planejamento"` no create) — workflow de estados fica pra E6. **Geocoding automático (endereço → lat/lng) não implementado** — nenhum provedor escolhido (Google Geocoding/Mapbox/Nominatim); `geo` é opcional, client manda lat/lng direto se tiver. Validado com `tsc`/`nest build`/execução real; nunca contra um Postgres real |
| P-022 | Publicar RFQ — **mesclado em `main`** | E3-02 | Mesclado | `POST/GET/GET:id/PATCH /rfq`, restrito a `CLIENTE_PF`/`CLIENTE_PJ`; exige que a `obraId` pertença ao próprio cliente (404 senão); `PATCH` só enquanto `status = ABERTO`. `Rfq.fotos` (array de URLs do S3, via E1-07) precisou de nova migração — ausente do doc 02 §3. **Sem matching regional, notificação ou propostas ainda** (E3-03/E3-04/E3-05). Validado com `tsc`/`nest build`/execução real; nunca contra um Postgres real |
| P-023 | `WorksService.create()`/`update()` gravam `geo` via `$executeRaw` numa chamada separada do `prisma.work.create()`, sem transação (mesmo padrão de `ProfileService.upsertPrestador`) | E3-01 | Aberto | Achado em code review (severidade baixa): uma falha entre as duas deixa a obra sem coordenadas até o cliente reenviar. Nada de segurança/dinheiro/compliance em jogo — não corrigido agora, só registrado |
| P-024 | Motor de matching regional, branch `feat/E3-03-matching` (empilhada sobre `main`, ainda não mesclada) | E3-03 | Em revisão | `MatchingService.matchRfq()` casa RFQ com até 10 prestadores por categoria + raio (PostGIS `ST_DWithin`), com rodízio via `ProfilePrestador.ultimoMatchEm` (nova migração, junto com `RfqMatch` pra persistir o resultado). Roda automaticamente e de forma best-effort dentro de `RfqService.create()` — falha no matching não impede a publicação do RFQ. `GET /rfq/discover` pro prestador ver os RFQs casados. **Sem obra.geo, o match cai pra só categoria** (geocoding ainda não existe, P-021). **Sem notificação ainda** (E3-04, precisa de worker BullMQ). Validado com `tsc`/`nest build`/execução real; nunca contra um Postgres real |
| P-025 | Envio de proposta + "caps por plano", branch `feat/E3-05-enviar-proposta` (empilhada sobre E3-03, ainda não mesclada) | E3-05 | Em revisão | `POST/GET /rfq/:id/proposals`, uma proposta por prestador por RFQ, só enquanto `ABERTO`; listagem restrita (dono vê todas, prestador só a própria — privacidade de leilão). **"Caps por plano" é um placeholder**: os tiers pagos de verdade (E8-01, 79/149/299/599 etc.) não existem ainda — hoje, sem nenhuma `Subscription`, o prestador tem um teto mensal fixo (`FREE_PLAN_MONTHLY_PROPOSAL_LIMIT`, env, default 5); qualquer `Subscription` isenta do teto, independente do plano real. Validado com `tsc`/`nest build`/execução real; nunca contra um Postgres real |
| P-026 | Aceitar proposta → rascunho de contrato, branch `feat/E3-07-aceitar-proposta` (empilhada sobre E3-05, ainda não mesclada) | E3-07 | Em revisão | `POST /proposals/:id/accept` (dono do RFQ): marca a proposta `ACEITA`, recusa as demais `ENVIADA` do mesmo RFQ, fecha o RFQ (`CONTRATADO`) e cria `Contract` (`"rascunho"`) + `ContractParty` — tudo numa única `$transaction` desde o início (lição do code review anterior). **Sem PDF nem assinatura eletrônica** (E4-01/E4-02). Validado com `tsc`/`nest build`/execução real; nunca contra um Postgres real |

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
| 2026-07-27 | Validação de env com zod em `packages/config` (`baseEnvSchema`/`parseEnv`), consumida por `services/api` |
| 2026-07-27 | Observabilidade v0 (S0-06, parcial): bootstrap NestJS mínimo (`main.ts`, `app.module.ts`, `GET /health`), logger estruturado (`nestjs-pino` com redact LGPD), `SentryExceptionFilter` global e `AuditLogService` (sanitiza CPF/token antes do insert), branch `feat/S0-06-observabilidade` — ver P-011. Bootstrap completo (env → Nest → logger → Prisma) testado de ponta a ponta com `tsc --noEmit`, `nest build` e execução real; única falha foi a esperada por não haver Postgres no ambiente |
| 2026-07-27 | DTOs zod compartilhados em `packages/types` (`@conectaobra/types/auth`, `/documents`), incluindo validação de CPF/CNPJ por dígito verificador (testada com casos conhecidos) |
| 2026-07-27 | Cadastro/login + refresh token + OTP telefone (E1-01, parcial): `AuthModule` completo em `services/api/src/modules/identity/auth/`, branch `feat/E1-01-cadastro-login-work` — ver P-014 |
| 2026-07-27 | Onboarding por perfil (E1-02, parcial): `ProfileModule` (`GET /profile/me`, `PUT /profile/{prestador,fornecedor}`) + `UserTypeGuard`, branch `feat/E1-02-onboarding-perfil` — ver P-015 |
| 2026-07-27 | ~~P-016~~ Push ao GitHub resolvido: usuário configurou credencial (PAT) via `osxkeychain` com um `git push` manual; a partir daí, pushes desta sessão (S0-04, S0-05, S0-06, E1-01, E1-02) funcionaram normalmente, inclusive os PRs sugeridos pelo GitHub no retorno do push |
| 2026-07-27 | MFA/TOTP (E1-04, parcial): `POST /auth/mfa/{setup,enable,disable,verify-login}`, branch `feat/E1-04-mfa` — ver P-017 |
| 2026-07-28 | Upload de mídia (E1-07, parcial): `POST /media/presigned-upload` (S3), branch `feat/E1-07-upload-midia` — ver P-018 |
| 2026-07-28 | LGPD (E1-08, parcial): consentimentos append-only (`GET/POST /legal/*`) + exclusão de conta por anonimização (`DELETE /account`), branch `feat/E1-08-lgpd` — ver P-019 |
| 2026-07-28 | Code review completo da sessão (main → feat/E1-08-lgpd): 2 bugs de atomicidade corrigidos (`register()`/`deleteAccount()` agora em `$transaction`) e 1 limitação documentada (P-020) |
| 2026-07-28 | Criar obra (E3-01, parcial): `WorksModule` (`POST/GET/GET:id/PATCH /works`), branch `feat/E3-01-criar-obra` — ver P-021 |
| 2026-07-28 | Publicar RFQ (E3-02, parcial): `RfqModule` (`POST/GET/GET:id/PATCH /rfq`), branch `feat/E3-02-publicar-rfq` — ver P-022 |
| 2026-07-28 | **Merge de toda a sessão em `main`**: `S0-04 → S0-05 → S0-06 → E1-01 → E1-02 → E1-04 → E1-07 → E1-08 → E3-01 → E3-02` (fast-forward da pilha principal + merge do S0-04 independente, único conflito foi em PENDENCIAS.md, resolvido mantendo a versão mais atualizada). Validação completa pós-merge (`tsc`/`nest build`/build de todos os pacotes/execução real) achou e corrigiu 1 bug real: `packages/ui/tailwind.preset.ts` não tipava contra o `tailwindcss` de verdade (nunca fora buildado antes por falta de `pnpm install`) — `fontFamily.sans` é uma tupla `readonly`, incompatível com o `string[]` mutável que o `Config` do Tailwind espera |
| 2026-07-28 | Motor de matching regional (E3-03, parcial): `MatchingService` (categoria + raio PostGIS + rodízio) integrado em `RfqService.create()` + `GET /rfq/discover`, branch `feat/E3-03-matching` — ver P-024 |
| 2026-07-28 | Envio de proposta (E3-05, parcial): `RfqProposalService` (`POST/GET /rfq/:id/proposals`, cap mensal placeholder do plano gratuito), branch `feat/E3-05-enviar-proposta` — ver P-025 |
| 2026-07-28 | Aceitar proposta → rascunho de contrato (E3-07, parcial): `ContractsModule` (`POST /proposals/:id/accept`), branch `feat/E3-07-aceitar-proposta` — ver P-026 |

---

## 📌 Como publicar esta branch (P-004)

> ~~Obsoleto (2026-07-28)~~: o branch `sprint-0` nunca chegou a existir — o
> scaffold foi commitado direto em `main`, e toda a pilha desta sessão
> (S0-04 a E3-02) também já foi mesclada em `main`. P-004 permanece aberto
> só como registro histórico do fluxo pretendido originalmente.

```bash
# na sua máquina, dentro do clone de https://github.com/lkohler1979/ConectaObra20
git checkout -b sprint-0
# copie o conteúdo do pacote sprint0 por cima do repositório (preservando .git)
git add -A
git commit -m "chore(sprint-0): scaffold monorepo, CLAUDE.md, PENDENCIAS.md e docs de kickoff"
git push -u origin sprint-0
# abra o PR: sprint-0 → main
```
