import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { SurplusListingPublic } from "@conectaobra/types/material-surplus";
import { Alert, AlertDescription, Badge } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { CheckoutForm } from "./checkout-form";

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function fetchListing(id: string): Promise<SurplusListingPublic | null> {
  const res = await apiFetchOrThrow(`/public/surplus-listings/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const listing = await fetchListing(id);
    if (!listing) {
      return { title: "Anúncio não encontrado — ConectaObra" };
    }
    return {
      title: `${listing.nome} — Sobra de material | ConectaObra`,
      description: listing.descricao,
    };
  } catch {
    return { title: "ConectaObra" };
  }
}

export default async function SobraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let listing: SurplusListingPublic | null;
  try {
    listing = await fetchListing(id);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar este anúncio agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  if (!listing) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <Link href="/sobras" className="text-sm font-semibold text-grafite hover:text-laranja">
        ← Sobra de material
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-grafite">{listing.nome}</h1>
          <Badge>{listing.categoria}</Badge>
        </div>
        <p className="mt-1 text-sm text-[#7A828C]">
          {listing.quantidade} {listing.unidade} · anunciado por {listing.clienteNome}
        </p>
        <p className="mt-3 whitespace-pre-wrap text-sm text-grafite">{listing.descricao}</p>
        <p className="mt-3 text-2xl font-black text-laranja">
          {formatMoney(listing.precoCentavos)}
        </p>
      </div>

      <CheckoutForm listingId={listing.id} />
    </main>
  );
}
