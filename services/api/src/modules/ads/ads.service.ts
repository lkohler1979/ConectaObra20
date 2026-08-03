import { Injectable, NotFoundException } from "@nestjs/common";
import type { Ad } from "@prisma/client";
import type { AdPrivate, CreateAdInput, UpdateAdInput } from "@conectaobra/types/ads";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { toPrivateAd } from "./ad-public.mapper";

/** Anúncios de fornecedor/prestador (E9-06, escopo reduzido) — CRUD restrito ao dono. */
@Injectable()
export class AdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(anuncianteId: string, input: CreateAdInput): Promise<AdPrivate> {
    const ad = await this.prisma.ad.create({
      data: {
        anuncianteId,
        tipo: input.tipo,
        criativo: input.criativo,
        budgetCentavos: input.budgetCentavos,
        ativo: input.ativo ?? true,
      },
    });

    await this.auditLog.record({
      userId: anuncianteId,
      acao: "ad.created",
      entidade: "ad",
      payload: { adId: ad.id, tipo: ad.tipo },
    });

    return toPrivateAd(ad);
  }

  async listMine(anuncianteId: string): Promise<AdPrivate[]> {
    const ads = await this.prisma.ad.findMany({
      where: { anuncianteId },
      orderBy: { createdAt: "desc" },
    });
    return ads.map(toPrivateAd);
  }

  async update(anuncianteId: string, adId: string, input: UpdateAdInput): Promise<AdPrivate> {
    await this.getOwnedOrThrow(anuncianteId, adId);

    const ad = await this.prisma.ad.update({
      where: { id: adId },
      data: {
        tipo: input.tipo,
        criativo: input.criativo,
        budgetCentavos: input.budgetCentavos,
        ativo: input.ativo,
      },
    });

    await this.auditLog.record({
      userId: anuncianteId,
      acao: "ad.updated",
      entidade: "ad",
      payload: { adId },
    });

    return toPrivateAd(ad);
  }

  async remove(anuncianteId: string, adId: string): Promise<void> {
    await this.getOwnedOrThrow(anuncianteId, adId);

    await this.prisma.ad.delete({ where: { id: adId } });

    await this.auditLog.record({
      userId: anuncianteId,
      acao: "ad.deleted",
      entidade: "ad",
      payload: { adId },
    });
  }

  /** Não vaza se o anúncio existe e é de outro anunciante — 404 nos dois casos. */
  private async getOwnedOrThrow(anuncianteId: string, adId: string): Promise<Ad> {
    const ad = await this.prisma.ad.findUnique({ where: { id: adId } });
    if (!ad || ad.anuncianteId !== anuncianteId) {
      throw new NotFoundException("Anúncio não encontrado");
    }
    return ad;
  }
}
