import http from "k6/http";
import { check, sleep } from "k6";

/**
 * Teste de carga do matching de RFQ (E10-04/D-002) — mede o custo de
 * `MatchingService.matchRfq()`, que roda de forma síncrona e best-effort
 * dentro de `RfqService.create()` (POST /rfq): cada RFQ criado varre
 * `profiles_prestador` por categoria + raio (PostGIS `ST_DWithin`) e grava
 * `RfqMatch` para até 10 prestadores.
 *
 * NUNCA executado neste ambiente (sem Docker/Postgres/Redis, sem o binário
 * do k6 disponível) — escrito e revisado, mas não validado contra a stack
 * real. Rodar com:
 *
 *   API_URL=http://localhost:3355 k6 run services/api/test/load/matching-k6.js
 *
 * Setup pressupõe um banco já populado com ao menos N_PRESTADORES contas
 * PRESTADOR com `categorias` incluindo CATEGORIA (ex.: via seed ou rodando
 * este script uma vez em modo --no-vus só pra registrar as contas).
 */

const API_URL = __ENV.API_URL || "http://localhost:3355";
const CATEGORIA = __ENV.E2E_CATEGORIA || "Pintura residencial";

export const options = {
  scenarios: {
    matching: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 },
        { duration: "1m", target: 10 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    // p95 do endpoint que dispara o matching síncrono deve ficar abaixo de 800ms.
    http_req_duration: ["p(95)<800"],
    http_req_failed: ["rate<0.01"],
  },
};

function randomDigits(n) {
  let out = "";
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 10).toString();
  return out;
}

function cpfCheckDigit(digits, weights) {
  const sum = weights.reduce((acc, w, i) => acc + w * Number(digits[i]), 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function randomValidCpf() {
  const base = randomDigits(9);
  const d1 = cpfCheckDigit(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const withD1 = base + d1;
  const d2 = cpfCheckDigit(withD1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return withD1 + d2;
}

function registerCliente() {
  const suffix = `${Date.now()}.${__VU}.${__ITER}`;
  const body = JSON.stringify({
    tipo: "CLIENTE_PF",
    nome: "Cliente k6",
    email: `k6.cliente.${suffix}@e2e.conectaobra.test`,
    telefone: `27${randomDigits(9)}`,
    cpfCnpj: randomValidCpf(),
    senha: "Senha123!",
    aceitouTermos: true,
    aceitouPolitica: true,
  });
  const res = http.post(`${API_URL}/auth/register`, body, {
    headers: { "Content-Type": "application/json" },
  });
  check(res, { "cliente registrado": (r) => r.status === 201 || r.status === 200 });
  return JSON.parse(res.body);
}

function createObra(token) {
  const res = http.post(
    `${API_URL}/works`,
    JSON.stringify({
      titulo: "Obra k6",
      tipo: "REFORMA",
      endereco: "Rua Teste k6, 1 — Vitória/ES",
    }),
    { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } },
  );
  check(res, { "obra criada": (r) => r.status === 201 });
  return JSON.parse(res.body);
}

export default function () {
  const { tokens } = registerCliente();
  const token = tokens.accessToken;
  const obra = createObra(token);

  const rfqRes = http.post(
    `${API_URL}/rfq`,
    JSON.stringify({
      obraId: obra.id,
      categoria: CATEGORIA,
      descricao: "RFQ de carga (k6) — mede custo do matching síncrono.",
      fotos: [],
    }),
    { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } },
  );

  check(rfqRes, {
    "RFQ criado (matching rodou dentro da request)": (r) => r.status === 201,
  });

  sleep(1);
}
