import Link from "next/link";
import type { AdminUser } from "@conectaobra/types/admin";
import { Alert, AlertDescription } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { PilotoForm } from "./piloto-form";

async function fetchPrestadorCount(accessToken: string): Promise<number> {
  const res = await apiFetchOrThrow("/admin/users?tipo=PRESTADOR&limit=500", {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return 0;
  const users: AdminUser[] = await res.json();
  return users.length;
}

export default async function PrestadoresPilotoPage() {
  const accessToken = await requireAccessToken("/prestadores-piloto");

  let contagem: number;
  try {
    contagem = await fetchPrestadorCount(accessToken);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar esta tela agora — o serviço está indisponível. Tente
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
        <h1 className="text-2xl font-black text-grafite">Cadastro assistido — prestadores</h1>
      </div>

      <p className="text-sm text-[#5B6875]">
        Pra usar em campo com o prestador ao lado: preenche conta e perfil de uma vez só, sem
        precisar que ele se cadastre sozinho depois.
      </p>

      <PilotoForm contagemInicial={contagem} />
    </main>
  );
}
