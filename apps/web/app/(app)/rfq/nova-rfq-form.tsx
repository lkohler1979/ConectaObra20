"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRfqInputSchema, type CreateRfqInput } from "@conectaobra/types/rfq";
import type { WorkPublic } from "@conectaobra/types/works";
import { Alert, AlertDescription, Button, Card, CardContent, Input, Textarea } from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

export function NovaRfqForm({ obras }: { obras: WorkPublic[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateRfqInput>({
    resolver: zodResolver(createRfqInputSchema),
    defaultValues: { obraId: obras[0]?.id, fotos: [] },
  });

  async function onSubmit(values: CreateRfqInput) {
    setErro(null);
    const res = await fetch("/api/rfq", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível publicar a RFQ.",
      );
      return;
    }
    router.push(`/rfq/${data.id}`);
    router.refresh();
  }

  if (obras.length === 0) {
    return (
      <Alert variant="disclaimer">
        <AlertDescription>
          Você precisa cadastrar uma obra antes de publicar uma RFQ.{" "}
          <Link href="/obras" className="font-semibold underline">
            Cadastrar obra →
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  if (!aberto) {
    return (
      <Button size="sm" variant="secondary" className="self-start" onClick={() => setAberto(true)}>
        + Nova RFQ
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        {erro && (
          <Alert variant="danger">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-2 flex flex-col gap-3">
          <FormField label="Obra" htmlFor="obraId" error={errors.obraId?.message}>
            <select
              id="obraId"
              {...register("obraId")}
              className="w-full rounded-md border-[1.5px] border-concreto bg-white px-3 py-[11px] text-sm text-grafite focus:border-azul-planta focus:outline-none focus:ring-2 focus:ring-azul-planta-claro"
            >
              {obras.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.titulo}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Categoria" htmlFor="categoria" error={errors.categoria?.message}>
            <Input id="categoria" placeholder="Pintura, elétrica, hidráulica…" {...register("categoria")} />
          </FormField>

          <FormField label="Descrição" htmlFor="descricao" error={errors.descricao?.message}>
            <Textarea id="descricao" rows={4} {...register("descricao")} />
          </FormField>

          <FormField
            label="Região (opcional)"
            htmlFor="regiao"
            error={errors.regiao?.message}
          >
            <Input id="regiao" placeholder="Vitória/ES" {...register("regiao")} />
          </FormField>

          <FormField
            label="Prazo pra resposta (opcional)"
            htmlFor="prazoResposta"
            error={errors.prazoResposta?.message}
          >
            <Input
              id="prazoResposta"
              type="date"
              {...register("prazoResposta", {
                setValueAs: (v: string) => (v === "" ? undefined : new Date(v).toISOString()),
              })}
            />
          </FormField>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Publicando…" : "Publicar RFQ"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
