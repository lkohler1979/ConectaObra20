import Link from "next/link";
import { Button, Card, CardContent, CardTitle } from "@conectaobra/ui";

const DIFERENCIAIS = [
  {
    titulo: "Pagamento garantido",
    descricao:
      "O valor da etapa fica em conta garantida (escrow) até você aprovar a entrega — o prestador só recebe depois.",
  },
  {
    titulo: "Prestadores da sua região",
    descricao:
      "Publique o orçamento e receba propostas de quem atende seu bairro e sua categoria de serviço.",
  },
  {
    titulo: "Engenheiro virtual",
    descricao:
      "Tire dúvidas técnicas com IA especializada, com cálculos determinísticos e recomendação de profissional habilitado quando precisar.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-areia">
      <div className="hazard" />

      <header className="flex items-center justify-between px-5 py-4">
        <span className="text-lg font-black text-grafite">
          Conecta<span className="text-laranja">Obra</span>
        </span>
        <nav className="flex items-center gap-3">
          <Link
            href="/entrar"
            className="text-sm font-semibold text-grafite hover:text-laranja"
          >
            Entrar
          </Link>
          <Link href="/cadastro">
            <Button size="sm">Cadastrar</Button>
          </Link>
        </nav>
      </header>

      <section className="grid gap-8 px-5 py-10 md:grid-cols-2 md:items-center md:py-16">
        <div>
          <h1 className="text-3xl font-black leading-tight text-grafite md:text-4xl">
            Sua obra, do orçamento ao pagamento, num só lugar.
          </h1>
          <p className="mt-4 text-base text-grafite/80">
            Publique sua obra, compare propostas de prestadores e fornecedores
            da sua região e pague com segurança — o dinheiro só sai da conta
            garantida depois que você aprovar cada etapa.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/cadastro">
              <Button>Publicar minha obra</Button>
            </Link>
            <Link href="/cadastro">
              <Button variant="secondary">Sou prestador ou fornecedor</Button>
            </Link>
          </div>
        </div>

        <div className="rounded bg-grafite p-6 text-white shadow md:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-laranja">
            Como funciona
          </p>
          <ol className="mt-3 space-y-2 text-sm text-white/90">
            <li>1. Você publica a obra e o orçamento (RFQ).</li>
            <li>2. Prestadores da região enviam propostas.</li>
            <li>3. Você aceita e assina o contrato digital.</li>
            <li>4. Deposita na conta garantida (escrow).</li>
            <li>5. Aprova cada etapa entregue — o pagamento é liberado.</li>
          </ol>
        </div>
      </section>

      <section className="grid gap-4 px-5 pb-16 md:grid-cols-3">
        {DIFERENCIAIS.map((item) => (
          <Card key={item.titulo}>
            <CardContent className="pt-4">
              <CardTitle>{item.titulo}</CardTitle>
              <p className="mt-2 text-sm text-[#5B6875]">{item.descricao}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
