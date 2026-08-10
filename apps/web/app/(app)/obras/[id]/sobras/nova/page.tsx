import Link from "next/link";
import { notFound } from "next/navigation";
import type { WorkPublic } from "@conectaobra/types/works";
import { Alert, AlertDescription } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { NovaSobraForm } from "./nova-sobra-form";

export default async function NovaSobraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accessToken = await requireAccessToken(`/obras/${id}/sobras/nova`);

  let obraRes: Response;
  try {
    obraRes = await apiFetchOrThrow(`/works/${id}`, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar esta obra agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  if (!obraRes.ok) {
    notFound();
  }

  const obra: WorkPublic = await obraRes.json();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <Link
        href={`/obras/${obra.id}`}
        className="text-sm font-semibold text-grafite hover:text-laranja"
      >
        ← {obra.titulo}
      </Link>

      <div>
        <h1 className="text-2xl font-black text-grafite">Anunciar sobra de material</h1>
        <p className="mt-1 text-sm text-[#7A828C]">
          Publicado no marketplace público — qualquer pessoa pode comprar, sem precisar de conta.
        </p>
      </div>

      <NovaSobraForm workId={obra.id} />
    </main>
  );
}
