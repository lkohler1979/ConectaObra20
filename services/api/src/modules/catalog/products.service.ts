import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type Product } from "@prisma/client";
import type {
  CreateProductInput,
  ImportProductsResult,
  ProductPublic,
  UpdateProductInput,
} from "@conectaobra/types/catalog";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { MeilisearchService } from "../search/meilisearch.service";
import { toPublicProduct } from "./product-public.mapper";
import { parseProductsSpreadsheet } from "./xlsx-import.util";

/** Categoria padrão pra produtos vindos do import de planilha (sem coluna de categoria). */
const IMPORT_DEFAULT_CATEGORIA = "Geral";

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

    let product: Product;
    try {
      product = await this.prisma.product.create({
        data: {
          fornecedorId,
          nome: input.nome,
          categoria: input.categoria,
          precoCentavos: input.precoCentavos,
          unidade: input.unidade,
          estoque: input.estoque,
          fotos: input.fotos,
          codigo: input.codigo,
          descricao: input.descricao,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Você já tem um produto com este código");
      }
      throw error;
    }

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

    let product: Product;
    try {
      product = await this.prisma.product.update({
        where: { id: productId },
        data: {
          nome: input.nome,
          categoria: input.categoria,
          precoCentavos: input.precoCentavos,
          unidade: input.unidade,
          estoque: input.estoque,
          fotos: input.fotos,
          codigo: input.codigo,
          descricao: input.descricao,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Você já tem um produto com este código");
      }
      throw error;
    }

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

  /**
   * Import em massa via planilha Excel (E1-06, extensão) — upsert por
   * (fornecedorId, codigo): linha nova cria produto, código já existente
   * atualiza. Categoria não vem da planilha — usa IMPORT_DEFAULT_CATEGORIA,
   * ajustável depois pelo fornecedor via PATCH. Processamento é por linha
   * (não é uma transação única): uma falha isolada não derruba o resto do
   * import, só entra na lista de erros.
   */
  async importFromExcel(fornecedorId: string, buffer: Buffer): Promise<ImportProductsResult> {
    const perfil = await this.prisma.profileFornecedor.findUnique({
      where: { userId: fornecedorId },
    });
    if (!perfil) {
      throw new ConflictException(
        "Complete seu perfil de fornecedor (PUT /profile/fornecedor) antes de importar produtos",
      );
    }

    const { rows, erros } = parseProductsSpreadsheet(buffer);

    let criados = 0;
    let atualizados = 0;

    for (const row of rows) {
      const nome = row.descricao.length > 160 ? row.descricao.slice(0, 160) : row.descricao;

      try {
        const existing = await this.prisma.product.findUnique({
          where: { fornecedorId_codigo: { fornecedorId, codigo: row.codigo } },
        });

        let product: Product;
        if (existing) {
          product = await this.prisma.product.update({
            where: { id: existing.id },
            data: {
              nome,
              descricao: row.descricao,
              unidade: row.unidade,
              precoCentavos: row.precoCentavos,
            },
          });
          atualizados += 1;
        } else {
          product = await this.prisma.product.create({
            data: {
              fornecedorId,
              codigo: row.codigo,
              nome,
              descricao: row.descricao,
              unidade: row.unidade,
              precoCentavos: row.precoCentavos,
              categoria: IMPORT_DEFAULT_CATEGORIA,
              fotos: [],
            },
          });
          criados += 1;
        }

        await this.meilisearch.indexProduto({
          id: product.id,
          fornecedorId: product.fornecedorId,
          nome: product.nome,
          categoria: product.categoria,
          precoCentavos: product.precoCentavos,
          unidade: product.unidade,
        });
      } catch (error) {
        erros.push({
          linha: row.linha,
          motivo: error instanceof Error ? error.message : "Erro desconhecido ao salvar produto",
        });
      }
    }

    await this.auditLog.record({
      userId: fornecedorId,
      acao: "product.imported",
      entidade: "product",
      payload: { criados, atualizados, erros: erros.length },
    });

    return {
      totalLinhas: rows.length + erros.length,
      criados,
      atualizados,
      erros,
    };
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
