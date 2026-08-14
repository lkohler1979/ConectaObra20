import Link from "next/link";
import type { SinapiItem, SinapiSearchResponse } from "@conectaobra/types/sinapi";
import { Alert, AlertDescription, Badge } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";

type Tipo = "todos" | "insumo" | "composicao";
const TIPOS: { value: Tipo; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "insumo", label: "Insumos" },
  { value: "composicao", label: "Composições" },
];

function formatMoney(centavos: number | null): string {
  if (centavos === null) return "—";
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function fetchResultado(
  accessToken: string,
  termo: string,
  tipo: Tipo,
): Promise<SinapiSearchResponse | null> {
  const params = new URLSearchParams({ termo, tipo, limit: "50" });
  const res = await apiFetchOrThrow(`/sinapi/search?${params.toString()}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function SinapiPage({
  searchParams,
}: {
  searchParams: Promise<{ termo?: string; tipo?: string }>;
}) {
  const accessToken = await requireAccessToken("/sinapi");
  const sp = await searchParams;
  const termo = sp.termo ?? "";
  const tipo: Tipo = sp.tipo === "insumo" || sp.tipo === "composicao" ? sp.tipo : "todos";

  let resultado: SinapiSearchResponse | null = null;
  let erro: string | null = null;

  if (termo.trim().length >= 2) {
    try {
      resultado = await fetchResultado(accessToken, termo.trim(), tipo);
      if (!resultado) {
        erro = "Não foi possível buscar agora. A base do SINAPI pode estar sendo carregada — tente de novo em alguns segundos.";
      }
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        erro = "Não foi possível buscar agora — o serviço está indisponível. Tente novamente em instantes.";
      } else {
        throw err;
      }
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <div>
        <Link href="/conta" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← Minha conta
        </Link>
        <h1 className="mt-2 text-2xl font-black text-grafite">Consultar SINAPI</h1>
        <p className="mt-1 text-sm text-[#7A828C]">
          Preços de insumos e composições da construção civil (fonte: CAIXA), fixo em{" "}
          <strong>Espírito Santo</strong> e no mês de referência mais recente disponível — ajuda a
          detalhar e compor um orçamento.
        </p>
      </div>

      <form className="flex flex-wrap gap-2" method="GET">
        <input
          type="text"
          name="termo"
          defaultValue={termo}
          placeholder="Ex.: cimento, alvenaria de blocos…"
          minLength={2}
          className="min-w-[220px] flex-1 rounded-md border-[1.5px] border-concreto bg-white px-3 py-[9px] text-sm text-grafite focus:border-azul-planta focus:outline-none"
        />
        <select
          name="tipo"
          defaultValue={tipo}
          className="rounded-md border-[1.5px] border-concreto bg-white px-3 py-[9px] text-sm text-grafite"
        >
          {TIPOS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-laranja px-4 py-[9px] text-sm font-bold text-white"
        >
          Buscar
        </button>
      </form>

      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {termo.trim().length > 0 && termo.trim().length < 2 && (
        <p className="text-sm text-[#5B6875]">Informe ao menos 2 caracteres pra buscar.</p>
      )}

      {resultado && (
        <>
          <div className="flex items-center gap-2 text-xs text-[#7A828C]">
            <Badge variant="platinum">Referência {resultado.referenciaMes}</Badge>
            <Badge variant="platinum">{resultado.regiao}</Badge>
            <span>
              {resultado.total} resultado{resultado.total === 1 ? "" : "s"}
              {resultado.total > resultado.itens.length && ` (mostrando os primeiros ${resultado.itens.length} — refine a busca)`}
            </span>
          </div>

          {resultado.itens.length === 0 ? (
            <p className="text-sm text-[#5B6875]">Nenhum resultado encontrado.</p>
          ) : (
            <div className="overflow-x-auto rounded border-[1.5px] border-concreto bg-white">
              <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-concreto text-left text-xs uppercase tracking-wide text-grafite/70">
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Código</th>
                    <th className="px-3 py-2">Descrição</th>
                    <th className="px-3 py-2">Unidade</th>
                    <th className="px-3 py-2">Sem desoneração</th>
                    <th className="px-3 py-2">Com desoneração</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.itens.map((item: SinapiItem, i: number) => (
                    <tr key={`${item.tipo}-${item.codigo}-${i}`} className="border-t border-concreto">
                      <td className="px-3 py-2">
                        <Badge variant={item.tipo === "insumo" ? "default" : "verified"}>
                          {item.tipo === "insumo" ? "Insumo" : "Composição"}
                        </Badge>
                      </td>
                      {/* Código de composição vem sempre zerado neste relatório (achado confirmado contra o arquivo real da CAIXA) — só é confiável pra insumo. */}
                      <td className="px-3 py-2 text-grafite/80">{item.tipo === "insumo" ? item.codigo : "—"}</td>
                      <td className="px-3 py-2 text-grafite">{item.descricao}</td>
                      <td className="px-3 py-2 text-grafite/80">{item.unidade}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-semibold text-laranja">
                        {formatMoney(item.precoSemDesoneracaoCentavos)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-semibold text-laranja">
                        {formatMoney(item.precoComDesoneracaoCentavos)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
