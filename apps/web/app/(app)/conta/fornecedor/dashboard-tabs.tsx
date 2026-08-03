"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@conectaobra/ui";
import type { FornecedorLojaPublic } from "@conectaobra/types/fornecedor-lojas";
import type { PromocaoPrivate } from "@conectaobra/types/promocoes";
import type { ProductPublic } from "@conectaobra/types/catalog";
import type { AdPrivate } from "@conectaobra/types/ads";
import { AdsPanel } from "@/components/ads-panel";
import { PerfilForm } from "./perfil-form";
import { LojasPanel } from "./lojas-panel";
import { PromocoesPanel } from "./promocoes-panel";
import { ProdutosPanel } from "./produtos-panel";

interface PerfilFornecedorAtual {
  razaoSocial: string;
  categorias: string[];
  regioes: string[];
  tempoMercadoAnos: number | null;
  certificacoes: string[];
}

export function FornecedorDashboardTabs({
  perfilAtual,
  lojasIniciais,
  promocoesIniciais,
  produtosIniciais,
  adsIniciais,
}: {
  perfilAtual: PerfilFornecedorAtual | null;
  lojasIniciais: FornecedorLojaPublic[];
  promocoesIniciais: PromocaoPrivate[];
  produtosIniciais: ProductPublic[];
  adsIniciais: AdPrivate[];
}) {
  return (
    <Tabs defaultValue="perfil">
      <TabsList>
        <TabsTrigger value="perfil">Perfil</TabsTrigger>
        <TabsTrigger value="lojas">Lojas</TabsTrigger>
        <TabsTrigger value="promocoes">Promoções</TabsTrigger>
        <TabsTrigger value="produtos">Produtos</TabsTrigger>
        <TabsTrigger value="anuncios">Anúncios</TabsTrigger>
      </TabsList>

      <TabsContent value="perfil">
        <PerfilForm perfilAtual={perfilAtual} />
      </TabsContent>

      <TabsContent value="lojas">
        <LojasPanel lojasIniciais={lojasIniciais} />
      </TabsContent>

      <TabsContent value="promocoes">
        <PromocoesPanel promocoesIniciais={promocoesIniciais} />
      </TabsContent>

      <TabsContent value="produtos">
        <ProdutosPanel produtosIniciais={produtosIniciais} />
      </TabsContent>

      <TabsContent value="anuncios">
        <AdsPanel adsIniciais={adsIniciais} />
      </TabsContent>
    </Tabs>
  );
}
