"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TeamMemberPublic } from "@conectaobra/types/equipe";
import { Alert, AlertDescription, Button, Card, CardContent, Input } from "@conectaobra/ui";

export function EquipePanel({
  obraId,
  membros,
  souDono,
}: {
  obraId: string;
  membros: TeamMemberPublic[];
  souDono: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function adicionar() {
    setErro(null);
    setLoading(true);
    const res = await fetch(`/api/works/${obraId}/equipe`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível adicionar o membro.",
      );
      setLoading(false);
      return;
    }
    setEmail("");
    setLoading(false);
    router.refresh();
  }

  async function remover(userId: string) {
    if (!window.confirm("Remover este membro da equipe?")) return;
    const res = await fetch(`/api/works/${obraId}/equipe/${userId}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => null);
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível remover o membro.",
      );
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[#7A828C]">
        Equipe tem visualização compartilhada, só leitura — membros não ganham poder de criar RFQ,
        aprovar etapa ou aceitar proposta.
      </p>

      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {membros.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhum membro na equipe ainda.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {membros.map((membro) => (
            <Card key={membro.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-4">
                <div>
                  <p className="text-sm font-bold text-grafite">{membro.nome}</p>
                  <p className="text-xs text-[#7A828C]">{membro.email}</p>
                </div>
                {souDono && (
                  <Button size="sm" variant="destructive" onClick={() => remover(membro.userId)}>
                    Remover
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {souDono && (
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="e-mail do membro"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button size="sm" disabled={loading || !email} onClick={adicionar}>
            {loading ? "Adicionando…" : "Adicionar"}
          </Button>
        </div>
      )}
    </div>
  );
}
