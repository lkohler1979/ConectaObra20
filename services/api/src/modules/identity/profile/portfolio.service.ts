import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { PortfolioItem } from "@prisma/client";
import type {
  CreatePortfolioItemInput,
  PortfolioItemPublic,
  UpdatePortfolioItemInput,
} from "@conectaobra/types/portfolio";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { AuditLogService } from "../../../common/audit/audit-log.service";
import { toPublicPortfolioItem } from "./portfolio-public.mapper";

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(
    prestadorId: string,
    input: CreatePortfolioItemInput,
  ): Promise<PortfolioItemPublic> {
    // PortfolioItem.prestadorId é FK pra profiles_prestador.user_id — sem o
    // perfil, o create do Prisma quebraria com um erro de constraint cru.
    const perfil = await this.prisma.profilePrestador.findUnique({
      where: { userId: prestadorId },
    });
    if (!perfil) {
      throw new ConflictException(
        "Complete seu perfil de prestador (PUT /profile/prestador) antes de adicionar itens ao portfólio",
      );
    }

    const item = await this.prisma.portfolioItem.create({
      data: {
        prestadorId,
        titulo: input.titulo,
        descricao: input.descricao,
        fotos: input.fotos,
      },
    });

    await this.auditLog.record({
      userId: prestadorId,
      acao: "portfolio_item.created",
      entidade: "portfolio_item",
      payload: { itemId: item.id, titulo: item.titulo },
    });

    return toPublicPortfolioItem(item);
  }

  async listMine(prestadorId: string): Promise<PortfolioItemPublic[]> {
    const items = await this.prisma.portfolioItem.findMany({
      where: { prestadorId },
      orderBy: { createdAt: "desc" },
    });
    return items.map(toPublicPortfolioItem);
  }

  async update(
    prestadorId: string,
    itemId: string,
    input: UpdatePortfolioItemInput,
  ): Promise<PortfolioItemPublic> {
    await this.getOwnedOrThrow(prestadorId, itemId);

    const item = await this.prisma.portfolioItem.update({
      where: { id: itemId },
      data: {
        titulo: input.titulo,
        descricao: input.descricao,
        fotos: input.fotos,
      },
    });

    await this.auditLog.record({
      userId: prestadorId,
      acao: "portfolio_item.updated",
      entidade: "portfolio_item",
      payload: { itemId },
    });

    return toPublicPortfolioItem(item);
  }

  async remove(prestadorId: string, itemId: string): Promise<void> {
    await this.getOwnedOrThrow(prestadorId, itemId);

    await this.prisma.portfolioItem.delete({ where: { id: itemId } });

    await this.auditLog.record({
      userId: prestadorId,
      acao: "portfolio_item.deleted",
      entidade: "portfolio_item",
      payload: { itemId },
    });
  }

  /** Não vaza se o item existe e é de outro prestador — 404 nos dois casos. */
  private async getOwnedOrThrow(prestadorId: string, itemId: string): Promise<PortfolioItem> {
    const item = await this.prisma.portfolioItem.findUnique({ where: { id: itemId } });
    if (!item || item.prestadorId !== prestadorId) {
      throw new NotFoundException("Item de portfólio não encontrado");
    }
    return item;
  }
}
