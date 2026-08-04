"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectPurchasePublic } from "@conectaobra/types/projects-catalog";
import { Alert, AlertDescription, Button } from "@conectaobra/ui";

export function ComprarButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [compra, setCompra] = useState<ProjectPurchasePublic | null>(null);

  async function handleComprar() {
    setLoading(true);
    setErro(null);
    const res = await fetch(`/api/catalog/projects/${projectId}/buy`, { method: "POST" });

    if (res.status === 401) {
      router.push(`/entrar?redirect=${encodeURIComponent(`/catalogo/${projectId}`)}`);
      return;
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setErro(typeof data?.message === "string" ? data.message : "Não foi possível concluir a compra.");
      setLoading(false);
      return;
    }

    setCompra(data as ProjectPurchasePublic);
    setLoading(false);
    router.refresh();
  }

  if (compra) {
    return (
      <div className="flex flex-col gap-2">
        <Alert variant="success">
          <AlertDescription>Compra concluída! Seus arquivos:</AlertDescription>
        </Alert>
        <div className="flex flex-col gap-1">
          {compra.arquivosEntregues.map((url, i) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-azul-planta hover:underline"
            >
              Baixar arquivo {i + 1} →
            </a>
          ))}
        </div>
        {!compra.marcaDaguaAplicada && (
          <p className="text-xs text-[#7A828C]">
            Entregue sem marca d&apos;água (armazenamento de arquivos não configurado neste
            ambiente).
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button onClick={handleComprar} disabled={loading}>
        {loading ? "Processando…" : "Comprar"}
      </Button>
      {erro && <p className="text-xs text-vermelho">{erro}</p>}
    </div>
  );
}
