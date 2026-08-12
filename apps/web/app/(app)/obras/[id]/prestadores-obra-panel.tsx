"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AvaliacaoPublic } from "@conectaobra/types/avaliacoes";
import { Alert, AlertDescription, Badge, Button, Card, CardContent, Input, Textarea } from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

export function PrestadoresObraPanel({
  obraId,
  avaliacoes,
  souDono,
}: {
  obraId: string;
  avaliacoes: AvaliacaoPublic[];
  souDono: boolean;
}) {
  const router = useRouter();
  const [prestadorEmail, setPrestadorEmail] = useState("");
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function cadastrar() {
    setErro(null);
    setLoading(true);
    const res = await fetch("/api/avaliacoes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tipo: "PRESTADOR",
        prestadorEmail,
        obraId,
        nota,
        comentario: comentario || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível cadastrar a avaliação.",
      );
      return;
    }
    setPrestadorEmail("");
    setComentario("");
    setNota(5);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[#7A828C]">
        Cadastre um prestador que trabalhou nesta obra e avalie o serviço — não exige RFQ/contrato
        formal na plataforma, é um registro aberto do cliente sobre o serviço recebido.
      </p>

      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {avaliacoes.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhum prestador cadastrado nesta obra ainda.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {avaliacoes.map((avaliacao) => (
            <Card key={avaliacao.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-4">
                <div>
                  <p className="text-sm font-bold text-grafite">{avaliacao.autorNome}</p>
                  {avaliacao.comentario && (
                    <p className="mt-1 text-sm text-grafite/80">{avaliacao.comentario}</p>
                  )}
                </div>
                <Badge variant="verified">★ {avaliacao.nota}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {souDono && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-4">
            <FormField label="E-mail do prestador" htmlFor="prestadorEmail">
              <Input
                id="prestadorEmail"
                type="email"
                placeholder="prestador@example.com"
                value={prestadorEmail}
                onChange={(e) => setPrestadorEmail(e.target.value)}
              />
            </FormField>
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
            <Button size="sm" disabled={loading || !prestadorEmail} onClick={cadastrar}>
              {loading ? "Salvando…" : "Cadastrar avaliação"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
