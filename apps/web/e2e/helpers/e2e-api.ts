import type { CreateWorkInput, WorkPublic } from "@conectaobra/types/works";
import type { CreateRfqInput, RfqPublic } from "@conectaobra/types/rfq";
import type { PrestadorProfileInput } from "@conectaobra/types/profile";
import type {
  CreateRfqProposalInput,
  RfqProposalPublic,
} from "@conectaobra/types/rfq-proposals";
import type { CreateMilestoneInput, MilestonePublic } from "@conectaobra/types/milestones";
import type { ExtratoFinanceiro } from "@conectaobra/types/escrow";
import type { ContractPublic } from "@conectaobra/types/contracts";

/**
 * Chamadas diretas a `services/api`, sem passar pelos Route Handlers de
 * `apps/web` — usadas pra parte "API" do E2E híbrido (obra, RFQ, matching,
 * proposta, aceite, escrow, milestones): nenhuma dessas telas existe em
 * `apps/web` ainda (ver PENDENCIAS.md), então não há como exercitá-las via
 * clique. A parte "browser" do híbrido (cadastro/login) usa o app de
 * verdade — ver critical-flow.spec.ts.
 */
export const API_BASE_URL = process.env.E2E_API_URL ?? "http://localhost:3355";

async function apiCall<T>(
  method: "GET" | "POST" | "PATCH" | "PUT",
  path: string,
  token?: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

// --- Geradores de dado de teste válido (CPF com dígito verificador real) ---

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

/** Gera um CPF aleatório com dígitos verificadores válidos (mesmo algoritmo de documents.ts). */
export function randomValidCpf(): string {
  const base = randomDigits(9);
  const d1 = cpfCheckDigit(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const withD1 = base + d1;
  const d2 = cpfCheckDigit(withD1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return withD1 + d2;
}

export function randomPhone(): string {
  return `27${randomDigits(9)}`;
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@e2e.conectaobra.test`;
}

// --- Fluxo crítico — um wrapper tipado por passo, na ordem em que são usados ---

export async function createWork(token: string, input: CreateWorkInput): Promise<WorkPublic> {
  return apiCall<WorkPublic>("POST", "/works", token, input);
}

export async function createRfq(token: string, input: CreateRfqInput): Promise<RfqPublic> {
  return apiCall<RfqPublic>("POST", "/rfq", token, input);
}

export async function updatePrestadorProfile(
  token: string,
  input: PrestadorProfileInput,
): Promise<unknown> {
  return apiCall("PUT", "/profile/prestador", token, input);
}

export async function discoverRfqs(token: string): Promise<RfqPublic[]> {
  return apiCall<RfqPublic[]>("GET", "/rfq/discover", token);
}

export async function submitProposal(
  token: string,
  rfqId: string,
  input: CreateRfqProposalInput,
): Promise<RfqProposalPublic> {
  return apiCall<RfqProposalPublic>("POST", `/rfq/${rfqId}/proposals`, token, input);
}

export async function acceptProposal(
  token: string,
  proposalId: string,
): Promise<ContractPublic> {
  return apiCall<ContractPublic>("POST", `/proposals/${proposalId}/accept`, token);
}

export async function createMilestone(
  token: string,
  contractId: string,
  input: CreateMilestoneInput,
): Promise<MilestonePublic> {
  return apiCall<MilestonePublic>("POST", `/contracts/${contractId}/milestones`, token, input);
}

export async function depositEscrow(
  token: string,
  contractId: string,
  milestoneId: string,
): Promise<unknown> {
  return apiCall("POST", `/contracts/${contractId}/milestones/${milestoneId}/deposito`, token);
}

export async function entregarMilestone(
  token: string,
  contractId: string,
  milestoneId: string,
  fotos: string[],
): Promise<MilestonePublic> {
  return apiCall<MilestonePublic>(
    "PATCH",
    `/contracts/${contractId}/milestones/${milestoneId}/entregar`,
    token,
    { fotos },
  );
}

export async function aprovarMilestone(
  token: string,
  contractId: string,
  milestoneId: string,
): Promise<MilestonePublic> {
  return apiCall<MilestonePublic>(
    "PATCH",
    `/contracts/${contractId}/milestones/${milestoneId}/aprovar`,
    token,
  );
}

export async function getExtratoFinanceiro(token: string): Promise<ExtratoFinanceiro> {
  return apiCall<ExtratoFinanceiro>("GET", "/extrato-financeiro", token);
}
