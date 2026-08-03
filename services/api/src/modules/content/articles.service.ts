import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Article } from "@prisma/client";
import type {
  ArticlePrivate,
  CreateArticleInput,
  UpdateArticleInput,
} from "@conectaobra/types/articles";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogService } from "../../common/audit/audit-log.service";
import { toPrivateArticle } from "./article-public.mapper";
import { slugify } from "./slugify.util";

/**
 * Notícias (E9-01) e biblioteca (E9-04) — mesmo model `Article`, CRUD
 * exclusivo do ADMIN (evita conteúdo publicado sem revisão, mesmo padrão de
 * KnowledgeChunk/AvgCost).
 */
@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(adminId: string, input: CreateArticleInput): Promise<ArticlePrivate> {
    const slug = input.slug
      ? await this.assertSlugFree(input.slug)
      : await this.generateUniqueSlug(slugify(input.titulo));

    const article = await this.prisma.article.create({
      data: {
        titulo: input.titulo,
        slug,
        categoria: input.categoria,
        corpo: input.corpo,
        autor: input.autor,
        arquivoUrl: input.arquivoUrl,
        publicadoEm: input.publicadoEm,
      },
    });

    await this.auditLog.record({
      userId: adminId,
      acao: "article.created",
      entidade: "article",
      payload: { articleId: article.id, slug: article.slug },
    });

    return toPrivateArticle(article);
  }

  /** Sem `createdAt` no schema (S0-05) — ordena por título pra ter uma ordem determinística. */
  async listAll(): Promise<ArticlePrivate[]> {
    const articles = await this.prisma.article.findMany({ orderBy: { titulo: "asc" } });
    return articles.map(toPrivateArticle);
  }

  async update(
    adminId: string,
    articleId: string,
    input: UpdateArticleInput,
  ): Promise<ArticlePrivate> {
    await this.getOrThrow(articleId);

    const slug = input.slug ? await this.assertSlugFree(input.slug, articleId) : undefined;

    const article = await this.prisma.article.update({
      where: { id: articleId },
      data: {
        titulo: input.titulo,
        slug,
        categoria: input.categoria,
        corpo: input.corpo,
        autor: input.autor,
        arquivoUrl: input.arquivoUrl,
        publicadoEm: input.publicadoEm,
      },
    });

    await this.auditLog.record({
      userId: adminId,
      acao: "article.updated",
      entidade: "article",
      payload: { articleId },
    });

    return toPrivateArticle(article);
  }

  async remove(adminId: string, articleId: string): Promise<void> {
    await this.getOrThrow(articleId);

    await this.prisma.article.delete({ where: { id: articleId } });

    await this.auditLog.record({
      userId: adminId,
      acao: "article.deleted",
      entidade: "article",
      payload: { articleId },
    });
  }

  private async getOrThrow(articleId: string): Promise<Article> {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      throw new NotFoundException("Artigo não encontrado");
    }
    return article;
  }

  /** Slug escolhido explicitamente pelo ADMIN — nunca desambiguado em silêncio. */
  private async assertSlugFree(slug: string, excludingId?: string): Promise<string> {
    const existing = await this.prisma.article.findUnique({ where: { slug } });
    if (existing && existing.id !== excludingId) {
      throw new ConflictException("Já existe um artigo com este slug");
    }
    return slug;
  }

  /** Slug gerado a partir do título — em colisão, tenta -2, -3... até achar livre. */
  private async generateUniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 2;
    while (await this.prisma.article.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}
