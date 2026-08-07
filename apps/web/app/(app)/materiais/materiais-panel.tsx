"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createMaterialListInputSchema,
  gerarListaMateriaisInputSchema,
  type CreateMaterialListInput,
  type GerarListaMateriaisInput,
} from "@conectaobra/types/material-lists";
import type { WorkPublic } from "@conectaobra/types/works";
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

export interface MaterialListWithObra {
  id: string;
  obraId: string;
  obraTitulo: string;
  itensCount: number;
  origem: "MANUAL" | "IA";
  createdAt: string;
}

function ManualForm({ obras, onCancel }: { obras: WorkPublic[]; onCancel: () => void }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateMaterialListInput>({
    resolver: zodResolver(createMaterialListInputSchema),
    defaultValues: {
      obraId: obras[0]?.id,
      itens: [{ descricao: "", quantidade: 1, unidade: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  async function onSubmit(values: CreateMaterialListInput) {
    setErro(null);
    const res = await fetch("/api/material-lists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setErro(typeof data?.message === "string" ? data.message : "Não foi possível criar a lista.");
      return;
    }
    router.push(`/materiais/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

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

      <div className="flex flex-col gap-3">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-md border-[1.5px] border-concreto p-3">
            <div className="grid grid-cols-2 gap-2">
              <FormField
                label="Descrição"
                htmlFor={`itens.${index}.descricao`}
                error={errors.itens?.[index]?.descricao?.message}
              >
                <Input {...register(`itens.${index}.descricao`)} />
              </FormField>
              <FormField
                label="Categoria (opcional)"
                htmlFor={`itens.${index}.categoria`}
                error={errors.itens?.[index]?.categoria?.message}
              >
                <Input placeholder="cimento, tinta…" {...register(`itens.${index}.categoria`)} />
              </FormField>
              <FormField
                label="Quantidade"
                htmlFor={`itens.${index}.quantidade`}
                error={errors.itens?.[index]?.quantidade?.message}
              >
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  {...register(`itens.${index}.quantidade`, { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                label="Unidade"
                htmlFor={`itens.${index}.unidade`}
                error={errors.itens?.[index]?.unidade?.message}
              >
                <Input placeholder="saco, m², un…" {...register(`itens.${index}.unidade`)} />
              </FormField>
            </div>
            {fields.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() => remove(index)}
              >
                Remover item
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="self-start"
        onClick={() => append({ descricao: "", quantidade: 1, unidade: "" })}
      >
        + Item
      </Button>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Criando…" : "Criar lista"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function IaForm({ obras, onCancel }: { obras: WorkPublic[]; onCancel: () => void }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GerarListaMateriaisInput>({
    resolver: zodResolver(gerarListaMateriaisInputSchema),
    defaultValues: { obraId: obras[0]?.id },
  });

  async function onSubmit(values: GerarListaMateriaisInput) {
    setErro(null);
    const res = await fetch("/api/material-lists/gerar-ia", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setErro(typeof data?.message === "string" ? data.message : "Não foi possível gerar a lista.");
      return;
    }
    router.push(`/materiais/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <Alert variant="disclaimer">
        <AlertDescription>
          Geração SIMULADA (regras por palavra-chave, sem LLM real) — revise a lista antes de
          solicitar cotações.
        </AlertDescription>
      </Alert>

      <FormField label="Obra" htmlFor="obraIdIa" error={errors.obraId?.message}>
        <select
          id="obraIdIa"
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

      <FormField label="Descreva a obra" htmlFor="descricao" error={errors.descricao?.message}>
        <Textarea
          id="descricao"
          rows={4}
          placeholder="Pintura completa de 2 quartos e sala, piso em porcelanato…"
          {...register("descricao")}
        />
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

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Gerando…" : "Gerar lista"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function MateriaisPanel({
  obras,
  listasIniciais,
}: {
  obras: WorkPublic[];
  listasIniciais: MaterialListWithObra[];
}) {
  const [modo, setModo] = useState<"nenhum" | "manual" | "ia">("nenhum");

  return (
    <div className="flex flex-col gap-4">
      {listasIniciais.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhuma lista de materiais criada ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {listasIniciais.map((lista) => (
            <Link key={lista.id} href={`/materiais/${lista.id}`}>
              <Card className="transition-colors hover:border-azul-planta">
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <div>
                    <CardTitle>{lista.obraTitulo}</CardTitle>
                    <p className="mt-1 text-xs text-[#7A828C]">
                      {lista.itensCount} item(ns) ·{" "}
                      {new Date(lista.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge variant={lista.origem === "IA" ? "verified" : "default"}>
                    {lista.origem === "IA" ? "Gerada por IA" : "Manual"}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {obras.length === 0 ? (
        <Alert variant="disclaimer">
          <AlertDescription>
            Você precisa cadastrar uma obra antes de criar uma lista de materiais.{" "}
            <Link href="/obras" className="font-semibold underline">
              Cadastrar obra →
            </Link>
          </AlertDescription>
        </Alert>
      ) : modo === "nenhum" ? (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setModo("manual")}>
            + Lista manual
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setModo("ia")}>
            + Gerar via IA
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-4">
            {modo === "manual" ? (
              <ManualForm obras={obras} onCancel={() => setModo("nenhum")} />
            ) : (
              <IaForm obras={obras} onCancel={() => setModo("nenhum")} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
