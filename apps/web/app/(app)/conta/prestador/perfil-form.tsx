"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  prestadorProfileInputSchema,
  type PrestadorProfileInput,
} from "@conectaobra/types/profile";
import { Alert, AlertDescription, Button, Input } from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

interface PerfilPrestadorAtual {
  categorias: string[];
  experienciaAnos: number | null;
  certificados: string[];
  raioAtendimentoKm: number | null;
}

/** Campos de lista (categorias/certificados) usam texto separado por vírgula — mesmo padrão do perfil do fornecedor. */
function toCsv(values: string[]): string {
  return values.join(", ");
}

function fromCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function PerfilForm({ perfilAtual }: { perfilAtual: PerfilPrestadorAtual | null }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PrestadorProfileInput>({
    resolver: zodResolver(prestadorProfileInputSchema),
    defaultValues: {
      categorias: perfilAtual?.categorias ?? [],
      experienciaAnos: perfilAtual?.experienciaAnos ?? undefined,
      certificados: perfilAtual?.certificados ?? [],
      raioAtendimentoKm: perfilAtual?.raioAtendimentoKm ?? undefined,
    },
  });

  async function onSubmit(values: PrestadorProfileInput) {
    setErro(null);
    setSucesso(false);
    const res = await fetch("/api/profile/prestador", {
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

      <FormField
        label="Categorias (separadas por vírgula)"
        htmlFor="categorias"
        error={errors.categorias?.message}
      >
        <Input
          id="categorias"
          placeholder="pedreiro, eletricista, pintor"
          defaultValue={toCsv(perfilAtual?.categorias ?? [])}
          {...register("categorias", {
            setValueAs: (v: string) => fromCsv(v),
          })}
        />
      </FormField>

      <FormField
        label="Experiência (anos)"
        htmlFor="experienciaAnos"
        error={errors.experienciaAnos?.message}
      >
        <Input
          id="experienciaAnos"
          type="number"
          min={0}
          {...register("experienciaAnos", {
            setValueAs: (v) => (v === "" ? undefined : Number(v)),
          })}
        />
      </FormField>

      <FormField
        label="Certificados (separados por vírgula)"
        htmlFor="certificados"
        error={errors.certificados?.message}
      >
        <Input
          id="certificados"
          placeholder="CREA-ES 123456"
          defaultValue={toCsv(perfilAtual?.certificados ?? [])}
          {...register("certificados", {
            setValueAs: (v: string) => fromCsv(v),
          })}
        />
      </FormField>

      <FormField
        label="Raio de atendimento (km, opcional)"
        htmlFor="raioAtendimentoKm"
        error={errors.raioAtendimentoKm?.message}
      >
        <Input
          id="raioAtendimentoKm"
          type="number"
          min={0}
          {...register("raioAtendimentoKm", {
            setValueAs: (v) => (v === "" ? undefined : Number(v)),
          })}
        />
      </FormField>

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Salvando…" : "Salvar perfil"}
      </Button>
    </form>
  );
}
