/**
 * Só aceita caminhos relativos internos (`/`, `/usuarios`), bloqueia
 * `//evil.com` (protocol-relative) e URLs absolutas, que um `?redirect=`
 * malicioso poderia usar pra mandar o admin logado pra fora do app.
 */
export function safeRedirect(path: string | null, fallback = "/"): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }
  return path;
}
