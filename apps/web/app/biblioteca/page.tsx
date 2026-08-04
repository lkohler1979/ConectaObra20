import type { Metadata } from "next";
import Link from "next/link";
import type { ArticlePublic } from "@conectaobra/types/articles";
import { Alert, AlertDescription, Badge, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Biblioteca — ConectaObra",
  description: "Guias, checklists e modelos de contrato para construção civil.",
};

/** Biblioteca = artigos que têm um arquivo pra baixar — mesma tabela de notícias (E9-01), diferenciada por convenção (ver PENDENCIAS.md). */
async function fetchLibraryItems(): Promise<ArticlePublic[]> {
  const res = await apiFetchOrThrow("/public/articles?limit=50", { cache: "no-store" });
  if (!res.ok) return [];
  const articles: ArticlePublic[] = await res.json();
  return articles.filter((article) => article.arquivoUrl);
}

export default async function BibliotecaPage() {
  let items: ArticlePublic[];
  try {
    items = await fetchLibraryItems();
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar a biblioteca agora — o serviço está indisponível. Tente
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
        <Link href="/noticias" className="text-sm font-semibold text-azul-planta">
          Notícias →
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-grafite">Biblioteca</h1>
        <p className="mt-1 text-sm text-grafite/80">Guias, checklists e modelos de contrato.</p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhum material disponível ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{item.titulo}</CardTitle>
                    <Badge>{item.categoria}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[#7A828C]">{item.autor}</p>
                </div>
                {item.arquivoUrl && (
                  <a
                    href={item.arquivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-sm font-semibold text-azul-planta"
                  >
                    Baixar →
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
