import Link from "next/link";
import type { WorkPublic } from "@conectaobra/types/works";
import { Alert, AlertDescription } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { ObrasPanel } from "./obras-panel";

export default async function ObrasPage() {
  const accessToken = await requireAccessToken("/obras");

  let obras: WorkPublic[];
  try {
    const res = await apiFetchOrThrow("/works", {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    obras = res.ok ? await res.json() : [];
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar suas obras agora — o serviço está indisponível. Tente
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
        <h1 className="text-2xl font-black text-grafite">Minhas obras</h1>
        <Link href="/conta" className="text-sm font-semibold text-azul-planta">
          Minha conta
        </Link>
      </div>

      <ObrasPanel obrasIniciais={obras} />
    </main>
  );
}
