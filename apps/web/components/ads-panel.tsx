"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAdInputSchema, type AdPrivate, type AdTipo, type CreateAdInput } from "@conectaobra/types/ads";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardTitle,
  Checkbox,
  Input,
  Textarea,
} from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

const TIPO_OPTIONS: { value: AdTipo; label: string }[] = [
  { value: "DESTAQUE", label: "Destaque (banner)" },
  { value: "CPC", label: "CPC (custo por clique)" },
  { value: "CPM", label: "CPM (custo por mil impressões)" },
];

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function centavosToReaisInput(centavos: number | null | undefined): string {
  return centavos != null ? (centavos / 100).toFixed(2) : "";
}

interface AdFormInitial {
  tipo: AdTipo;
  criativo: {
    titulo: string;
    descricao?: string;
    imagemUrl?: string;
    linkUrl?: string;
  };
  budgetCentavos: number;
  ativo: boolean;
}

function AdForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: AdFormInitial;
  onSubmit: (values: CreateAdInput) => Promise<string | null>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdInput>({
    resolver: zodResolver(createAdInputSchema),
    defaultValues: {
      tipo: initial?.tipo ?? "DESTAQUE",
      criativo: {
        titulo: initial?.criativo.titulo ?? "",
        descricao: initial?.criativo.descricao ?? undefined,
        imagemUrl: initial?.criativo.imagemUrl ?? undefined,
        linkUrl: initial?.criativo.linkUrl ?? undefined,
      },
      ativo: initial?.ativo ?? true,
    },
  });

  async function handle(values: CreateAdInput) {
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

      <FormField label="Título" htmlFor="titulo" error={errors.criativo?.titulo?.message}>
        <Input id="titulo" {...register("criativo.titulo")} />
      </FormField>

      <FormField
        label="Descrição (opcional)"
        htmlFor="descricao"
        error={errors.criativo?.descricao?.message}
      >
        <Textarea id="descricao" {...register("criativo.descricao")} />
      </FormField>

      <FormField
        label="Imagem (URL, opcional)"
        htmlFor="imagemUrl"
        error={errors.criativo?.imagemUrl?.message}
      >
        <Input id="imagemUrl" placeholder="https://…" {...register("criativo.imagemUrl")} />
      </FormField>

      <FormField
        label="Link de destino (URL, opcional)"
        htmlFor="linkUrl"
        error={errors.criativo?.linkUrl?.message}
      >
        <Input id="linkUrl" placeholder="https://…" {...register("criativo.linkUrl")} />
      </FormField>

      <FormField
        label="Budget (R$, informativo — sem cobrança nesta versão)"
        htmlFor="budgetCentavos"
        error={errors.budgetCentavos?.message}
      >
        <Input
          id="budgetCentavos"
          type="number"
          step="0.01"
          min={0}
          defaultValue={centavosToReaisInput(initial?.budgetCentavos)}
          {...register("budgetCentavos", {
            setValueAs: (v: string) => (v === "" ? undefined : Math.round(Number(v) * 100)),
          })}
        />
      </FormField>

      <label className="flex items-center gap-2 text-sm text-grafite">
        <Controller
          control={control}
          name="ativo"
          render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} />}
        />
        Ativo (visível na home)
      </label>

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

export function AdsPanel({ adsIniciais }: { adsIniciais: AdPrivate[] }) {
  const [ads, setAds] = useState(adsIniciais);
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function criar(values: CreateAdInput): Promise<string | null> {
    const res = await fetch("/api/ads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string" ? data.message : "Não foi possível criar o anúncio.";
    }
    setAds((prev) => [data as AdPrivate, ...prev]);
    setCriando(false);
    return null;
  }

  async function editar(id: string, values: CreateAdInput): Promise<string | null> {
    const res = await fetch(`/api/ads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string"
        ? data.message
        : "Não foi possível salvar o anúncio.";
    }
    setAds((prev) => prev.map((a) => (a.id === id ? (data as AdPrivate) : a)));
    setEditandoId(null);
    return null;
  }

  async function excluir(id: string) {
    setErroGeral(null);
    if (!window.confirm("Excluir este anúncio?")) return;
    const res = await fetch(`/api/ads/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => null);
      setErroGeral(
        typeof data?.message === "string" ? data.message : "Não foi possível excluir o anúncio.",
      );
      return;
    }
    setAds((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      {erroGeral && (
        <Alert variant="danger">
          <AlertDescription>{erroGeral}</AlertDescription>
        </Alert>
      )}

      {ads.length === 0 && !criando && (
        <p className="text-sm text-[#5B6875]">Nenhum anúncio cadastrado ainda.</p>
      )}

      <div className="flex flex-col gap-3">
        {ads.map((ad) =>
          editandoId === ad.id ? (
            <Card key={ad.id}>
              <CardContent className="pt-4">
                <AdForm
                  initial={ad}
                  submitLabel="Salvar"
                  onCancel={() => setEditandoId(null)}
                  onSubmit={(values) => editar(ad.id, values)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card key={ad.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{ad.criativo.titulo}</CardTitle>
                    <Badge>{ad.tipo}</Badge>
                    {!ad.ativo && <Badge variant="warning">Inativo</Badge>}
                  </div>
                  {ad.criativo.descricao && (
                    <p className="mt-1 text-sm text-[#5B6875]">{ad.criativo.descricao}</p>
                  )}
                  <p className="mt-1 text-xs text-[#7A828C]">
                    Budget: {formatMoney(ad.budgetCentavos)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditandoId(ad.id)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => excluir(ad.id)}>
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ),
        )}
      </div>

      {criando ? (
        <Card>
          <CardContent className="pt-4">
            <AdForm submitLabel="Criar anúncio" onCancel={() => setCriando(false)} onSubmit={criar} />
          </CardContent>
        </Card>
      ) : (
        <Button size="sm" variant="secondary" className="self-start" onClick={() => setCriando(true)}>
          + Novo anúncio
        </Button>
      )}
    </div>
  );
}
