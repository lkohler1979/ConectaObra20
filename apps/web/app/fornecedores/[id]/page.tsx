import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { PublicFornecedorProfile } from "@conectaobra/types/public-profiles";
import { Alert, AlertDescription, Badge, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";

async function fetchFornecedor(id: string): Promise<PublicFornecedorProfile | null> {
  const res = await apiFetchOrThrow(`/public/fornecedores/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
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
  try {
    fornecedor = await fetchFornecedor(id);
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
        <h1 className="text-2xl font-black text-grafite">{fornecedor.razaoSocial}</h1>
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
              <Card key={produto.id}>
                <CardContent className="pt-4">
                  <CardTitle>{produto.nome}</CardTitle>
                  <p className="mt-1 text-sm text-grafite/80">
                    {formatMoney(produto.precoCentavos)} / {produto.unidade}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
