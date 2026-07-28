"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@conectaobra/ui";

export function AcceptProposalButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleAccept() {
    if (
      !window.confirm(
        "Aceitar esta proposta? As demais propostas deste RFQ serão recusadas automaticamente.",
      )
    ) {
      return;
    }

    setLoading(true);
    setErro(null);
    const res = await fetch(`/api/proposals/${proposalId}/accept`, { method: "POST" });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível aceitar a proposta.",
      );
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="success" onClick={handleAccept} disabled={loading}>
        {loading ? "Aceitando…" : "Aceitar"}
      </Button>
      {erro && <p className="text-xs text-vermelho">{erro}</p>}
    </div>
  );
}
