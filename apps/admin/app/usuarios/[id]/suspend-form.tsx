"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, Button, Textarea } from "@conectaobra/ui";

export function SuspendForm({ userId, suspenso }: { userId: string; suspenso: boolean }) {
  const router = useRouter();
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function suspender() {
    setLoading(true);
    setErro(null);
    const res = await fetch(`/api/admin/users/${userId}/suspender`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível suspender a conta.",
      );
      setLoading(false);
      return;
    }
    setLoading(false);
    router.refresh();
  }

  async function reativar() {
    if (!window.confirm("Reativar esta conta?")) return;
    setLoading(true);
    setErro(null);
    const res = await fetch(`/api/admin/users/${userId}/reativar`, { method: "PATCH" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível reativar a conta.",
      );
      setLoading(false);
      return;
    }
    setLoading(false);
    router.refresh();
  }

  if (suspenso) {
    return (
      <div className="flex flex-col items-start gap-2">
        {erro && (
          <Alert variant="danger">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}
        <Button variant="success" onClick={reativar} disabled={loading}>
          {loading ? "Reativando…" : "Reativar conta"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
      <Textarea
        placeholder="Motivo da suspensão (obrigatório)"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        rows={2}
      />
      <Button
        variant="destructive"
        onClick={suspender}
        disabled={loading || motivo.trim().length < 3}
        className="self-start"
      >
        {loading ? "Suspendendo…" : "Suspender conta"}
      </Button>
    </div>
  );
}
