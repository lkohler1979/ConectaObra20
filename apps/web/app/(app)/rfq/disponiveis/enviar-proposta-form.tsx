"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createRfqProposalInputSchema,
  type CreateRfqProposalInput,
} from "@conectaobra/types/rfq-proposals";
import { Alert, AlertDescription, Button, Input, Textarea } from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

/** Sem upload de arquivo wired ainda (P-018) — anexo entra como lista separada por linha, mesmo padrão de produtos-panel.tsx/catalogo-panel.tsx. */
function fromLines(value: string): string[] {
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function EnviarPropostaForm({ rfqId }: { rfqId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateRfqProposalInput>({
    resolver: zodResolver(createRfqProposalInputSchema),
  });

  async function onSubmit(values: CreateRfqProposalInput) {
    setErro(null);
    const res = await fetch(`/api/rfq/${rfqId}/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível enviar a proposta.",
      );
      return;
    }
    router.push(`/rfq/${rfqId}`);
  }

  if (!aberto) {
    return (
      <Button size="sm" onClick={() => setAberto(true)}>
        Enviar proposta
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <FormField label="Preço (R$)" htmlFor="precoCentavos" error={errors.precoCentavos?.message}>
        <Input
          id="precoCentavos"
          type="number"
          step="0.01"
          min={0}
          {...register("precoCentavos", {
            setValueAs: (v: string) => (v === "" ? undefined : Math.round(Number(v) * 100)),
          })}
        />
      </FormField>

      <FormField label="Prazo (dias)" htmlFor="prazoDias" error={errors.prazoDias?.message}>
        <Input
          id="prazoDias"
          type="number"
          min={1}
          {...register("prazoDias", {
            setValueAs: (v: string) => (v === "" ? undefined : Number(v)),
          })}
        />
      </FormField>

      <FormField label="Observações (opcional)" htmlFor="observacoes" error={errors.observacoes?.message}>
        <Textarea id="observacoes" rows={3} {...register("observacoes")} />
      </FormField>

      <FormField
        label="Anexos (uma URL por linha, opcional)"
        htmlFor="anexos"
        error={errors.anexos?.message as string | undefined}
      >
        <Textarea
          id="anexos"
          rows={3}
          placeholder="https://…/orcamento-detalhado.pdf"
          {...register("anexos", {
            setValueAs: (v: string) => fromLines(v),
          })}
        />
      </FormField>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Enviando…" : "Enviar proposta"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
