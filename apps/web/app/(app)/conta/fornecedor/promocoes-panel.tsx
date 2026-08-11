"use client";

import { useState } from "react";
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPromocaoInputSchema,
  validarCupomInputSchema,
  type CreatePromocaoInput,
  type PromocaoPrivate,
  type ValidarCupomInput,
  type ValidarCupomResult,
} from "@conectaobra/types/promocoes";
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

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function centavosToReaisInput(centavos: number | null | undefined): string {
  return centavos != null ? (centavos / 100).toFixed(2) : "";
}

function isoToDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

interface PromoFormInitial {
  codigo: string;
  nome: string;
  descricao: string;
  valorOriginalCentavos: number | null;
  valorPromocionalCentavos: number;
  imagemUrl: string | null;
  validadeInicio: string | null;
  validadeFim: string;
  destaque: boolean;
  ativa: boolean;
}

function PromoForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: PromoFormInitial;
  onSubmit: (values: CreatePromocaoInput) => Promise<string | null>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePromocaoInput>({
    resolver: zodResolver(createPromocaoInputSchema),
    defaultValues: {
      codigo: initial?.codigo ?? "",
      nome: initial?.nome ?? "",
      descricao: initial?.descricao ?? "",
      imagemUrl: initial?.imagemUrl ?? undefined,
      destaque: initial?.destaque ?? false,
      ativa: initial?.ativa ?? true,
    },
  });

  async function handle(values: CreatePromocaoInput) {
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

      <FormField label="Código" htmlFor="codigo" error={errors.codigo?.message}>
        <Input id="codigo" placeholder="PROMO10" {...register("codigo")} />
      </FormField>

      <FormField label="Nome" htmlFor="nome" error={errors.nome?.message}>
        <Input id="nome" {...register("nome")} />
      </FormField>

      <FormField label="Descrição" htmlFor="descricao" error={errors.descricao?.message}>
        <Textarea id="descricao" {...register("descricao")} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Valor original (R$, opcional)"
          htmlFor="valorOriginalCentavos"
          error={errors.valorOriginalCentavos?.message}
        >
          <Input
            id="valorOriginalCentavos"
            type="number"
            step="0.01"
            min={0}
            defaultValue={centavosToReaisInput(initial?.valorOriginalCentavos)}
            {...register("valorOriginalCentavos", {
              setValueAs: (v: string) => (v === "" ? undefined : Math.round(Number(v) * 100)),
            })}
          />
        </FormField>

        <FormField
          label="Valor promocional (R$)"
          htmlFor="valorPromocionalCentavos"
          error={errors.valorPromocionalCentavos?.message}
        >
          <Input
            id="valorPromocionalCentavos"
            type="number"
            step="0.01"
            min={0}
            defaultValue={centavosToReaisInput(initial?.valorPromocionalCentavos)}
            {...register("valorPromocionalCentavos", {
              setValueAs: (v: string) => (v === "" ? undefined : Math.round(Number(v) * 100)),
            })}
          />
        </FormField>
      </div>

      <FormField label="Imagem promocional (URL, opcional)" htmlFor="imagemUrl" error={errors.imagemUrl?.message}>
        <Input
          id="imagemUrl"
          placeholder="https://…"
          {...register("imagemUrl", { setValueAs: (v: string) => (v === "" ? undefined : v) })}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Validade — início (opcional)"
          htmlFor="validadeInicio"
          error={errors.validadeInicio?.message as string | undefined}
        >
          <Input
            id="validadeInicio"
            type="date"
            defaultValue={isoToDateInput(initial?.validadeInicio)}
            {...register("validadeInicio")}
          />
        </FormField>

        <FormField
          label="Validade — fim"
          htmlFor="validadeFim"
          error={errors.validadeFim?.message as string | undefined}
        >
          <Input
            id="validadeFim"
            type="date"
            defaultValue={isoToDateInput(initial?.validadeFim)}
            {...register("validadeFim")}
          />
        </FormField>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-grafite">
          <Controller
            control={control}
            name="destaque"
            render={({ field }) => (
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          Destacar na home
        </label>
        <label className="flex items-center gap-2 text-sm text-grafite">
          <Controller
            control={control}
            name="ativa"
            render={({ field }) => (
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          Ativa
        </label>
      </div>

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

function ValidarCupomForm() {
  const [resultado, setResultado] = useState<ValidarCupomResult | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ValidarCupomInput>({
    resolver: zodResolver(validarCupomInputSchema),
  });

  async function onSubmit(values: ValidarCupomInput) {
    setErro(null);
    setResultado(null);
    const res = await fetch("/api/fornecedor/promocoes/validar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setErro(typeof data?.message === "string" ? data.message : "Não foi possível validar o cupom.");
      return;
    }
    setResultado(data as ValidarCupomResult);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4">
        <CardTitle>Validar cupom</CardTitle>
        <p className="text-xs text-[#7A828C]">
          Digite o código que o cliente apresentou no balcão pra confirmar se ainda é válido.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex gap-2">
          <Input placeholder="PROMO10" className="max-w-[200px]" {...register("codigo")} />
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Validando…" : "Validar"}
          </Button>
        </form>

        {erro && (
          <Alert variant="danger">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {resultado && resultado.valido && resultado.promocao && (
          <Alert variant="disclaimer">
            <AlertDescription>
              <Badge variant="verified" className="mr-2">
                Válido
              </Badge>
              {resultado.promocao.nome} — {formatMoney(resultado.promocao.valorPromocionalCentavos)}
              {resultado.promocao.valorOriginalCentavos != null && (
                <>
                  {" "}
                  (era {formatMoney(resultado.promocao.valorOriginalCentavos)})
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {resultado && !resultado.valido && (
          <Alert variant="danger">
            <AlertDescription>
              <Badge variant="warning" className="mr-2">
                Inválido
              </Badge>
              {resultado.motivo}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export function PromocoesPanel({ promocoesIniciais }: { promocoesIniciais: PromocaoPrivate[] }) {
  const [promocoes, setPromocoes] = useState(promocoesIniciais);
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function criar(values: CreatePromocaoInput): Promise<string | null> {
    const res = await fetch("/api/fornecedor/promocoes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string"
        ? data.message
        : "Não foi possível criar a promoção.";
    }
    setPromocoes((prev) => [data as PromocaoPrivate, ...prev]);
    setCriando(false);
    return null;
  }

  async function editar(id: string, values: CreatePromocaoInput): Promise<string | null> {
    const res = await fetch(`/api/fornecedor/promocoes/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string"
        ? data.message
        : "Não foi possível salvar a promoção.";
    }
    setPromocoes((prev) => prev.map((p) => (p.id === id ? (data as PromocaoPrivate) : p)));
    setEditandoId(null);
    return null;
  }

  async function excluir(id: string) {
    setErroGeral(null);
    if (!window.confirm("Excluir esta promoção?")) return;
    const res = await fetch(`/api/fornecedor/promocoes/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => null);
      setErroGeral(
        typeof data?.message === "string" ? data.message : "Não foi possível excluir a promoção.",
      );
      return;
    }
    setPromocoes((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <ValidarCupomForm />

      {erroGeral && (
        <Alert variant="danger">
          <AlertDescription>{erroGeral}</AlertDescription>
        </Alert>
      )}

      {promocoes.length === 0 && !criando && (
        <p className="text-sm text-[#5B6875]">Nenhuma promoção cadastrada ainda.</p>
      )}

      <div className="flex flex-col gap-3">
        {promocoes.map((promo) =>
          editandoId === promo.id ? (
            <Card key={promo.id}>
              <CardContent className="pt-4">
                <PromoForm
                  initial={promo}
                  submitLabel="Salvar"
                  onCancel={() => setEditandoId(null)}
                  onSubmit={(values) => editar(promo.id, values)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card key={promo.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-4">
                <div className="flex items-center gap-3">
                  {promo.imagemUrl && (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={promo.imagemUrl}
                        alt={promo.nome}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{promo.nome}</CardTitle>
                    <Badge>{promo.codigo}</Badge>
                    {promo.destaque && <Badge variant="verified">Destaque</Badge>}
                    {!promo.ativa && <Badge variant="warning">Inativa</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-[#5B6875]">{promo.descricao}</p>
                  <p className="mt-1 text-xs text-[#7A828C]">
                    {promo.valorOriginalCentavos != null && (
                      <span className="line-through">
                        {formatMoney(promo.valorOriginalCentavos)}{" "}
                      </span>
                    )}
                    {formatMoney(promo.valorPromocionalCentavos)} · válida até{" "}
                    {new Date(promo.validadeFim).toLocaleDateString("pt-BR")}
                  </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditandoId(promo.id)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => excluir(promo.id)}>
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
            <PromoForm submitLabel="Criar promoção" onCancel={() => setCriando(false)} onSubmit={criar} />
          </CardContent>
        </Card>
      ) : (
        <Button size="sm" variant="secondary" className="self-start" onClick={() => setCriando(true)}>
          + Nova promoção
        </Button>
      )}
    </div>
  );
}
