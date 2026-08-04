import Link from "next/link";
import type { AdminUser, AdminUserType } from "@conectaobra/types/admin";
import { Alert, AlertDescription, Badge, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { requireAccessToken } from "@/lib/auth-session";

const TIPO_OPTIONS: { value: AdminUserType; label: string }[] = [
  { value: "CLIENTE_PF", label: "Cliente (PF)" },
  { value: "CLIENTE_PJ", label: "Cliente (PJ)" },
  { value: "PRESTADOR", label: "Prestador" },
  { value: "FORNECEDOR", label: "Fornecedor" },
  { value: "TECNICO", label: "Técnico" },
  { value: "ADMIN", label: "Admin" },
];

async function fetchUsers(
  accessToken: string,
  filters: { tipo?: string; q?: string; suspenso?: string },
): Promise<AdminUser[]> {
  const params = new URLSearchParams({ limit: "50" });
  if (filters.tipo) params.set("tipo", filters.tipo);
  if (filters.q) params.set("q", filters.q);
  if (filters.suspenso) params.set("suspenso", filters.suspenso);

  const res = await apiFetchOrThrow(`/admin/users?${params.toString()}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; q?: string; suspenso?: string }>;
}) {
  const accessToken = await requireAccessToken("/usuarios");
  const { tipo, q, suspenso } = await searchParams;

  let users: AdminUser[];
  try {
    users = await fetchUsers(accessToken, { tipo, q, suspenso });
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar os usuários agora — o serviço está indisponível. Tente
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
        <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← Painel
        </Link>
        <h1 className="text-2xl font-black text-grafite">Usuários</h1>
      </div>

      <form className="flex flex-wrap gap-2" method="GET">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Nome ou e-mail"
          className="rounded-md border-[1.5px] border-concreto bg-white px-3 py-[9px] text-sm text-grafite"
        />
        <select
          name="tipo"
          defaultValue={tipo ?? ""}
          className="rounded-md border-[1.5px] border-concreto bg-white px-3 py-[9px] text-sm text-grafite"
        >
          <option value="">Todos os tipos</option>
          {TIPO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          name="suspenso"
          defaultValue={suspenso ?? ""}
          className="rounded-md border-[1.5px] border-concreto bg-white px-3 py-[9px] text-sm text-grafite"
        >
          <option value="">Ativos e suspensos</option>
          <option value="true">Só suspensos</option>
          <option value="false">Só ativos</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-laranja px-4 py-[9px] text-sm font-bold text-white"
        >
          Filtrar
        </button>
      </form>

      {users.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhum usuário encontrado.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {users.map((user) => (
            <Link key={user.id} href={`/usuarios/${user.id}`}>
              <Card className="transition-colors hover:border-azul-planta">
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{user.nome}</CardTitle>
                      <Badge>{user.tipo}</Badge>
                      {user.suspenso && <Badge variant="danger">Suspenso</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-[#7A828C]">{user.email}</p>
                  </div>
                  <span className="shrink-0 text-xs text-[#7A828C]">
                    {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
