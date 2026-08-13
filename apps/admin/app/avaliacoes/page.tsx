import Link from "next/link";
import type { AvaliacaoAdmin, AvaliacaoTipo } from "@conectaobra/types/avaliacoes";
import { Alert, AlertDescription, Badge, Card, CardContent } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { ModeracaoForm } from "./moderacao-form";

const TIPO_OPTIONS: { value: AvaliacaoTipo; label: string }[] = [
  { value: "PRESTADOR", label: "Prestador" },
  { value: "FORNECEDOR", label: "Fornecedor" },
  { value: "PRODUTO", label: "Produto" },
];

function alvoAvaliado(item: AvaliacaoAdmin): string {
  return item.prestadorNome ?? item.fornecedorNome ?? item.produtoNome ?? "—";
}

async function fetchAvaliacoes(
  accessToken: string,
  filters: { tipo?: string; oculta?: string },
): Promise<AvaliacaoAdmin[]> {
  const params = new URLSearchParams({ limit: "50" });
  if (filters.tipo) params.set("tipo", filters.tipo);
  if (filters.oculta) params.set("oculta", filters.oculta);

  const res = await apiFetchOrThrow(`/admin/avaliacoes?${params.toString()}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function AvaliacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; oculta?: string }>;
}) {
  const accessToken = await requireAccessToken("/avaliacoes");
  const { tipo, oculta } = await searchParams;

  let avaliacoes: AvaliacaoAdmin[];
  try {
    avaliacoes = await fetchAvaliacoes(accessToken, { tipo, oculta });
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar as avaliações agora — o serviço está indisponível. Tente
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
        <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← Painel
        </Link>
        <h1 className="text-2xl font-black text-grafite">Avaliações</h1>
      </div>

      <form className="flex flex-wrap gap-2" method="GET">
        <select
          name="tipo"
          defaultValue={tipo ?? ""}
          className="rounded-md border-[1.5px] border-concreto bg-white px-3 py-[9px] text-sm text-grafite"
        >
          <option value="">Todos os tipos</option>
          {TIPO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          name="oculta"
          defaultValue={oculta ?? ""}
          className="rounded-md border-[1.5px] border-concreto bg-white px-3 py-[9px] text-sm text-grafite"
        >
          <option value="">Visíveis e ocultas</option>
          <option value="false">Só visíveis</option>
          <option value="true">Só ocultas</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-laranja px-4 py-[9px] text-sm font-bold text-white"
        >
          Filtrar
        </button>
      </form>

      {avaliacoes.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhuma avaliação encontrada.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {avaliacoes.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-grafite">{item.autorNome}</span>
                    <Badge>{item.tipo}</Badge>
                    {item.oculta && <Badge variant="danger">Oculta</Badge>}
                  </div>
                  <Badge variant="verified">★ {item.nota}</Badge>
                </div>

                <p className="text-xs text-[#7A828C]">
                  {item.autorEmail} · avaliou {alvoAvaliado(item)}
                  {item.obraTitulo && ` · obra ${item.obraTitulo}`} ·{" "}
                  {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                </p>

                {item.comentario && (
                  <p className="text-sm text-grafite/80">{item.comentario}</p>
                )}

                {item.oculta && item.ocultaMotivo && (
                  <p className="text-xs text-[#7A828C]">
                    Ocultada em{" "}
                    {item.ocultaEm && new Date(item.ocultaEm).toLocaleDateString("pt-BR")} —
                    motivo: {item.ocultaMotivo}
                  </p>
                )}

                <ModeracaoForm avaliacaoId={item.id} oculta={item.oculta} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
