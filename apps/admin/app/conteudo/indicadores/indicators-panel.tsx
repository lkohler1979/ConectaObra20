"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  upsertIndicatorInputSchema,
  type IndicatorPublic,
  type IndicatorTipo,
  type UpsertIndicatorInput,
} from "@conectaobra/types/indicators";
import { Alert, AlertDescription, Badge, Button, Card, CardContent, Input } from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

const TIPO_OPTIONS: { value: IndicatorTipo; label: string }[] = [
  { value: "CUB", label: "CUB" },
  { value: "INCC", label: "INCC" },
  { value: "SINAPI", label: "SINAPI" },
  { value: "ACO", label: "Aço" },
  { value: "CIMENTO", label: "Cimento" },
  { value: "MADEIRA", label: "Madeira" },
];

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function centavosToReaisInput(centavos: number | undefined): string {
  return centavos != null ? (centavos / 100).toFixed(2) : "";
}

function dateToInputValue(date: Date | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

/**
 * Remonta a cada troca de `initial` (via `key` no componente pai) — mesmo
 * padrão de AdForm/ProjectForm: evita ter que sincronizar manualmente a
 * conversão centavos↔reais quando o valor exibido muda por fora do form.
 */
function IndicatorForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: Partial<UpsertIndicatorInput> | null;
  onSubmit: (values: UpsertIndicatorInput) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpsertIndicatorInput>({
    resolver: zodResolver(upsertIndicatorInputSchema),
    defaultValues: {
      tipo: initial?.tipo ?? "CUB",
      regiao: initial?.regiao ?? "",
      valorCentavos: initial?.valorCentavos ?? undefined,
      referenciaMes: initial?.referenciaMes ?? undefined,
      fonte: initial?.fonte ?? "",
    },
  });

  async function handle(values: UpsertIndicatorInput) {
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

      <FormField label="Região" htmlFor="regiao" error={errors.regiao?.message}>
        <Input id="regiao" placeholder="Vitória/ES" {...register("regiao")} />
      </FormField>

      <FormField label="Valor (R$)" htmlFor="valorCentavos" error={errors.valorCentavos?.message}>
        <Input
          id="valorCentavos"
          type="number"
          step="0.01"
          min={0}
          defaultValue={centavosToReaisInput(initial?.valorCentavos)}
          {...register("valorCentavos", {
            setValueAs: (v: string) => (v === "" ? undefined : Math.round(Number(v) * 100)),
          })}
        />
      </FormField>

      <FormField
        label="Mês de referência"
        htmlFor="referenciaMes"
        error={errors.referenciaMes?.message as string | undefined}
      >
        <Input
          id="referenciaMes"
          type="date"
          defaultValue={dateToInputValue(initial?.referenciaMes)}
          {...register("referenciaMes")}
        />
      </FormField>

      <FormField label="Fonte" htmlFor="fonte" error={errors.fonte?.message}>
        <Input id="fonte" placeholder="Sinduscon-ES" {...register("fonte")} />
      </FormField>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar indicador"}
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

export function IndicatorsPanel({ indicadoresIniciais }: { indicadoresIniciais: IndicatorPublic[] }) {
  const router = useRouter();
  const [sucesso, setSucesso] = useState(false);
  const [initial, setInitial] = useState<Partial<UpsertIndicatorInput> | null>(null);
  const [formKey, setFormKey] = useState(0);

  function selecionar(values: Partial<UpsertIndicatorInput> | null) {
    setInitial(values);
    setFormKey((k) => k + 1);
    setSucesso(false);
  }

  async function salvar(values: UpsertIndicatorInput): Promise<string | null> {
    setSucesso(false);
    const res = await fetch("/api/indicators", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return typeof data?.message === "string"
        ? data.message
        : "Não foi possível salvar o indicador.";
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
              <AlertDescription>Indicador salvo com sucesso.</AlertDescription>
            </Alert>
          )}
          <IndicatorForm
            key={formKey}
            initial={initial}
            onSubmit={salvar}
            onCancel={() => selecionar(null)}
          />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-bold text-grafite">Indicadores cadastrados</h2>
        {indicadoresIniciais.length === 0 ? (
          <p className="text-sm text-[#5B6875]">Nenhum indicador cadastrado ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {indicadoresIniciais.map((indicator) => (
              <Card key={indicator.id}>
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge>{indicator.tipo}</Badge>
                      <span className="text-sm font-bold text-grafite">{indicator.regiao}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#7A828C]">
                      {new Date(indicator.referenciaMes).toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      · fonte: {indicator.fonte}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-bold text-laranja">
                      {formatMoney(indicator.valorCentavos)}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        selecionar({
                          tipo: indicator.tipo,
                          regiao: indicator.regiao,
                          valorCentavos: indicator.valorCentavos,
                          referenciaMes: new Date(indicator.referenciaMes),
                          fonte: indicator.fonte,
                        })
                      }
                    >
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
