import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre — ConectaObra",
  description: "O que é o ConectaObra e como a plataforma funciona.",
};

export default function SobrePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
        ← ConectaObra
      </Link>

      <div>
        <h1 className="text-2xl font-black text-grafite">Sobre o ConectaObra</h1>
        <p className="mt-4 text-sm leading-relaxed text-grafite/80">
          O ConectaObra é uma plataforma que conecta quem tem uma obra a prestadores e
          fornecedores da região, com pagamento garantido: o valor de cada etapa fica em conta
          garantida (escrow) e só é liberado depois que o cliente aprova a entrega.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-grafite/80">
          Além do marketplace, oferecemos um engenheiro virtual com IA especializada pra tirar
          dúvidas técnicas, e um espaço pra vender material de obra que sobrou, direto com quem
          está construindo.
        </p>
      </div>
    </main>
  );
}
