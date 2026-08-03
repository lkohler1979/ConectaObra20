import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { PromocaoPublic } from "@conectaobra/types/promocoes";
import { Alert, AlertDescription, Badge, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Promoções dos fornecedores — ConectaObra",
  description: "Promoções e ofertas de fornecedores de materiais de construção no ConectaObra.",
};

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function fetchPromocoes(): Promise<PromocaoPublic[]> {
  const res = await apiFetchOrThrow("/public/promocoes?limit=50", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function PromocoesPublicPage() {
  let promocoes: PromocaoPublic[];
  try {
    promocoes = await fetchPromocoes();
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar as promoções agora — o serviço está indisponível. Tente
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

      <h1 className="text-2xl font-black text-grafite">Promoções dos fornecedores</h1>

      {promocoes.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhuma promoção ativa no momento.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {promocoes.map((promo) => (
            <Card key={promo.id}>
              {promo.imagemUrl && (
                <div className="relative h-36 w-full overflow-hidden rounded-t-lg">
                  <Image
                    src={promo.imagemUrl}
                    alt={promo.nome}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <CardContent className="flex flex-col gap-1 pt-4">
                <div className="flex items-center gap-2">
                  <CardTitle>{promo.nome}</CardTitle>
                  {promo.destaque && <Badge variant="verified">Destaque</Badge>}
                </div>
                <p className="text-xs text-[#7A828C]">{promo.fornecedorNome}</p>
                <p className="text-sm text-grafite/80">{promo.descricao}</p>
                <p className="mt-1 text-sm font-bold text-laranja">
                  {promo.valorOriginalCentavos != null && (
                    <span className="mr-2 font-normal text-[#7A828C] line-through">
                      {formatMoney(promo.valorOriginalCentavos)}
                    </span>
                  )}
                  {formatMoney(promo.valorPromocionalCentavos)}
                </p>
                <div className="mt-1 flex items-center justify-between text-xs text-[#7A828C]">
                  <Badge>{promo.codigo}</Badge>
                  <span>
                    válida até {new Date(promo.validadeFim).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
