"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createArticleInputSchema,
  type ArticlePrivate,
  type CreateArticleInput,
} from "@conectaobra/types/articles";
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

function dateToInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

interface ArticleFormInitial {
  titulo: string;
  slug?: string;
  categoria: string;
  corpo: string;
  autor: string;
  arquivoUrl?: string;
  publicadoEm?: string;
}

function ArticleForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: ArticleFormInitial;
  onSubmit: (values: CreateArticleInput) => Promise<string | null>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateArticleInput>({
    resolver: zodResolver(createArticleInputSchema),
    defaultValues: {
      titulo: initial?.titulo ?? "",
      slug: initial?.slug ?? undefined,
      categoria: initial?.categoria ?? "",
      corpo: initial?.corpo ?? "",
      autor: initial?.autor ?? "",
      arquivoUrl: initial?.arquivoUrl ?? undefined,
      publicadoEm: initial?.publicadoEm ? new Date(initial.publicadoEm) : undefined,
    },
  });

  async function handle(values: CreateArticleInput) {
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
        label="Slug (opcional — gerado do título se vazio)"
        htmlFor="slug"
        error={errors.slug?.message}
      >
        <Input id="slug" placeholder="meu-artigo" {...register("slug")} />
      </FormField>

      <FormField
        label="Categoria (livre — ex.: legislação, checklist)"
        htmlFor="categoria"
        error={errors.categoria?.message}
      >
        <Input id="categoria" {...register("categoria")} />
      </FormField>

      <FormField label="Autor" htmlFor="autor" error={errors.autor?.message}>
        <Input id="autor" {...register("autor")} />
      </FormField>

      <FormField label="Corpo" htmlFor="corpo" error={errors.corpo?.message}>
        <Textarea id="corpo" rows={8} {...register("corpo")} />
      </FormField>

      <FormField
        label="Arquivo (URL, opcional — presença define biblioteca vs. notícia)"
        htmlFor="arquivoUrl"
        error={errors.arquivoUrl?.message}
      >
        <Input id="arquivoUrl" placeholder="https://…" {...register("arquivoUrl")} />
      </FormField>

      <FormField
        label="Publicado em (vazio = rascunho, não aparece no portal)"
        htmlFor="publicadoEm"
        error={errors.publicadoEm?.message as string | undefined}
      >
        <Input
          id="publicadoEm"
          type="date"
          defaultValue={dateToInputValue(initial?.publicadoEm)}
          {...register("publicadoEm", {
            setValueAs: (v: string) => (v === "" ? undefined : v),
          })}
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

export function ArticlesPanel({ artigosIniciais }: { artigosIniciais: ArticlePrivate[] }) {
  const [artigos, setArtigos] = useState(artigosIniciais);
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function criar(values: CreateArticleInput): Promise<string | null> {
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string" ? data.message : "Não foi possível criar o artigo.";
    }
    setArtigos((prev) => [data as ArticlePrivate, ...prev]);
    setCriando(false);
    return null;
  }

  async function editar(id: string, values: CreateArticleInput): Promise<string | null> {
    const res = await fetch(`/api/articles/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string" ? data.message : "Não foi possível salvar o artigo.";
    }
    setArtigos((prev) => prev.map((a) => (a.id === id ? (data as ArticlePrivate) : a)));
    setEditandoId(null);
    return null;
  }

  async function excluir(id: string) {
    setErroGeral(null);
    if (!window.confirm("Excluir este artigo?")) return;
    const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => null);
      setErroGeral(
        typeof data?.message === "string" ? data.message : "Não foi possível excluir o artigo.",
      );
      return;
    }
    setArtigos((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      {erroGeral && (
        <Alert variant="danger">
          <AlertDescription>{erroGeral}</AlertDescription>
        </Alert>
      )}

      {artigos.length === 0 && !criando && (
        <p className="text-sm text-[#5B6875]">Nenhum artigo cadastrado ainda.</p>
      )}

      <div className="flex flex-col gap-3">
        {artigos.map((artigo) =>
          editandoId === artigo.id ? (
            <Card key={artigo.id}>
              <CardContent className="pt-4">
                <ArticleForm
                  initial={{
                    titulo: artigo.titulo,
                    slug: artigo.slug,
                    categoria: artigo.categoria,
                    corpo: artigo.corpo,
                    autor: artigo.autor,
                    arquivoUrl: artigo.arquivoUrl ?? undefined,
                    publicadoEm: artigo.publicadoEm ?? undefined,
                  }}
                  submitLabel="Salvar"
                  onCancel={() => setEditandoId(null)}
                  onSubmit={(values) => editar(artigo.id, values)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card key={artigo.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{artigo.titulo}</CardTitle>
                    <Badge>{artigo.categoria}</Badge>
                    {!artigo.publicadoEm && <Badge variant="warning">Rascunho</Badge>}
                    {artigo.arquivoUrl && <Badge variant="verified">Biblioteca</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-[#7A828C]">
                    /{artigo.slug} · {artigo.autor}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditandoId(artigo.id)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => excluir(artigo.id)}>
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
            <ArticleForm submitLabel="Publicar artigo" onCancel={() => setCriando(false)} onSubmit={criar} />
          </CardContent>
        </Card>
      ) : (
        <Button size="sm" variant="secondary" className="self-start" onClick={() => setCriando(true)}>
          + Novo artigo
        </Button>
      )}
    </div>
  );
}
