import Link from "next/link";
import type { PortfolioItemPublic } from "@conectaobra/types/portfolio";
import type { AdPrivate } from "@conectaobra/types/ads";
import { Alert, AlertDescription } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { PrestadorDashboardTabs } from "./dashboard-tabs";

interface MeResponse {
  tipo: string;
  profilePrestador: {
    categorias: string[];
    experienciaAnos: number | null;
    certificados: string[];
    raioAtendimentoKm: number | null;
  } | null;
}

export default async function PrestadorDashboardPage() {
  const accessToken = await requireAccessToken("/conta/prestador");
  const authHeader = { authorization: `Bearer ${accessToken}` };

  try {
    const [meRes, portfolioRes, adsRes] = await Promise.all([
      apiFetchOrThrow("/profile/me", { headers: authHeader, cache: "no-store" }),
      apiFetchOrThrow("/profile/prestador/portfolio", { headers: authHeader, cache: "no-store" }),
      apiFetchOrThrow("/ads", { headers: authHeader, cache: "no-store" }),
    ]);

    if (!meRes.ok) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>Não foi possível carregar sua conta.</AlertDescription>
          </Alert>
        </main>
      );
    }

    const me: MeResponse = await meRes.json();

    if (me.tipo !== "PRESTADOR" && me.tipo !== "TECNICO") {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Esta área é exclusiva para contas de prestador de serviço.
            </AlertDescription>
          </Alert>
          <Link href="/conta" className="text-sm font-semibold text-azul-planta">
            Voltar pra minha conta
          </Link>
        </main>
      );
    }

    const portfolio: PortfolioItemPublic[] = portfolioRes.ok ? await portfolioRes.json() : [];
    const ads: AdPrivate[] = adsRes.ok ? await adsRes.json() : [];

    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-grafite">Painel do prestador</h1>
          <Link href="/conta" className="text-sm font-semibold text-azul-planta">
            Minha conta
          </Link>
        </div>

        <PrestadorDashboardTabs
          perfilAtual={me.profilePrestador}
          portfolioIniciais={portfolio}
          adsIniciais={ads}
        />
      </main>
    );
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar o painel agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }
}
