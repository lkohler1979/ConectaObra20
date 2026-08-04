"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createProjectInputSchema,
  type CreateProjectInput,
  type ProjectCategory,
  type ProjectPrivate,
} from "@conectaobra/types/projects-catalog";
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

const CATEGORIA_OPTIONS: { value: ProjectCategory; label: string }[] = [
  { value: "CASA", label: "Casa" },
  { value: "SOBRADO", label: "Sobrado" },
  { value: "GALPAO", label: "Galpão" },
  { value: "CHACARA", label: "Chácara" },
  { value: "CONDOMINIO", label: "Condomínio" },
];

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function centavosToReaisInput(centavos: number | null | undefined): string {
  return centavos != null ? (centavos / 100).toFixed(2) : "";
}

/** URLs dos arquivos reais — sem upload wired ainda (P-018), então entram como lista separada por linha. */
function toLines(values: string[]): string {
  return values.join("\n");
}

function fromLines(value: string): string[] {
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
}

interface ProjectFormInitial {
  titulo: string;
  categoria: ProjectCategory;
  precoCentavos: number;
  descricao?: string;
  imagemCapaUrl?: string;
  licenca?: string;
  arquivos: string[];
}

function ProjectForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: ProjectFormInitial;
  onSubmit: (values: CreateProjectInput) => Promise<string | null>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectInputSchema),
    defaultValues: {
      titulo: initial?.titulo ?? "",
      categoria: initial?.categoria ?? "CASA",
      precoCentavos: initial?.precoCentavos ?? 0,
      descricao: initial?.descricao ?? undefined,
      imagemCapaUrl: initial?.imagemCapaUrl ?? undefined,
      licenca: initial?.licenca ?? undefined,
      arquivos: initial?.arquivos ?? [],
    },
  });

  async function handle(values: CreateProjectInput) {
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

      <FormField label="Categoria" htmlFor="categoria" error={errors.categoria?.message}>
        <select
          id="categoria"
          {...register("categoria")}
          className="w-full rounded-md border-[1.5px] border-concreto bg-white px-3 py-[11px] text-sm text-grafite focus:border-azul-planta focus:outline-none focus:ring-2 focus:ring-azul-planta-claro"
        >
          {CATEGORIA_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Preço (R$)" htmlFor="precoCentavos" error={errors.precoCentavos?.message}>
        <Input
          id="precoCentavos"
          type="number"
          step="0.01"
          min={0}
          defaultValue={centavosToReaisInput(initial?.precoCentavos)}
          {...register("precoCentavos", {
            setValueAs: (v: string) => (v === "" ? undefined : Math.round(Number(v) * 100)),
          })}
        />
      </FormField>

      <FormField
        label="Descrição (opcional)"
        htmlFor="descricao"
        error={errors.descricao?.message}
      >
        <Textarea id="descricao" {...register("descricao")} />
      </FormField>

      <FormField
        label="Imagem de capa (URL, opcional)"
        htmlFor="imagemCapaUrl"
        error={errors.imagemCapaUrl?.message}
      >
        <Input id="imagemCapaUrl" placeholder="https://…" {...register("imagemCapaUrl")} />
      </FormField>

      <FormField label="Licença (opcional)" htmlFor="licenca" error={errors.licenca?.message}>
        <Input id="licenca" placeholder="Uso residencial único" {...register("licenca")} />
      </FormField>

      <FormField
        label="Arquivos do projeto (uma URL por linha)"
        htmlFor="arquivos"
        error={errors.arquivos?.message}
      >
        <Textarea
          id="arquivos"
          rows={3}
          placeholder="https://…/planta.pdf"
          defaultValue={toLines(initial?.arquivos ?? [])}
          {...register("arquivos", {
            setValueAs: (v: string) => fromLines(v),
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

export function CatalogoPanel({ projetosIniciais }: { projetosIniciais: ProjectPrivate[] }) {
  const [projetos, setProjetos] = useState(projetosIniciais);
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function criar(values: CreateProjectInput): Promise<string | null> {
    const res = await fetch("/api/catalog/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string" ? data.message : "Não foi possível criar o projeto.";
    }
    setProjetos((prev) => [data as ProjectPrivate, ...prev]);
    setCriando(false);
    return null;
  }

  async function editar(id: string, values: CreateProjectInput): Promise<string | null> {
    const res = await fetch(`/api/catalog/projects/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string"
        ? data.message
        : "Não foi possível salvar o projeto.";
    }
    setProjetos((prev) => prev.map((p) => (p.id === id ? (data as ProjectPrivate) : p)));
    setEditandoId(null);
    return null;
  }

  async function excluir(id: string) {
    setErroGeral(null);
    if (!window.confirm("Excluir este projeto do catálogo?")) return;
    const res = await fetch(`/api/catalog/projects/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => null);
      setErroGeral(
        typeof data?.message === "string" ? data.message : "Não foi possível excluir o projeto.",
      );
      return;
    }
    setProjetos((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      {erroGeral && (
        <Alert variant="danger">
          <AlertDescription>{erroGeral}</AlertDescription>
        </Alert>
      )}

      {projetos.length === 0 && !criando && (
        <p className="text-sm text-[#5B6875]">Nenhum projeto publicado no catálogo ainda.</p>
      )}

      <div className="flex flex-col gap-3">
        {projetos.map((projeto) =>
          editandoId === projeto.id ? (
            <Card key={projeto.id}>
              <CardContent className="pt-4">
                <ProjectForm
                  initial={{
                    titulo: projeto.titulo,
                    categoria: projeto.categoria,
                    precoCentavos: projeto.precoCentavos,
                    descricao: projeto.descricao ?? undefined,
                    imagemCapaUrl: projeto.imagemCapaUrl ?? undefined,
                    licenca: projeto.licenca ?? undefined,
                    arquivos: projeto.arquivos,
                  }}
                  submitLabel="Salvar"
                  onCancel={() => setEditandoId(null)}
                  onSubmit={(values) => editar(projeto.id, values)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card key={projeto.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{projeto.titulo}</CardTitle>
                    <Badge>{projeto.categoria}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[#7A828C]">
                    {formatMoney(projeto.precoCentavos)} · {projeto.vendasCount} venda
                    {projeto.vendasCount === 1 ? "" : "s"} · {projeto.arquivos.length} arquivo
                    {projeto.arquivos.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditandoId(projeto.id)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => excluir(projeto.id)}>
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
            <ProjectForm submitLabel="Publicar projeto" onCancel={() => setCriando(false)} onSubmit={criar} />
          </CardContent>
        </Card>
      ) : (
        <Button size="sm" variant="secondary" className="self-start" onClick={() => setCriando(true)}>
          + Novo projeto
        </Button>
      )}
    </div>
  );
}
