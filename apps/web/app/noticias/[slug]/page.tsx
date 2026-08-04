import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ArticlePublic } from "@conectaobra/types/articles";
import { Alert, AlertDescription, Badge } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";

async function fetchArticle(slug: string): Promise<ArticlePublic | null> {
  const res = await apiFetchOrThrow(`/public/articles/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await fetchArticle(slug);
    if (!article) {
      return { title: "Notícia não encontrada — ConectaObra" };
    }
    return {
      title: `${article.titulo} — ConectaObra`,
      description: article.corpo.slice(0, 160),
    };
  } catch {
    return { title: "ConectaObra" };
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let article: ArticlePublic | null;
  try {
    article = await fetchArticle(slug);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar esta notícia agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <Link href="/noticias" className="text-sm font-semibold text-grafite hover:text-laranja">
        ← Notícias
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-grafite">{article.titulo}</h1>
          <Badge>{article.categoria}</Badge>
        </div>
        <p className="mt-1 text-xs text-[#7A828C]">
          {article.autor} · {new Date(article.publicadoEm).toLocaleDateString("pt-BR")}
        </p>
      </div>

      <div className="flex flex-col gap-3 text-sm text-grafite/90">
        {article.corpo
          .split("\n")
          .filter((paragrafo) => paragrafo.trim().length > 0)
          .map((paragrafo, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <p key={i}>{paragrafo}</p>
          ))}
      </div>

      {article.arquivoUrl && (
        <a
          href={article.arquivoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-azul-planta"
        >
          Baixar arquivo →
        </a>
      )}
    </main>
  );
}
