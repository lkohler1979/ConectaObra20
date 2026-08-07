import Link from "next/link";
import type { PurchaseOrderPublic } from "@conectaobra/types/purchase-orders";
import { Alert, AlertDescription, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ComprasMateriaisPage() {
  const accessToken = await requireAccessToken("/compras-materiais");

  let pedidos: PurchaseOrderPublic[];
  try {
    const res = await apiFetchOrThrow("/purchase-orders", {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    pedidos = res.ok ? await res.json() : [];
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar suas compras agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <div className="flex items-center justify-between">
        <Link href="/materiais" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← Listas de materiais
        </Link>
        <h1 className="text-2xl font-black text-grafite">Minhas compras</h1>
      </div>

      {pedidos.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhuma compra de material fechada ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map((pedido) => (
            <Card key={pedido.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle>{pedido.fornecedorNome}</CardTitle>
                  <span className="text-lg font-black text-laranja">
                    {formatMoney(pedido.totalPagoCentavos)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#7A828C]">
                  Materiais: {formatMoney(pedido.itensTotalCentavos)} · Frete:{" "}
                  {formatMoney(pedido.freteCentavos)} · Comissão: {formatMoney(pedido.comissaoCentavos)}
                </p>
                <p className="mt-1 text-xs text-[#7A828C]">
                  {new Date(pedido.createdAt).toLocaleString("pt-BR")} · {pedido.pspRef}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
