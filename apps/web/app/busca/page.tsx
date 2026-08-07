import type { Metadata } from "next";
import Link from "next/link";
import type {
  FornecedorSearchHit,
  PrestadorSearchHit,
  ProdutoSearchHit,
} from "@conectaobra/types/search";
import { Alert, AlertDescription, Badge, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Buscar — ConectaObra",
  description: "Encontre prestadores de serviço, fornecedores e produtos de material de construção.",
};

type Tipo = "prestadores" | "fornecedores" | "produtos";
const TIPOS: { value: Tipo; label: string }[] = [
  { value: "prestadores", label: "Prestadores" },
  { value: "fornecedores", label: "Fornecedores" },
  { value: "produtos", label: "Produtos" },
];

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function fetchResultados(tipo: Tipo, q: string, categoria: string, regiao: string) {
  const params = new URLSearchParams({ limit: "20" });
  if (q) params.set("q", q);
  if (categoria) params.set("categoria", categoria);
  if (tipo === "fornecedores" && regiao) params.set("regiao", regiao);
  const res = await apiFetchOrThrow(`/search/${tipo}?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; q?: string; categoria?: string; regiao?: string }>;
}) {
  const sp = await searchParams;
  const tipo: Tipo = sp.tipo === "fornecedores" || sp.tipo === "produtos" ? sp.tipo : "prestadores";
  const q = sp.q ?? "";
  const categoria = sp.categoria ?? "";
  const regiao = sp.regiao ?? "";

  let resultados: PrestadorSearchHit[] | FornecedorSearchHit[] | ProdutoSearchHit[];
  try {
    resultados = await fetchResultados(tipo, q, categoria, regiao);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível buscar agora — o serviço está indisponível. Tente novamente em
              instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <div>
        <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← ConectaObra
        </Link>
        <h1 className="mt-2 text-2xl font-black text-grafite">Buscar</h1>
      </div>

      <div className="flex gap-2 border-b-[1.5px] border-concreto">
        {TIPOS.map((t) => (
          <Link
            key={t.value}
            href={`/busca?tipo=${t.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`px-3 py-2 text-sm font-semibold ${
              tipo === t.value
                ? "border-b-2 border-laranja text-grafite"
                : "text-[#7A828C] hover:text-grafite"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap gap-2" method="GET">
        <input type="hidden" name="tipo" value={tipo} />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, categoria…"
          className="min-w-[200px] flex-1 rounded-md border-[1.5px] border-concreto bg-white px-3 py-[9px] text-sm text-grafite focus:border-azul-planta focus:outline-none"
        />
        <input
          type="text"
          name="categoria"
          defaultValue={categoria}
          placeholder="Categoria"
          className="w-40 rounded-md border-[1.5px] border-concreto bg-white px-3 py-[9px] text-sm text-grafite focus:border-azul-planta focus:outline-none"
        />
        {tipo === "fornecedores" && (
          <input
            type="text"
            name="regiao"
            defaultValue={regiao}
            placeholder="Região"
            className="w-40 rounded-md border-[1.5px] border-concreto bg-white px-3 py-[9px] text-sm text-grafite focus:border-azul-planta focus:outline-none"
          />
        )}
        <button
          type="submit"
          className="rounded-md bg-laranja px-4 py-[9px] text-sm font-bold text-white"
        >
          Buscar
        </button>
      </form>

      {resultados.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhum resultado encontrado.</p>
      ) : tipo === "prestadores" ? (
        <div className="flex flex-col gap-3">
          {(resultados as PrestadorSearchHit[]).map((hit) => (
            <Link key={hit.userId} href={`/prestadores/${hit.userId}`}>
              <Card className="transition-colors hover:border-azul-planta">
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <div>
                    <CardTitle>{hit.nome}</CardTitle>
                    <p className="mt-1 text-xs text-[#7A828C]">
                      {hit.categorias.join(", ") || "Sem categoria cadastrada"}
                      {hit.experienciaAnos !== null && ` · ${hit.experienciaAnos} anos de experiência`}
                    </p>
                  </div>
                  {hit.notaMedia !== null && <Badge variant="verified">★ {hit.notaMedia.toFixed(1)}</Badge>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : tipo === "fornecedores" ? (
        <div className="flex flex-col gap-3">
          {(resultados as FornecedorSearchHit[]).map((hit) => (
            <Link key={hit.userId} href={`/fornecedores/${hit.userId}`}>
              <Card className="transition-colors hover:border-azul-planta">
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <div>
                    <CardTitle>{hit.razaoSocial}</CardTitle>
                    <p className="mt-1 text-xs text-[#7A828C]">
                      {hit.categorias.join(", ") || "Sem categoria cadastrada"}
                      {hit.regioes.length > 0 && ` · Atende: ${hit.regioes.join(", ")}`}
                    </p>
                  </div>
                  {hit.notaMedia !== null && <Badge variant="verified">★ {hit.notaMedia.toFixed(1)}</Badge>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(resultados as ProdutoSearchHit[]).map((hit) => (
            <Link key={hit.id} href={`/fornecedores/${hit.fornecedorId}`}>
              <Card className="h-full transition-colors hover:border-azul-planta">
                <CardContent className="flex flex-col gap-1 pt-4">
                  <div className="flex items-center gap-2">
                    <CardTitle>{hit.nome}</CardTitle>
                    <Badge>{hit.categoria}</Badge>
                  </div>
                  <p className="text-sm font-bold text-laranja">
                    {formatMoney(hit.precoCentavos)} / {hit.unidade}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
