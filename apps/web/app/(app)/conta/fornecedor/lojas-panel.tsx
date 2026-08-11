"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createFornecedorLojaInputSchema,
  type CreateFornecedorLojaInput,
  type FornecedorLojaPublic,
} from "@conectaobra/types/fornecedor-lojas";
import { Alert, AlertDescription, Button, Card, CardContent, CardTitle, Input } from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

function LojaForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: Partial<CreateFornecedorLojaInput>;
  onSubmit: (values: CreateFornecedorLojaInput) => Promise<string | null>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFornecedorLojaInput>({
    resolver: zodResolver(createFornecedorLojaInputSchema),
    defaultValues: {
      nome: initial?.nome ?? "",
      endereco: initial?.endereco ?? "",
      regiao: initial?.regiao ?? "",
      telefone: initial?.telefone ?? "",
      imagemUrl: initial?.imagemUrl ?? undefined,
    },
  });

  async function handle(values: CreateFornecedorLojaInput) {
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
      <FormField label="Nome da loja" htmlFor="nome" error={errors.nome?.message}>
        <Input id="nome" {...register("nome")} />
      </FormField>
      <FormField label="Endereço" htmlFor="endereco" error={errors.endereco?.message}>
        <Input id="endereco" {...register("endereco")} />
      </FormField>
      <FormField label="Região (opcional)" htmlFor="regiao" error={errors.regiao?.message}>
        <Input
          id="regiao"
          {...register("regiao", { setValueAs: (v: string) => (v === "" ? undefined : v) })}
        />
      </FormField>
      <FormField label="Telefone (opcional)" htmlFor="telefone" error={errors.telefone?.message}>
        <Input
          id="telefone"
          {...register("telefone", { setValueAs: (v: string) => (v === "" ? undefined : v) })}
        />
      </FormField>
      <FormField label="Imagem da loja (URL, opcional)" htmlFor="imagemUrl" error={errors.imagemUrl?.message}>
        <Input
          id="imagemUrl"
          placeholder="https://…"
          {...register("imagemUrl", { setValueAs: (v: string) => (v === "" ? undefined : v) })}
        />
      </FormField>
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

export function LojasPanel({ lojasIniciais }: { lojasIniciais: FornecedorLojaPublic[] }) {
  const [lojas, setLojas] = useState(lojasIniciais);
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function criar(values: CreateFornecedorLojaInput): Promise<string | null> {
    const res = await fetch("/api/fornecedor/lojas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string" ? data.message : "Não foi possível criar a loja.";
    }
    setLojas((prev) => [data as FornecedorLojaPublic, ...prev]);
    setCriando(false);
    return null;
  }

  async function editar(id: string, values: CreateFornecedorLojaInput): Promise<string | null> {
    const res = await fetch(`/api/fornecedor/lojas/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string" ? data.message : "Não foi possível salvar a loja.";
    }
    setLojas((prev) => prev.map((l) => (l.id === id ? (data as FornecedorLojaPublic) : l)));
    setEditandoId(null);
    return null;
  }

  async function excluir(id: string) {
    setErroGeral(null);
    if (!window.confirm("Excluir esta loja?")) return;
    const res = await fetch(`/api/fornecedor/lojas/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => null);
      setErroGeral(
        typeof data?.message === "string" ? data.message : "Não foi possível excluir a loja.",
      );
      return;
    }
    setLojas((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      {erroGeral && (
        <Alert variant="danger">
          <AlertDescription>{erroGeral}</AlertDescription>
        </Alert>
      )}

      {lojas.length === 0 && !criando && (
        <p className="text-sm text-[#5B6875]">Nenhuma loja cadastrada ainda.</p>
      )}

      <div className="flex flex-col gap-3">
        {lojas.map((loja) =>
          editandoId === loja.id ? (
            <Card key={loja.id}>
              <CardContent className="pt-4">
                <LojaForm
                  initial={{
                    nome: loja.nome,
                    endereco: loja.endereco,
                    regiao: loja.regiao ?? undefined,
                    telefone: loja.telefone ?? undefined,
                    imagemUrl: loja.imagemUrl ?? undefined,
                  }}
                  submitLabel="Salvar"
                  onCancel={() => setEditandoId(null)}
                  onSubmit={(values) => editar(loja.id, values)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card key={loja.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-4">
                <div className="flex items-center gap-3">
                  {loja.imagemUrl && (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
                      <Image src={loja.imagemUrl} alt={loja.nome} fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div>
                    <CardTitle>{loja.nome}</CardTitle>
                    <p className="mt-1 text-sm text-[#5B6875]">{loja.endereco}</p>
                    {(loja.regiao || loja.telefone) && (
                      <p className="mt-1 text-xs text-[#7A828C]">
                        {[loja.regiao, loja.telefone].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditandoId(loja.id)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => excluir(loja.id)}>
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
            <LojaForm submitLabel="Criar loja" onCancel={() => setCriando(false)} onSubmit={criar} />
          </CardContent>
        </Card>
      ) : (
        <Button size="sm" variant="secondary" className="self-start" onClick={() => setCriando(true)}>
          + Nova loja
        </Button>
      )}
    </div>
  );
}
