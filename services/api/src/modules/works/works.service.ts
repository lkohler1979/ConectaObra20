import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type Work } from "@prisma/client";
import type { DiarioEvento } from "@conectaobra/types/diario";
import type { GeoPoint } from "@conectaobra/types/geo";
import type { PainelFinanceiroObra } from "@conectaobra/types/painel-financeiro";
import type {
  CreateWorkInput,
  UpdateWorkInput,
  WorkPublic,
} from "@conectaobra/types/works";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { toPublicWork } from "./work-public.mapper";

/** Estado inicial livre — nenhum workflow de status foi definido ainda (E6). */
const STATUS_INICIAL = "planejamento";

@Injectable()
export class WorksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(clienteId: string, input: CreateWorkInput): Promise<WorkPublic> {
    // create() + gravação de geo numa única transação (achado em code
    // review — P-023: as duas chamadas eram separadas, deixando a obra sem
    // coordenadas se a segunda falhasse).
    const work = await this.prisma.$transaction(async (tx) => {
      const created = await tx.work.create({
        data: {
          clienteId,
          titulo: input.titulo,
          tipo: input.tipo,
          endereco: input.endereco,
          areaM2: input.areaM2,
          orcamentoPrevistoCentavos: input.orcamentoPrevistoCentavos,
          status: STATUS_INICIAL,
        },
      });

      if (input.geo) {
        await this.setGeo(tx, created.id, input.geo);
      }

      return created;
    });

    await this.auditLog.record({
      userId: clienteId,
      obraId: work.id,
      acao: "work.created",
      entidade: "work",
      payload: { workId: work.id, tipo: work.tipo },
    });

    return toPublicWork(work);
  }

  async listMine(clienteId: string): Promise<WorkPublic[]> {
    const works = await this.prisma.work.findMany({
      where: { clienteId },
      orderBy: { createdAt: "desc" },
    });
    return works.map(toPublicWork);
  }

  async getMine(clienteId: string, workId: string): Promise<WorkPublic> {
    const work = await this.getOwnedOrThrow(clienteId, workId);
    return toPublicWork(work);
  }

  /**
   * Diário de obra (E6-03) — feed automático a partir do `audit_log`
   * (S0-06) filtrado por `obraId`, sem tabela nova: cada ação relevante
   * (RFQ publicado, proposta recebida, contrato criado, etapa entregue/
   * aprovada, avaliação registrada) já grava lá desde que o serviço
   * correspondente informe `obraId` em `auditLog.record()`.
   */
  async listDiario(clienteId: string, workId: string): Promise<DiarioEvento[]> {
    await this.getOwnedOrThrow(clienteId, workId);

    const entries = await this.prisma.auditLog.findMany({
      where: { obraId: workId },
      orderBy: { createdAt: "asc" },
    });

    return entries.map((entry) => ({
      id: entry.id,
      acao: entry.acao,
      entidade: entry.entidade,
      payload: (entry.payload ?? {}) as Record<string, unknown>,
      createdAt: entry.createdAt.toISOString(),
    }));
  }

  /**
   * Painel financeiro (E6-02): previsto × aprovado por etapa. Deliberadamente
   * "aprovado", não "realizado"/"pago" — sem escrow (E4, bloqueado por
   * P-002), nada disso é dinheiro que de fato mudou de mãos, só o valor das
   * etapas cuja entrega já foi aprovada (`Milestone.status`).
   */
  async getPainelFinanceiro(clienteId: string, workId: string): Promise<PainelFinanceiroObra> {
    const work = await this.getOwnedOrThrow(clienteId, workId);

    const milestones = await this.prisma.milestone.findMany({
      where: { contract: { obraId: workId } },
      orderBy: [{ contractId: "asc" }, { ordem: "asc" }],
    });

    const etapas = milestones.map((m) => {
      const aprovado = m.status === "APROVADO" || m.status === "PAGO";
      return {
        milestoneId: m.id,
        contractId: m.contractId,
        descricao: m.descricao,
        status: m.status,
        valorPrevistoCentavos: m.valorCentavos,
        valorAprovadoCentavos: aprovado ? m.valorCentavos : 0,
      };
    });

    return {
      obraId: workId,
      orcamentoPrevistoCentavos: work.orcamentoPrevistoCentavos,
      totalEtapasCentavos: etapas.reduce((sum, e) => sum + e.valorPrevistoCentavos, 0),
      totalAprovadoCentavos: etapas.reduce((sum, e) => sum + e.valorAprovadoCentavos, 0),
      etapas,
    };
  }

  async update(
    clienteId: string,
    workId: string,
    input: UpdateWorkInput,
  ): Promise<WorkPublic> {
    await this.getOwnedOrThrow(clienteId, workId);

    const work = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.work.update({
        where: { id: workId },
        data: {
          titulo: input.titulo,
          tipo: input.tipo,
          endereco: input.endereco,
          areaM2: input.areaM2,
          orcamentoPrevistoCentavos: input.orcamentoPrevistoCentavos,
        },
      });

      if (input.geo) {
        await this.setGeo(tx, workId, input.geo);
      }

      return updated;
    });

    await this.auditLog.record({
      userId: clienteId,
      obraId: workId,
      acao: "work.updated",
      entidade: "work",
      payload: { workId },
    });

    return toPublicWork(work);
  }

  /** Não vaza se a obra existe e é de outro cliente — 404 nos dois casos. */
  private async getOwnedOrThrow(clienteId: string, workId: string): Promise<Work> {
    const work = await this.prisma.work.findUnique({ where: { id: workId } });
    if (!work || work.clienteId !== clienteId) {
      throw new NotFoundException("Obra não encontrada");
    }
    return work;
  }

  /// PostGIS — Unsupported("geography") não é gravável pelo client (mesmo padrão de ProfilePrestador/ProfileService).
  private async setGeo(
    tx: Prisma.TransactionClient,
    workId: string,
    geo: GeoPoint,
  ): Promise<void> {
    await tx.$executeRaw`
      UPDATE works
      SET geo = ST_SetSRID(ST_MakePoint(${geo.lng}, ${geo.lat}), 4326)::geography
      WHERE id = ${workId}::uuid
    `;
  }
}
