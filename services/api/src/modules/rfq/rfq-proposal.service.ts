import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CreateRfqProposalInput,
  RfqProposalPublic,
} from "@conectaobra/types/rfq-proposals";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { env } from "../../config/env";
import { toPublicRfqProposal } from "./rfq-proposal-public.mapper";

@Injectable()
export class RfqProposalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async submit(
    rfqId: string,
    proponenteId: string,
    input: CreateRfqProposalInput,
  ): Promise<RfqProposalPublic> {
    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) {
      throw new NotFoundException("RFQ não encontrado");
    }
    if (rfq.status !== "ABERTO") {
      throw new ConflictException("Este RFQ não está mais aberto para propostas");
    }

    const existing = await this.prisma.rfqProposal.findFirst({
      where: { rfqId, proponenteId },
    });
    if (existing) {
      throw new ConflictException("Você já enviou uma proposta para este RFQ");
    }

    await this.enforceMonthlyCap(proponenteId);

    const proposal = await this.prisma.rfqProposal.create({
      data: {
        rfqId,
        proponenteId,
        precoCentavos: input.precoCentavos,
        prazoDias: input.prazoDias,
        observacoes: input.observacoes,
      },
    });

    await this.auditLog.record({
      userId: proponenteId,
      acao: "rfq_proposal.created",
      entidade: "rfq_proposal",
      payload: { rfqId, proposalId: proposal.id },
    });

    return toPublicRfqProposal(proposal);
  }

  /**
   * O dono do RFQ vê todas as propostas; um prestador só vê a própria —
   * é um leilão, ninguém pode ver o preço/prazo da concorrência.
   */
  async listForRfq(rfqId: string, requesterId: string): Promise<RfqProposalPublic[]> {
    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) {
      throw new NotFoundException("RFQ não encontrado");
    }

    if (rfq.clienteId === requesterId) {
      const proposals = await this.prisma.rfqProposal.findMany({
        where: { rfqId },
        orderBy: { createdAt: "asc" },
      });
      return proposals.map(toPublicRfqProposal);
    }

    const own = await this.prisma.rfqProposal.findFirst({
      where: { rfqId, proponenteId: requesterId },
    });
    return own ? [toPublicRfqProposal(own)] : [];
  }

  /**
   * Placeholder até E8-01 definir os planos de verdade (P-025): sem nenhuma
   * Subscription, o prestador é tratado como plano gratuito e sujeito ao
   * teto mensal; qualquer Subscription (seja qual for o plano) isenta por
   * enquanto — não há ainda tiers pagos distintos implementados.
   */
  private async enforceMonthlyCap(proponenteId: string): Promise<void> {
    const hasSubscription = await this.prisma.subscription.findFirst({
      where: { userId: proponenteId },
    });
    if (hasSubscription) return;

    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const count = await this.prisma.rfqProposal.count({
      where: { proponenteId, createdAt: { gte: startOfMonth } },
    });

    if (count >= env.FREE_PLAN_MONTHLY_PROPOSAL_LIMIT) {
      throw new ForbiddenException(
        `Limite de ${env.FREE_PLAN_MONTHLY_PROPOSAL_LIMIT} propostas por mês do plano gratuito atingido — assine um plano pago pra continuar`,
      );
    }
  }
}
