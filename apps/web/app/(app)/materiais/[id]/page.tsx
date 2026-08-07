import Link from "next/link";
import { notFound } from "next/navigation";
import type { MaterialListPublic } from "@conectaobra/types/material-lists";
import type { PurchaseQuotePublic, MaterialListComparison } from "@conectaobra/types/purchase-quotes";
import { Alert, AlertDescription, Card, CardContent } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { ComparadorPanel } from "./comparador-panel";

export default async function MaterialListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accessToken = await requireAccessToken(`/materiais/${id}`);
  const authHeader = { authorization: `Bearer ${accessToken}` };

  let listaRes: Response;
  let quotesRes: Response;
  let comparisonRes: Response;
  try {
    [listaRes, quotesRes, comparisonRes] = await Promise.all([
      apiFetchOrThrow(`/material-lists/${id}`, { headers: authHeader, cache: "no-store" }),
      apiFetchOrThrow(`/material-lists/${id}/quotes`, { headers: authHeader, cache: "no-store" }),
      apiFetchOrThrow(`/material-lists/${id}/comparison`, { headers: authHeader, cache: "no-store" }),
    ]);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar esta lista agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  if (!listaRes.ok) {
    notFound();
  }

  const lista: MaterialListPublic = await listaRes.json();
  const cotacoes: PurchaseQuotePublic[] = quotesRes.ok ? await quotesRes.json() : [];
  const comparison: MaterialListComparison | null = comparisonRes.ok
    ? await comparisonRes.json()
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <Link href="/materiais" className="text-sm font-semibold text-grafite hover:text-laranja">
        ← Listas de materiais
      </Link>

      <h1 className="text-2xl font-black text-grafite">Lista de materiais</h1>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-2">
            {lista.itens.map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b border-concreto pb-2 text-sm last:border-0">
                <span className="text-grafite">{item.descricao}</span>
                <span className="text-[#7A828C]">
                  {item.quantidade} {item.unidade}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ComparadorPanel
        materialListId={lista.id}
        cotacoes={cotacoes}
        comparativo={comparison?.cotacoes ?? []}
      />
    </main>
  );
}
