import Link from "next/link";
import type { ProjectPurchasePublic } from "@conectaobra/types/projects-catalog";
import { Alert, AlertDescription, Badge, Card, CardContent } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function MinhasComprasPage() {
  const accessToken = await requireAccessToken("/compras");
  const authHeader = { authorization: `Bearer ${accessToken}` };

  let compras: ProjectPurchasePublic[];
  try {
    const res = await apiFetchOrThrow("/catalog/purchases", {
      headers: authHeader,
      cache: "no-store",
    });
    compras = res.ok ? await res.json() : [];
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
        <Link href="/catalogo" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← Catálogo de plantas
        </Link>
        <Link href="/conta" className="text-sm font-semibold text-azul-planta">
          Minha conta
        </Link>
      </div>

      <h1 className="text-2xl font-black text-grafite">Minhas compras</h1>

      {compras.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Você ainda não comprou nenhum projeto.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {compras.map((compra) => (
            <Card key={compra.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-grafite">
                      {formatMoney(compra.precoCentavos)}
                    </span>
                    {!compra.marcaDaguaAplicada && (
                      <Badge variant="warning">Sem marca d&apos;água</Badge>
                    )}
                  </div>
                  <span className="text-xs text-[#7A828C]">
                    {new Date(compra.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <Link
                  href={`/catalogo/${compra.projectId}`}
                  className="mt-1 inline-block text-xs font-semibold text-azul-planta hover:underline"
                >
                  Ver projeto →
                </Link>
                <div className="mt-2 flex flex-col gap-1">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
