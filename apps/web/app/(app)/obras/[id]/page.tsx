import Link from "next/link";
import { notFound } from "next/navigation";
import type { WorkPublic } from "@conectaobra/types/works";
import type { DiarioEvento } from "@conectaobra/types/diario";
import type { PainelFinanceiroObra } from "@conectaobra/types/painel-financeiro";
import type { TeamMemberPublic } from "@conectaobra/types/equipe";
import type { ContractListItem } from "@conectaobra/types/contracts";
import { Alert, AlertDescription, Badge } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { ObraDetailTabs } from "./obra-detail-tabs";

interface MeResponse {
  id: string;
}

const TIPO_LABEL: Record<string, string> = {
  REFORMA: "Reforma",
  CONSTRUCAO: "Construção",
  AMPLIACAO: "Ampliação",
};

export default async function ObraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accessToken = await requireAccessToken(`/obras/${id}`);
  const authHeader = { authorization: `Bearer ${accessToken}` };

  let obraRes: Response;
  let meRes: Response;
  let diarioRes: Response;
  let financeiroRes: Response;
  let equipeRes: Response;
  let contratosRes: Response;
  try {
    [obraRes, meRes, diarioRes, financeiroRes, equipeRes, contratosRes] = await Promise.all([
      apiFetchOrThrow(`/works/${id}`, { headers: authHeader, cache: "no-store" }),
      apiFetchOrThrow("/profile/me", { headers: authHeader, cache: "no-store" }),
      apiFetchOrThrow(`/works/${id}/diario`, { headers: authHeader, cache: "no-store" }),
      apiFetchOrThrow(`/works/${id}/financeiro`, { headers: authHeader, cache: "no-store" }),
      apiFetchOrThrow(`/works/${id}/equipe`, { headers: authHeader, cache: "no-store" }),
      apiFetchOrThrow("/contracts", { headers: authHeader, cache: "no-store" }),
    ]);
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
  const me: MeResponse | null = meRes.ok ? await meRes.json() : null;
  const diario: DiarioEvento[] = diarioRes.ok ? await diarioRes.json() : [];
  const financeiro: PainelFinanceiroObra | null = financeiroRes.ok
    ? await financeiroRes.json()
    : null;
  const equipe: TeamMemberPublic[] = equipeRes.ok ? await equipeRes.json() : [];
  const todosContratos: ContractListItem[] = contratosRes.ok ? await contratosRes.json() : [];
  const contratos = todosContratos.filter((c) => c.obraId === obra.id);
  const souDono = me?.id === obra.clienteId;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <div className="flex items-center justify-between">
        <Link href="/obras" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← Minhas obras
        </Link>
        <Link href="/materiais" className="text-sm font-semibold text-azul-planta">
          Listas de materiais →
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-grafite">{obra.titulo}</h1>
          <Badge>{TIPO_LABEL[obra.tipo] ?? obra.tipo}</Badge>
        </div>
        <p className="mt-1 text-sm text-[#7A828C]">{obra.endereco}</p>
        {souDono && (
          <Link
            href={`/obras/${obra.id}/sobras/nova`}
            className="mt-2 inline-block text-sm font-semibold text-azul-planta hover:underline"
          >
            + Anunciar sobra de material →
          </Link>
        )}
      </div>

      {financeiro ? (
        <ObraDetailTabs
          obraId={obra.id}
          contratos={contratos}
          diario={diario}
          financeiro={financeiro}
          equipe={equipe}
          souDono={souDono}
        />
      ) : (
        <Alert variant="danger">
          <AlertDescription>Não foi possível carregar o painel financeiro desta obra.</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
