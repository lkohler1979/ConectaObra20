import { Injectable } from "@nestjs/common";
import type { ListPublicPromocoesQuery, PromocaoPublic } from "@conectaobra/types/promocoes";
import { PrismaService } from "../../common/prisma/prisma.service";

/**
 * Listagem pública (sem login) de promoções ativas e dentro da validade —
 * página compartilhável e destaques da home (E1-06, extensão).
 */
@Injectable()
export class PublicPromocoesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPublicPromocoesQuery): Promise<PromocaoPublic[]> {
    const now = new Date();

    const promocoes = await this.prisma.promocao.findMany({
      where: {
        ativa: true,
        validadeFim: { gte: now },
        OR: [{ validadeInicio: null }, { validadeInicio: { lte: now } }],
        ...(query.destaque !== undefined ? { destaque: query.destaque } : {}),
      },
      include: { fornecedor: { select: { razaoSocial: true } } },
      orderBy: [{ destaque: "desc" }, { createdAt: "desc" }],
      take: query.limit,
    });

    return promocoes.map((promocao) => ({
      id: promocao.id,
      fornecedorId: promocao.fornecedorId,
      fornecedorNome: promocao.fornecedor.razaoSocial,
      codigo: promocao.codigo,
      nome: promocao.nome,
      descricao: promocao.descricao,
      valorOriginalCentavos: promocao.valorOriginalCentavos,
      valorPromocionalCentavos: promocao.valorPromocionalCentavos,
      imagemUrl: promocao.imagemUrl,
      validadeFim: promocao.validadeFim.toISOString(),
      destaque: promocao.destaque,
    }));
  }
}
