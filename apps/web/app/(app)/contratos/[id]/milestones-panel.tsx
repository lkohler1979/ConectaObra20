"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createMilestoneInputSchema,
  type CreateMilestoneInput,
  type MilestonePublic,
  type MilestoneStatus,
} from "@conectaobra/types/milestones";
import type { ContractPartyRole } from "@conectaobra/types/contracts";
import type { DisputePublic } from "@conectaobra/types/disputes";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardTitle,
  Input,
  Textarea,
} from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

const STATUS_LABEL: Record<MilestoneStatus, string> = {
  PENDENTE: "Pendente",
  EM_EXECUCAO: "Em execução",
  ENTREGUE: "Entregue — aguardando aprovação",
  APROVADO: "Aprovado",
  EM_DISPUTA: "Em disputa",
  PAGO: "Pago",
};

const STATUS_BADGE: Record<MilestoneStatus, "default" | "warning" | "verified" | "danger"> = {
  PENDENTE: "default",
  EM_EXECUCAO: "default",
  ENTREGUE: "warning",
  APROVADO: "verified",
  EM_DISPUTA: "danger",
  PAGO: "verified",
};

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fromLines(value: string): string[] {
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
}

function NovaEtapaForm({
  contractId,
  proximaOrdem,
  onCriada,
}: {
  contractId: string;
  proximaOrdem: number;
  onCriada: (milestone: MilestonePublic) => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateMilestoneInput>({
    resolver: zodResolver(createMilestoneInputSchema),
    defaultValues: { ordem: proximaOrdem },
  });

  async function onSubmit(values: CreateMilestoneInput) {
    setErro(null);
    const res = await fetch(`/api/contracts/${contractId}/milestones`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível criar a etapa.",
      );
      return;
    }
    onCriada(data as MilestonePublic);
    reset({ ordem: proximaOrdem + 1 });
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <CardTitle>Nova etapa</CardTitle>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-3 flex flex-col gap-3">
          {erro && (
            <Alert variant="danger">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <FormField label="Ordem" htmlFor="ordem" error={errors.ordem?.message}>
            <Input
              id="ordem"
              type="number"
              min={1}
              {...register("ordem", { valueAsNumber: true })}
            />
          </FormField>

          <FormField label="Descrição" htmlFor="descricao" error={errors.descricao?.message}>
            <Textarea id="descricao" {...register("descricao")} />
          </FormField>

          <FormField label="Valor (R$)" htmlFor="valorCentavos" error={errors.valorCentavos?.message}>
            <Input
              id="valorCentavos"
              type="number"
              step="0.01"
              min={0}
              {...register("valorCentavos", {
                setValueAs: (v: string) => (v === "" ? undefined : Math.round(Number(v) * 100)),
              })}
            />
          </FormField>

          <FormField
            label="Checklist (um item por linha, opcional)"
            htmlFor="checklist"
            error={errors.checklist?.message}
          >
            <Textarea
              id="checklist"
              rows={3}
              {...register("checklist", { setValueAs: (v: string) => fromLines(v) })}
            />
          </FormField>

          <Button type="submit" size="sm" disabled={isSubmitting} className="self-start">
            {isSubmitting ? "Criando…" : "Criar etapa"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function EntregarForm({
  contractId,
  milestoneId,
  onEntregue,
}: {
  contractId: string;
  milestoneId: string;
  onEntregue: (milestone: MilestonePublic) => void;
}) {
  const [fotos, setFotos] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEntregar() {
    setErro(null);
    setLoading(true);
    const res = await fetch(`/api/contracts/${contractId}/milestones/${milestoneId}/entregar`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fotos: fromLines(fotos) }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível entregar a etapa.",
      );
      setLoading(false);
      return;
    }
    onEntregue(data as MilestonePublic);
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
      <Textarea
        placeholder="URL de uma foto por linha (evidência da entrega)"
        rows={2}
        value={fotos}
        onChange={(e) => setFotos(e.target.value)}
      />
      <Button size="sm" onClick={handleEntregar} disabled={loading || !fotos.trim()}>
        {loading ? "Entregando…" : "Entregar etapa"}
      </Button>
    </div>
  );
}

const DISPUTA_STATUS_LABEL: Record<DisputePublic["status"], string> = {
  ABERTA: "Aberta",
  RESOLVIDA: "Resolvida",
};

const DISPUTA_STATUS_BADGE: Record<DisputePublic["status"], "warning" | "verified"> = {
  ABERTA: "warning",
  RESOLVIDA: "verified",
};

function AbrirDisputaForm({
  contractId,
  milestoneId,
  onAberta,
}: {
  contractId: string;
  milestoneId: string;
  onAberta: (dispute: DisputePublic) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [evidencias, setEvidencias] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAbrir() {
    if (
      !window.confirm(
        "Abrir disputa nesta etapa? Sem depósito em custódia nesta versão, isso não bloqueia nem libera pagamento automaticamente — serve para registrar o problema e pedir mediação da equipe ConectaObra.",
      )
    ) {
      return;
    }
    setErro(null);
    setLoading(true);
    const res = await fetch(`/api/contracts/${contractId}/milestones/${milestoneId}/disputas`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ motivo, evidencias: fromLines(evidencias) }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível abrir a disputa.",
      );
      return;
    }
    onAberta(data as DisputePublic);
    setMotivo("");
    setEvidencias("");
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border-[1.5px] border-vermelho/30 bg-vermelho/5 p-3">
      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
      <Textarea
        placeholder="Motivo da disputa (pelo menos 10 caracteres)"
        rows={2}
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
      />
      <Textarea
        placeholder="URL de uma evidência por linha (foto, documento, print…)"
        rows={2}
        value={evidencias}
        onChange={(e) => setEvidencias(e.target.value)}
      />
      <Button
        size="sm"
        variant="destructive"
        onClick={handleAbrir}
        disabled={loading || motivo.trim().length < 10 || fromLines(evidencias).length === 0}
      >
        {loading ? "Abrindo…" : "Abrir disputa"}
      </Button>
    </div>
  );
}

function DisputasDaEtapa({ disputas }: { disputas: DisputePublic[] }) {
  if (disputas.length === 0) {
    return <p className="mt-2 text-sm text-[#5B6875]">Nenhuma disputa registrada nesta etapa.</p>;
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      {disputas.map((disputa) => (
        <div
          key={disputa.id}
          className="rounded-md border-[1.5px] border-concreto bg-white p-3 text-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <Badge variant={DISPUTA_STATUS_BADGE[disputa.status]}>
              {DISPUTA_STATUS_LABEL[disputa.status]}
            </Badge>
          </div>
          <p className="mt-1 text-grafite">{disputa.motivo}</p>
          {disputa.evidencias.length > 0 && (
            <div className="mt-1 flex flex-col gap-1">
              {disputa.evidencias.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-azul-planta hover:underline"
                >
                  Evidência {i + 1} →
                </a>
              ))}
            </div>
          )}
          {disputa.status === "RESOLVIDA" && disputa.resolucao && (
            <p className="mt-2 rounded bg-verde-ok/10 px-2 py-1 text-xs text-grafite">
              <strong>Resolução:</strong> {disputa.resolucao}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function MilestonesPanel({
  contractId,
  meuPapel,
  milestonesIniciais,
}: {
  contractId: string;
  meuPapel: ContractPartyRole;
  milestonesIniciais: MilestonePublic[];
}) {
  const [milestones, setMilestones] = useState(milestonesIniciais);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);
  const [disputasPorMilestone, setDisputasPorMilestone] = useState<Record<string, DisputePublic[]>>({});
  const [disputasVisiveis, setDisputasVisiveis] = useState<Record<string, boolean>>({});
  const [formDisputaVisivel, setFormDisputaVisivel] = useState<Record<string, boolean>>({});

  async function carregarDisputas(milestoneId: string) {
    const res = await fetch(`/api/contracts/${contractId}/milestones/${milestoneId}/disputas`);
    const data = await res.json().catch(() => null);
    if (res.ok && Array.isArray(data)) {
      setDisputasPorMilestone((prev) => ({ ...prev, [milestoneId]: data as DisputePublic[] }));
    }
  }

  useEffect(() => {
    milestonesIniciais
      .filter((m) => m.status === "EM_DISPUTA")
      .forEach((m) => {
        setDisputasVisiveis((prev) => ({ ...prev, [m.id]: true }));
        void carregarDisputas(m.id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleDisputas(milestoneId: string) {
    const aberto = disputasVisiveis[milestoneId];
    setDisputasVisiveis((prev) => ({ ...prev, [milestoneId]: !aberto }));
    if (!aberto && !disputasPorMilestone[milestoneId]) {
      void carregarDisputas(milestoneId);
    }
  }

  function onDisputaAberta(milestoneId: string, dispute: DisputePublic) {
    setDisputasPorMilestone((prev) => ({
      ...prev,
      [milestoneId]: [dispute, ...(prev[milestoneId] ?? [])],
    }));
    setDisputasVisiveis((prev) => ({ ...prev, [milestoneId]: true }));
    setFormDisputaVisivel((prev) => ({ ...prev, [milestoneId]: false }));
    setMilestones((prev) =>
      prev.map((m) => (m.id === milestoneId ? { ...m, status: "EM_DISPUTA" as MilestoneStatus } : m)),
    );
  }

  function atualizar(milestone: MilestonePublic) {
    setMilestones((prev) => {
      const existe = prev.some((m) => m.id === milestone.id);
      return existe
        ? prev.map((m) => (m.id === milestone.id ? milestone : m))
        : [...prev, milestone].sort((a, b) => a.ordem - b.ordem);
    });
  }

  async function iniciar(milestoneId: string) {
    setErroAcao(null);
    setCarregandoId(milestoneId);
    const res = await fetch(`/api/contracts/${contractId}/milestones/${milestoneId}/iniciar`, {
      method: "PATCH",
    });
    const data = await res.json().catch(() => null);
    setCarregandoId(null);
    if (!res.ok) {
      setErroAcao(
        typeof data?.message === "string" ? data.message : "Não foi possível iniciar a etapa.",
      );
      return;
    }
    atualizar(data as MilestonePublic);
  }

  async function aprovar(milestoneId: string) {
    if (!window.confirm("Aprovar esta etapa? Sem depósito em custódia, ela só fica marcada como aprovada (sem liberação automática de pagamento).")) {
      return;
    }
    setErroAcao(null);
    setCarregandoId(milestoneId);
    const res = await fetch(`/api/contracts/${contractId}/milestones/${milestoneId}/aprovar`, {
      method: "PATCH",
    });
    const data = await res.json().catch(() => null);
    setCarregandoId(null);
    if (!res.ok) {
      setErroAcao(
        typeof data?.message === "string" ? data.message : "Não foi possível aprovar a etapa.",
      );
      return;
    }
    atualizar(data as MilestonePublic);
  }

  const souCliente = meuPapel === "CONTRATANTE";
  const proximaOrdem = milestones.length > 0 ? Math.max(...milestones.map((m) => m.ordem)) + 1 : 1;

  return (
    <div className="flex flex-col gap-4">
      {erroAcao && (
        <Alert variant="danger">
          <AlertDescription>{erroAcao}</AlertDescription>
        </Alert>
      )}

      {milestones.length === 0 && (
        <p className="text-sm text-[#5B6875]">
          {souCliente
            ? "Nenhuma etapa criada ainda — crie a primeira abaixo."
            : "O cliente ainda não criou nenhuma etapa para este contrato."}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {milestones.map((milestone) => (
          <Card key={milestone.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>
                  #{milestone.ordem} — {milestone.descricao}
                </CardTitle>
                <Badge variant={STATUS_BADGE[milestone.status]}>
                  {STATUS_LABEL[milestone.status]}
                </Badge>
              </div>
              <p className="mt-1 text-sm font-bold text-laranja">
                {formatMoney(milestone.valorCentavos)}
              </p>
              {milestone.checklist.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-sm text-grafite/80">
                  {milestone.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {milestone.fotos.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {milestone.fotos.map((foto, i) => (
                    <a
                      key={foto}
                      href={foto}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-azul-planta hover:underline"
                    >
                      Evidência {i + 1} →
                    </a>
                  ))}
                </div>
              )}

              {/* CONTRATADO: iniciar/entregar */}
              {!souCliente && milestone.status === "PENDENTE" && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  disabled={carregandoId === milestone.id}
                  onClick={() => iniciar(milestone.id)}
                >
                  {carregandoId === milestone.id ? "Iniciando…" : "Iniciar etapa"}
                </Button>
              )}
              {!souCliente && (milestone.status === "PENDENTE" || milestone.status === "EM_EXECUCAO") && (
                <EntregarForm contractId={contractId} milestoneId={milestone.id} onEntregue={atualizar} />
              )}

              {/* CONTRATANTE: aprovar */}
              {souCliente && milestone.status === "ENTREGUE" && (
                <Button
                  size="sm"
                  variant="success"
                  className="mt-3"
                  disabled={carregandoId === milestone.id}
                  onClick={() => aprovar(milestone.id)}
                >
                  {carregandoId === milestone.id ? "Aprovando…" : "Aprovar etapa"}
                </Button>
              )}

              {/* Disputa: qualquer parte do contrato pode abrir, exceto etapa já em disputa ou já paga */}
              {(milestone.status === "PENDENTE" ||
                milestone.status === "EM_EXECUCAO" ||
                milestone.status === "ENTREGUE" ||
                milestone.status === "APROVADO") && (
                <div className="mt-3">
                  {formDisputaVisivel[milestone.id] ? (
                    <AbrirDisputaForm
                      contractId={contractId}
                      milestoneId={milestone.id}
                      onAberta={(dispute) => onDisputaAberta(milestone.id, dispute)}
                    />
                  ) : (
                    <button
                      type="button"
                      className="text-xs font-semibold text-vermelho hover:underline"
                      onClick={() =>
                        setFormDisputaVisivel((prev) => ({ ...prev, [milestone.id]: true }))
                      }
                    >
                      Abrir disputa
                    </button>
                  )}
                </div>
              )}

              <div className="mt-2">
                <button
                  type="button"
                  className="text-xs font-semibold text-azul-planta hover:underline"
                  onClick={() => toggleDisputas(milestone.id)}
                >
                  {disputasVisiveis[milestone.id] ? "Ocultar disputas" : "Ver disputas desta etapa"}
                </button>
                {disputasVisiveis[milestone.id] && (
                  <DisputasDaEtapa disputas={disputasPorMilestone[milestone.id] ?? []} />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {souCliente && (
        <NovaEtapaForm contractId={contractId} proximaOrdem={proximaOrdem} onCriada={atualizar} />
      )}
    </div>
  );
}
