import type { Metadata } from "next";
import Link from "next/link";
import type { ArticlePublic } from "@conectaobra/types/articles";
import { Alert, AlertDescription, Badge, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Notícias — ConectaObra",
  description: "Novidades, legislação, tendências e materiais da construção civil.",
};

async function fetchArticles(): Promise<ArticlePublic[]> {
  const res = await apiFetchOrThrow("/public/articles?limit=30", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function NoticiasPage() {
  let articles: ArticlePublic[];
  try {
    articles = await fetchArticles();
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar as notícias agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← ConectaObra
        </Link>
        <Link href="/biblioteca" className="text-sm font-semibold text-azul-planta">
          Biblioteca →
        </Link>
      </div>

      <h1 className="text-2xl font-black text-grafite">Notícias</h1>

      {articles.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhuma notícia publicada ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {articles.map((article) => (
            <Link key={article.id} href={`/noticias/${article.slug}`}>
              <Card className="transition-colors hover:border-azul-planta">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <CardTitle>{article.titulo}</CardTitle>
                    <Badge>{article.categoria}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[#7A828C]">
                    {article.autor} · {new Date(article.publicadoEm).toLocaleDateString("pt-BR")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
