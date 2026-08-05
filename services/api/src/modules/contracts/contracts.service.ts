import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { ContractListItem, ContractPublic } from "@conectaobra/types/contracts";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { AnalyticsService } from "../../common/analytics/analytics.service";
import { toContractListItem, toPublicContract } from "./contract-public.mapper";

/** Estado inicial livre — nenhum workflow de contrato foi definido ainda (doc 02 §3 não enumera). */
const STATUS_RASCUNHO = "rascunho";

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly analytics: AnalyticsService,
  ) {}

  /**
   * Aceitar proposta → rascunho de contrato (E3-07). Tudo numa única
   * transação: marcar a proposta aceita, recusar as demais do mesmo RFQ,
   * fechar o RFQ e criar o Contract + as duas partes.
   *
   * As checagens de estado (`status ABERTO`/`ENVIADA`) rodam DUAS vezes: uma
   * vez antes, só pra dar um erro rápido e amigável no caso comum; e de novo
   * DENTRO da transação, via `updateMany` condicional + checagem de `count`
   * — essa segunda é a que garante corretude de verdade. Sem ela, dois
   * aceites concorrentes (ex: duas propostas do mesmo RFQ aceitas quase ao
   * mesmo tempo) passariam os dois pela checagem "de fora" antes de
   * qualquer commit e gerariam 2 Contracts pro mesmo RFQ — achado em code
   * review desta sessão.
   */
  async acceptProposal(proposalId: string, clienteId: string): Promise<ContractPublic> {
    const proposal = await this.prisma.rfqProposal.findUnique({
      where: { id: proposalId },
      include: { rfq: true },
    });

    if (!proposal || proposal.rfq.clienteId !== clienteId) {
      throw new NotFoundException("Proposta não encontrada");
    }
    if (proposal.rfq.status !== "ABERTO") {
      throw new ConflictException("Este RFQ não está mais aberto");
    }
    if (proposal.status !== "ENVIADA") {
      throw new ConflictException("Esta proposta não está mais disponível para aceite");
    }

    const contract = await this.prisma.$transaction(async (tx) => {
      const proposalUpdate = await tx.rfqProposal.updateMany({
        where: { id: proposalId, status: "ENVIADA" },
        data: { status: "ACEITA" },
      });
      if (proposalUpdate.count === 0) {
        throw new ConflictException("Esta proposta não está mais disponível para aceite");
      }

      const rfqUpdate = await tx.rfq.updateMany({
        where: { id: proposal.rfqId, status: "ABERTO" },
        data: { status: "CONTRATADO" },
      });
      if (rfqUpdate.count === 0) {
        throw new ConflictException("Este RFQ não está mais aberto");
      }

      await tx.rfqProposal.updateMany({
        where: { rfqId: proposal.rfqId, id: { not: proposalId }, status: "ENVIADA" },
        data: { status: "RECUSADA" },
      });

      const created = await tx.contract.create({
        data: {
          rfqProposalId: proposalId,
          obraId: proposal.rfq.obraId,
          valorTotalCentavos: proposal.precoCentavos,
          status: STATUS_RASCUNHO,
        },
      });

      await tx.contractParty.createMany({
        data: [
          { contractId: created.id, userId: clienteId, papel: "CONTRATANTE" },
          { contractId: created.id, userId: proposal.proponenteId, papel: "CONTRATADO" },
        ],
      });

      return created;
    });

    await this.auditLog.record({
      userId: clienteId,
      obraId: proposal.rfq.obraId,
      acao: "rfq_proposal.accepted",
      entidade: "contract",
      payload: { proposalId, rfqId: proposal.rfqId, contractId: contract.id },
    });
    this.analytics.capture(clienteId, "rfq_proposal_accepted", {
      rfqId: proposal.rfqId,
      contractId: contract.id,
      valorTotalCentavos: contract.valorTotalCentavos,
    });

    return toPublicContract(contract);
  }

  /**
   * "Meus contratos" — não existia nenhuma forma de listar/navegar até um
   * contrato antes disso (só o retorno direto de `acceptProposal`, nunca
   * persistido em tela nenhuma). Cliente e prestador/fornecedor usam o
   * mesmo endpoint; `meuPapel` decide o que a tela mostra.
   */
  async listMine(userId: string): Promise<ContractListItem[]> {
    const parties = await this.prisma.contractParty.findMany({
      where: { userId },
      include: { contract: { include: { obra: true } } },
      orderBy: { contract: { createdAt: "desc" } },
    });

    return parties.map((party) => toContractListItem(party.contract, party.papel));
  }
}
