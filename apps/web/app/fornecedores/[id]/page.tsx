import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { PublicFornecedorProfile } from "@conectaobra/types/public-profiles";
import type { AvaliacaoListResponse } from "@conectaobra/types/avaliacoes";
import { Alert, AlertDescription, Badge, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { AvaliacoesLista } from "@/components/avaliacoes-lista";
import { AvaliarForm } from "@/components/avaliar-form";

async function fetchFornecedor(id: string): Promise<PublicFornecedorProfile | null> {
  const res = await apiFetchOrThrow(`/public/fornecedores/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function fetchAvaliacoes(id: string): Promise<AvaliacaoListResponse> {
  const res = await apiFetchOrThrow(`/public/fornecedores/${id}/avaliacoes`, { cache: "no-store" });
  if (!res.ok) return { resumo: { notaMedia: null, total: 0 }, itens: [] };
  return res.json();
}

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const fornecedor = await fetchFornecedor(id);
    if (!fornecedor) {
      return { title: "Fornecedor não encontrado — ConectaObra" };
    }
    return {
      title: `${fornecedor.razaoSocial} — Fornecedor | ConectaObra`,
      description:
        fornecedor.categorias.length > 0
          ? `${fornecedor.razaoSocial} atende as categorias: ${fornecedor.categorias.join(", ")}.`
          : `Perfil de ${fornecedor.razaoSocial} no ConectaObra.`,
    };
  } catch {
    return { title: "ConectaObra" };
  }
}

export default async function FornecedorPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let fornecedor: PublicFornecedorProfile | null;
  let avaliacoes: AvaliacaoListResponse;
  try {
    [fornecedor, avaliacoes] = await Promise.all([fetchFornecedor(id), fetchAvaliacoes(id)]);
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

  if (!fornecedor) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
        ← ConectaObra
      </Link>

      <div>
        <div className="flex items-center gap-3">
          {fornecedor.logoUrl && (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
              <Image
                src={fornecedor.logoUrl}
                alt={fornecedor.razaoSocial}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <h1 className="text-2xl font-black text-grafite">{fornecedor.razaoSocial}</h1>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {fornecedor.categorias.map((categoria) => (
            <Badge key={categoria}>{categoria}</Badge>
          ))}
          {fornecedor.selo && <Badge variant="verified">{fornecedor.selo}</Badge>}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-grafite/80">
          {fornecedor.tempoMercadoAnos !== null && (
            <span>{fornecedor.tempoMercadoAnos} anos de mercado</span>
          )}
          {fornecedor.regioes.length > 0 && <span>Atende: {fornecedor.regioes.join(", ")}</span>}
          {fornecedor.notaMedia !== null && (
            <span>Nota média: {fornecedor.notaMedia.toFixed(1)}</span>
          )}
        </div>
      </div>

      {fornecedor.produtos.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-grafite">Produtos</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {fornecedor.produtos.map((produto) => (
              <Link key={produto.id} href={`/produtos/${produto.id}`}>
                <Card className="h-full transition-colors hover:border-azul-planta">
                  <CardContent className="pt-4">
                    <CardTitle>{produto.nome}</CardTitle>
                    <p className="mt-1 text-sm text-grafite/80">
                      {formatMoney(produto.precoCentavos)} / {produto.unidade}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-grafite">Avaliações</h2>
        <div className="mt-3">
          <AvaliacoesLista data={avaliacoes} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-grafite">Avaliar este fornecedor</h2>
        <div className="mt-3">
          <AvaliarForm tipo="FORNECEDOR" targetId={fornecedor.userId} redirectPath={`/fornecedores/${id}`} />
        </div>
      </div>
    </main>
  );
}
