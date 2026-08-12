import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { PublicProdutoDetalhe } from "@conectaobra/types/produtos-publicos";
import type { AvaliacaoListResponse } from "@conectaobra/types/avaliacoes";
import { Alert, AlertDescription, Badge } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { AvaliacoesLista } from "@/components/avaliacoes-lista";
import { AvaliarForm } from "@/components/avaliar-form";

async function fetchProduto(id: string): Promise<PublicProdutoDetalhe | null> {
  const res = await apiFetchOrThrow(`/public/produtos/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function fetchAvaliacoes(id: string): Promise<AvaliacaoListResponse> {
  const res = await apiFetchOrThrow(`/public/produtos/${id}/avaliacoes`, { cache: "no-store" });
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
    const produto = await fetchProduto(id);
    if (!produto) {
      return { title: "Produto não encontrado — ConectaObra" };
    }
    return {
      title: `${produto.nome} — ${produto.fornecedorNome} | ConectaObra`,
      description: produto.descricao ?? `${produto.nome}, vendido por ${produto.fornecedorNome}.`,
    };
  } catch {
    return { title: "ConectaObra" };
  }
}

export default async function ProdutoPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let produto: PublicProdutoDetalhe | null;
  let avaliacoes: AvaliacaoListResponse;
  try {
    [produto, avaliacoes] = await Promise.all([fetchProduto(id), fetchAvaliacoes(id)]);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar este produto agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  if (!produto) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
        ← ConectaObra
      </Link>

      {produto.fotos.length > 0 && (
        <div className="relative h-56 w-full overflow-hidden rounded-lg">
          <Image src={produto.fotos[0]} alt={produto.nome} fill className="object-cover" unoptimized />
        </div>
      )}

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-grafite">{produto.nome}</h1>
          <Badge>{produto.categoria}</Badge>
        </div>
        <p className="mt-1 text-lg font-bold text-laranja">
          {formatMoney(produto.precoCentavos)} / {produto.unidade}
        </p>
        {produto.descricao && <p className="mt-2 text-sm text-grafite/80">{produto.descricao}</p>}
        <Link
          href={`/fornecedores/${produto.fornecedorId}`}
          className="mt-2 inline-block text-sm font-semibold text-azul-planta hover:underline"
        >
          Vendido por {produto.fornecedorNome} →
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-bold text-grafite">Avaliações</h2>
        <div className="mt-3">
          <AvaliacoesLista data={avaliacoes} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-grafite">Avaliar este produto</h2>
        <div className="mt-3">
          <AvaliarForm tipo="PRODUTO" targetId={produto.id} redirectPath={`/produtos/${id}`} />
        </div>
      </div>
    </main>
  );
}
