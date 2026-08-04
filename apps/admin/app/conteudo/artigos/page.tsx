import Link from "next/link";
import type { ArticlePrivate } from "@conectaobra/types/articles";
import { Alert, AlertDescription } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { ArticlesPanel } from "./articles-panel";

async function fetchArticles(accessToken: string): Promise<ArticlePrivate[]> {
  const res = await apiFetchOrThrow("/articles", {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function ArtigosAdminPage() {
  const accessToken = await requireAccessToken("/conteudo/artigos");

  let artigos: ArticlePrivate[];
  try {
    artigos = await fetchArticles(accessToken);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar os artigos agora — o serviço está indisponível. Tente
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
        <Link href="/conteudo" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← Conteúdo
        </Link>
        <h1 className="text-2xl font-black text-grafite">Notícias e biblioteca</h1>
      </div>

      <ArticlesPanel artigosIniciais={artigos} />
    </main>
  );
}
