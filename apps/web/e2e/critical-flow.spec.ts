import { test, expect, type Page } from "@playwright/test";
import {
  acceptProposal,
  aprovarMilestone,
  createMilestone,
  createRfq,
  createWork,
  depositEscrow,
  discoverRfqs,
  entregarMilestone,
  getExtratoFinanceiro,
  randomPhone,
  randomValidCpf,
  submitProposal,
  uniqueEmail,
  updatePrestadorProfile,
} from "./helpers/e2e-api";

/**
 * E2E do fluxo crítico completo (E10-04) — o loop central do CLAUDE.md:
 * cliente publica RFQ → prestador responde → cliente aceita → contrato →
 * depósito em escrow → prestador entrega → cliente aprova → liberação.
 *
 * Híbrido (decisão confirmada com o usuário via `AskUserQuestion`): usa o
 * navegador só onde existe tela de verdade (cadastro de cliente e de
 * prestador, via `apps/web`) e chama `services/api` direto pra tudo o mais
 * (obra, RFQ, matching, proposta, aceite, escrow, milestones) — nenhuma
 * dessas telas existe em `apps/web` ainda (ver PENDENCIAS.md P-021/P-022/
 * P-041/P-047), então não haveria o que clicar. `POST /proposals/:id/accept`
 * em particular só devolve o `Contract` criado na resposta da própria
 * chamada (não existe endpoint pra buscar depois) — mesmo o botão
 * "Aceitar" que já existe em `/rfq/[id]` (`accept-proposal-button.tsx`)
 * não expõe esse retorno, então essa etapa também precisa ser via API.
 *
 * PRÉ-REQUISITOS PRA RODAR (nunca executado neste ambiente — sem Docker):
 *   1. docker compose -f infra/docker/docker-compose.local.yml up -d
 *   2. pnpm --filter @conectaobra/api dev   (porta 3355)
 *   3. pnpm --filter @conectaobra/web dev   (porta 3399)
 *   4. pnpm --filter @conectaobra/web test:e2e
 */

const ACCESS_COOKIE = "co_access_token";

async function cadastrar(
  page: Page,
  input: {
    tipo: "CLIENTE_PF" | "PRESTADOR";
    nome: string;
    email: string;
    telefone: string;
    cpfCnpj: string;
    senha: string;
  },
): Promise<void> {
  await page.goto("/cadastro");
  await page.selectOption("#tipo", input.tipo);
  await page.fill("#nome", input.nome);
  await page.fill("#email", input.email);
  await page.fill("#telefone", input.telefone);
  await page.fill("#cpfCnpj", input.cpfCnpj);
  await page.fill("#senha", input.senha);
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/conta");
}

async function accessTokenFromContext(page: Page): Promise<string> {
  const cookies = await page.context().cookies();
  const token = cookies.find((c) => c.name === ACCESS_COOKIE)?.value;
  if (!token) {
    throw new Error(`Cookie ${ACCESS_COOKIE} não encontrado — cadastro/login falhou?`);
  }
  return token;
}

test("fluxo crítico: cadastro → RFQ → proposta → contrato → escrow → aprovação → liberação", async ({
  browser,
}) => {
  const categoria = `Pintura residencial E2E ${Date.now()}`;

  const clienteContext = await browser.newContext();
  const prestadorContext = await browser.newContext();
  const clientePage = await clienteContext.newPage();
  const prestadorPage = await prestadorContext.newPage();

  try {
    // --- Browser: cadastro dos dois atores (única parte com UI real) ---
    await cadastrar(clientePage, {
      tipo: "CLIENTE_PF",
      nome: "Cliente E2E",
      email: uniqueEmail("cliente"),
      telefone: randomPhone(),
      cpfCnpj: randomValidCpf(),
      senha: "Senha123!",
    });
    const clienteToken = await accessTokenFromContext(clientePage);

    await cadastrar(prestadorPage, {
      tipo: "PRESTADOR",
      nome: "Prestador E2E",
      email: uniqueEmail("prestador"),
      telefone: randomPhone(),
      cpfCnpj: randomValidCpf(),
      senha: "Senha123!",
    });
    const prestadorToken = await accessTokenFromContext(prestadorPage);

    // --- API direta: resto do fluxo (sem UI ainda) ---
    const obra = await createWork(clienteToken, {
      titulo: "Reforma E2E",
      tipo: "REFORMA",
      endereco: "Rua Teste, 123 — Vitória/ES",
    });
    expect(obra.id).toBeTruthy();

    const rfq = await createRfq(clienteToken, {
      obraId: obra.id,
      categoria,
      descricao: "Pintura completa de apartamento de 2 quartos, incluindo teto.",
      fotos: [],
    });
    expect(rfq.status).toBe("ABERTO");

    await updatePrestadorProfile(prestadorToken, {
      categorias: [categoria],
      certificados: [],
    });

    const casados = await discoverRfqs(prestadorToken);
    expect(casados.some((r) => r.id === rfq.id)).toBe(true);

    const proposta = await submitProposal(prestadorToken, rfq.id, {
      precoCentavos: 500_000,
      prazoDias: 10,
      observacoes: "Proposta de teste E2E",
    });
    expect(proposta.status).toBe("ENVIADA");

    const contrato = await acceptProposal(clienteToken, proposta.id);
    expect(contrato.obraId).toBe(obra.id);

    const milestone = await createMilestone(clienteToken, contrato.id, {
      ordem: 1,
      descricao: "Etapa única — pintura completa",
      valorCentavos: 500_000,
      checklist: [],
    });
    expect(milestone.status).toBe("PENDENTE");

    await depositEscrow(clienteToken, contrato.id, milestone.id);

    const entregue = await entregarMilestone(prestadorToken, contrato.id, milestone.id, [
      "https://example.com/e2e-foto-1.jpg",
    ]);
    expect(entregue.status).toBe("ENTREGUE");

    const aprovado = await aprovarMilestone(clienteToken, contrato.id, milestone.id);
    // Com depósito prévio, aprovar libera o escrow automaticamente (CLAUDE.md
    // §5 regra 1) — a etapa pula direto de ENTREGUE pra PAGO.
    expect(aprovado.status).toBe("PAGO");

    const extrato = await getExtratoFinanceiro(prestadorToken);
    const item = extrato.itens.find((i) => i.milestoneId === milestone.id);
    expect(item).toBeTruthy();
    expect(item?.valorCentavos).toBeGreaterThan(0);
  } finally {
    await clienteContext.close();
    await prestadorContext.close();
  }
});
