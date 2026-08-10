/**
 * Seed de EXEMPLOS — gera pelo menos 3 registros de demonstração em cada
 * rota principal do sistema, além dos 5 personas mínimos de `seed.ts`.
 *
 * Diferente de `seed.ts` (grava direto no Postgres via PrismaClient, sem
 * precisar da API rodando), este script faz chamadas HTTP reais contra
 * `services/api` — mesmo padrão de `apps/web/e2e/helpers/e2e-api.ts` —
 * porque a maior parte dos fluxos (RFQ→proposta→contrato→milestone→
 * escrow→disputa→review, cotação→checkout, catálogo de plantas, sobra de
 * material) tem lógica de negócio (cálculo de comissão, encadeamento de
 * hash do ledger, transições de status) que só existe nos services do
 * Nest — replicar isso à mão em `prisma.create` seria reinventar (e
 * arriscar divergir) o que o próprio backend já faz.
 *
 * PRÉ-REQUISITOS:
 *   1. `docker compose -f infra/docker/docker-compose.local.yml -f infra/docker/docker-compose.dev.yml up -d`
 *      (ou a API rodando localmente na porta certa)
 *   2. `pnpm --filter @conectaobra/api seed` já ter rodado antes (cria os
 *      5 personas base que este script reaproveita por e-mail/login)
 *
 * Rodar com: pnpm --filter @conectaobra/api seed:examples
 * (ou, dentro do container: docker exec conectaobra-local-api-1 sh -c
 *  "cd services/api && pnpm exec tsx prisma/seed-examples.ts")
 */
import { PrismaClient } from "@prisma/client";
import type { CreateWorkInput, WorkPublic } from "@conectaobra/types/works";
import type { CreateRfqInput, RfqPublic } from "@conectaobra/types/rfq";
import type { CreateRfqProposalInput, RfqProposalPublic } from "@conectaobra/types/rfq-proposals";
import type { ContractPublic } from "@conectaobra/types/contracts";
import type { CreateMilestoneInput, MilestonePublic } from "@conectaobra/types/milestones";
import type { AbrirDisputeInput, ResolverDisputeInput, DisputePublic } from "@conectaobra/types/disputes";
import type { CreateReviewInput, ReviewPublic } from "@conectaobra/types/reviews";
import type { AddTeamMemberInput, TeamMemberPublic } from "@conectaobra/types/equipe";
import type { CreateMaterialListInput, MaterialListPublic } from "@conectaobra/types/material-lists";
import type { PurchaseQuotePublic, RespondPurchaseQuoteInput } from "@conectaobra/types/purchase-quotes";
import type { PurchaseOrderPublic } from "@conectaobra/types/purchase-orders";
import type { CreateProjectInput, ProjectPrivate } from "@conectaobra/types/projects-catalog";
import type {
  CreateSurplusListingInput,
  SurplusCheckoutInput,
  SurplusListingPublic,
} from "@conectaobra/types/material-surplus";
import type { CreateAdInput, AdPrivate } from "@conectaobra/types/ads";
import type { CreateArticleInput, ArticlePrivate } from "@conectaobra/types/articles";
import type { UpsertIndicatorInput, IndicatorPublic } from "@conectaobra/types/indicators";
import type { UpsertAvgCostInput, AvgCostPublic } from "@conectaobra/types/ai-budget";
import type { IngestKnowledgeInput, KnowledgeChunkPublic } from "@conectaobra/types/ai-knowledge";
import type { ChatResponse } from "@conectaobra/types/ai-chat";
import type { CreatePortfolioItemInput, PortfolioItemPublic } from "@conectaobra/types/portfolio";
import type { CreateFornecedorLojaInput, FornecedorLojaPublic } from "@conectaobra/types/fornecedor-lojas";
import type { CreatePromocaoInput, PromocaoPublic } from "@conectaobra/types/promocoes";
import type { CreateProductInput, ProductPublic } from "@conectaobra/types/catalog";
import type { PrestadorProfileInput, FornecedorProfileInput } from "@conectaobra/types/profile";

const API_BASE_URL = process.env.API_URL ?? "http://localhost:3355";
const SEED_SENHA = "senha12345";
const prisma = new PrismaClient();

/** Shape mínimo de `AuthResult` (services/api/.../auth.service.ts) — não é exportado por packages/types. */
interface AuthResponse {
  tokens: { accessToken: string };
}

// ───────────────────────── infra de chamada HTTP ─────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiCall<T>(
  method: "GET" | "POST" | "PATCH" | "PUT",
  path: string,
  token?: string,
  body?: unknown,
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 429) {
      // POST /auth/register e /auth/login têm @Throttle mais estrito
      // (5/60s) — esperar a janela passar em vez de falhar o seed inteiro.
      console.log(`  (429 em ${method} ${path}, esperando 61s pra passar do throttle...)`);
      await sleep(61_000);
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${method} ${path} → ${res.status}: ${text}`);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
  throw new Error(`${method} ${path}: excedeu tentativas por 429`);
}

/** Roda uma fase isolada — uma falha aqui não derruba as fases seguintes. */
async function fase<T>(nome: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    console.log(`\n=== ${nome} ===`);
    const resultado = await fn();
    console.log(`✔ ${nome}`);
    return resultado;
  } catch (err) {
    console.error(`✘ ${nome} FALHOU:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// --- geradores de dado válido (mesmo algoritmo de packages/types/documents.ts) ---

function randomDigits(n: number): string {
  let out = "";
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 10).toString();
  return out;
}
function cpfCheckDigit(digits: string, weights: number[]): number {
  const sum = weights.reduce((acc, w, i) => acc + w * Number(digits[i]), 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}
function randomValidCpf(): string {
  const base = randomDigits(9);
  const d1 = cpfCheckDigit(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const withD1 = base + d1;
  const d2 = cpfCheckDigit(withD1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return withD1 + d2;
}
function randomPhone(): string {
  return `27${randomDigits(9)}`;
}

async function login(email: string, senha: string): Promise<string> {
  const result = await apiCall<AuthResponse>("POST", "/auth/login", undefined, { email, senha });
  return result.tokens.accessToken;
}

async function registerOrLogin(input: {
  tipo: "CLIENTE_PF" | "PRESTADOR" | "FORNECEDOR";
  nome: string;
  email: string;
}): Promise<string> {
  try {
    const result = await apiCall<AuthResponse>("POST", "/auth/register", undefined, {
      tipo: input.tipo,
      nome: input.nome,
      email: input.email,
      telefone: `+55${randomPhone()}`,
      cpfCnpj: randomValidCpf(),
      senha: SEED_SENHA,
      aceitouTermos: true,
      aceitouPolitica: true,
    });
    console.log(`  registrado: ${input.email}`);
    return result.tokens.accessToken;
  } catch {
    console.log(`  já existia, logando: ${input.email}`);
    return login(input.email, SEED_SENHA);
  }
}

// ───────────────────────────── fases ─────────────────────────────

interface Tokens {
  ana: string;
  bruno: string;
  carla: string;
  carlos: string;
  daniel: string;
  elisa: string;
  julia: string;
  materiaisVitoria: string;
  ferro: string;
  construmix: string;
  admin: string;
}

async function faseContas(): Promise<Tokens> {
  const ana = await login("ana.cliente@example.com", SEED_SENHA);
  const carlos = await login("carlos.prestador@example.com", SEED_SENHA);
  const julia = await login("julia.engenheira@example.com", SEED_SENHA);
  const materiaisVitoria = await login("contato@materiaisvitoria.example.com", SEED_SENHA);
  const admin = await login("admin@conectaobra.example.com", SEED_SENHA);

  // @Throttle(5/60s) em /auth/register — registrar em série com pausa curta
  // entre cada um (o wrapper apiCall já lida com 429 se ainda assim bater).
  const bruno = await registerOrLogin({
    tipo: "CLIENTE_PF",
    nome: "Bruno Cliente",
    email: "bruno.cliente@example.com",
  });
  const carla = await registerOrLogin({
    tipo: "CLIENTE_PF",
    nome: "Carla Cliente",
    email: "carla.cliente@example.com",
  });
  const daniel = await registerOrLogin({
    tipo: "PRESTADOR",
    nome: "Daniel Prestador",
    email: "daniel.prestador@example.com",
  });
  const elisa = await registerOrLogin({
    tipo: "PRESTADOR",
    nome: "Elisa Prestadora",
    email: "elisa.prestadora@example.com",
  });
  const ferro = await registerOrLogin({
    tipo: "FORNECEDOR",
    nome: "Ferro & Aço Distribuidora",
    email: "contato@ferroaco.example.com",
  });
  const construmix = await registerOrLogin({
    tipo: "FORNECEDOR",
    nome: "Construmix Materiais",
    email: "contato@construmix.example.com",
  });

  return { ana, bruno, carla, carlos, daniel, elisa, julia, materiaisVitoria, ferro, construmix, admin };
}

async function faseProfiles(t: Tokens): Promise<void> {
  const prestador = (categorias: string[]): PrestadorProfileInput => ({
    categorias,
    experienciaAnos: 6,
    certificados: [],
    raioAtendimentoKm: 30,
  });
  await apiCall("PUT", "/profile/prestador", t.carlos, prestador(["eletrica", "hidraulica"]));
  await apiCall("PUT", "/profile/prestador", t.daniel, prestador(["hidraulica", "pintura"]));
  await apiCall("PUT", "/profile/prestador", t.elisa, prestador(["pintura", "eletrica"]));

  const fornecedor = (razaoSocial: string, categorias: string[]): FornecedorProfileInput => ({
    razaoSocial,
    categorias,
    regioes: ["Vitória/ES", "Vila Velha/ES"],
    tempoMercadoAnos: 5,
    certificacoes: [],
  });
  await apiCall(
    "PUT",
    "/profile/fornecedor",
    t.materiaisVitoria,
    fornecedor("Materiais Vitória Comércio Ltda", ["cimento", "acabamento"]),
  );
  await apiCall("PUT", "/profile/fornecedor", t.ferro, fornecedor("Ferro & Aço Distribuidora Ltda", ["ferro", "acabamento"]));
  await apiCall(
    "PUT",
    "/profile/fornecedor",
    t.construmix,
    fornecedor("Construmix Materiais Ltda", ["cimento", "hidraulica"]),
  );
}

async function faseVitrines(t: Tokens): Promise<void> {
  const itens: CreatePortfolioItemInput[] = [
    { titulo: "Reforma elétrica completa — apto 80m²", fotos: [] },
    { titulo: "Instalação hidráulica — casa térrea", fotos: [] },
    { titulo: "Padronização de quadro elétrico — condomínio", fotos: [] },
  ];
  for (const item of itens) {
    await apiCall<PortfolioItemPublic>("POST", "/profile/prestador/portfolio", t.carlos, item).catch(
      (e) => console.log(`  (item de portfólio já existia ou falhou: ${(e as Error).message})`),
    );
  }

  const lojas: CreateFornecedorLojaInput[] = [
    { nome: "Loja Centro", endereco: "Av. Central, 100 — Vitória/ES", regiao: "Vitória/ES" },
    { nome: "Loja Praia", endereco: "Av. Beira Mar, 500 — Vila Velha/ES", regiao: "Vila Velha/ES" },
    { nome: "Loja Serra", endereco: "Rod. Serrana, km 12 — Serra/ES", regiao: "Serra/ES" },
  ];
  for (const loja of lojas) {
    await apiCall<FornecedorLojaPublic>("POST", "/profile/fornecedor/lojas", t.materiaisVitoria, loja).catch(
      (e) => console.log(`  (loja já existia ou falhou: ${(e as Error).message})`),
    );
  }

  const validadeFim = new Date();
  validadeFim.setMonth(validadeFim.getMonth() + 2);
  const promocoes: CreatePromocaoInput[] = [
    {
      codigo: "CIMENTO10",
      nome: "10% off em cimento",
      descricao: "Válido para compras acima de 10 sacos.",
      valorOriginalCentavos: 3490,
      valorPromocionalCentavos: 3140,
      validadeFim,
      destaque: true,
    },
    {
      // valorPromocionalCentavos exige > 0 (nunca 0/grátis) — "frete grátis"
      // aqui é simbólico (R$0,01), não um frete real cobrado.
      codigo: "FRETE0",
      nome: "Frete grátis na primeira compra",
      descricao: "Válido pra novos clientes cadastrados.",
      valorPromocionalCentavos: 1,
      validadeFim,
      destaque: true,
    },
    {
      codigo: "ACABAMENTO15",
      nome: "15% off em acabamento",
      descricao: "Rejunte, argamassa e afins.",
      valorOriginalCentavos: 5000,
      valorPromocionalCentavos: 4250,
      validadeFim,
      destaque: false,
    },
  ];
  for (const promo of promocoes) {
    await apiCall<PromocaoPublic>("POST", "/profile/fornecedor/promocoes", t.materiaisVitoria, promo).catch(
      (e) => console.log(`  (promoção já existia ou falhou: ${(e as Error).message})`),
    );
  }

  const produtos: CreateProductInput[] = [
    { nome: "Areia média m³", categoria: "cimento", precoCentavos: 12000, unidade: "m³", estoque: 50, fotos: [] },
    { nome: "Argamassa AC-II 20kg", categoria: "acabamento", precoCentavos: 2890, unidade: "saco", estoque: 200, fotos: [] },
  ];
  for (const produto of produtos) {
    await apiCall<ProductPublic>("POST", "/products", t.materiaisVitoria, produto).catch(
      (e) => console.log(`  (produto já existia ou falhou: ${(e as Error).message})`),
    );
  }
}

interface RfqFlowResult {
  obraIds: string[];
  contractIds: string[];
  milestonesByContract: string[][];
}

async function faseObrasRfqContratos(t: Tokens): Promise<RfqFlowResult> {
  // Obra 1 já existe (criada por seed.ts: "Reforma de banheiro", RFQ
  // "eletrica" com 1 proposta ENVIADA de carlos) — reaproveita em vez de duplicar.
  const obrasExistentes = await apiCall<WorkPublic[]>("GET", "/works", t.ana);
  let obra1 = obrasExistentes.find((o) => o.titulo === "Reforma de banheiro");
  if (!obra1) {
    obra1 = await apiCall<WorkPublic>("POST", "/works", t.ana, {
      titulo: "Reforma de banheiro",
      tipo: "REFORMA",
      endereco: "Rua Exemplo, 123 — Vitória/ES",
    } satisfies CreateWorkInput);
  }

  const obra2 = await apiCall<WorkPublic>("POST", "/works", t.ana, {
    titulo: "Reforma de cozinha",
    tipo: "REFORMA",
    endereco: "Rua das Flores, 45 — Vila Velha/ES",
    areaM2: 18,
    orcamentoPrevistoCentavos: 1_200_000,
  } satisfies CreateWorkInput);

  const obra3 = await apiCall<WorkPublic>("POST", "/works", t.ana, {
    titulo: "Pintura da fachada",
    tipo: "REFORMA",
    endereco: "Rua Exemplo, 123 — Vitória/ES",
    areaM2: 60,
    orcamentoPrevistoCentavos: 600_000,
  } satisfies CreateWorkInput);

  // Ao menos 1 obra pra bruno/carla também — só pra não deixarem "GET /works"
  // vazio quando logados, sem levar o fluxo completo até contrato.
  await apiCall<WorkPublic>("POST", "/works", t.bruno, {
    titulo: "Construção de garagem",
    tipo: "CONSTRUCAO",
    endereco: "Av. Norte, 200 — Serra/ES",
  } satisfies CreateWorkInput);
  await apiCall<WorkPublic>("POST", "/works", t.carla, {
    titulo: "Ampliação de quarto",
    tipo: "AMPLIACAO",
    endereco: "Rua Sul, 88 — Cariacica/ES",
  } satisfies CreateWorkInput);

  const rfqsExistentes = await apiCall<RfqPublic[]>("GET", "/rfq", t.ana);
  let rfq1 = rfqsExistentes.find((r) => r.obraId === obra1!.id);
  if (!rfq1) {
    rfq1 = await apiCall<RfqPublic>("POST", "/rfq", t.ana, {
      obraId: obra1.id,
      categoria: "eletrica",
      descricao: "Troca completa do quadro elétrico e pontos de luz do banheiro.",
      regiao: "Vitória/ES",
      fotos: [],
    } satisfies CreateRfqInput);
  }

  const rfq2 = await apiCall<RfqPublic>("POST", "/rfq", t.ana, {
    obraId: obra2.id,
    categoria: "hidraulica",
    descricao: "Troca de encanamento e instalação de pia + torneira na cozinha.",
    regiao: "Vila Velha/ES",
    fotos: [],
  } satisfies CreateRfqInput);

  const rfq3 = await apiCall<RfqPublic>("POST", "/rfq", t.ana, {
    obraId: obra3.id,
    categoria: "pintura",
    descricao: "Pintura completa da fachada, incluindo preparo e selador.",
    regiao: "Vitória/ES",
    fotos: [],
  } satisfies CreateRfqInput);

  const proponentes = [
    { token: t.carlos, id: "carlos" },
    { token: t.daniel, id: "daniel" },
    { token: t.elisa, id: "elisa" },
  ];

  // rfq1 já tem a proposta ENVIADA de carlos (via seed.ts) — completa com
  // daniel/elisa pra chegar em 3.
  const propostasExistentesRfq1 = await apiCall<RfqProposalPublic[]>(
    "GET",
    `/rfq/${rfq1.id}/proposals`,
    t.ana,
  );
  if (!propostasExistentesRfq1.some((p) => true)) {
    // carlos ainda não propôs (base rodada sem seed.ts) — cobre esse caso também.
    await apiCall<RfqProposalPublic>("POST", `/rfq/${rfq1.id}/proposals`, t.carlos, {
      precoCentavos: 120_000,
      prazoDias: 5,
      observacoes: "Inclui material elétrico básico, exclui luminárias.",
    } satisfies CreateRfqProposalInput);
  }
  for (const p of [t.daniel, t.elisa]) {
    try {
      await apiCall<RfqProposalPublic>("POST", `/rfq/${rfq1.id}/proposals`, p, {
        precoCentavos: 135_000 + Math.floor(Math.random() * 20_000),
        prazoDias: 6,
        observacoes: "Proposta alternativa — inclui garantia de 90 dias.",
      } satisfies CreateRfqProposalInput);
    } catch {
      // já propôs numa rodada anterior — @@unique([rfqId, proponenteId]).
    }
  }

  for (const rfq of [rfq2, rfq3]) {
    for (const prop of proponentes) {
      try {
        await apiCall<RfqProposalPublic>("POST", `/rfq/${rfq.id}/proposals`, prop.token, {
          precoCentavos: 400_000 + Math.floor(Math.random() * 100_000),
          prazoDias: 7 + Math.floor(Math.random() * 10),
          observacoes: `Proposta de ${prop.id} — material e mão de obra inclusos.`,
        } satisfies CreateRfqProposalInput);
      } catch {
        // idempotência entre reruns
      }
    }
  }

  /**
   * Aceita a proposta ENVIADA do prestador escolhido — não "a primeira
   * disponível" (bug encontrado ao rodar: pegar `[0]` sempre acertava
   * carlos, já que ele é sempre o 1º a propor no loop de `proponentes`
   * acima, deixando os 3 contratos com o mesmo prestador).
   */
  async function aceitarProposta(rfqId: string, prestadorToken: string): Promise<ContractPublic | null> {
    const prestador = await apiCall<{ id: string }>("GET", "/profile/me", prestadorToken);
    const propostas = await apiCall<RfqProposalPublic[]>("GET", `/rfq/${rfqId}/proposals`, t.ana);
    const pendente = propostas.find((p) => p.status === "ENVIADA" && p.proponenteId === prestador.id);
    if (!pendente) return null;
    return apiCall<ContractPublic>("POST", `/proposals/${pendente.id}/accept`, t.ana);
  }

  const contrato1 = await aceitarProposta(rfq1.id, t.carlos);
  const contrato2 = await aceitarProposta(rfq2.id, t.daniel);
  const contrato3 = await aceitarProposta(rfq3.id, t.elisa);

  const contratos = [contrato1, contrato2, contrato3].filter((c): c is ContractPublic => c !== null);

  const meusContratos = await apiCall<ContractPublic[]>("GET", "/contracts", t.ana);
  const contractIds = contratos.length > 0 ? contratos.map((c) => c.id) : meusContratos.map((c) => c.id);

  const milestonesByContract: string[][] = [];
  for (const contractId of contractIds) {
    const milestonesExistentes = await apiCall<MilestonePublic[]>(
      "GET",
      `/contracts/${contractId}/milestones`,
      t.ana,
    );
    if (milestonesExistentes.length >= 3) {
      milestonesByContract.push(milestonesExistentes.map((m) => m.id));
      continue;
    }
    const ids: string[] = [...milestonesExistentes.map((m) => m.id)];
    for (let ordem = milestonesExistentes.length + 1; ordem <= 3; ordem++) {
      const m = await apiCall<MilestonePublic>("POST", `/contracts/${contractId}/milestones`, t.ana, {
        ordem,
        descricao: `Etapa ${ordem} do contrato`,
        valorCentavos: 150_000,
        checklist: ["Material no local", "Execução conforme projeto", "Limpeza da área"],
      } satisfies CreateMilestoneInput);
      ids.push(m.id);
    }
    milestonesByContract.push(ids);
  }

  return { obraIds: [obra1.id, obra2.id, obra3.id], contractIds, milestonesByContract };
}

async function faseMilestonesEscrowDisputas(t: Tokens, flow: RfqFlowResult): Promise<void> {
  const [contract1, contract2, contract3] = flow.contractIds;
  const [m1, m2, m3] = flow.milestonesByContract;
  if (!contract1 || !m1) return;

  async function pagarNormal(contractId: string, milestoneId: string, prestadorToken: string): Promise<void> {
    await apiCall("POST", `/contracts/${contractId}/milestones/${milestoneId}/deposito`, t.ana).catch(() => {});
    await apiCall("PATCH", `/contracts/${contractId}/milestones/${milestoneId}/entregar`, prestadorToken, {
      fotos: ["https://example.com/seed/etapa-entregue.jpg"],
    }).catch(() => {});
    await apiCall("PATCH", `/contracts/${contractId}/milestones/${milestoneId}/aprovar`, t.ana).catch(() => {});
  }

  // Contrato 1 (carlos) — as 3 etapas pagas, extrato financeiro de carlos com 3 exemplos.
  for (const milestoneId of m1) {
    await pagarNormal(contract1, milestoneId, t.carlos);
  }

  if (contract2 && m2) {
    // m2[0]: fluxo normal → PAGO.
    await pagarNormal(contract2, m2[0], t.daniel);

    // m2[1]: depósito + entrega + disputa resolvida com APROVAR (volta a
    // ENTREGUE) e depois aprovada de verdade → PAGO.
    if (m2[1]) {
      await apiCall("POST", `/contracts/${contract2}/milestones/${m2[1]}/deposito`, t.ana).catch(() => {});
      await apiCall("PATCH", `/contracts/${contract2}/milestones/${m2[1]}/entregar`, t.daniel, {
        fotos: ["https://example.com/seed/etapa-entregue.jpg"],
      }).catch(() => {});
      const disputa1 = await apiCall<DisputePublic>(
        "POST",
        `/contracts/${contract2}/milestones/${m2[1]}/disputas`,
        t.ana,
        {
          motivo: "Acabamento não ficou como o combinado, precisa de retoque.",
          evidencias: ["https://example.com/seed/evidencia-1.jpg"],
        } satisfies AbrirDisputeInput,
      ).catch(() => null);
      if (disputa1) {
        await apiCall("PATCH", `/disputas/${disputa1.id}/resolver`, t.admin, {
          decisao: "APROVAR",
          resolucao: "Prestador se comprometeu a corrigir o retoque em 2 dias — etapa segue.",
        } satisfies ResolverDisputeInput).catch(() => {});
        await apiCall("PATCH", `/contracts/${contract2}/milestones/${m2[1]}/aprovar`, t.ana).catch(() => {});
      }
    }

    // m2[2]: depósito + entrega + disputa resolvida com LIBERAR_PARCIAL → PAGO.
    if (m2[2]) {
      await apiCall("POST", `/contracts/${contract2}/milestones/${m2[2]}/deposito`, t.ana).catch(() => {});
      await apiCall("PATCH", `/contracts/${contract2}/milestones/${m2[2]}/entregar`, t.daniel, {
        fotos: ["https://example.com/seed/etapa-entregue.jpg"],
      }).catch(() => {});
      const disputa2 = await apiCall<DisputePublic>(
        "POST",
        `/contracts/${contract2}/milestones/${m2[2]}/disputas`,
        t.ana,
        {
          motivo: "Serviço entregue parcialmente, faltou concluir um trecho.",
          evidencias: ["https://example.com/seed/evidencia-2.jpg"],
        } satisfies AbrirDisputeInput,
      ).catch(() => null);
      if (disputa2) {
        await apiCall("PATCH", `/disputas/${disputa2.id}/resolver`, t.admin, {
          decisao: "LIBERAR_PARCIAL",
          resolucao: "Liberado só o valor da parte concluída, negociado entre as partes.",
          valorLiberadoCentavos: 100_000,
        } satisfies ResolverDisputeInput).catch(() => {});
      }
    }
  }

  if (contract3 && m3) {
    // m3[0]: fluxo normal → PAGO.
    await pagarNormal(contract3, m3[0], t.elisa);

    // m3[1]: disputa resolvida com ESTORNAR → volta a PENDENTE.
    if (m3[1]) {
      await apiCall("POST", `/contracts/${contract3}/milestones/${m3[1]}/deposito`, t.ana).catch(() => {});
      await apiCall("PATCH", `/contracts/${contract3}/milestones/${m3[1]}/entregar`, t.elisa, {
        fotos: ["https://example.com/seed/etapa-entregue.jpg"],
      }).catch(() => {});
      const disputa3 = await apiCall<DisputePublic>(
        "POST",
        `/contracts/${contract3}/milestones/${m3[1]}/disputas`,
        t.ana,
        {
          motivo: "Cor da tinta usada não é a que foi combinada no orçamento.",
          evidencias: ["https://example.com/seed/evidencia-3.jpg"],
        } satisfies AbrirDisputeInput,
      ).catch(() => null);
      if (disputa3) {
        await apiCall("PATCH", `/disputas/${disputa3.id}/resolver`, t.admin, {
          decisao: "ESTORNAR",
          resolucao: "Serviço não corresponde ao combinado — valor estornado ao cliente.",
        } satisfies ResolverDisputeInput).catch(() => {});
      }
    }

    // m3[2]: disputa aberta e deixada SEM resolver — fila de mediação do admin.
    if (m3[2]) {
      await apiCall("POST", `/contracts/${contract3}/milestones/${m3[2]}/deposito`, t.ana).catch(() => {});
      await apiCall("PATCH", `/contracts/${contract3}/milestones/${m3[2]}/entregar`, t.elisa, {
        fotos: ["https://example.com/seed/etapa-entregue.jpg"],
      }).catch(() => {});
      await apiCall("POST", `/contracts/${contract3}/milestones/${m3[2]}/disputas`, t.ana, {
        motivo: "Etapa entregue com atraso significativo em relação ao prazo combinado.",
        evidencias: ["https://example.com/seed/evidencia-4.jpg"],
      } satisfies AbrirDisputeInput).catch(() => {});
    }
  }
}

async function faseReviews(t: Tokens, flow: RfqFlowResult): Promise<void> {
  const prestadorTokenPorContrato = [t.carlos, t.daniel, t.elisa];
  for (let i = 0; i < flow.contractIds.length; i++) {
    const contractId = flow.contractIds[i];
    const prestadorToken = prestadorTokenPorContrato[i];
    const input: CreateReviewInput = {
      notaPrazo: 4 + (i % 2),
      notaQualidade: 5,
      notaPreco: 4,
      comentario: "Serviço concluído dentro do esperado, recomendo.",
    };
    await apiCall<ReviewPublic>("POST", `/contracts/${contractId}/reviews`, t.ana, input).catch(() => {});
    await apiCall<ReviewPublic>("POST", `/contracts/${contractId}/reviews`, prestadorToken, {
      notaPrazo: 5,
      notaQualidade: 5,
      notaPreco: 4,
      comentario: "Cliente comunicativo, pagamento em dia.",
    } satisfies CreateReviewInput).catch(() => {});
  }
}

async function faseEquipe(t: Tokens, flow: RfqFlowResult): Promise<void> {
  const obraId = flow.obraIds[0];
  if (!obraId) return;
  const membros = ["bruno.cliente@example.com", "carla.cliente@example.com", "daniel.prestador@example.com"];
  for (const email of membros) {
    await apiCall<TeamMemberPublic>("POST", `/works/${obraId}/equipe`, t.ana, {
      email,
    } satisfies AddTeamMemberInput).catch(() => {});
  }
}

async function faseMateriais(t: Tokens, flow: RfqFlowResult): Promise<void> {
  for (const obraId of flow.obraIds) {
    const lista = await apiCall<MaterialListPublic>("POST", "/material-lists", t.ana, {
      obraId,
      itens: [
        { descricao: "Cimento CP II 50kg", quantidade: 20, unidade: "saco", categoria: "cimento" },
        { descricao: "Areia média", quantidade: 3, unidade: "m³", categoria: "cimento" },
        { descricao: "Argamassa AC-II", quantidade: 15, unidade: "saco", categoria: "cimento" },
      ],
    } satisfies CreateMaterialListInput).catch(() => null);
    if (!lista) continue;

    await apiCall("POST", `/material-lists/${lista.id}/quote`, t.ana).catch(() => {});

    const quotes = await apiCall<PurchaseQuotePublic[]>(
      "GET",
      `/material-lists/${lista.id}/quotes`,
      t.ana,
    ).catch(() => [] as PurchaseQuotePublic[]);

    for (const [fornecedorToken] of [[t.materiaisVitoria], [t.construmix]] as const) {
      const minha = quotes.find((q) => true);
      if (!minha) continue;
      const respondida = await apiCall<PurchaseQuotePublic>(
        "PATCH",
        `/purchase-quotes/${minha.id}`,
        fornecedorToken,
        {
          itensPrecos: [
            { descricao: "Cimento CP II 50kg", quantidade: 20, unidade: "saco", precoUnitarioCentavos: 3490 },
            { descricao: "Areia média", quantidade: 3, unidade: "m³", precoUnitarioCentavos: 12000 },
            { descricao: "Argamassa AC-II", quantidade: 15, unidade: "saco", precoUnitarioCentavos: 2890 },
          ],
          freteCentavos: 5000,
          prazoDias: 3,
        } satisfies RespondPurchaseQuoteInput,
      ).catch(() => null);

      if (respondida && respondida.fornecedorId) {
        await apiCall<PurchaseOrderPublic>(
          "POST",
          `/purchase-quotes/${respondida.id}/checkout`,
          t.ana,
        ).catch(() => {});
      }
    }
  }
}

async function faseCatalogoDePlantas(t: Tokens): Promise<void> {
  const projetos: CreateProjectInput[] = [
    {
      titulo: "Casa térrea 2 quartos — 65m²",
      categoria: "CASA",
      precoCentavos: 89_000,
      descricao: "Projeto completo com planta baixa, elétrica e hidráulica.",
      arquivos: ["https://example.com/seed/planta-casa-65.pdf"],
    },
    {
      titulo: "Sobrado 3 quartos — 140m²",
      categoria: "SOBRADO",
      precoCentavos: 149_000,
      descricao: "Sobrado com suíte, varanda gourmet e garagem para 2 carros.",
      arquivos: ["https://example.com/seed/planta-sobrado-140.pdf"],
    },
    {
      titulo: "Galpão comercial — 300m²",
      categoria: "GALPAO",
      precoCentavos: 129_000,
      descricao: "Estrutura metálica, pé-direito duplo, mezanino administrativo.",
      arquivos: ["https://example.com/seed/planta-galpao-300.pdf"],
    },
  ];

  const criados: ProjectPrivate[] = [];
  for (const projeto of projetos) {
    const criado = await apiCall<ProjectPrivate>("POST", "/catalog/projects", t.carlos, projeto).catch(
      () => null,
    );
    if (criado) criados.push(criado);
  }

  for (const projeto of criados) {
    await apiCall("POST", `/catalog/projects/${projeto.id}/buy`, t.bruno).catch(() => {});
  }
}

async function faseSobraDeMaterial(t: Tokens, flow: RfqFlowResult): Promise<void> {
  const obraId = flow.obraIds[0];
  if (!obraId) return;

  const anuncios: CreateSurplusListingInput[] = [
    {
      workId: obraId,
      nome: "Porcelanato 60x60 sobrando",
      descricao: "12 caixas sobraram da reforma, ainda seladas.",
      categoria: "acabamento",
      quantidade: 12,
      unidade: "caixa",
      precoCentavos: 8000,
      fotos: [],
    },
    {
      workId: obraId,
      nome: "Tinta acrílica branca 18L",
      descricao: "2 latas fechadas, sobrou da pintura da fachada.",
      categoria: "tinta",
      quantidade: 2,
      unidade: "lata",
      precoCentavos: 15000,
      fotos: [],
    },
    {
      workId: obraId,
      nome: "Fio elétrico 2.5mm — rolo",
      descricao: "1 rolo de 100m, sobrou da troca do quadro elétrico.",
      categoria: "eletrica",
      quantidade: 1,
      unidade: "rolo",
      precoCentavos: 12000,
      fotos: [],
    },
    {
      workId: obraId,
      nome: "Tubo PVC 100mm — 3 unidades",
      descricao: "Sobraram da reforma hidráulica, sem uso.",
      categoria: "hidraulica",
      quantidade: 3,
      unidade: "unidade",
      precoCentavos: 4500,
      fotos: [],
    },
  ];

  const criados: SurplusListingPublic[] = [];
  for (const anuncio of anuncios) {
    const criado = await apiCall<SurplusListingPublic>("POST", "/surplus-listings", t.ana, anuncio).catch(
      () => null,
    );
    if (criado) criados.push(criado);
  }

  // Vende 2 dos novos como convidado (sem token) — mantém pelo menos 3
  // disponíveis pra vitrine pública mesmo depois da venda.
  for (const listing of criados.slice(0, 2)) {
    await apiCall("POST", `/public/surplus-listings/${listing.id}/checkout`, undefined, {
      compradorNome: "Comprador Anônimo",
      compradorEmail: `comprador.${Date.now()}@example.com`,
      compradorTelefone: "+5527999991234",
    } satisfies SurplusCheckoutInput).catch(() => {});
  }
}

async function faseAnuncios(t: Tokens): Promise<void> {
  const ads: { token: string; input: CreateAdInput }[] = [
    {
      token: t.materiaisVitoria,
      input: {
        tipo: "DESTAQUE",
        criativo: { titulo: "Materiais Vitória — entrega em 24h", descricao: "Cimento, areia e acabamento com frete rápido." },
        budgetCentavos: 50_000,
      },
    },
    {
      token: t.carlos,
      input: {
        tipo: "CPC",
        criativo: { titulo: "Carlos Prestador — elétrica e hidráulica", descricao: "8 anos de experiência, orçamento sem compromisso." },
        budgetCentavos: 20_000,
      },
    },
    {
      token: t.julia,
      input: {
        tipo: "CPM",
        criativo: { titulo: "Júlia Engenheira — projetos estruturais", descricao: "CREA-ES 123456, atendimento em toda a Grande Vitória." },
        budgetCentavos: 30_000,
      },
    },
  ];
  for (const ad of ads) {
    await apiCall<AdPrivate>("POST", "/ads", ad.token, ad.input).catch(() => {});
  }
}

async function faseConteudo(t: Tokens): Promise<void> {
  const hoje = new Date();

  const artigos: CreateArticleInput[] = [
    {
      titulo: "Como escolher o cimento certo para sua obra",
      categoria: "noticia",
      corpo:
        "Resumo autoral: existem diferentes tipos de cimento (CP I a CP V) para usos distintos — fundação, alvenaria, acabamento. Consulte um profissional habilitado antes de decidir.",
      autor: "Equipe ConectaObra",
      publicadoEm: hoje,
    },
    {
      titulo: "5 sinais de que sua instalação elétrica precisa de revisão",
      categoria: "noticia",
      corpo:
        "Resumo autoral: disjuntores caindo com frequência, tomadas esquentando e cheiro de queimado são sinais de alerta. Procure um eletricista habilitado.",
      autor: "Equipe ConectaObra",
      publicadoEm: hoje,
    },
    {
      titulo: "Checklist de recebimento de obra",
      categoria: "biblioteca",
      corpo: "Resumo autoral com os principais itens a verificar antes de aceitar a entrega de uma etapa ou obra completa.",
      autor: "Equipe ConectaObra",
      arquivoUrl: "https://example.com/seed/checklist-recebimento.pdf",
      publicadoEm: hoje,
    },
  ];
  for (const artigo of artigos) {
    await apiCall<ArticlePrivate>("POST", "/articles", t.admin, artigo).catch(() => {});
  }

  const referenciaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const indicadores: UpsertIndicatorInput[] = [
    { tipo: "CUB", regiao: "ES", valorCentavos: 180_000, referenciaMes, fonte: "Sinduscon-ES (exemplo)" },
    { tipo: "SINAPI", regiao: "ES", valorCentavos: 165_000, referenciaMes, fonte: "Caixa/IBGE (exemplo)" },
    { tipo: "CIMENTO", regiao: "ES", valorCentavos: 3400, referenciaMes, fonte: "Pesquisa de mercado (exemplo)" },
  ];
  for (const indicador of indicadores) {
    await apiCall<IndicatorPublic>("POST", "/indicators", t.admin, indicador).catch(() => {});
  }

  const custos: UpsertAvgCostInput[] = [
    {
      servico: "Pintura residencial",
      unidade: "m²",
      cidade: "Vitória/ES",
      valorMinCentavos: 2500,
      valorMedCentavos: 3500,
      valorMaxCentavos: 5000,
      mes: referenciaMes,
    },
    {
      servico: "Instalação elétrica",
      unidade: "ponto",
      cidade: "Vitória/ES",
      valorMinCentavos: 8000,
      valorMedCentavos: 12000,
      valorMaxCentavos: 18000,
      mes: referenciaMes,
    },
    {
      servico: "Instalação hidráulica",
      unidade: "ponto",
      cidade: "Vila Velha/ES",
      valorMinCentavos: 9000,
      valorMedCentavos: 13000,
      valorMaxCentavos: 19000,
      mes: referenciaMes,
    },
  ];
  for (const custo of custos) {
    await apiCall<AvgCostPublic>("POST", "/ai/avg-costs", t.admin, custo).catch(() => {});
  }
}

async function faseConhecimentoEChat(t: Tokens): Promise<void> {
  const chunks: IngestKnowledgeInput[] = [
    {
      fonte: "Resumo autoral",
      titulo: "Fundação: cuidados básicos",
      conteudo:
        "Resumo autoral (não é texto de norma): o tipo de fundação depende do solo local — um sondagem prévia evita problemas estruturais. Sempre com responsável técnico (ART/RRT).",
      categoria: "estrutural",
    },
    {
      fonte: "Resumo autoral",
      titulo: "Instalação elétrica: normas gerais",
      conteudo:
        "Resumo autoral (não é texto de norma): circuitos separados por ambiente, aterramento obrigatório, disjuntores dimensionados à carga. Consulte um eletricista habilitado.",
      categoria: "eletrica",
    },
    {
      fonte: "Resumo autoral",
      titulo: "Impermeabilização de laje",
      conteudo:
        "Resumo autoral (não é texto de norma): a impermeabilização deve ser feita antes do contrapiso, com manta ou membrana adequada ao clima local.",
      categoria: "hidraulica",
    },
  ];
  for (const chunk of chunks) {
    await apiCall<KnowledgeChunkPublic>("POST", "/ai/knowledge", t.admin, chunk).catch(() => {});
  }

  const mensagens = [
    "Qual o tipo de cimento ideal para uma laje?",
    "Preciso trocar o quadro elétrico, o que devo verificar antes?",
    "Como saber se uma parede é estrutural antes de derrubar?",
  ];
  for (const mensagem of mensagens) {
    await apiCall<ChatResponse>("POST", "/ai/chat", t.ana, { mensagem }).catch(() => {});
  }
}

async function faseSubscriptions(t: Tokens): Promise<void> {
  // Sem endpoint HTTP (billing/E8 ainda não implementado) — único ponto
  // deste script que grava direto via Prisma, documentado aqui de propósito.
  const emails = ["ana.cliente@example.com", "contato@materiaisvitoria.example.com", "carlos.prestador@example.com"];
  const users = await prisma.user.findMany({ where: { email: { in: emails } } });
  for (const user of users) {
    await prisma.subscription
      .create({
        data: {
          userId: user.id,
          plano: user.tipo.startsWith("CLIENTE") ? "cliente-plus" : "profissional-plus",
          valorCentavos: 4990,
          status: "ATIVA",
        },
      })
      .catch(() => {});
  }
}

async function main() {
  console.log(`Rodando contra API_URL=${API_BASE_URL}`);
  const t = await faseContas();
  await fase("Perfis (prestador/fornecedor)", () => faseProfiles(t));
  await fase("Vitrines (portfólio, lojas, promoções, produtos)", () => faseVitrines(t));
  const flow = await fase("Obras → RFQ → propostas → contratos → milestones (criação)", () =>
    faseObrasRfqContratos(t),
  );
  if (flow) {
    await fase("Pagamento normal, disputas (3 decisões) e ledger de escrow", () =>
      faseMilestonesEscrowDisputas(t, flow),
    );
    await fase("Reviews (cliente↔prestador)", () => faseReviews(t, flow));
    await fase("Equipe da obra", () => faseEquipe(t, flow));
    await fase("Listas de materiais → cotação → checkout", () => faseMateriais(t, flow));
    await fase("Sobra de material (marketplace público)", () => faseSobraDeMaterial(t, flow));
  }
  await fase("Catálogo de plantas + compra", () => faseCatalogoDePlantas(t));
  await fase("Anúncios (ads)", () => faseAnuncios(t));
  await fase("Conteúdo (artigos, indicadores, custos médios)", () => faseConteudo(t));
  await fase("Base de conhecimento (RAG) + chat do Engenheiro Virtual", () => faseConhecimentoEChat(t));
  await fase("Assinaturas (direto via Prisma — sem endpoint HTTP ainda)", () => faseSubscriptions(t));

  console.log("\n✔ Seed de exemplos concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
