"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resolverDisputeInputSchema,
  type DisputeDecisao,
  type ResolverDisputeInput,
} from "@conectaobra/types/disputes";
import { Alert, AlertDescription, Button, Input, Textarea } from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

const DECISAO_OPTIONS: { value: DisputeDecisao; label: string }[] = [
  { value: "APROVAR", label: "Aprovar (etapa volta a ENTREGUE)" },
  { value: "ESTORNAR", label: "Estornar depósito ao cliente" },
  { value: "LIBERAR_PARCIAL", label: "Liberar parcialmente ao prestador" },
];

function centavosToReaisInput(centavos: number | undefined): string {
  return centavos != null ? (centavos / 100).toFixed(2) : "";
}

export function ResolveForm({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResolverDisputeInput>({
    resolver: zodResolver(resolverDisputeInputSchema),
    defaultValues: { decisao: "APROVAR", resolucao: "" },
  });

  const decisao = watch("decisao");

  async function onSubmit(values: ResolverDisputeInput) {
    setErro(null);
    const res = await fetch(`/api/disputas/${disputeId}/resolver`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível resolver a disputa.",
      );
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <FormField label="Decisão" htmlFor="decisao" error={errors.decisao?.message}>
        <select
          id="decisao"
          {...register("decisao")}
          className="w-full rounded-md border-[1.5px] border-concreto bg-white px-3 py-[11px] text-sm text-grafite focus:border-azul-planta focus:outline-none focus:ring-2 focus:ring-azul-planta-claro"
        >
          {DECISAO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      {decisao === "LIBERAR_PARCIAL" && (
        <FormField
          label="Valor liberado ao prestador (R$)"
          htmlFor="valorLiberadoCentavos"
          error={errors.valorLiberadoCentavos?.message}
        >
          <Input
            id="valorLiberadoCentavos"
            type="number"
            step="0.01"
            min={0}
            defaultValue={centavosToReaisInput(undefined)}
            {...register("valorLiberadoCentavos", {
              setValueAs: (v: string) => (v === "" ? undefined : Math.round(Number(v) * 100)),
            })}
          />
        </FormField>
      )}

      <FormField label="Resolução (registrada no histórico)" htmlFor="resolucao" error={errors.resolucao?.message}>
        <Textarea id="resolucao" rows={3} {...register("resolucao")} />
      </FormField>

      <Button type="submit" variant="destructive" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Resolvendo…" : "Resolver disputa"}
      </Button>
    </form>
  );
}
