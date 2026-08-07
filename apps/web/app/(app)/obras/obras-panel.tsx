"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createWorkInputSchema,
  type CreateWorkInput,
  type WorkPublic,
  type WorkType,
} from "@conectaobra/types/works";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardTitle,
  Input,
} from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

const TIPO_OPTIONS: { value: WorkType; label: string }[] = [
  { value: "REFORMA", label: "Reforma" },
  { value: "CONSTRUCAO", label: "Construção" },
  { value: "AMPLIACAO", label: "Ampliação" },
];

const STATUS_LABEL: Record<string, string> = {
  planejamento: "Planejamento",
};

function centavosToReaisInput(centavos: number | null | undefined): string {
  return centavos != null ? (centavos / 100).toFixed(2) : "";
}

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface ObraFormInitial {
  titulo: string;
  tipo: WorkType;
  endereco: string;
  areaM2?: number;
  orcamentoPrevistoCentavos?: number;
}

/** Remonta a cada troca de `initial` (via `key` no componente pai) — mesmo padrão de outros CRUDs desta sessão. */
function ObraForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: ObraFormInitial;
  onSubmit: (values: CreateWorkInput) => Promise<string | null>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkInput>({
    resolver: zodResolver(createWorkInputSchema),
    defaultValues: {
      titulo: initial?.titulo ?? "",
      tipo: initial?.tipo ?? "REFORMA",
      endereco: initial?.endereco ?? "",
      areaM2: initial?.areaM2,
      orcamentoPrevistoCentavos: initial?.orcamentoPrevistoCentavos,
    },
  });

  async function handle(values: CreateWorkInput) {
    setErro(null);
    const erroSalvar = await onSubmit(values);
    if (erroSalvar) setErro(erroSalvar);
  }

  return (
    <form onSubmit={handleSubmit(handle)} noValidate className="flex flex-col gap-3">
      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <FormField label="Título" htmlFor="titulo" error={errors.titulo?.message}>
        <Input id="titulo" placeholder="Reforma do apartamento" {...register("titulo")} />
      </FormField>

      <FormField label="Tipo" htmlFor="tipo" error={errors.tipo?.message}>
        <select
          id="tipo"
          {...register("tipo")}
          className="w-full rounded-md border-[1.5px] border-concreto bg-white px-3 py-[11px] text-sm text-grafite focus:border-azul-planta focus:outline-none focus:ring-2 focus:ring-azul-planta-claro"
        >
          {TIPO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Endereço" htmlFor="endereco" error={errors.endereco?.message}>
        <Input id="endereco" placeholder="Rua, número, bairro, cidade/UF" {...register("endereco")} />
      </FormField>

      <FormField label="Área (m², opcional)" htmlFor="areaM2" error={errors.areaM2?.message}>
        <Input
          id="areaM2"
          type="number"
          step="0.01"
          min={0}
          {...register("areaM2", {
            setValueAs: (v: string) => (v === "" ? undefined : Number(v)),
          })}
        />
      </FormField>

      <FormField
        label="Orçamento previsto (R$, opcional)"
        htmlFor="orcamentoPrevistoCentavos"
        error={errors.orcamentoPrevistoCentavos?.message}
      >
        <Input
          id="orcamentoPrevistoCentavos"
          type="number"
          step="0.01"
          min={0}
          defaultValue={centavosToReaisInput(initial?.orcamentoPrevistoCentavos)}
          {...register("orcamentoPrevistoCentavos", {
            setValueAs: (v: string) => (v === "" ? undefined : Math.round(Number(v) * 100)),
          })}
        />
      </FormField>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : submitLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function ObrasPanel({ obrasIniciais }: { obrasIniciais: WorkPublic[] }) {
  const [obras, setObras] = useState(obrasIniciais);
  const [criando, setCriando] = useState(obrasIniciais.length === 0);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function criar(values: CreateWorkInput): Promise<string | null> {
    const res = await fetch("/api/works", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string" ? data.message : "Não foi possível criar a obra.";
    }
    setObras((prev) => [data as WorkPublic, ...prev]);
    setCriando(false);
    return null;
  }

  async function editar(id: string, values: CreateWorkInput): Promise<string | null> {
    const res = await fetch(`/api/works/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string" ? data.message : "Não foi possível salvar a obra.";
    }
    setObras((prev) => prev.map((o) => (o.id === id ? (data as WorkPublic) : o)));
    setEditandoId(null);
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {erroGeral && (
        <Alert variant="danger">
          <AlertDescription>{erroGeral}</AlertDescription>
        </Alert>
      )}

      {obras.length === 0 && !criando && (
        <p className="text-sm text-[#5B6875]">Nenhuma obra cadastrada ainda.</p>
      )}

      <div className="flex flex-col gap-3">
        {obras.map((obra) =>
          editandoId === obra.id ? (
            <Card key={obra.id}>
              <CardContent className="pt-4">
                <ObraForm
                  initial={{
                    titulo: obra.titulo,
                    tipo: obra.tipo,
                    endereco: obra.endereco,
                    areaM2: obra.areaM2 ?? undefined,
                    orcamentoPrevistoCentavos: obra.orcamentoPrevistoCentavos ?? undefined,
                  }}
                  submitLabel="Salvar"
                  onCancel={() => setEditandoId(null)}
                  onSubmit={(values) => editar(obra.id, values)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card key={obra.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{obra.titulo}</CardTitle>
                    <Badge>{TIPO_OPTIONS.find((t) => t.value === obra.tipo)?.label ?? obra.tipo}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[#7A828C]">{obra.endereco}</p>
                  <p className="mt-1 text-xs text-[#7A828C]">
                    {STATUS_LABEL[obra.status] ?? obra.status}
                    {obra.orcamentoPrevistoCentavos != null &&
                      ` · ${formatMoney(obra.orcamentoPrevistoCentavos)}`}
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setEditandoId(obra.id)}>
                  Editar
                </Button>
              </CardContent>
            </Card>
          ),
        )}
      </div>

      {criando ? (
        <Card>
          <CardContent className="pt-4">
            <ObraForm
              submitLabel="Cadastrar obra"
              onCancel={() => setCriando(false)}
              onSubmit={criar}
            />
          </CardContent>
        </Card>
      ) : (
        <Button size="sm" variant="secondary" className="self-start" onClick={() => setCriando(true)}>
          + Nova obra
        </Button>
      )}
    </div>
  );
}
