import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Product } from "@prisma/client";
import type {
  CreateProductInput,
  ProductPublic,
  UpdateProductInput,
} from "@conectaobra/types/catalog";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { MeilisearchService } from "../search/meilisearch.service";
import { toPublicProduct } from "./product-public.mapper";

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly meilisearch: MeilisearchService,
  ) {}

  async create(fornecedorId: string, input: CreateProductInput): Promise<ProductPublic> {
    // Product.fornecedorId referencia profiles_fornecedor.user_id (FK) — sem
    // o perfil, o create do Prisma quebraria com um erro de constraint cru.
    const perfil = await this.prisma.profileFornecedor.findUnique({
      where: { userId: fornecedorId },
    });
    if (!perfil) {
      throw new ConflictException(
        "Complete seu perfil de fornecedor (PUT /profile/fornecedor) antes de cadastrar produtos",
      );
    }

    const product = await this.prisma.product.create({
      data: {
        fornecedorId,
        nome: input.nome,
        categoria: input.categoria,
        precoCentavos: input.precoCentavos,
        unidade: input.unidade,
        estoque: input.estoque,
        fotos: input.fotos,
      },
    });

    await this.auditLog.record({
      userId: fornecedorId,
      acao: "product.created",
      entidade: "product",
      payload: { productId: product.id, nome: product.nome },
    });

    await this.meilisearch.indexProduto({
      id: product.id,
      fornecedorId: product.fornecedorId,
      nome: product.nome,
      categoria: product.categoria,
      precoCentavos: product.precoCentavos,
      unidade: product.unidade,
    });

    return toPublicProduct(product);
  }

  async listMine(fornecedorId: string): Promise<ProductPublic[]> {
    const products = await this.prisma.product.findMany({
      where: { fornecedorId },
      orderBy: { createdAt: "desc" },
    });
    return products.map(toPublicProduct);
  }

  async getMine(fornecedorId: string, productId: string): Promise<ProductPublic> {
    const product = await this.getOwnedOrThrow(fornecedorId, productId);
    return toPublicProduct(product);
  }

  async update(
    fornecedorId: string,
    productId: string,
    input: UpdateProductInput,
  ): Promise<ProductPublic> {
    await this.getOwnedOrThrow(fornecedorId, productId);

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        nome: input.nome,
        categoria: input.categoria,
        precoCentavos: input.precoCentavos,
        unidade: input.unidade,
        estoque: input.estoque,
        fotos: input.fotos,
      },
    });

    await this.auditLog.record({
      userId: fornecedorId,
      acao: "product.updated",
      entidade: "product",
      payload: { productId },
    });

    await this.meilisearch.indexProduto({
      id: product.id,
      fornecedorId: product.fornecedorId,
      nome: product.nome,
      categoria: product.categoria,
      precoCentavos: product.precoCentavos,
      unidade: product.unidade,
    });

    return toPublicProduct(product);
  }

  async remove(fornecedorId: string, productId: string): Promise<void> {
    await this.getOwnedOrThrow(fornecedorId, productId);

    await this.prisma.product.delete({ where: { id: productId } });

    await this.auditLog.record({
      userId: fornecedorId,
      acao: "product.deleted",
      entidade: "product",
      payload: { productId },
    });

    await this.meilisearch.removeProduto(productId);
  }

  /** Não vaza se o produto existe e é de outro fornecedor — 404 nos dois casos. */
  private async getOwnedOrThrow(fornecedorId: string, productId: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.fornecedorId !== fornecedorId) {
      throw new NotFoundException("Produto não encontrado");
    }
    return product;
  }
}
