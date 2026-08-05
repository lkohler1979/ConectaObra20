import Link from "next/link";
import type { ContractListItem } from "@conectaobra/types/contracts";
import { Alert, AlertDescription, Badge, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";

const PAPEL_LABEL: Record<string, string> = {
  CONTRATANTE: "Sou o cliente",
  CONTRATADO: "Sou o executor",
};

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function MeusContratosPage() {
  const accessToken = await requireAccessToken("/contratos");

  let contratos: ContractListItem[];
  try {
    const res = await apiFetchOrThrow("/contracts", {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    contratos = res.ok ? await res.json() : [];
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar seus contratos agora — o serviço está indisponível. Tente
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
        <h1 className="text-2xl font-black text-grafite">Meus contratos</h1>
        <Link href="/conta" className="text-sm font-semibold text-azul-planta">
          Minha conta
        </Link>
      </div>

      {contratos.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhum contrato ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {contratos.map((contrato) => (
            <Link key={contrato.id} href={`/contratos/${contrato.id}`}>
              <Card className="transition-colors hover:border-azul-planta">
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{contrato.obraTitulo}</CardTitle>
                      <Badge>{PAPEL_LABEL[contrato.meuPapel] ?? contrato.meuPapel}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[#7A828C]">
                      {new Date(contrato.createdAt).toLocaleDateString("pt-BR")} · {contrato.status}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-laranja">
                    {formatMoney(contrato.valorTotalCentavos)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
