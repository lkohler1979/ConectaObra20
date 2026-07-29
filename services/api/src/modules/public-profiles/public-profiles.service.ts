import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  PublicFornecedorProfile,
  PublicPrestadorProfile,
} from "@conectaobra/types/public-profiles";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class PublicProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPrestador(userId: string): Promise<PublicPrestadorProfile> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tipo: { in: ["PRESTADOR", "TECNICO"] }, deletedAt: null },
      include: { profilePrestador: { include: { portfolio: true } } },
    });

    if (!user || !user.profilePrestador) {
      throw new NotFoundException("Prestador não encontrado");
    }

    return {
      userId: user.id,
      nome: user.nome,
      categorias: user.profilePrestador.categorias,
      experienciaAnos: user.profilePrestador.experienciaAnos,
      raioAtendimentoKm: user.profilePrestador.raioAtendimentoKm,
      selo: user.profilePrestador.selo,
      notaMedia: user.profilePrestador.notaMedia
        ? user.profilePrestador.notaMedia.toNumber()
        : null,
      portfolio: user.profilePrestador.portfolio.map((item) => ({
        id: item.id,
        titulo: item.titulo,
        descricao: item.descricao,
        fotos: item.fotos,
      })),
    };
  }

  async getFornecedor(userId: string): Promise<PublicFornecedorProfile> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tipo: "FORNECEDOR", deletedAt: null },
      include: { profileFornecedor: { include: { products: true } } },
    });

    if (!user || !user.profileFornecedor) {
      throw new NotFoundException("Fornecedor não encontrado");
    }

    return {
      userId: user.id,
      razaoSocial: user.profileFornecedor.razaoSocial,
      categorias: user.profileFornecedor.categorias,
      regioes: user.profileFornecedor.regioes,
      tempoMercadoAnos: user.profileFornecedor.tempoMercadoAnos,
      selo: user.profileFornecedor.selo,
      notaMedia: user.profileFornecedor.notaMedia
        ? user.profileFornecedor.notaMedia.toNumber()
        : null,
      produtos: user.profileFornecedor.products.map((product) => ({
        id: product.id,
        nome: product.nome,
        categoria: product.categoria,
        precoCentavos: product.precoCentavos,
        unidade: product.unidade,
      })),
    };
  }
}
