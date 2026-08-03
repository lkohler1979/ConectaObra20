"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@conectaobra/ui";
import type { FornecedorLojaPublic } from "@conectaobra/types/fornecedor-lojas";
import type { PromocaoPrivate } from "@conectaobra/types/promocoes";
import { PerfilForm } from "./perfil-form";
import { LojasPanel } from "./lojas-panel";
import { PromocoesPanel } from "./promocoes-panel";

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
}: {
  perfilAtual: PerfilFornecedorAtual | null;
  lojasIniciais: FornecedorLojaPublic[];
  promocoesIniciais: PromocaoPrivate[];
}) {
  return (
    <Tabs defaultValue="perfil">
      <TabsList>
        <TabsTrigger value="perfil">Perfil</TabsTrigger>
        <TabsTrigger value="lojas">Lojas</TabsTrigger>
        <TabsTrigger value="promocoes">Promoções</TabsTrigger>
        <TabsTrigger value="produtos">Produtos</TabsTrigger>
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
        <p className="text-sm text-[#5B6875]">
          Cadastro de produtos e import de planilha chegam em breve nesta tela — a API já está
          disponível em <code className="text-xs">POST /products</code> e{" "}
          <code className="text-xs">POST /products/import</code>.
        </p>
      </TabsContent>
    </Tabs>
  );
}
