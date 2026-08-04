import type { Metadata } from "next";
import Link from "next/link";
import type { IndicatorPublic, IndicatorTipo } from "@conectaobra/types/indicators";
import { Alert, AlertDescription, Badge, Card, CardContent } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Indicadores — ConectaObra",
  description: "CUB, INCC, SINAPI, aço, cimento e madeira — indicadores da construção civil.",
};

const TIPO_OPTIONS: { value: IndicatorTipo; label: string }[] = [
  { value: "CUB", label: "CUB" },
  { value: "INCC", label: "INCC" },
  { value: "SINAPI", label: "SINAPI" },
  { value: "ACO", label: "Aço" },
  { value: "CIMENTO", label: "Cimento" },
  { value: "MADEIRA", label: "Madeira" },
];

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function fetchIndicators(tipo?: string, regiao?: string): Promise<IndicatorPublic[]> {
  const params = new URLSearchParams({ limit: "50" });
  if (tipo) params.set("tipo", tipo);
  if (regiao) params.set("regiao", regiao);
  const res = await apiFetchOrThrow(`/public/indicators?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function IndicadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; regiao?: string }>;
}) {
  const { tipo, regiao } = await searchParams;

  let indicators: IndicatorPublic[];
  try {
    indicators = await fetchIndicators(tipo, regiao);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar os indicadores agora — o serviço está indisponível. Tente
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
          ← ConectaObra
        </Link>
        <Link href="/custos-medios" className="text-sm font-semibold text-azul-planta">
          Custos médios →
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-grafite">Indicadores</h1>
        <p className="mt-1 text-sm text-grafite/80">CUB, INCC, SINAPI, aço, cimento e madeira.</p>
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
        <input
          type="text"
          name="regiao"
          defaultValue={regiao ?? ""}
          placeholder="Região"
          className="rounded-md border-[1.5px] border-concreto bg-white px-3 py-[9px] text-sm text-grafite"
        />
        <button
          type="submit"
          className="rounded-md bg-laranja px-4 py-[9px] text-sm font-bold text-white"
        >
          Filtrar
        </button>
      </form>

      {indicators.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhum indicador cadastrado ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {indicators.map((indicator) => (
            <Card key={indicator.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge>{indicator.tipo}</Badge>
                    <span className="text-sm font-bold text-grafite">{indicator.regiao}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#7A828C]">
                    {new Date(indicator.referenciaMes).toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    · fonte: {indicator.fonte}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-laranja">
                  {formatMoney(indicator.valorCentavos)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
