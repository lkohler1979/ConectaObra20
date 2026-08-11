import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

/**
 * Header persistente pra toda a área logada — antes cada página decidia por
 * conta própria se e para onde "voltar", o que criava becos sem saída (ex:
 * /materiais, /compras-materiais não tinham nenhum link de volta pra
 * /conta). Estático (sem verificação de sessão própria) — cada página
 * continua responsável pelo seu próprio `requireAccessToken`.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-areia">
      <header className="border-b border-concreto bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Link href="/" className="text-sm font-black text-grafite hover:text-laranja">
            ConectaObra
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/conta" className="text-sm font-semibold text-azul-planta">
              Minha conta
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
