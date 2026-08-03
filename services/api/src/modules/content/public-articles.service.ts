import { Injectable, NotFoundException } from "@nestjs/common";
import type { ArticlePublic, ListPublicArticlesQuery } from "@conectaobra/types/articles";
import { PrismaService } from "../../common/prisma/prisma.service";
import { toPublicArticle } from "./article-public.mapper";

/** Listagem pública (sem login) — portal de notícias (E9-01) e biblioteca (E9-04). */
@Injectable()
export class PublicArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPublicArticlesQuery): Promise<ArticlePublic[]> {
    const articles = await this.prisma.article.findMany({
      where: {
        publicadoEm: { not: null, lte: new Date() },
        ...(query.categoria ? { categoria: query.categoria } : {}),
      },
      orderBy: { publicadoEm: "desc" },
      take: query.limit,
    });

    return articles.map(toPublicArticle);
  }

  async getBySlug(slug: string): Promise<ArticlePublic> {
    const article = await this.prisma.article.findUnique({ where: { slug } });
    if (!article || !article.publicadoEm || article.publicadoEm > new Date()) {
      throw new NotFoundException("Artigo não encontrado");
    }
    return toPublicArticle(article);
  }
}
