/**
 * Só aceita caminhos relativos internos (`/conta`, `/conta/x`) — bloqueia
 * `//evil.com` (protocol-relative) e URLs absolutas, que um `?redirect=`
 * malicioso poderia usar pra mandar o usuário logado pra fora do app.
 */
export function safeRedirect(path: string | null, fallback = "/conta"): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }
  return path;
}
