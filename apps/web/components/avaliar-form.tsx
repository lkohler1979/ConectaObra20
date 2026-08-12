"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, Button, Textarea } from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

/** Avaliação aberta de fornecedor/produto — qualquer usuário logado, sem exigir contrato. */
export function AvaliarForm({
  tipo,
  targetId,
  redirectPath,
}: {
  tipo: "FORNECEDOR" | "PRODUTO";
  targetId: string;
  redirectPath: string;
}) {
  const router = useRouter();
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);

  async function enviar() {
    setErro(null);
    setLoading(true);
    const body =
      tipo === "FORNECEDOR"
        ? { tipo, fornecedorId: targetId, nota, comentario: comentario || undefined }
        : { tipo, produtoId: targetId, nota, comentario: comentario || undefined };
    const res = await fetch("/api/avaliacoes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);

    if (res.status === 401) {
      router.push(`/entrar?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível enviar sua avaliação.",
      );
      return;
    }
    setComentario("");
    setSucesso(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
      {sucesso && (
        <Alert variant="disclaimer">
          <AlertDescription>Avaliação registrada — obrigado!</AlertDescription>
        </Alert>
      )}

      <FormField label="Nota" htmlFor="nota">
        <select
          id="nota"
          value={nota}
          onChange={(e) => setNota(Number(e.target.value))}
          className="w-full rounded-md border-[1.5px] border-concreto bg-white px-3 py-[11px] text-sm text-grafite focus:border-azul-planta focus:outline-none focus:ring-2 focus:ring-azul-planta-claro"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} — {"★".repeat(n)}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Comentário (opcional)" htmlFor="comentario">
        <Textarea
          id="comentario"
          rows={3}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
      </FormField>
      <Button size="sm" disabled={loading} onClick={enviar} className="self-start">
        {loading ? "Enviando…" : "Avaliar"}
      </Button>
    </div>
  );
}
