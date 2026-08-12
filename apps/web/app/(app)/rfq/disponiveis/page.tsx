import Link from "next/link";
import type { RfqPublic } from "@conectaobra/types/rfq";
import { Alert, AlertDescription, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { EnviarPropostaForm } from "./enviar-proposta-form";

export default async function RfqDisponiveisPage() {
  const accessToken = await requireAccessToken("/rfq/disponiveis");

  let rfqs: RfqPublic[];
  try {
    const res = await apiFetchOrThrow("/rfq/discover", {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    rfqs = res.ok ? await res.json() : [];
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar os orçamentos disponíveis agora — o serviço está
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
        <h1 className="text-2xl font-black text-grafite">Orçamentos disponíveis</h1>
        <Link href="/conta" className="text-sm font-semibold text-azul-planta">
          Minha conta
        </Link>
      </div>

      {rfqs.length === 0 ? (
        <p className="text-sm text-[#5B6875]">
          Nenhum orçamento casado com o seu perfil ainda — RFQs aparecem aqui automaticamente
          quando um cliente publica um orçamento na sua categoria e região.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {rfqs.map((rfq) => (
            <Card key={rfq.id}>
              <CardContent className="flex flex-col gap-2 pt-4">
                <CardTitle>{rfq.categoria}</CardTitle>
                <p className="text-sm text-grafite/80">{rfq.descricao}</p>
                <p className="text-xs text-[#7A828C]">
                  {rfq.regiao ? `${rfq.regiao} · ` : ""}
                  Publicado em {new Date(rfq.createdAt).toLocaleDateString("pt-BR")}
                  {rfq.prazoResposta &&
                    ` · Prazo de resposta: ${new Date(rfq.prazoResposta).toLocaleDateString("pt-BR")}`}
                </p>
                <EnviarPropostaForm rfqId={rfq.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
