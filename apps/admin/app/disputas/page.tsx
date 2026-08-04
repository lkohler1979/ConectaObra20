import Link from "next/link";
import type { AdminDispute } from "@conectaobra/types/disputes";
import { Alert, AlertDescription, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { ResolveForm } from "./resolve-form";

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function fetchDisputas(accessToken: string): Promise<AdminDispute[]> {
  const res = await apiFetchOrThrow("/disputas", {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function DisputasPage() {
  const accessToken = await requireAccessToken("/disputas");

  let disputas: AdminDispute[];
  try {
    disputas = await fetchDisputas(accessToken);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar as disputas agora — o serviço está indisponível. Tente
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
        <h1 className="text-2xl font-black text-grafite">Fila de disputas</h1>
      </div>

      {disputas.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhuma disputa aberta no momento.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {disputas.map((disputa) => (
            <Card key={disputa.id}>
              <CardContent className="flex flex-col gap-3 pt-4">
                <div>
                  <CardTitle>{disputa.obraTitulo}</CardTitle>
                  <p className="mt-1 text-sm text-grafite/80">{disputa.milestoneDescricao}</p>
                  <p className="mt-1 text-xs text-[#7A828C]">
                    Valor da etapa: {formatMoney(disputa.milestoneValorCentavos)} · Aberta por{" "}
                    {disputa.abertoPorNome} em{" "}
                    {new Date(disputa.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-grafite">Motivo</p>
                  <p className="text-sm text-grafite/80">{disputa.motivo}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-grafite">Evidências</p>
                  <div className="mt-1 flex flex-col gap-1">
                    {disputa.evidencias.map((url, i) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-azul-planta hover:underline"
                      >
                        Evidência {i + 1} →
                      </a>
                    ))}
                  </div>
                </div>

                <ResolveForm disputeId={disputa.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
