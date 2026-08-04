import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE } from "./session";

/**
 * Lê o access token do cookie httpOnly; redireciona pro login (preservando
 * ?redirect=currentPath) se não houver sessão. Uso em Server Components —
 * o middleware.ts já cobre isso antes da página renderizar, mas cada página
 * confirma de novo, não depende só do matcher do middleware estar atualizado.
 */
export async function requireAccessToken(currentPath: string): Promise<string> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    redirect(`/entrar?redirect=${encodeURIComponent(currentPath)}`);
  }
  return token;
}
