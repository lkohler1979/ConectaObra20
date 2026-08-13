import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AvaliacaoAdmin, ListAdminAvaliacoesQuery } from "@conectaobra/types/avaliacoes";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { toAdminAvaliacao } from "./admin-avaliacao.mapper";

const INCLUDE = {
  autor: { select: { nome: true, email: true } },
  prestador: { select: { nome: true } },
  fornecedor: { select: { nome: true } },
  produto: { select: { nome: true } },
  obra: { select: { titulo: true } },
} satisfies Prisma.AvaliacaoInclude;

/** Moderação de conteúdo (P-091) — ocultar/reativar avaliação, exclusivo do ADMIN. */
@Injectable()
export class AdminAvaliacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async list(query: ListAdminAvaliacoesQuery): Promise<AvaliacaoAdmin[]> {
    const where: Prisma.AvaliacaoWhereInput = {};
    if (query.tipo) where.tipo = query.tipo;
    if (query.oculta !== undefined) where.oculta = query.oculta;

    const avaliacoes = await this.prisma.avaliacao.findMany({
      where,
      include: INCLUDE,
      orderBy: { createdAt: "desc" },
      take: query.limit,
    });
    return avaliacoes.map(toAdminAvaliacao);
  }

  async ocultar(adminId: string, id: string, motivo: string): Promise<AvaliacaoAdmin> {
    const avaliacao = await this.prisma.avaliacao.findUnique({ where: { id } });
    if (!avaliacao) {
      throw new NotFoundException("Avaliação não encontrada");
    }
    if (avaliacao.oculta) {
      throw new ConflictException("Avaliação já está oculta");
    }

    const updated = await this.prisma.avaliacao.update({
      where: { id },
      data: { oculta: true, ocultaMotivo: motivo, ocultaEm: new Date() },
      include: INCLUDE,
    });

    await this.auditLog.record({
      userId: adminId,
      acao: "admin.avaliacao_oculta",
      entidade: "avaliacao",
      payload: { alvoId: id, motivo },
    });

    return toAdminAvaliacao(updated);
  }

  async reativar(adminId: string, id: string): Promise<AvaliacaoAdmin> {
    const avaliacao = await this.prisma.avaliacao.findUnique({ where: { id } });
    if (!avaliacao) {
      throw new NotFoundException("Avaliação não encontrada");
    }
    if (!avaliacao.oculta) {
      throw new ConflictException("Avaliação não está oculta");
    }

    const updated = await this.prisma.avaliacao.update({
      where: { id },
      data: { oculta: false, ocultaMotivo: null, ocultaEm: null },
      include: INCLUDE,
    });

    await this.auditLog.record({
      userId: adminId,
      acao: "admin.avaliacao_reativada",
      entidade: "avaliacao",
      payload: { alvoId: id },
    });

    return toAdminAvaliacao(updated);
  }
}
