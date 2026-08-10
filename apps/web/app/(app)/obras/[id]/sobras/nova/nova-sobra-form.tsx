"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createSurplusListingInputSchema,
  type CreateSurplusListingInput,
} from "@conectaobra/types/material-surplus";
import { Alert, AlertDescription, Button, Input, Textarea } from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

export function NovaSobraForm({ workId }: { workId: string }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSurplusListingInput>({
    resolver: zodResolver(createSurplusListingInputSchema),
    defaultValues: { workId, fotos: [] },
  });

  async function onSubmit(values: CreateSurplusListingInput) {
    setErro(null);
    const res = await fetch("/api/surplus-listings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setErro(typeof data?.message === "string" ? data.message : "Não foi possível publicar o anúncio.");
      return;
    }
    router.push(`/obras/${workId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <FormField label="O que está sobrando" htmlFor="nome" error={errors.nome?.message}>
        <Input id="nome" placeholder="Cimento CP II, 20 sacos" {...register("nome")} />
      </FormField>

      <FormField label="Categoria" htmlFor="categoria" error={errors.categoria?.message}>
        <Input id="categoria" placeholder="Cimento, tijolo, elétrica…" {...register("categoria")} />
      </FormField>

      <FormField label="Descrição" htmlFor="descricao" error={errors.descricao?.message}>
        <Textarea
          id="descricao"
          rows={4}
          placeholder="Estado, marca, motivo da sobra…"
          {...register("descricao")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Quantidade" htmlFor="quantidade" error={errors.quantidade?.message}>
          <Input id="quantidade" type="number" step="any" min="0" {...register("quantidade")} />
        </FormField>

        <FormField label="Unidade" htmlFor="unidade" error={errors.unidade?.message}>
          <Input id="unidade" placeholder="saco, m², unidade…" {...register("unidade")} />
        </FormField>
      </div>

      <FormField
        label="Preço (R$)"
        htmlFor="precoCentavos"
        error={errors.precoCentavos?.message}
      >
        <Input
          id="precoCentavos"
          type="number"
          step="0.01"
          min="0"
          {...register("precoCentavos", { setValueAs: (v: string) => Math.round(Number(v) * 100) })}
        />
      </FormField>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Publicando…" : "Publicar anúncio"}
      </Button>
    </form>
  );
}
