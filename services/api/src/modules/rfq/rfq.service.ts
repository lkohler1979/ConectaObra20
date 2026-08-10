import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { Rfq } from "@prisma/client";
import type { CreateRfqInput, RfqPublic, UpdateRfqInput } from "@conectaobra/types/rfq";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { AnalyticsService } from "../../common/analytics/analytics.service";
import { MatchingService } from "../matching/matching.service";
import { MaterialListsService } from "../procurement/material-lists.service";
import { PurchaseQuotesService } from "../procurement/purchase-quotes.service";
import { toPublicRfq } from "./rfq-public.mapper";

@Injectable()
export class RfqService {
  private readonly logger = new Logger(RfqService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly analytics: AnalyticsService,
    private readonly matching: MatchingService,
    private readonly materialLists: MaterialListsService,
    private readonly purchaseQuotes: PurchaseQuotesService,
  ) {}

  async create(clienteId: string, input: CreateRfqInput): Promise<RfqPublic> {
    const obra = await this.prisma.work.findUnique({ where: { id: input.obraId } });
    if (!obra || obra.clienteId !== clienteId) {
      throw new NotFoundException("Obra não encontrada");
    }

    // Best-effort: falha ao criar a lista de materiais não pode impedir a
    // publicação da RFQ em si — o cliente sempre pode criar a lista depois,
    // à parte, pelo fluxo manual que já existe.
    let materialListId: string | undefined;
    if (input.itensMateriais && input.itensMateriais.length > 0) {
      try {
        const lista = await this.materialLists.create(clienteId, {
          obraId: input.obraId,
          itens: input.itensMateriais,
        });
        materialListId = lista.id;
      } catch (err) {
        this.logger.error(
          `Falha ao criar lista de materiais da RFQ (obra ${input.obraId})`,
          err as Error,
        );
      }
    }

    const rfq = await this.prisma.rfq.create({
      data: {
        obraId: input.obraId,
        clienteId,
        categoria: input.categoria,
        descricao: input.descricao,
        fotos: input.fotos,
        prazoResposta: input.prazoResposta ? new Date(input.prazoResposta) : undefined,
        regiao: input.regiao,
        materialListId,
      },
    });

    await this.auditLog.record({
      userId: clienteId,
      obraId: rfq.obraId,
      acao: "rfq.created",
      entidade: "rfq",
      payload: { rfqId: rfq.id, obraId: rfq.obraId, categoria: rfq.categoria },
    });
    this.analytics.capture(clienteId, "rfq_created", {
      rfqId: rfq.id,
      categoria: rfq.categoria,
    });

    // Best-effort: falha no matching não pode impedir a publicação do RFQ —
    // sempre dá pra rodar de novo depois (ex: quando E3-04 existir).
    try {
      await this.matching.matchRfq(rfq.id);
    } catch (err) {
      this.logger.error(`Falha ao casar RFQ ${rfq.id} com prestadores`, err as Error);
    }

    // Best-effort: mesmo espírito do matching acima — RFQ e lista de
    // materiais já foram criadas, só não acha fornecedor se der erro aqui
    // (ex: nenhum item com categoria preenchida).
    if (materialListId) {
      try {
        await this.purchaseQuotes.requestQuotes(clienteId, materialListId);
      } catch (err) {
        this.logger.error(`Falha ao cotar materiais da RFQ ${rfq.id}`, err as Error);
      }
    }

    return toPublicRfq(rfq);
  }

  async listMine(clienteId: string): Promise<RfqPublic[]> {
    const rfqs = await this.prisma.rfq.findMany({
      where: { clienteId },
      orderBy: { createdAt: "desc" },
    });
    return rfqs.map(toPublicRfq);
  }

  /**
   * Cliente dono OU prestador que enviou proposta pra este RFQ pode ver os
   * detalhes (resolve P-032, achado ao construir o comparador E3-06: um
   * prestador conseguia ver a própria proposta via GET /rfq/:id/proposals
   * mas não os dados do RFQ em si). Editar (`update()`) continua estrito
   * ao dono — usa `getOwnedOrThrow`, não este método.
   */
  async getMine(requesterId: string, rfqId: string): Promise<RfqPublic> {
    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) {
      throw new NotFoundException("RFQ não encontrado");
    }
    if (rfq.clienteId === requesterId) {
      return toPublicRfq(rfq);
    }

    const hasProposal = await this.prisma.rfqProposal.findFirst({
      where: { rfqId, proponenteId: requesterId },
    });
    if (!hasProposal) {
      throw new NotFoundException("RFQ não encontrado");
    }

    return toPublicRfq(rfq);
  }

  /** RFQs abertos que o motor de matching (E3-03) casou com este prestador. */
  async discoverForPrestador(prestadorId: string): Promise<RfqPublic[]> {
    const matches = await this.prisma.rfqMatch.findMany({
      where: { prestadorId },
      include: { rfq: true },
      orderBy: { createdAt: "desc" },
    });

    return matches
      .map((match) => match.rfq)
      .filter((rfq) => rfq.status === "ABERTO")
      .map(toPublicRfq);
  }

  async update(
    clienteId: string,
    rfqId: string,
    input: UpdateRfqInput,
  ): Promise<RfqPublic> {
    const existing = await this.getOwnedOrThrow(clienteId, rfqId);

    if (existing.status !== "ABERTO") {
      throw new ConflictException(
        "Só é possível editar um RFQ enquanto estiver ABERTO",
      );
    }

    const rfq = await this.prisma.rfq.update({
      where: { id: rfqId },
      data: {
        categoria: input.categoria,
        descricao: input.descricao,
        fotos: input.fotos,
        prazoResposta: input.prazoResposta ? new Date(input.prazoResposta) : undefined,
        regiao: input.regiao,
      },
    });

    await this.auditLog.record({
      userId: clienteId,
      obraId: existing.obraId,
      acao: "rfq.updated",
      entidade: "rfq",
      payload: { rfqId },
    });

    return toPublicRfq(rfq);
  }

  /** Não vaza se o RFQ existe e é de outro cliente — 404 nos dois casos. */
  private async getOwnedOrThrow(clienteId: string, rfqId: string): Promise<Rfq> {
    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq || rfq.clienteId !== clienteId) {
      throw new NotFoundException("RFQ não encontrado");
    }
    return rfq;
  }
}
