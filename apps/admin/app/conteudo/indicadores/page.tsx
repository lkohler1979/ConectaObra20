import Link from "next/link";
import type { IndicatorPublic } from "@conectaobra/types/indicators";
import { Alert, AlertDescription } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { IndicatorsPanel } from "./indicators-panel";

async function fetchIndicators(): Promise<IndicatorPublic[]> {
  const res = await apiFetchOrThrow("/public/indicators?limit=100", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function IndicadoresAdminPage() {
  await requireAccessToken("/conteudo/indicadores");

  let indicadores: IndicatorPublic[];
  try {
    indicadores = await fetchIndicators();
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
        <Link href="/conteudo" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← Conteúdo
        </Link>
        <h1 className="text-2xl font-black text-grafite">Indicadores de mercado</h1>
      </div>

      <IndicatorsPanel indicadoresIniciais={indicadores} />
    </main>
  );
}
