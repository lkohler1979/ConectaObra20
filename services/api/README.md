# @conectaobra/api

NestJS monólito modular. Ver `docs/prd/03_Estrutura_Projeto.md` para a
estrutura-alvo completa (módulos de domínio em `src/modules/*`).

## Conteúdo (S0-05 + S0-06 + E1-01 + E1-02 + E1-04 + E1-07 + E1-08 + E3-01 + E3-02 + E3-03)

> S0-05 até E3-02 já estão mesclados em `main` (2026-07-28). O que segue é
> o inventário cumulativo; a seção **Status** no fim descreve o que ainda
> falta validar contra infra real (Postgres/S3/Sentry).

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
- `src/modules/identity/profile/` (**E1-02**) — `GET /profile/me`,
  `PUT /profile/prestador` (também usado por `TECNICO` — `profiles_prestador`
  cobre os dois, o doc 02 §3 não define um profile dedicado para técnico),
  `PUT /profile/fornecedor`. `UserTypeGuard` +`@AllowedUserTypes(...)`
  restringe cada rota ao(s) tipo(s) certo(s) de usuário. `geo` (lat/lng) é
  gravado via `$executeRaw` em PostGIS — o Prisma Client não escreve campos
  `Unsupported`. Cliente PF/PJ não tem perfil extra: o cadastro (E1-01) já é
  o onboarding dele.
- `src/modules/identity/auth/mfa.service.ts` (**E1-04**) — TOTP (`otplib`,
  RFC 6238). `POST /auth/mfa/setup` gera secret + `otpauthUrl` (autenticado);
  `/mfa/enable` confirma com um código e liga `mfaEnabled`; `/mfa/disable`
  exige o código atual. Com MFA ligado, `POST /auth/login` não devolve mais
  os tokens direto — devolve `{ mfaRequired: true, mfaToken }` (JWT de
  escopo `mfa_challenge`, 5 min); o client troca isso + o código TOTP em
  `POST /auth/mfa/verify-login` pelos tokens finais. `JwtStrategy` agora
  rejeita qualquer token cujo `scope` não seja `access` nas rotas
  protegidas normais — sem essa checagem, o próprio `mfaToken` serviria
  pra acessar rotas comuns, o que seria um furo de segurança. Isso é o
  alicerce de "MFA obrigatório para operações financeiras" (CLAUDE.md §5)
  — a obrigatoriedade por operação específica vem quando os endpoints do
  épico E4 (escrow) existirem.
- `src/modules/media/` (**E1-07**) — `POST /media/presigned-upload`
  (autenticado) gera uma URL presigned de `PUT` direto pro S3 via
  `@aws-sdk/client-s3` + `s3-request-presigner` — o Nest nunca recebe os
  bytes do arquivo. Restrito a `image/{jpeg,png,webp}`, até 10MB. Sem
  `S3_BUCKET`/credenciais configuradas (nenhum bucket real existe ainda),
  responde `503` em vez de derrubar o boot — mesmo padrão do `OtpNotifier`
  e do `Sentry.init()`. **Compressão de fotos não está implementada**: como
  o upload é direto client→S3, comprimir de forma síncrona no Nest não é
  possível; isso fica para um worker assíncrono (BullMQ, já provisionado
  no `docker-compose.local.yml`, mas nenhum consumer foi criado ainda) —
  ver `PENDENCIAS.md` P-018.
- `src/modules/identity/legal/` (**E1-08**) — `GET /legal/versions`
  (público) + `POST /legal/consent` (autenticado, só
  `COMUNICACAO_MARKETING` — os obrigatórios entram no cadastro).
  `ConsentService` grava em `consents`, que é **append-only** (cada
  aceite/revogação é uma linha nova, mesmo espírito da regra 1 do
  CLAUDE.md) — o estado atual é sempre a linha mais recente por
  `(userId, tipo)`. `POST /auth/register` agora exige
  `aceitouTermos`/`aceitouPolitica` (ambos `true`) e grava os dois
  consentimentos obrigatórios automaticamente.
- `src/modules/identity/account/` (**E1-08**) — `DELETE /account`
  (autenticado, exige senha atual). Exclusão de conta é **anonimização,
  não hard-delete**: nome/e-mail/telefone/CPF-CNPJ sobrescritos, senha
  invalidada, MFA desligado, todas as sessões (`refresh_tokens`)
  revogadas, `deletedAt` marcado. Um `DELETE` de verdade falharia por FK
  assim que o usuário tivesse qualquer contrato/RFQ (as relações usam
  `Restrict` por padrão), e além disso destruiria histórico que
  `escrow_transactions`/`audit_log` precisam reter por serem append-only.
- `src/modules/works/` (**E3-01**) — `POST /works`, `GET /works` (só as
  próprias), `GET /works/:id` e `PATCH /works/:id` (dono only — 404, não
  403, se a obra for de outro cliente, pra não vazar existência).
  Restrito a `CLIENTE_PF`/`CLIENTE_PJ` para criar/editar. `status` fica
  livre (`"planejamento"` no create) — nenhum workflow de estados foi
  definido ainda (isso é E6). **Geocoding automático não está
  implementado**: `endereco` é texto livre, e `geo` (lat/lng) é opcional —
  o client manda direto se tiver (ex: mapa/autocomplete no frontend);
  converter o texto do endereço em coordenadas automaticamente exige um
  provedor (Google Geocoding/Mapbox/Nominatim) ainda não escolhido — ver
  `PENDENCIAS.md` P-021.
- `src/modules/rfq/` (**E3-02**) — `POST /rfq`, `GET /rfq`, `GET /rfq/:id`,
  `PATCH /rfq/:id` (só enquanto `status = ABERTO`). Publicar um RFQ exige
  que a `obraId` informada pertença ao próprio cliente (senão 404, mesmo
  padrão de information-hiding do `WorksModule`). `fotos` é um array de
  URLs já enviadas via `POST /media/presigned-upload` (E1-07) — precisou
  de uma nova migração (`Rfq.fotos`, ausente do doc 02 §3).
- `src/modules/matching/` (**E3-03**) — `MatchingService.matchRfq()` casa
  um RFQ recém-publicado com até 10 prestadores: categoria em comum
  (`categoria = ANY(pp.categorias)`) e, se a obra tiver `geo`, dentro do
  raio de atendimento do prestador via PostGIS `ST_DWithin`. Sem `geo` na
  obra, cai pra match só por categoria (ver P-021). **Rodízio**:
  `ProfilePrestador.ultimoMatchEm` (nova migração) — ordena por quem não
  é casado há mais tempo primeiro e marca a hora do match pros
  selecionados, pra não sempre entregar os leads aos mesmos prestadores.
  Persistido em `RfqMatch` (auditoria + base pra E3-04 quando existir).
  Roda automaticamente dentro de `RfqService.create()`, mas de forma
  *best-effort*: uma falha no matching (ex: erro de SQL) não impede a
  publicação do RFQ, só fica logada. `GET /rfq/discover` (autenticado,
  `PRESTADOR`/`TECNICO`) lista os RFQs abertos casados com o próprio
  perfil. **Sem notificação ainda** — isso é E3-04 (fila BullMQ, infra já
  no `docker-compose.local.yml` mas sem consumer criado).
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

curl localhost:3333/legal/versions

curl -X POST localhost:3333/auth/register -H 'content-type: application/json' -d '{
  "tipo":"PRESTADOR","nome":"Teste","email":"teste@example.com",
  "telefone":"+5527999998888","cpfCnpj":"52998224725","senha":"senha12345",
  "aceitouTermos":true,"aceitouPolitica":true
}'

# com o accessToken retornado acima:
curl -X PUT localhost:3333/profile/prestador \
  -H 'content-type: application/json' -H 'authorization: Bearer <accessToken>' -d '{
  "categorias":["eletrica"],"experienciaAnos":5,"raioAtendimentoKm":20
}'

curl -X DELETE localhost:3333/account \
  -H 'content-type: application/json' -H 'authorization: Bearer <accessToken>' -d '{
  "senha":"senha12345"
}'

# POST /works e POST /rfq exigem tipo CLIENTE_PF/CLIENTE_PJ — registre uma conta desse tipo primeiro
curl -X POST localhost:3333/works \
  -H 'content-type: application/json' -H 'authorization: Bearer <accessTokenDeCliente>' -d '{
  "titulo":"Reforma cozinha","tipo":"REFORMA","endereco":"Rua Exemplo, 123 — Vitória/ES",
  "areaM2":12.5,"orcamentoPrevistoCentavos":800000
}'

# com o id da obra retornado acima — publicar já roda o matching automaticamente:
curl -X POST localhost:3333/rfq \
  -H 'content-type: application/json' -H 'authorization: Bearer <accessTokenDeCliente>' -d '{
  "obraId":"<workId>","categoria":"eletrica",
  "descricao":"Troca completa do quadro elétrico e pontos de luz da cozinha."
}'

# prestador com categorias:["eletrica"] no perfil (PUT /profile/prestador) descobre o RFQ acima:
curl localhost:3333/rfq/discover -H 'authorization: Bearer <accessTokenDePrestador>'
```

## Status

Todo o bootstrap e a árvore de injeção de dependências de `AuthModule`,
`ProfileModule`, `MediaModule`, `LegalModule`, `AccountModule`,
`WorksModule`, `RfqModule` e `MatchingModule` (controller → service →
guards → strategies → throttler → audit log → prisma) foram validados com
`tsc --noEmit`, `nest build` e execução real do `dist/src/main.js` —
inclusive **sem nenhuma credencial S3 configurada**, confirmando que
`MediaService` degrada normalmente em vez de derrubar o boot. A única
falha observada foi a esperada, "Can't reach database server", porque não
havia Postgres disponível no ambiente (sem Docker em nenhuma sessão até
agora). Esse mesmo tipo de teste já pegou e corrigiu bugs reais de DI e de
tipos que `tsc`/`nest build` sozinhos não detectam (ver `PENDENCIAS.md`
para o histórico). As funções do `otplib` também foram testadas
isoladamente e se comportam como esperado.

**Ninguém rodou isso contra um banco (ou bucket S3) real ainda** — validar
com `docker compose up` + os `curl` acima assim que houver Docker
disponível (ver `PENDENCIAS.md` P-010/P-011/P-013/P-014/P-015/P-017/P-018/
P-019/P-020/P-021/P-023/P-024).
