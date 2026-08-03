"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPortfolioItemInputSchema,
  type CreatePortfolioItemInput,
  type PortfolioItemPublic,
} from "@conectaobra/types/portfolio";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardTitle,
  Input,
  Textarea,
} from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

function PortfolioForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: Partial<CreatePortfolioItemInput>;
  onSubmit: (values: CreatePortfolioItemInput) => Promise<string | null>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePortfolioItemInput>({
    resolver: zodResolver(createPortfolioItemInputSchema),
    defaultValues: {
      titulo: initial?.titulo ?? "",
      descricao: initial?.descricao ?? "",
      fotos: [],
    },
  });

  async function handle(values: CreatePortfolioItemInput) {
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
      <FormField label="Título" htmlFor="titulo" error={errors.titulo?.message}>
        <Input id="titulo" {...register("titulo")} />
      </FormField>
      <FormField
        label="Descrição (opcional)"
        htmlFor="descricao"
        error={errors.descricao?.message}
      >
        <Textarea id="descricao" {...register("descricao")} />
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

export function PortfolioPanel({ itensIniciais }: { itensIniciais: PortfolioItemPublic[] }) {
  const [itens, setItens] = useState(itensIniciais);
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function criar(values: CreatePortfolioItemInput): Promise<string | null> {
    const res = await fetch("/api/prestador/portfolio", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string"
        ? data.message
        : "Não foi possível criar o item do portfólio.";
    }
    setItens((prev) => [data as PortfolioItemPublic, ...prev]);
    setCriando(false);
    return null;
  }

  async function editar(id: string, values: CreatePortfolioItemInput): Promise<string | null> {
    const res = await fetch(`/api/prestador/portfolio/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string"
        ? data.message
        : "Não foi possível salvar o item do portfólio.";
    }
    setItens((prev) => prev.map((i) => (i.id === id ? (data as PortfolioItemPublic) : i)));
    setEditandoId(null);
    return null;
  }

  async function excluir(id: string) {
    setErroGeral(null);
    if (!window.confirm("Excluir este item do portfólio?")) return;
    const res = await fetch(`/api/prestador/portfolio/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => null);
      setErroGeral(
        typeof data?.message === "string"
          ? data.message
          : "Não foi possível excluir o item do portfólio.",
      );
      return;
    }
    setItens((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      {erroGeral && (
        <Alert variant="danger">
          <AlertDescription>{erroGeral}</AlertDescription>
        </Alert>
      )}

      {itens.length === 0 && !criando && (
        <p className="text-sm text-[#5B6875]">Nenhum item no portfólio ainda.</p>
      )}

      <div className="flex flex-col gap-3">
        {itens.map((item) =>
          editandoId === item.id ? (
            <Card key={item.id}>
              <CardContent className="pt-4">
                <PortfolioForm
                  initial={{ titulo: item.titulo, descricao: item.descricao ?? undefined }}
                  submitLabel="Salvar"
                  onCancel={() => setEditandoId(null)}
                  onSubmit={(values) => editar(item.id, values)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-4">
                <div>
                  <CardTitle>{item.titulo}</CardTitle>
                  {item.descricao && (
                    <p className="mt-1 text-sm text-[#5B6875]">{item.descricao}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditandoId(item.id)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => excluir(item.id)}>
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
            <PortfolioForm
              submitLabel="Adicionar ao portfólio"
              onCancel={() => setCriando(false)}
              onSubmit={criar}
            />
          </CardContent>
        </Card>
      ) : (
        <Button size="sm" variant="secondary" className="self-start" onClick={() => setCriando(true)}>
          + Novo item
        </Button>
      )}
    </div>
  );
}
