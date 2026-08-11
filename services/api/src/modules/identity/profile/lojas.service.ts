import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type FornecedorLoja } from "@prisma/client";
import type {
  CreateFornecedorLojaInput,
  FornecedorLojaPublic,
  UpdateFornecedorLojaInput,
} from "@conectaobra/types/fornecedor-lojas";
import type { GeoPoint } from "@conectaobra/types/geo";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { AuditLogService } from "../../../common/audit/audit-log.service";
import { toPublicLoja } from "./loja-public.mapper";

/** Lojas/filiais físicas do fornecedor — um fornecedor pode ter várias unidades. */
@Injectable()
export class LojasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(
    fornecedorId: string,
    input: CreateFornecedorLojaInput,
  ): Promise<FornecedorLojaPublic> {
    // FornecedorLoja.fornecedorId é FK pra profiles_fornecedor.user_id — sem
    // o perfil, o create do Prisma quebraria com um erro de constraint cru.
    const perfil = await this.prisma.profileFornecedor.findUnique({
      where: { userId: fornecedorId },
    });
    if (!perfil) {
      throw new ConflictException(
        "Complete seu perfil de fornecedor (PUT /profile/fornecedor) antes de adicionar lojas",
      );
    }

    const loja = await this.prisma.$transaction(async (tx) => {
      const created = await tx.fornecedorLoja.create({
        data: {
          fornecedorId,
          nome: input.nome,
          endereco: input.endereco,
          regiao: input.regiao,
          telefone: input.telefone,
          imagemUrl: input.imagemUrl,
        },
      });

      if (input.geo) {
        await this.setGeo(tx, created.id, input.geo);
      }

      return created;
    });

    await this.auditLog.record({
      userId: fornecedorId,
      acao: "fornecedor_loja.created",
      entidade: "fornecedor_loja",
      payload: { lojaId: loja.id, nome: loja.nome },
    });

    return toPublicLoja(loja);
  }

  async listMine(fornecedorId: string): Promise<FornecedorLojaPublic[]> {
    const lojas = await this.prisma.fornecedorLoja.findMany({
      where: { fornecedorId },
      orderBy: { createdAt: "desc" },
    });
    return lojas.map(toPublicLoja);
  }

  async update(
    fornecedorId: string,
    lojaId: string,
    input: UpdateFornecedorLojaInput,
  ): Promise<FornecedorLojaPublic> {
    await this.getOwnedOrThrow(fornecedorId, lojaId);

    const loja = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.fornecedorLoja.update({
        where: { id: lojaId },
        data: {
          nome: input.nome,
          endereco: input.endereco,
          regiao: input.regiao,
          telefone: input.telefone,
          imagemUrl: input.imagemUrl,
        },
      });

      if (input.geo) {
        await this.setGeo(tx, lojaId, input.geo);
      }

      return updated;
    });

    await this.auditLog.record({
      userId: fornecedorId,
      acao: "fornecedor_loja.updated",
      entidade: "fornecedor_loja",
      payload: { lojaId },
    });

    return toPublicLoja(loja);
  }

  async remove(fornecedorId: string, lojaId: string): Promise<void> {
    await this.getOwnedOrThrow(fornecedorId, lojaId);

    await this.prisma.fornecedorLoja.delete({ where: { id: lojaId } });

    await this.auditLog.record({
      userId: fornecedorId,
      acao: "fornecedor_loja.deleted",
      entidade: "fornecedor_loja",
      payload: { lojaId },
    });
  }

  /** Não vaza se a loja existe e é de outro fornecedor — 404 nos dois casos. */
  private async getOwnedOrThrow(fornecedorId: string, lojaId: string): Promise<FornecedorLoja> {
    const loja = await this.prisma.fornecedorLoja.findUnique({ where: { id: lojaId } });
    if (!loja || loja.fornecedorId !== fornecedorId) {
      throw new NotFoundException("Loja não encontrada");
    }
    return loja;
  }

  /// PostGIS — Unsupported("geography") não é gravável pelo client (mesmo padrão de WorksService/ProfileService).
  private async setGeo(
    tx: Prisma.TransactionClient,
    lojaId: string,
    geo: GeoPoint,
  ): Promise<void> {
    await tx.$executeRaw`
      UPDATE fornecedor_lojas
      SET geo = ST_SetSRID(ST_MakePoint(${geo.lng}, ${geo.lat}), 4326)::geography
      WHERE id = ${lojaId}::uuid
    `;
  }
}
