import Link from "next/link";
import type { FornecedorLojaPublic } from "@conectaobra/types/fornecedor-lojas";
import { Alert, AlertDescription } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { FornecedorDashboardTabs } from "./dashboard-tabs";

interface MeResponse {
  tipo: string;
  profileFornecedor: {
    razaoSocial: string;
    categorias: string[];
    regioes: string[];
    tempoMercadoAnos: number | null;
    certificacoes: string[];
  } | null;
}

export default async function FornecedorDashboardPage() {
  const accessToken = await requireAccessToken("/conta/fornecedor");
  const authHeader = { authorization: `Bearer ${accessToken}` };

  try {
    const [meRes, lojasRes] = await Promise.all([
      apiFetchOrThrow("/profile/me", { headers: authHeader, cache: "no-store" }),
      apiFetchOrThrow("/profile/fornecedor/lojas", { headers: authHeader, cache: "no-store" }),
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

    if (me.tipo !== "FORNECEDOR") {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>Esta área é exclusiva para contas de fornecedor.</AlertDescription>
          </Alert>
          <Link href="/conta" className="text-sm font-semibold text-azul-planta">
            Voltar pra minha conta
          </Link>
        </main>
      );
    }

    const lojas: FornecedorLojaPublic[] = lojasRes.ok ? await lojasRes.json() : [];

    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-grafite">Painel do fornecedor</h1>
          <Link href="/conta" className="text-sm font-semibold text-azul-planta">
            Minha conta
          </Link>
        </div>

        <FornecedorDashboardTabs perfilAtual={me.profileFornecedor} lojasIniciais={lojas} />
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
