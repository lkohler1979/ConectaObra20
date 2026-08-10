import type { Metadata } from "next";
import Link from "next/link";
import type { SurplusListingPublic } from "@conectaobra/types/material-surplus";
import { Alert, AlertDescription, Badge, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Sobra de material — ConectaObra",
  description: "Material de obra excedente à venda direto com quem sobrou, sem precisar de conta.",
};

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function fetchListings(q?: string): Promise<SurplusListingPublic[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  const res = await apiFetchOrThrow(`/public/surplus-listings?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function SobrasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  let listings: SurplusListingPublic[];
  try {
    listings = await fetchListings(q);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar os anúncios agora — o serviço está indisponível. Tente
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
      <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
        ← ConectaObra
      </Link>

      <div>
        <h1 className="text-2xl font-black text-grafite">Sobra de material</h1>
        <p className="mt-1 text-sm text-grafite/80">
          Material excedente de obras cadastradas na plataforma, à venda direto com o cliente.
          Compra sem precisar criar conta.
        </p>
      </div>

      <form className="flex flex-wrap gap-2" method="GET">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nome…"
          className="min-w-0 flex-1 rounded-md border-[1.5px] border-concreto bg-white px-3 py-[9px] text-sm text-grafite"
        />
        <button
          type="submit"
          className="rounded-md bg-laranja px-4 py-[9px] text-sm font-bold text-white"
        >
          Buscar
        </button>
      </form>

      {listings.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhum anúncio disponível agora.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/sobras/${listing.id}`}>
              <Card className="h-full transition-colors hover:border-azul-planta">
                <CardContent className="flex flex-col gap-1 pt-4">
                  <div className="flex items-center gap-2">
                    <CardTitle>{listing.nome}</CardTitle>
                    <Badge>{listing.categoria}</Badge>
                  </div>
                  <p className="text-xs text-[#7A828C]">
                    {listing.quantidade} {listing.unidade} · anunciado por {listing.clienteNome}
                  </p>
                  <span className="mt-1 text-sm font-bold text-laranja">
                    {formatMoney(listing.precoCentavos)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
