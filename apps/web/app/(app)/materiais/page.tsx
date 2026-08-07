import Link from "next/link";
import type { WorkPublic } from "@conectaobra/types/works";
import type { MaterialListPublic } from "@conectaobra/types/material-lists";
import { Alert, AlertDescription } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { MateriaisPanel, type MaterialListWithObra } from "./materiais-panel";

export default async function MateriaisPage() {
  const accessToken = await requireAccessToken("/materiais");
  const authHeader = { authorization: `Bearer ${accessToken}` };

  let obras: WorkPublic[];
  let listas: MaterialListWithObra[];
  try {
    const obrasRes = await apiFetchOrThrow("/works", { headers: authHeader, cache: "no-store" });
    obras = obrasRes.ok ? await obrasRes.json() : [];

    const listasPorObra = await Promise.all(
      obras.map(async (obra) => {
        const res = await apiFetchOrThrow(`/material-lists?obraId=${obra.id}`, {
          headers: authHeader,
          cache: "no-store",
        });
        const lists: MaterialListPublic[] = res.ok ? await res.json() : [];
        return lists.map((lista) => ({
          id: lista.id,
          obraId: lista.obraId,
          obraTitulo: obra.titulo,
          itensCount: lista.itens.length,
          origem: lista.origem,
          createdAt: lista.createdAt,
        }));
      }),
    );
    listas = listasPorObra
      .flat()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar suas listas de materiais agora — o serviço está
              indisponível. Tente novamente em instantes.
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
        <h1 className="text-2xl font-black text-grafite">Listas de materiais</h1>
        <Link href="/compras-materiais" className="text-sm font-semibold text-azul-planta">
          Minhas compras →
        </Link>
      </div>

      <MateriaisPanel obras={obras} listasIniciais={listas} />
    </main>
  );
}
