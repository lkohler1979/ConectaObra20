"use client";

import { useState } from "react";
import Link from "next/link";
import type { ContractListItem } from "@conectaobra/types/contracts";
import type { MilestonePublic, MilestoneStatus } from "@conectaobra/types/milestones";
import type { RfqProposalMine, RfqProposalStatus } from "@conectaobra/types/rfq-proposals";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardTitle,
  KanbanBoard,
  KanbanColumn,
  Textarea,
} from "@conectaobra/ui";

const MILESTONE_COLUNAS: { status: MilestoneStatus; titulo: string }[] = [
  { status: "PENDENTE", titulo: "Pendente" },
  { status: "EM_EXECUCAO", titulo: "Em execução" },
  { status: "ENTREGUE", titulo: "Entregue" },
  { status: "APROVADO", titulo: "Aprovado" },
  { status: "EM_DISPUTA", titulo: "Em disputa" },
  { status: "PAGO", titulo: "Pago" },
];

const PROPOSTA_COLUNAS: { status: RfqProposalStatus; titulo: string }[] = [
  { status: "ENVIADA", titulo: "Enviada" },
  { status: "ACEITA", titulo: "Aceita" },
  { status: "RECUSADA", titulo: "Recusada" },
];

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fromLines(value: string): string[] {
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
}

interface MilestoneComContexto extends MilestonePublic {
  obraTitulo: string;
}

function flatten(contratos: ContractListItem[]): MilestoneComContexto[] {
  return contratos.flatMap((contrato) =>
    contrato.milestones.map((milestone) => ({ ...milestone, obraTitulo: contrato.obraTitulo })),
  );
}

function EtapaCard({
  milestone,
  onAtualizar,
}: {
  milestone: MilestoneComContexto;
  onAtualizar: (m: MilestonePublic) => void;
}) {
  const [fotos, setFotos] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function iniciar() {
    setErro(null);
    setLoading(true);
    const res = await fetch(
      `/api/contracts/${milestone.contractId}/milestones/${milestone.id}/iniciar`,
      { method: "PATCH" },
    );
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setErro(typeof data?.message === "string" ? data.message : "Não foi possível iniciar a etapa.");
      return;
    }
    onAtualizar(data as MilestonePublic);
  }

  async function entregar() {
    setErro(null);
    setLoading(true);
    const res = await fetch(
      `/api/contracts/${milestone.contractId}/milestones/${milestone.id}/entregar`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fotos: fromLines(fotos) }),
      },
    );
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível entregar a etapa.",
      );
      return;
    }
    onAtualizar(data as MilestonePublic);
  }

  return (
    <Card>
      <CardContent className="pt-3">
        <CardTitle className="text-sm">{milestone.obraTitulo}</CardTitle>
        <p className="mt-1 text-xs text-grafite/80">{milestone.descricao}</p>
        <p className="mt-1 text-sm font-bold text-laranja">{formatMoney(milestone.valorCentavos)}</p>

        {erro && (
          <Alert variant="danger" className="mt-2">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {milestone.status === "PENDENTE" && (
          <Button size="sm" variant="secondary" className="mt-2" disabled={loading} onClick={iniciar}>
            {loading ? "Iniciando…" : "Iniciar"}
          </Button>
        )}

        {(milestone.status === "PENDENTE" || milestone.status === "EM_EXECUCAO") && (
          <div className="mt-2 flex flex-col gap-2">
            <Textarea
              placeholder="URL de uma foto por linha (evidência)"
              rows={2}
              value={fotos}
              onChange={(e) => setFotos(e.target.value)}
            />
            <Button size="sm" disabled={loading || !fotos.trim()} onClick={entregar}>
              {loading ? "Entregando…" : "Entregar etapa"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PropostaCard({ proposta }: { proposta: RfqProposalMine }) {
  return (
    <Link href={`/rfq/${proposta.rfqId}`}>
      <Card className="transition-colors hover:border-azul-planta">
        <CardContent className="pt-3">
          <CardTitle className="text-sm">{proposta.rfqCategoria}</CardTitle>
          <p className="mt-1 text-xs text-grafite/80">{proposta.obraTitulo}</p>
          <p className="mt-1 text-sm font-bold text-laranja">{formatMoney(proposta.precoCentavos)}</p>
          <p className="text-xs text-[#7A828C]">
            {proposta.prazoDias} {proposta.prazoDias === 1 ? "dia" : "dias"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ServicosKanban({
  contratosIniciais,
  propostasIniciais,
}: {
  contratosIniciais: ContractListItem[];
  propostasIniciais: RfqProposalMine[];
}) {
  const [etapas, setEtapas] = useState<MilestoneComContexto[]>(flatten(contratosIniciais));

  function atualizar(milestone: MilestonePublic) {
    setEtapas((prev) => prev.map((m) => (m.id === milestone.id ? { ...m, ...milestone } : m)));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 text-sm font-bold text-grafite">Etapas em andamento</h2>
        {etapas.length === 0 ? (
          <p className="text-sm text-[#5B6875]">Nenhum contrato com etapas ainda.</p>
        ) : (
          <KanbanBoard>
            {MILESTONE_COLUNAS.map((coluna) => {
              const itens = etapas.filter((m) => m.status === coluna.status);
              return (
                <KanbanColumn key={coluna.status} title={coluna.titulo} count={itens.length}>
                  {itens.map((milestone) => (
                    <EtapaCard key={milestone.id} milestone={milestone} onAtualizar={atualizar} />
                  ))}
                </KanbanColumn>
              );
            })}
          </KanbanBoard>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-grafite">Meus orçamentos</h2>
        {propostasIniciais.length === 0 ? (
          <p className="text-sm text-[#5B6875]">Nenhuma proposta enviada ainda.</p>
        ) : (
          <KanbanBoard>
            {PROPOSTA_COLUNAS.map((coluna) => {
              const itens = propostasIniciais.filter((p) => p.status === coluna.status);
              return (
                <KanbanColumn key={coluna.status} title={coluna.titulo} count={itens.length}>
                  {itens.map((proposta) => (
                    <PropostaCard key={proposta.id} proposta={proposta} />
                  ))}
                </KanbanColumn>
              );
            })}
          </KanbanBoard>
        )}
      </div>
    </div>
  );
}
