# Testes de carga (E10-04 / D-002)

`matching-k6.js` mede o custo de `MatchingService.matchRfq()` (roda de forma
síncrona dentro de `POST /rfq`) sob carga crescente.

Pré-requisitos: [k6](https://k6.io) instalado, `services/api` rodando contra
um Postgres/Redis reais (`docker compose -f infra/docker/docker-compose.local.yml up -d`),
e ao menos alguns prestadores já cadastrados com `categorias` incluindo a
categoria usada no teste (`E2E_CATEGORIA`, default "Pintura residencial") —
sem prestador casável, o teste ainda mede o custo da query de matching (que
roda de qualquer forma), só não vai gerar `RfqMatch`.

```bash
API_URL=http://localhost:3355 k6 run services/api/test/load/matching-k6.js
```

**Nunca executado neste ambiente** (sem Docker/Postgres/Redis e sem o
binário do k6 disponível) — escrito e revisado, mas não validado contra a
stack real. Ver PENDENCIAS.md.
