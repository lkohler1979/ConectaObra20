"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  fornecedorProfileInputSchema,
  type FornecedorProfileInput,
} from "@conectaobra/types/profile";
import { Alert, AlertDescription, Button, Input } from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

interface PerfilFornecedorAtual {
  razaoSocial: string;
  categorias: string[];
  regioes: string[];
  tempoMercadoAnos: number | null;
  certificacoes: string[];
  logoUrl: string | null;
}

/** Campos de lista (categorias/regiões/certificações) usam texto separado por vírgula — sem tag-input dedicado, mesmo espírito minimalista do resto do app. */
function toCsv(values: string[]): string {
  return values.join(", ");
}

function fromCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function PerfilForm({ perfilAtual }: { perfilAtual: PerfilFornecedorAtual | null }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FornecedorProfileInput>({
    resolver: zodResolver(fornecedorProfileInputSchema),
    defaultValues: {
      razaoSocial: perfilAtual?.razaoSocial ?? "",
      // Campo é um texto "a, b, c" (register com setValueAs: fromCsv) — o
      // default pro <input> precisa ser a string já juntada (toCsv), nunca
      // o array puro (quebrava com "value.split is not a function" no
      // mount: setValueAs esperava receber string, não array).
      categorias: toCsv(perfilAtual?.categorias ?? []) as unknown as string[],
      regioes: toCsv(perfilAtual?.regioes ?? []) as unknown as string[],
      tempoMercadoAnos: perfilAtual?.tempoMercadoAnos ?? undefined,
      certificacoes: toCsv(perfilAtual?.certificacoes ?? []) as unknown as string[],
      logoUrl: perfilAtual?.logoUrl ?? undefined,
    },
  });

  async function onSubmit(values: FornecedorProfileInput) {
    setErro(null);
    setSucesso(false);
    const res = await fetch("/api/profile/fornecedor", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível salvar o perfil.",
      );
      return;
    }

    setSucesso(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
      {sucesso && (
        <Alert variant="success">
          <AlertDescription>Perfil salvo com sucesso.</AlertDescription>
        </Alert>
      )}

      <FormField label="Razão social" htmlFor="razaoSocial" error={errors.razaoSocial?.message}>
        <Input id="razaoSocial" {...register("razaoSocial")} />
      </FormField>

      <FormField
        label="Categorias (separadas por vírgula)"
        htmlFor="categorias"
        error={errors.categorias?.message}
      >
        <Input
          id="categorias"
          placeholder="cimento, tintas, elétrica"
          defaultValue={toCsv(perfilAtual?.categorias ?? [])}
          {...register("categorias", {
            setValueAs: (v: string) => fromCsv(v),
          })}
        />
      </FormField>

      <FormField
        label="Regiões atendidas (separadas por vírgula)"
        htmlFor="regioes"
        error={errors.regioes?.message}
      >
        <Input
          id="regioes"
          placeholder="Vitória, Vila Velha"
          defaultValue={toCsv(perfilAtual?.regioes ?? [])}
          {...register("regioes", {
            setValueAs: (v: string) => fromCsv(v),
          })}
        />
      </FormField>

      <FormField
        label="Tempo de mercado (anos)"
        htmlFor="tempoMercadoAnos"
        error={errors.tempoMercadoAnos?.message}
      >
        <Input
          id="tempoMercadoAnos"
          type="number"
          min={0}
          {...register("tempoMercadoAnos", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
        />
      </FormField>

      <FormField
        label="Certificações (separadas por vírgula)"
        htmlFor="certificacoes"
        error={errors.certificacoes?.message}
      >
        <Input
          id="certificacoes"
          placeholder="ISO 9001"
          defaultValue={toCsv(perfilAtual?.certificacoes ?? [])}
          {...register("certificacoes", {
            setValueAs: (v: string) => fromCsv(v),
          })}
        />
      </FormField>

      <FormField label="Logo da empresa (URL, opcional)" htmlFor="logoUrl" error={errors.logoUrl?.message}>
        <Input
          id="logoUrl"
          placeholder="https://…"
          {...register("logoUrl", { setValueAs: (v: string) => (v === "" ? undefined : v) })}
        />
      </FormField>

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Salvando…" : "Salvar perfil"}
      </Button>
    </form>
  );
}
