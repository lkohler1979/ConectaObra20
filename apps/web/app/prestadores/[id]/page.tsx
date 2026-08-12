import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { PublicPrestadorProfile } from "@conectaobra/types/public-profiles";
import type { AvaliacaoListResponse } from "@conectaobra/types/avaliacoes";
import { Alert, AlertDescription, Badge, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { AvaliacoesLista } from "@/components/avaliacoes-lista";

async function fetchPrestador(id: string): Promise<PublicPrestadorProfile | null> {
  const res = await apiFetchOrThrow(`/public/prestadores/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function fetchAvaliacoes(id: string): Promise<AvaliacaoListResponse> {
  const res = await apiFetchOrThrow(`/public/prestadores/${id}/avaliacoes`, { cache: "no-store" });
  if (!res.ok) return { resumo: { notaMedia: null, total: 0 }, itens: [] };
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const prestador = await fetchPrestador(id);
    if (!prestador) {
      return { title: "Prestador não encontrado — ConectaObra" };
    }
    return {
      title: `${prestador.nome} — Prestador de serviço | ConectaObra`,
      description:
        prestador.categorias.length > 0
          ? `${prestador.nome} atende as categorias: ${prestador.categorias.join(", ")}.`
          : `Perfil de ${prestador.nome} no ConectaObra.`,
    };
  } catch {
    return { title: "ConectaObra" };
  }
}

export default async function PrestadorPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let prestador: PublicPrestadorProfile | null;
  let avaliacoes: AvaliacaoListResponse;
  try {
    [prestador, avaliacoes] = await Promise.all([fetchPrestador(id), fetchAvaliacoes(id)]);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar este perfil agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  if (!prestador) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
        ← ConectaObra
      </Link>

      <div>
        <div className="flex items-center gap-3">
          {prestador.fotoUrl && (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
              <Image src={prestador.fotoUrl} alt={prestador.nome} fill className="object-cover" unoptimized />
            </div>
          )}
          <h1 className="text-2xl font-black text-grafite">{prestador.nome}</h1>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {prestador.categorias.map((categoria) => (
            <Badge key={categoria}>{categoria}</Badge>
          ))}
          {prestador.selo && <Badge variant="verified">{prestador.selo}</Badge>}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-grafite/80">
          {prestador.experienciaAnos !== null && (
            <span>{prestador.experienciaAnos} anos de experiência</span>
          )}
          {prestador.raioAtendimentoKm !== null && (
            <span>Atende num raio de {prestador.raioAtendimentoKm} km</span>
          )}
          {prestador.notaMedia !== null && <span>Nota média: {prestador.notaMedia.toFixed(1)}</span>}
        </div>
      </div>

      {prestador.portfolio.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-grafite">Obras anteriores</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {prestador.portfolio.map((item) => (
              <Card key={item.id}>
                <CardContent className="pt-4">
                  <CardTitle>{item.titulo}</CardTitle>
                  {item.descricao && (
                    <p className="mt-1 text-sm text-grafite/80">{item.descricao}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-grafite">Avaliações</h2>
        <p className="mt-1 text-xs text-[#7A828C]">
          Avaliações abertas registradas pelos clientes nas obras em que este prestador trabalhou —
          diferente da "Nota média" acima (que vem de contratos verificados na plataforma).
        </p>
        <div className="mt-3">
          <AvaliacoesLista data={avaliacoes} agruparPorObra />
        </div>
      </div>
    </main>
  );
}
