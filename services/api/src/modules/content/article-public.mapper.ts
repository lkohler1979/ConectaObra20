import type { Article } from "@prisma/client";
import type { ArticlePrivate, ArticlePublic } from "@conectaobra/types/articles";

export function toPrivateArticle(article: Article): ArticlePrivate {
  return {
    id: article.id,
    titulo: article.titulo,
    slug: article.slug,
    categoria: article.categoria,
    corpo: article.corpo,
    autor: article.autor,
    arquivoUrl: article.arquivoUrl,
    publicadoEm: article.publicadoEm ? article.publicadoEm.toISOString() : null,
  };
}

/** Só chamado com artigos já filtrados por `publicadoEm` preenchido (ver PublicArticlesService). */
export function toPublicArticle(article: Article): ArticlePublic {
  return {
    id: article.id,
    titulo: article.titulo,
    slug: article.slug,
    categoria: article.categoria,
    corpo: article.corpo,
    autor: article.autor,
    arquivoUrl: article.arquivoUrl,
    publicadoEm: article.publicadoEm!.toISOString(),
  };
}
