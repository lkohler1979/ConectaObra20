"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  upsertAvgCostInputSchema,
  type AvgCostPublic,
  type UpsertAvgCostInput,
} from "@conectaobra/types/ai-budget";
import { Alert, AlertDescription, Button, Card, CardContent, Input } from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function centavosToReaisInput(centavos: number | undefined): string {
  return centavos != null ? (centavos / 100).toFixed(2) : "";
}

function dateToInputValue(date: Date | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

/** Remonta a cada troca de `initial` (via `key` no componente pai) — mesmo padrão de IndicatorForm. */
function AvgCostForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: Partial<UpsertAvgCostInput> | null;
  onSubmit: (values: UpsertAvgCostInput) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpsertAvgCostInput>({
    resolver: zodResolver(upsertAvgCostInputSchema),
    defaultValues: {
      servico: initial?.servico ?? "",
      cidade: initial?.cidade ?? "",
      unidade: initial?.unidade ?? "",
      valorMinCentavos: initial?.valorMinCentavos ?? undefined,
      valorMedCentavos: initial?.valorMedCentavos ?? undefined,
      valorMaxCentavos: initial?.valorMaxCentavos ?? undefined,
      mes: initial?.mes ?? undefined,
    },
  });

  async function handle(values: UpsertAvgCostInput) {
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

      <FormField label="Serviço" htmlFor="servico" error={errors.servico?.message}>
        <Input id="servico" placeholder="Alvenaria de vedação" {...register("servico")} />
      </FormField>

      <FormField label="Cidade" htmlFor="cidade" error={errors.cidade?.message}>
        <Input id="cidade" placeholder="Vitória/ES" {...register("cidade")} />
      </FormField>

      <FormField label="Unidade" htmlFor="unidade" error={errors.unidade?.message}>
        <Input id="unidade" placeholder="m²" {...register("unidade")} />
      </FormField>

      <FormField
        label="Valor mínimo (R$)"
        htmlFor="valorMinCentavos"
        error={errors.valorMinCentavos?.message}
      >
        <Input
          id="valorMinCentavos"
          type="number"
          step="0.01"
          min={0}
          defaultValue={centavosToReaisInput(initial?.valorMinCentavos)}
          {...register("valorMinCentavos", {
            setValueAs: (v: string) => (v === "" ? undefined : Math.round(Number(v) * 100)),
          })}
        />
      </FormField>

      <FormField
        label="Valor médio (R$)"
        htmlFor="valorMedCentavos"
        error={errors.valorMedCentavos?.message}
      >
        <Input
          id="valorMedCentavos"
          type="number"
          step="0.01"
          min={0}
          defaultValue={centavosToReaisInput(initial?.valorMedCentavos)}
          {...register("valorMedCentavos", {
            setValueAs: (v: string) => (v === "" ? undefined : Math.round(Number(v) * 100)),
          })}
        />
      </FormField>

      <FormField
        label="Valor máximo (R$)"
        htmlFor="valorMaxCentavos"
        error={errors.valorMaxCentavos?.message}
      >
        <Input
          id="valorMaxCentavos"
          type="number"
          step="0.01"
          min={0}
          defaultValue={centavosToReaisInput(initial?.valorMaxCentavos)}
          {...register("valorMaxCentavos", {
            setValueAs: (v: string) => (v === "" ? undefined : Math.round(Number(v) * 100)),
          })}
        />
      </FormField>

      <FormField label="Mês" htmlFor="mes" error={errors.mes?.message as string | undefined}>
        <Input id="mes" type="date" defaultValue={dateToInputValue(initial?.mes)} {...register("mes")} />
      </FormField>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar custo médio"}
        </Button>
        {initial && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Limpar
          </Button>
        )}
      </div>
    </form>
  );
}

export function AvgCostsPanel({ custosIniciais }: { custosIniciais: AvgCostPublic[] }) {
  const router = useRouter();
  const [sucesso, setSucesso] = useState(false);
  const [initial, setInitial] = useState<Partial<UpsertAvgCostInput> | null>(null);
  const [formKey, setFormKey] = useState(0);

  function selecionar(values: Partial<UpsertAvgCostInput> | null) {
    setInitial(values);
    setFormKey((k) => k + 1);
    setSucesso(false);
  }

  async function salvar(values: UpsertAvgCostInput): Promise<string | null> {
    setSucesso(false);
    const res = await fetch("/api/ai/avg-costs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return typeof data?.message === "string"
        ? data.message
        : "Não foi possível salvar o custo médio.";
    }
    setSucesso(true);
    selecionar(null);
    router.refresh();
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="pt-4">
          {sucesso && (
            <Alert variant="success">
              <AlertDescription>Custo médio salvo com sucesso.</AlertDescription>
            </Alert>
          )}
          <AvgCostForm key={formKey} initial={initial} onSubmit={salvar} onCancel={() => selecionar(null)} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-bold text-grafite">Custos médios cadastrados</h2>
        {custosIniciais.length === 0 ? (
          <p className="text-sm text-[#5B6875]">Nenhum custo médio cadastrado ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {custosIniciais.map((custo) => (
              <Card key={custo.id}>
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <div>
                    <span className="text-sm font-bold text-grafite">{custo.servico}</span>
                    <p className="mt-1 text-xs text-[#7A828C]">
                      {custo.cidade} ·{" "}
                      {new Date(custo.mes).toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 text-xs text-[#7A828C]">
                      {formatMoney(custo.valorMinCentavos)} – {formatMoney(custo.valorMedCentavos)} –{" "}
                      {formatMoney(custo.valorMaxCentavos)} / {custo.unidade}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      selecionar({
                        servico: custo.servico,
                        cidade: custo.cidade,
                        unidade: custo.unidade,
                        valorMinCentavos: custo.valorMinCentavos,
                        valorMedCentavos: custo.valorMedCentavos,
                        valorMaxCentavos: custo.valorMaxCentavos,
                        mes: new Date(custo.mes),
                      })
                    }
                  >
                    Editar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
