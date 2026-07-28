import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { ContractPublic } from "@conectaobra/types/contracts";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { toPublicContract } from "./contract-public.mapper";

/** Estado inicial livre — nenhum workflow de contrato foi definido ainda (doc 02 §3 não enumera). */
const STATUS_RASCUNHO = "rascunho";

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Aceitar proposta → rascunho de contrato (E3-07). Tudo numa única
   * transação: marcar a proposta aceita, recusar as demais do mesmo RFQ,
   * fechar o RFQ e criar o Contract + as duas partes. Uma falha parcial
   * aqui (ex: RFQ virar CONTRATADO sem contrato criado) é um bug de
   * negócio real, não cosmético — ver o code review de register()/
   * deleteAccount() nesta mesma sessão que motivou tratar isso como
   * atômico desde o início.
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
      await tx.rfqProposal.update({
        where: { id: proposalId },
        data: { status: "ACEITA" },
      });

      await tx.rfqProposal.updateMany({
        where: { rfqId: proposal.rfqId, id: { not: proposalId }, status: "ENVIADA" },
        data: { status: "RECUSADA" },
      });

      await tx.rfq.update({
        where: { id: proposal.rfqId },
        data: { status: "CONTRATADO" },
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
      acao: "rfq_proposal.accepted",
      entidade: "contract",
      payload: { proposalId, rfqId: proposal.rfqId, contractId: contract.id },
    });

    return toPublicContract(contract);
  }
}
