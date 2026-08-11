import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@conectaobra/ui";

export const metadata: Metadata = {
  title: "Política de privacidade — ConectaObra",
  description: "Política de privacidade e tratamento de dados da plataforma ConectaObra.",
};

export default function PrivacidadePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
        ← ConectaObra
      </Link>

      <div>
        <h1 className="text-2xl font-black text-grafite">Política de privacidade</h1>
        <Alert variant="disclaimer" className="mt-4">
          <AlertDescription>
            Conteúdo em revisão jurídica — a versão final da política de privacidade (LGPD) será
            publicada aqui antes do lançamento oficial da plataforma.
          </AlertDescription>
        </Alert>
      </div>
    </main>
  );
}
