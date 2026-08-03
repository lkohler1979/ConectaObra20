import { Injectable } from "@nestjs/common";
import { adCriativoSchema, type AdPublic, type ListPublicAdsQuery } from "@conectaobra/types/ads";
import { PrismaService } from "../../common/prisma/prisma.service";

/** Listagem pública (sem login) de anúncios ativos — exibidos na home. */
@Injectable()
export class PublicAdsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPublicAdsQuery): Promise<AdPublic[]> {
    const ads = await this.prisma.ad.findMany({
      where: { ativo: true },
      include: { anunciante: { select: { nome: true, tipo: true } } },
      orderBy: { createdAt: "desc" },
      take: query.limit,
    });

    return ads.map((ad) => {
      const criativo = adCriativoSchema.parse(ad.criativo);
      return {
        id: ad.id,
        anuncianteId: ad.anuncianteId,
        anuncianteNome: ad.anunciante.nome,
        anuncianteTipo: ad.anunciante.tipo as AdPublic["anuncianteTipo"],
        tipo: ad.tipo,
        titulo: criativo.titulo,
        descricao: criativo.descricao ?? null,
        imagemUrl: criativo.imagemUrl ?? null,
        linkUrl: criativo.linkUrl ?? null,
      };
    });
  }
}
