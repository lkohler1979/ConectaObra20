"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@conectaobra/ui";
import type { PortfolioItemPublic } from "@conectaobra/types/portfolio";
import type { AdPrivate } from "@conectaobra/types/ads";
import { AdsPanel } from "@/components/ads-panel";
import { PerfilForm } from "./perfil-form";
import { PortfolioPanel } from "./portfolio-panel";

interface PerfilPrestadorAtual {
  categorias: string[];
  experienciaAnos: number | null;
  certificados: string[];
  raioAtendimentoKm: number | null;
}

export function PrestadorDashboardTabs({
  perfilAtual,
  portfolioIniciais,
  adsIniciais,
}: {
  perfilAtual: PerfilPrestadorAtual | null;
  portfolioIniciais: PortfolioItemPublic[];
  adsIniciais: AdPrivate[];
}) {
  return (
    <Tabs defaultValue="perfil">
      <TabsList>
        <TabsTrigger value="perfil">Perfil</TabsTrigger>
        <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
        <TabsTrigger value="anuncios">Anúncios</TabsTrigger>
      </TabsList>

      <TabsContent value="perfil">
        <PerfilForm perfilAtual={perfilAtual} />
      </TabsContent>

      <TabsContent value="portfolio">
        <PortfolioPanel itensIniciais={portfolioIniciais} />
      </TabsContent>

      <TabsContent value="anuncios">
        <AdsPanel adsIniciais={adsIniciais} />
      </TabsContent>
    </Tabs>
  );
}
