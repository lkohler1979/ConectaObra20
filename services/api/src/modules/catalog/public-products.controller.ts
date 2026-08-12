import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { publicProfileIdSchema } from "@conectaobra/types/public-profiles";
import type { PublicProdutoDetalhe } from "@conectaobra/types/produtos-publicos";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { PrismaService } from "../../common/prisma/prisma.service";

/** Sem guard, de propósito — mesmo padrão de PublicProfilesController (E2-03). */
@Controller("public/produtos")
export class PublicProductsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(":id")
  async getOne(
    @Param("id", new ZodValidationPipe(publicProfileIdSchema)) id: string,
  ): Promise<PublicProdutoDetalhe> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { fornecedor: { select: { razaoSocial: true } } },
    });
    if (!product) {
      throw new NotFoundException("Produto não encontrado");
    }

    return {
      id: product.id,
      nome: product.nome,
      categoria: product.categoria,
      descricao: product.descricao,
      precoCentavos: product.precoCentavos,
      unidade: product.unidade,
      fotos: product.fotos,
      fornecedorId: product.fornecedorId,
      fornecedorNome: product.fornecedor.razaoSocial,
    };
  }
}
