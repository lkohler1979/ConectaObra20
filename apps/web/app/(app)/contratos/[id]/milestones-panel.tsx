"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createMilestoneInputSchema,
  type CreateMilestoneInput,
  type MilestonePublic,
  type MilestoneStatus,
} from "@conectaobra/types/milestones";
import type { ContractPartyRole } from "@conectaobra/types/contracts";
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
    defaultValues: { ordem: proximaOrdem, checklist: [] },
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
    reset({ ordem: proximaOrdem + 1, checklist: [] });
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
