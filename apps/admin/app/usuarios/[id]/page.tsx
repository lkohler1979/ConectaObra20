import Link from "next/link";
import { notFound } from "next/navigation";
import type { AdminUser } from "@conectaobra/types/admin";
import { Alert, AlertDescription, Badge, Card, CardContent } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";
import { SuspendForm } from "./suspend-form";

const KYC_BADGE: Record<string, "verified" | "warning" | "danger"> = {
  APROVADO: "verified",
  PENDENTE: "warning",
  REPROVADO: "danger",
};

async function fetchUser(accessToken: string, id: string): Promise<AdminUser | null> {
  const res = await apiFetchOrThrow(`/admin/users/${id}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function UsuarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accessToken = await requireAccessToken(`/usuarios/${id}`);

  let user: AdminUser | null;
  try {
    user = await fetchUser(accessToken, id);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar este usuário agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  if (!user) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <Link href="/usuarios" className="text-sm font-semibold text-grafite hover:text-laranja">
        ← Usuários
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-grafite">{user.nome}</h1>
          <Badge>{user.tipo}</Badge>
          {user.suspenso && <Badge variant="danger">Suspenso</Badge>}
          {user.deletedAt && <Badge variant="warning">Conta excluída</Badge>}
        </div>
        <p className="mt-1 text-sm text-[#7A828C]">
          Cadastrado em {new Date(user.createdAt).toLocaleDateString("pt-BR")}
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[#7A828C]">E-mail</span>
            <span className="text-grafite">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7A828C]">Telefone</span>
            <span className="text-grafite">{user.telefone ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7A828C]">CPF/CNPJ</span>
            <span className="text-grafite">{user.cpfCnpj}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#7A828C]">KYC</span>
            <Badge variant={KYC_BADGE[user.kycStatus]}>{user.kycStatus}</Badge>
          </div>
          {user.suspenso && (
            <>
              <div className="flex justify-between">
                <span className="text-[#7A828C]">Suspenso em</span>
                <span className="text-grafite">
                  {user.suspensoEm ? new Date(user.suspensoEm).toLocaleString("pt-BR") : "—"}
                </span>
              </div>
              <div>
                <span className="text-[#7A828C]">Motivo</span>
                <p className="mt-1 text-grafite">{user.suspensoMotivo}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!user.deletedAt && <SuspendForm userId={user.id} suspenso={user.suspenso} />}
    </main>
  );
}
