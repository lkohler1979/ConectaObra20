import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contato — ConectaObra",
  description: "Como falar com o ConectaObra.",
};

export default function ContatoPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
        ← ConectaObra
      </Link>

      <div>
        <h1 className="text-2xl font-black text-grafite">Contato</h1>
        <p className="mt-4 text-sm leading-relaxed text-grafite/80">
          Dúvidas, sugestões ou problemas com a plataforma? Escreva pra gente:
        </p>
        <a
          href="mailto:contato@conectaon.unifyhub.com.br"
          className="mt-2 inline-block text-sm font-semibold text-azul-planta hover:underline"
        >
          contato@conectaon.unifyhub.com.br
        </a>
      </div>
    </main>
  );
}
