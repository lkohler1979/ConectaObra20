import Image from "next/image";
import Link from "next/link";
import type { PromocaoPublic } from "@conectaobra/types/promocoes";
import type { AdPublic } from "@conectaobra/types/ads";
import type { IndicatorPublic } from "@conectaobra/types/indicators";
import { Badge, Button, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { apiFetchOrThrow } from "@/lib/api-client";
import { CubChart, type CubChartPoint } from "@/components/cub-chart";

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Decorativo — se a API estiver fora do ar, a home simplesmente não mostra a seção. */
async function fetchPromocoesDestaque(): Promise<PromocaoPublic[]> {
  try {
    const res = await apiFetchOrThrow("/public/promocoes?destaque=true&limit=3", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/** Decorativo, mesmo critério "fail open" da seção de promoções acima. */
async function fetchAdsDestaque(): Promise<AdPublic[]> {
  try {
    const res = await apiFetchOrThrow("/public/ads?limit=3", { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function formatMesLabel(referenciaMes: string): string {
  const label = new Date(referenciaMes).toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
  return label.replace(".", "");
}

/**
 * CUB-ES sincronizado diariamente (`CubSyncService`, `services/api/src/modules/content/`)
 * — decorativo, mesmo critério "fail open" das seções acima.
 */
async function fetchCubHistorico(): Promise<CubChartPoint[]> {
  try {
    const [cubRes, desoneradoRes] = await Promise.all([
      apiFetchOrThrow("/public/indicators?tipo=CUB&regiao=ES&limit=12", { cache: "no-store" }),
      apiFetchOrThrow("/public/indicators?tipo=CUB_DESONERADO&regiao=ES&limit=12", {
        cache: "no-store",
      }),
    ]);
    if (!cubRes.ok || !desoneradoRes.ok) return [];

    const cub: IndicatorPublic[] = await cubRes.json();
    const desonerado: IndicatorPublic[] = await desoneradoRes.json();
    const desoneradoPorMes = new Map(desonerado.map((d) => [d.referenciaMes, d.valorCentavos]));

    return cub
      .slice()
      .reverse()
      .map((item) => ({
        mesLabel: formatMesLabel(item.referenciaMes),
        cub: item.valorCentavos / 100,
        desonerado: (desoneradoPorMes.get(item.referenciaMes) ?? 0) / 100,
      }));
  } catch {
    return [];
  }
}

function anuncianteProfileHref(ad: AdPublic): string {
  return ad.anuncianteTipo === "FORNECEDOR"
    ? `/fornecedores/${ad.anuncianteId}`
    : `/prestadores/${ad.anuncianteId}`;
}

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

export default async function LandingPage() {
  const [promocoesDestaque, adsDestaque, cubHistorico] = await Promise.all([
    fetchPromocoesDestaque(),
    fetchAdsDestaque(),
    fetchCubHistorico(),
  ]);

  return (
    <main className="min-h-screen bg-areia">
      <div className="hazard" />

      <header className="flex items-center justify-between px-5 py-4">
        <span className="text-lg font-black text-grafite">
          Conecta<span className="text-laranja">Obra</span>
        </span>
        <nav className="flex items-center gap-3">
          <Link
            href="/busca"
            className="text-sm font-semibold text-grafite hover:text-laranja"
          >
            Buscar
          </Link>
          <Link
            href="/sobras"
            className="text-sm font-semibold text-grafite hover:text-laranja"
          >
            Sobra de material
          </Link>
          <Link
            href="/conta"
            className="text-sm font-semibold text-grafite hover:text-laranja"
          >
            Minha conta
          </Link>
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

      {adsDestaque.length > 0 && (
        <section className="px-5 pb-10">
          <h2 className="text-lg font-bold text-grafite">Anúncios de fornecedores e prestadores</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {adsDestaque.map((ad) => {
              const external = Boolean(ad.linkUrl);
              return (
                <Link
                  key={ad.id}
                  href={ad.linkUrl ?? anuncianteProfileHref(ad)}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                >
                  <Card className="h-full transition-colors hover:border-azul-planta">
                    {ad.imagemUrl && (
                      <div className="relative h-28 w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={ad.imagemUrl}
                          alt={ad.titulo}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <CardTitle>{ad.titulo}</CardTitle>
                        <Badge>Anúncio</Badge>
                      </div>
                      <p className="mt-1 text-xs text-[#7A828C]">{ad.anuncianteNome}</p>
                      {ad.descricao && (
                        <p className="mt-1 text-sm text-grafite/80">{ad.descricao}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {promocoesDestaque.length > 0 && (
        <section className="px-5 pb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-grafite">Promoções em destaque</h2>
            <Link href="/promocoes" className="text-sm font-semibold text-azul-planta">
              Ver todas →
            </Link>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {promocoesDestaque.map((promo) => (
              <Link key={promo.id} href="/promocoes">
                <Card className="h-full transition-colors hover:border-azul-planta">
                  {promo.imagemUrl && (
                    <div className="relative h-28 w-full overflow-hidden rounded-t-lg">
                      <Image
                        src={promo.imagemUrl}
                        alt={promo.nome}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <CardContent className="pt-4">
                    <CardTitle>{promo.nome}</CardTitle>
                    <p className="mt-1 text-xs text-[#7A828C]">{promo.fornecedorNome}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {promo.valorOriginalCentavos != null && (
                        <span className="text-xs text-[#7A828C] line-through">
                          {formatMoney(promo.valorOriginalCentavos)}
                        </span>
                      )}
                      <Badge variant="verified">
                        {formatMoney(promo.valorPromocionalCentavos)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {cubHistorico.length > 0 && (
        <section className="px-5 pb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-grafite">
              CUB-ES — últimos {cubHistorico.length} meses
            </h2>
            <Link href="/indicadores?tipo=CUB" className="text-sm font-semibold text-azul-planta">
              Ver histórico completo →
            </Link>
          </div>
          <p className="mt-1 text-xs text-[#7A828C]">
            Custo Unitário Básico da construção civil no ES, por m² — fonte: Sinduscon-ES.
          </p>
          <Card className="mt-3">
            <CardContent className="pt-4">
              <CubChart data={cubHistorico} />
            </CardContent>
          </Card>
        </section>
      )}

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

      <footer className="flex flex-col items-center gap-2 border-t border-concreto px-5 py-6 text-xs text-[#7A828C]">
        <nav className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/sobre" className="hover:text-laranja">
            Sobre
          </Link>
          <Link href="/contato" className="hover:text-laranja">
            Contato
          </Link>
        </nav>
        <a
          href={process.env.ADMIN_URL ?? "http://localhost:3096"}
          className="text-[10px] text-[#B0B6BC] hover:text-[#7A828C]"
        >
          Admin
        </a>
      </footer>
    </main>
  );
}
