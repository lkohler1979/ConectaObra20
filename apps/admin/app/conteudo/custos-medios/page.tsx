import Link from "next/link";
import type { AvgCostPublic } from "@conectaobra/types/ai-budget";
import { Alert, AlertDescription } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { AvgCostsPanel } from "./avg-costs-panel";

async function fetchAvgCosts(): Promise<AvgCostPublic[]> {
  const res = await apiFetchOrThrow("/public/avg-costs?limit=100", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function CustosMediosAdminPage() {
  await requireAccessToken("/conteudo/custos-medios");

  let custos: AvgCostPublic[];
  try {
    custos = await fetchAvgCosts();
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar os custos médios agora — o serviço está indisponível. Tente
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
        <h1 className="text-2xl font-black text-grafite">Custos médios por cidade</h1>
      </div>

      <AvgCostsPanel custosIniciais={custos} />
    </main>
  );
}
