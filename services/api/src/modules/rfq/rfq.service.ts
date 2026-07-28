import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Rfq } from "@prisma/client";
import type { CreateRfqInput, RfqPublic, UpdateRfqInput } from "@conectaobra/types/rfq";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { toPublicRfq } from "./rfq-public.mapper";

@Injectable()
export class RfqService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(clienteId: string, input: CreateRfqInput): Promise<RfqPublic> {
    const obra = await this.prisma.work.findUnique({ where: { id: input.obraId } });
    if (!obra || obra.clienteId !== clienteId) {
      throw new NotFoundException("Obra não encontrada");
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
      },
    });

    await this.auditLog.record({
      userId: clienteId,
      acao: "rfq.created",
      entidade: "rfq",
      payload: { rfqId: rfq.id, obraId: rfq.obraId, categoria: rfq.categoria },
    });

    return toPublicRfq(rfq);
  }

  async listMine(clienteId: string): Promise<RfqPublic[]> {
    const rfqs = await this.prisma.rfq.findMany({
      where: { clienteId },
      orderBy: { createdAt: "desc" },
    });
    return rfqs.map(toPublicRfq);
  }

  async getMine(clienteId: string, rfqId: string): Promise<RfqPublic> {
    const rfq = await this.getOwnedOrThrow(clienteId, rfqId);
    return toPublicRfq(rfq);
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
