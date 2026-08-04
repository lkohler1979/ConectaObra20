import type { Metadata } from "next";
import Link from "next/link";
import type { AvgCostPublic } from "@conectaobra/types/ai-budget";
import { Alert, AlertDescription, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Custos médios — ConectaObra",
  description: "Tabela dinâmica de custos médios de serviços e materiais por cidade.",
};

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function fetchAvgCosts(cidade?: string, servico?: string): Promise<AvgCostPublic[]> {
  const params = new URLSearchParams({ limit: "50" });
  if (cidade) params.set("cidade", cidade);
  if (servico) params.set("servico", servico);
  const res = await apiFetchOrThrow(`/public/avg-costs?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function CustosMediosPage({
  searchParams,
}: {
  searchParams: Promise<{ cidade?: string; servico?: string }>;
}) {
  const { cidade, servico } = await searchParams;

  let avgCosts: AvgCostPublic[];
  try {
    avgCosts = await fetchAvgCosts(cidade, servico);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar os custos médios agora — o serviço está indisponível.
              Tente novamente em instantes.
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
        <Link href="/indicadores" className="text-sm font-semibold text-azul-planta">
          Indicadores →
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-grafite">Custos médios por cidade</h1>
        <p className="mt-1 text-sm text-grafite/80">
          Valores mínimo, médio e máximo por serviço e unidade.
        </p>
      </div>

      <form className="flex flex-wrap gap-2" method="GET">
        <input
          type="text"
          name="cidade"
          defaultValue={cidade ?? ""}
          placeholder="Cidade"
          className="rounded-md border-[1.5px] border-concreto bg-white px-3 py-[9px] text-sm text-grafite"
        />
        <input
          type="text"
          name="servico"
          defaultValue={servico ?? ""}
          placeholder="Serviço"
          className="rounded-md border-[1.5px] border-concreto bg-white px-3 py-[9px] text-sm text-grafite"
        />
        <button
          type="submit"
          className="rounded-md bg-laranja px-4 py-[9px] text-sm font-bold text-white"
        >
          Filtrar
        </button>
      </form>

      {avgCosts.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhum custo médio cadastrado ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {avgCosts.map((avgCost) => (
            <Card key={avgCost.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{avgCost.servico}</CardTitle>
                  <span className="text-xs text-[#7A828C]">
                    {avgCost.cidade} · {new Date(avgCost.mes).toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <span className="text-[#7A828C]">
                    Mín: <span className="font-bold text-grafite">{formatMoney(avgCost.valorMinCentavos)}</span>
                  </span>
                  <span className="text-[#7A828C]">
                    Médio:{" "}
                    <span className="font-bold text-laranja">
                      {formatMoney(avgCost.valorMedCentavos)}
                    </span>
                  </span>
                  <span className="text-[#7A828C]">
                    Máx: <span className="font-bold text-grafite">{formatMoney(avgCost.valorMaxCentavos)}</span>
                  </span>
                  <span className="text-[#7A828C]">/ {avgCost.unidade}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
