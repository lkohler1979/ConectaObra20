"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createProductInputSchema,
  type CreateProductInput,
  type ImportProductsResult,
  type ProductPublic,
} from "@conectaobra/types/catalog";
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

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function centavosToReaisInput(centavos: number | null | undefined): string {
  return centavos != null ? (centavos / 100).toFixed(2) : "";
}

/** Sem upload de arquivo wired ainda (P-018) — fotos entram como lista separada por linha, mesmo padrão de catalogo-panel.tsx. */
function toLines(values: string[]): string {
  return values.join("\n");
}

function fromLines(value: string): string[] {
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
}

interface ProdutoFormInitial {
  nome: string;
  categoria: string;
  precoCentavos: number;
  unidade: string;
  estoque: number | null;
  codigo: string | null;
  descricao: string | null;
  fotos: string[];
}

function ProdutoForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: ProdutoFormInitial;
  onSubmit: (values: CreateProductInput) => Promise<string | null>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductInputSchema),
    defaultValues: {
      nome: initial?.nome ?? "",
      categoria: initial?.categoria ?? "",
      unidade: initial?.unidade ?? "",
      codigo: initial?.codigo ?? undefined,
      descricao: initial?.descricao ?? undefined,
      // string já juntada (toLines), nunca o array puro — mesmo motivo do
      // bug em conta/*/perfil-form.tsx (setValueAs: fromLines espera string).
      fotos: toLines(initial?.fotos ?? []) as unknown as string[],
    },
  });

  async function handle(values: CreateProductInput) {
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

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nome" htmlFor="nome" error={errors.nome?.message}>
          <Input id="nome" {...register("nome")} />
        </FormField>
        <FormField label="Categoria" htmlFor="categoria" error={errors.categoria?.message}>
          <Input id="categoria" {...register("categoria")} />
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField
          label="Preço (R$)"
          htmlFor="precoCentavos"
          error={errors.precoCentavos?.message}
        >
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
        <FormField label="Unidade" htmlFor="unidade" error={errors.unidade?.message}>
          <Input id="unidade" placeholder="un, m², saco" {...register("unidade")} />
        </FormField>
        <FormField label="Estoque (opcional)" htmlFor="estoque" error={errors.estoque?.message}>
          <Input
            id="estoque"
            type="number"
            min={0}
            defaultValue={initial?.estoque ?? ""}
            {...register("estoque", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
          />
        </FormField>
      </div>

      <FormField label="Código (SKU, opcional)" htmlFor="codigo" error={errors.codigo?.message}>
        <Input id="codigo" {...register("codigo")} />
      </FormField>

      <FormField
        label="Descrição (opcional)"
        htmlFor="descricao"
        error={errors.descricao?.message}
      >
        <Textarea id="descricao" {...register("descricao")} />
      </FormField>

      <FormField label="Fotos (uma URL por linha, opcional)" htmlFor="fotos" error={errors.fotos?.message}>
        <Textarea
          id="fotos"
          rows={3}
          placeholder="https://…"
          defaultValue={toLines(initial?.fotos ?? [])}
          {...register("fotos", {
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

function ImportarPlanilha({ onImported }: { onImported: (result: ImportProductsResult) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ImportProductsResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setErro("Selecione um arquivo .xlsx ou .xls");
      return;
    }

    setEnviando(true);
    setErro(null);
    setResultado(null);

    const formData = new FormData();
    formData.set("file", file);

    const res = await fetch("/api/products/import", { method: "POST", body: formData });
    const data = await res.json().catch(() => null);
    setEnviando(false);

    if (!res.ok) {
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível importar a planilha.",
      );
      return;
    }

    const result = data as ImportProductsResult;
    setResultado(result);
    onImported(result);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4">
        <CardTitle>Importar planilha (Excel)</CardTitle>
        <p className="text-xs text-[#7A828C]">
          Colunas esperadas: código, descrição, unidade, valor. Produtos existentes com o mesmo
          código são atualizados; os demais são criados com categoria &quot;Geral&quot;.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="text-sm text-grafite"
          />
          <Button type="submit" size="sm" disabled={enviando}>
            {enviando ? "Importando…" : "Importar"}
          </Button>
        </form>
        {erro && (
          <Alert variant="danger">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}
        {resultado && (
          <Alert variant={resultado.erros.length > 0 ? "disclaimer" : "success"}>
            <AlertDescription>
              {resultado.criados} criado(s), {resultado.atualizados} atualizado(s) de{" "}
              {resultado.totalLinhas} linha(s).
              {resultado.erros.length > 0 && (
                <ul className="mt-2 list-disc pl-4">
                  {resultado.erros.map((e) => (
                    <li key={e.linha}>
                      Linha {e.linha}: {e.motivo}
                    </li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export function ProdutosPanel({ produtosIniciais }: { produtosIniciais: ProductPublic[] }) {
  const [produtos, setProdutos] = useState(produtosIniciais);
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function criar(values: CreateProductInput): Promise<string | null> {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string" ? data.message : "Não foi possível criar o produto.";
    }
    setProdutos((prev) => [data as ProductPublic, ...prev]);
    setCriando(false);
    return null;
  }

  async function editar(id: string, values: CreateProductInput): Promise<string | null> {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return typeof data?.message === "string"
        ? data.message
        : "Não foi possível salvar o produto.";
    }
    setProdutos((prev) => prev.map((p) => (p.id === id ? (data as ProductPublic) : p)));
    setEditandoId(null);
    return null;
  }

  async function excluir(id: string) {
    setErroGeral(null);
    if (!window.confirm("Excluir este produto?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => null);
      setErroGeral(
        typeof data?.message === "string" ? data.message : "Não foi possível excluir o produto.",
      );
      return;
    }
    setProdutos((prev) => prev.filter((p) => p.id !== id));
  }

  function recarregarAposImport() {
    // O import faz upsert direto no banco — não dá pra saber quais produtos
    // mudaram sem uma nova busca completa da lista.
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-4">
      <ImportarPlanilha onImported={recarregarAposImport} />

      {erroGeral && (
        <Alert variant="danger">
          <AlertDescription>{erroGeral}</AlertDescription>
        </Alert>
      )}

      {produtos.length === 0 && !criando && (
        <p className="text-sm text-[#5B6875]">Nenhum produto cadastrado ainda.</p>
      )}

      <div className="flex flex-col gap-3">
        {produtos.map((produto) =>
          editandoId === produto.id ? (
            <Card key={produto.id}>
              <CardContent className="pt-4">
                <ProdutoForm
                  initial={produto}
                  submitLabel="Salvar"
                  onCancel={() => setEditandoId(null)}
                  onSubmit={(values) => editar(produto.id, values)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card key={produto.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-4">
                <div className="flex items-center gap-3">
                  {produto.fotos[0] && (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
                      <Image src={produto.fotos[0]} alt={produto.nome} fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{produto.nome}</CardTitle>
                      {produto.codigo && <Badge>{produto.codigo}</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-[#5B6875]">
                      {formatMoney(produto.precoCentavos)} / {produto.unidade} · {produto.categoria}
                    </p>
                    {produto.descricao && (
                      <p className="mt-1 text-xs text-[#7A828C]">{produto.descricao}</p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditandoId(produto.id)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => excluir(produto.id)}>
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
            <ProdutoForm submitLabel="Criar produto" onCancel={() => setCriando(false)} onSubmit={criar} />
          </CardContent>
        </Card>
      ) : (
        <Button size="sm" variant="secondary" className="self-start" onClick={() => setCriando(true)}>
          + Novo produto
        </Button>
      )}
    </div>
  );
}
