import Link from "next/link";
import type { RfqPublic } from "@conectaobra/types/rfq";
import type { RfqProposalPublic } from "@conectaobra/types/rfq-proposals";
import { Alert, AlertDescription, Badge } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { AcceptProposalButton } from "./accept-proposal-button";

const RFQ_STATUS_LABEL: Record<string, string> = {
  ABERTO: "Aberto",
  EM_ANALISE: "Em análise",
  CONTRATADO: "Contratado",
  CANCELADO: "Cancelado",
};

const PROPOSAL_STATUS_LABEL: Record<string, string> = {
  ENVIADA: "Enviada",
  ACEITA: "Aceita",
  RECUSADA: "Recusada",
};

const PROPOSAL_STATUS_BADGE: Record<string, "default" | "verified" | "danger"> = {
  ENVIADA: "default",
  ACEITA: "verified",
  RECUSADA: "danger",
};

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface MeResponse {
  id: string;
}

export default async function RfqComparadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accessToken = await requireAccessToken(`/rfq/${id}`);

  let meRes: Response;
  let rfqRes: Response;
  let proposalsRes: Response;
  try {
    [meRes, rfqRes, proposalsRes] = await Promise.all([
      apiFetchOrThrow("/profile/me", {
        headers: { authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }),
      apiFetchOrThrow(`/rfq/${id}`, {
        headers: { authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }),
      apiFetchOrThrow(`/rfq/${id}/proposals`, {
        headers: { authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }),
    ]);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar este RFQ agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  if (!rfqRes.ok) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 bg-areia px-5 py-10">
        <Alert variant="danger">
          <AlertDescription>
            RFQ não encontrado, ou você não tem acesso a ele. Esta tela é visível pra quem
            publicou o RFQ e pra quem enviou uma proposta pra ele.
          </AlertDescription>
        </Alert>
        <Link href="/rfq" className="text-sm font-semibold text-azul-planta">
          ← Voltar pra minhas RFQs
        </Link>
      </main>
    );
  }

  const rfq: RfqPublic = await rfqRes.json();
  const proposals: RfqProposalPublic[] = proposalsRes.ok ? await proposalsRes.json() : [];
  const me: MeResponse | null = meRes.ok ? await meRes.json() : null;
  const souDono = me?.id === rfq.clienteId;

  const ativas = proposals.filter((p) => p.status === "ENVIADA");
  const menorPreco = ativas.length ? Math.min(...ativas.map((p) => p.precoCentavos)) : null;
  const menorPrazo = ativas.length ? Math.min(...ativas.map((p) => p.prazoDias)) : null;

  const podeAceitar = souDono && rfq.status === "ABERTO";

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-areia px-5 py-10">
      <div>
        <Link href="/rfq" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← Minhas RFQs
        </Link>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-grafite">{rfq.categoria}</h1>
          <Badge
            variant={
              rfq.status === "CONTRATADO"
                ? "verified"
                : rfq.status === "CANCELADO"
                  ? "danger"
                  : "default"
            }
          >
            {RFQ_STATUS_LABEL[rfq.status] ?? rfq.status}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-grafite/80">{rfq.descricao}</p>
      </div>

      {!souDono && (
        <Alert variant="info">
          <AlertDescription>
            Você está vendo sua própria proposta pra este RFQ — só quem publicou o RFQ pode
            comparar todas as propostas e aceitar uma.
          </AlertDescription>
        </Alert>
      )}

      {proposals.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhuma proposta recebida ainda.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded border-[1.5px] border-concreto bg-white">
            <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-concreto text-left text-xs uppercase tracking-wide text-grafite/70">
                  <th className="px-4 py-3">Prestador</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Prazo</th>
                  <th className="px-4 py-3">Observações</th>
                  <th className="px-4 py-3">Status</th>
                  {souDono && <th className="px-4 py-3" />}
                  {podeAceitar && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr key={p.id} className="border-t border-concreto align-top">
                    <td className="px-4 py-3 font-semibold text-grafite">{p.proponenteNome}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatMoney(p.precoCentavos)}
                      {p.status === "ENVIADA" && p.precoCentavos === menorPreco && (
                        <Badge variant="verified" className="ml-2">
                          Menor preço
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.prazoDias} {p.prazoDias === 1 ? "dia" : "dias"}
                      {p.status === "ENVIADA" && p.prazoDias === menorPrazo && (
                        <Badge variant="warning" className="ml-2">
                          Mais rápido
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-grafite/80">{p.observacoes ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={PROPOSAL_STATUS_BADGE[p.status] ?? "default"}>
                        {PROPOSAL_STATUS_LABEL[p.status] ?? p.status}
                      </Badge>
                    </td>
                    {souDono && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/analisar-orcamento?servico=${encodeURIComponent(rfq.categoria)}&cidade=${encodeURIComponent(rfq.regiao ?? "")}&valor=${p.precoCentavos / 100}`}
                          className="text-xs font-semibold text-azul-planta hover:underline"
                        >
                          Analisar orçamento →
                        </Link>
                      </td>
                    )}
                    {podeAceitar && (
                      <td className="px-4 py-3">
                        {p.status === "ENVIADA" && <AcceptProposalButton proposalId={p.id} />}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#7A828C]">
            "Menor preço" e "Mais rápido" são destaques automáticos por comparação simples — não
            envolvem IA (o Engenheiro Virtual ainda não existe, ver épico E5 em PENDENCIAS.md).
          </p>
        </>
      )}
    </main>
  );
}
