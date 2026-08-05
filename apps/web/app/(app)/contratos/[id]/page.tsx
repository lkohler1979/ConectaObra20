import Link from "next/link";
import { notFound } from "next/navigation";
import type { ContractListItem } from "@conectaobra/types/contracts";
import type { MilestonePublic } from "@conectaobra/types/milestones";
import { Alert, AlertDescription, Badge } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { MilestonesPanel } from "./milestones-panel";

const PAPEL_LABEL: Record<string, string> = {
  CONTRATANTE: "Sou o cliente",
  CONTRATADO: "Sou o executor",
};

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ContratoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accessToken = await requireAccessToken(`/contratos/${id}`);
  const authHeader = { authorization: `Bearer ${accessToken}` };

  let contrato: ContractListItem | null;
  let milestones: MilestonePublic[];
  try {
    const [contratosRes, milestonesRes] = await Promise.all([
      apiFetchOrThrow("/contracts", { headers: authHeader, cache: "no-store" }),
      apiFetchOrThrow(`/contracts/${id}/milestones`, { headers: authHeader, cache: "no-store" }),
    ]);

    const contratos: ContractListItem[] = contratosRes.ok ? await contratosRes.json() : [];
    contrato = contratos.find((c) => c.id === id) ?? null;
    milestones = milestonesRes.ok ? await milestonesRes.json() : [];
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar este contrato agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  if (!contrato) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <Link href="/contratos" className="text-sm font-semibold text-grafite hover:text-laranja">
        ← Meus contratos
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-grafite">{contrato.obraTitulo}</h1>
          <Badge>{PAPEL_LABEL[contrato.meuPapel] ?? contrato.meuPapel}</Badge>
        </div>
        <p className="mt-1 text-sm text-[#7A828C]">
          Valor total: {formatMoney(contrato.valorTotalCentavos)} · {contrato.status}
        </p>
      </div>

      <Alert variant="info">
        <AlertDescription>
          Sem depósito em custódia (escrow) nesta versão — aprovar uma etapa aqui só marca ela
          como aprovada, sem liberar pagamento automaticamente. Depósito/liberação real fica pra
          uma próxima versão.
        </AlertDescription>
      </Alert>

      <div>
        <h2 className="mb-2 text-lg font-bold text-grafite">Etapas</h2>
        <MilestonesPanel
          contractId={contrato.id}
          meuPapel={contrato.meuPapel}
          milestonesIniciais={milestones}
        />
      </div>
    </main>
  );
}
