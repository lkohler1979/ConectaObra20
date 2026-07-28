import Link from "next/link";
import type { RfqPublic } from "@conectaobra/types/rfq";
import { Alert, AlertDescription, Badge, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";

const STATUS_LABEL: Record<string, string> = {
  ABERTO: "Aberto",
  EM_ANALISE: "Em análise",
  CONTRATADO: "Contratado",
  CANCELADO: "Cancelado",
};

const STATUS_BADGE: Record<string, "default" | "warning" | "verified" | "danger"> = {
  ABERTO: "default",
  EM_ANALISE: "warning",
  CONTRATADO: "verified",
  CANCELADO: "danger",
};

export default async function MinhasRfqsPage() {
  const accessToken = await requireAccessToken("/rfq");

  let res: Response;
  try {
    res = await apiFetchOrThrow("/rfq", {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar suas RFQs agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  const rfqs: RfqPublic[] = res.ok ? await res.json() : [];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-grafite">Minhas RFQs</h1>
        <Link href="/conta" className="text-sm font-semibold text-azul-planta">
          Minha conta
        </Link>
      </div>

      {rfqs.length === 0 ? (
        <p className="text-sm text-[#5B6875]">
          Nenhuma RFQ publicada ainda. A publicação de RFQ (E3-02) ainda não tem tela nesta
          interface — por enquanto, use <code className="text-xs">POST /rfq</code> direto na API.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {rfqs.map((rfq) => (
            <Link key={rfq.id} href={`/rfq/${rfq.id}`}>
              <Card className="transition-colors hover:border-azul-planta">
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <div>
                    <CardTitle>{rfq.categoria}</CardTitle>
                    <p className="mt-1 text-xs text-[#7A828C]">
                      Publicado em {new Date(rfq.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge variant={STATUS_BADGE[rfq.status] ?? "default"}>
                    {STATUS_LABEL[rfq.status] ?? rfq.status}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
