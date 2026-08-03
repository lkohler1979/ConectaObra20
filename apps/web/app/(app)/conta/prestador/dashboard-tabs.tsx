"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@conectaobra/ui";
import type { PortfolioItemPublic } from "@conectaobra/types/portfolio";
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
}: {
  perfilAtual: PerfilPrestadorAtual | null;
  portfolioIniciais: PortfolioItemPublic[];
}) {
  return (
    <Tabs defaultValue="perfil">
      <TabsList>
        <TabsTrigger value="perfil">Perfil</TabsTrigger>
        <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
      </TabsList>

      <TabsContent value="perfil">
        <PerfilForm perfilAtual={perfilAtual} />
      </TabsContent>

      <TabsContent value="portfolio">
        <PortfolioPanel itensIniciais={portfolioIniciais} />
      </TabsContent>
    </Tabs>
  );
}
