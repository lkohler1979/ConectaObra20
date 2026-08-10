"use client";

import Link from "next/link";
import type { DiarioEvento } from "@conectaobra/types/diario";
import type { PainelFinanceiroObra } from "@conectaobra/types/painel-financeiro";
import type { TeamMemberPublic } from "@conectaobra/types/equipe";
import type { ContractListItem } from "@conectaobra/types/contracts";
import {
  Badge,
  Card,
  CardContent,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@conectaobra/ui";
import { EquipePanel } from "./equipe-panel";

const MILESTONE_STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_EXECUCAO: "Em execução",
  ENTREGUE: "Entregue",
  APROVADO: "Aprovado",
  EM_DISPUTA: "Em disputa",
  PAGO: "Pago",
};

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const ACAO_LABEL: Record<string, string> = {
  "rfq.created": "RFQ publicado",
  "rfq_proposal.created": "Proposta recebida",
  "rfq_proposal.accepted": "Proposta aceita — contrato criado",
  "milestone.created": "Etapa criada",
  "milestone.aprovado": "Etapa aprovada",
  "milestone.aprovado_automaticamente": "Etapa aprovada automaticamente",
  "escrow.deposito": "Depósito em custódia",
  "dispute.aberta": "Disputa aberta",
  "dispute.resolvida": "Disputa resolvida",
  "review.created": "Avaliação registrada",
  "surplus_listing.created": "Sobra de material anunciada",
  "surplus_order.created": "Sobra de material vendida",
};

export function ObraDetailTabs({
  obraId,
  contratos,
  diario,
  financeiro,
  equipe,
  souDono,
}: {
  obraId: string;
  contratos: ContractListItem[];
  diario: DiarioEvento[];
  financeiro: PainelFinanceiroObra;
  equipe: TeamMemberPublic[];
  souDono: boolean;
}) {
  return (
    <Tabs defaultValue="cronograma">
      <TabsList>
        <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
        <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        <TabsTrigger value="diario">Diário</TabsTrigger>
        <TabsTrigger value="equipe">Equipe</TabsTrigger>
      </TabsList>

      <TabsContent value="cronograma">
        {contratos.length === 0 ? (
          <p className="text-sm text-[#5B6875]">
            Nenhum contrato pra esta obra ainda — publique uma RFQ e aceite uma proposta pra
            começar o cronograma de etapas.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {contratos.map((contrato) => (
              <Link key={contrato.id} href={`/contratos/${contrato.id}`}>
                <Card className="transition-colors hover:border-azul-planta">
                  <CardContent className="flex items-center justify-between gap-3 pt-4">
                    <div>
                      <CardTitle>{formatMoney(contrato.valorTotalCentavos)}</CardTitle>
                      <p className="mt-1 text-xs text-[#7A828C]">
                        {contrato.meuPapel === "CONTRATANTE" ? "Como cliente" : "Como executor"} ·{" "}
                        {new Date(contrato.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge>{contrato.status}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="financeiro">
        <div className="flex flex-col gap-3">
          <Card>
            <CardContent className="flex flex-wrap gap-4 pt-4 text-sm">
              <div>
                <p className="text-[#7A828C]">Orçamento previsto</p>
                <p className="font-bold text-grafite">
                  {financeiro.orcamentoPrevistoCentavos != null
                    ? formatMoney(financeiro.orcamentoPrevistoCentavos)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[#7A828C]">Total em etapas</p>
                <p className="font-bold text-grafite">{formatMoney(financeiro.totalEtapasCentavos)}</p>
              </div>
              <div>
                <p className="text-[#7A828C]">Total aprovado</p>
                <p className="font-bold text-verde-ok">
                  {formatMoney(financeiro.totalAprovadoCentavos)}
                </p>
              </div>
            </CardContent>
          </Card>

          {financeiro.etapas.length === 0 ? (
            <p className="text-sm text-[#5B6875]">Nenhuma etapa cadastrada ainda.</p>
          ) : (
            financeiro.etapas.map((etapa) => (
              <Card key={etapa.milestoneId}>
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <div>
                    <p className="text-sm font-bold text-grafite">{etapa.descricao}</p>
                    <p className="text-xs text-[#7A828C]">
                      Previsto: {formatMoney(etapa.valorPrevistoCentavos)}
                      {etapa.valorAprovadoCentavos > 0 &&
                        ` · Aprovado: ${formatMoney(etapa.valorAprovadoCentavos)}`}
                    </p>
                  </div>
                  <Badge>{MILESTONE_STATUS_LABEL[etapa.status] ?? etapa.status}</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="diario">
        {diario.length === 0 ? (
          <p className="text-sm text-[#5B6875]">Nenhum evento registrado ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {diario.map((evento) => (
              <div key={evento.id} className="border-l-2 border-concreto pl-3">
                <p className="text-sm font-semibold text-grafite">
                  {ACAO_LABEL[evento.acao] ?? evento.acao}
                </p>
                <p className="text-xs text-[#7A828C]">
                  {new Date(evento.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="equipe">
        <EquipePanel obraId={obraId} membros={equipe} souDono={souDono} />
      </TabsContent>
    </Tabs>
  );
}
