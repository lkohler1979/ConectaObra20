-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "user_type" AS ENUM ('CLIENTE_PF', 'CLIENTE_PJ', 'PRESTADOR', 'FORNECEDOR', 'TECNICO', 'ADMIN');

-- CreateEnum
CREATE TYPE "kyc_status" AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO');

-- CreateEnum
CREATE TYPE "work_type" AS ENUM ('REFORMA', 'CONSTRUCAO', 'AMPLIACAO');

-- CreateEnum
CREATE TYPE "rfq_status" AS ENUM ('ABERTO', 'EM_ANALISE', 'CONTRATADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "rfq_proposal_status" AS ENUM ('ENVIADA', 'ACEITA', 'RECUSADA');

-- CreateEnum
CREATE TYPE "contract_party_role" AS ENUM ('CONTRATANTE', 'CONTRATADO');

-- CreateEnum
CREATE TYPE "milestone_status" AS ENUM ('PENDENTE', 'EM_EXECUCAO', 'ENTREGUE', 'APROVADO', 'EM_DISPUTA', 'PAGO');

-- CreateEnum
CREATE TYPE "escrow_transaction_type" AS ENUM ('DEPOSITO', 'LIBERACAO', 'ESTORNO', 'COMISSAO');

-- CreateEnum
CREATE TYPE "material_list_origin" AS ENUM ('MANUAL', 'IA');

-- CreateEnum
CREATE TYPE "project_category" AS ENUM ('CASA', 'SOBRADO', 'GALPAO', 'CHACARA', 'CONDOMINIO');

-- CreateEnum
CREATE TYPE "indicator_type" AS ENUM ('CUB', 'INCC', 'SINAPI', 'ACO', 'CIMENTO', 'MADEIRA');

-- CreateEnum
CREATE TYPE "ad_type" AS ENUM ('CPC', 'CPM', 'DESTAQUE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tipo" "user_type" NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "cpf_cnpj" TEXT NOT NULL,
    "kyc_status" "kyc_status" NOT NULL DEFAULT 'PENDENTE',
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles_prestador" (
    "user_id" UUID NOT NULL,
    "categorias" TEXT[],
    "experiencia_anos" INTEGER,
    "certificados" TEXT[],
    "raio_atendimento_km" INTEGER,
    "geo" geography(Point, 4326),
    "selo" TEXT,
    "nota_media" DECIMAL(3,2),
    "agenda_config" JSONB,

    CONSTRAINT "profiles_prestador_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "profiles_fornecedor" (
    "user_id" UUID NOT NULL,
    "razao_social" TEXT NOT NULL,
    "categorias" TEXT[],
    "regioes" TEXT[],
    "tempo_mercado_anos" INTEGER,
    "certificacoes" TEXT[],
    "plano" TEXT,
    "selo" TEXT,
    "nota_media" DECIMAL(3,2),

    CONSTRAINT "profiles_fornecedor_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fornecedor_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "preco_centavos" INTEGER NOT NULL,
    "unidade" TEXT NOT NULL,
    "estoque" INTEGER,
    "fotos" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "cliente_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "work_type" NOT NULL,
    "endereco" TEXT NOT NULL,
    "geo" geography(Point, 4326),
    "area_m2" DECIMAL(10,2),
    "orcamento_previsto_centavos" INTEGER,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "obra_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prazo_resposta" TIMESTAMP(3),
    "regiao" TEXT,
    "status" "rfq_status" NOT NULL DEFAULT 'ABERTO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_proposals" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "rfq_id" UUID NOT NULL,
    "proponente_id" UUID NOT NULL,
    "preco_centavos" INTEGER NOT NULL,
    "prazo_dias" INTEGER NOT NULL,
    "observacoes" TEXT,
    "status" "rfq_proposal_status" NOT NULL DEFAULT 'ENVIADA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "rfq_proposal_id" UUID NOT NULL,
    "obra_id" UUID NOT NULL,
    "valor_total_centavos" INTEGER NOT NULL,
    "assinatura_external_id" TEXT,
    "status" TEXT NOT NULL,
    "pdf_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_parties" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "contract_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "papel" "contract_party_role" NOT NULL,

    CONSTRAINT "contract_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "contract_id" UUID NOT NULL,
    "ordem" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor_centavos" INTEGER NOT NULL,
    "checklist" JSONB NOT NULL,
    "fotos" TEXT[],
    "status" "milestone_status" NOT NULL DEFAULT 'PENDENTE',
    "aprovado_em" TIMESTAMP(3),
    "aprovado_por" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_transactions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "milestone_id" UUID NOT NULL,
    "psp_ref" TEXT NOT NULL,
    "tipo" "escrow_transaction_type" NOT NULL,
    "valor_centavos" INTEGER NOT NULL,
    "taxa_plataforma_centavos" INTEGER,
    "status" TEXT NOT NULL,
    "ledger_hash" VARCHAR(64) NOT NULL,
    "previous_hash" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escrow_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "milestone_id" UUID NOT NULL,
    "aberto_por" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "evidencias" TEXT[],
    "mediador_id" UUID,
    "resolucao" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "contrato_id" UUID NOT NULL,
    "avaliador_id" UUID NOT NULL,
    "avaliado_id" UUID NOT NULL,
    "nota_prazo" SMALLINT NOT NULL,
    "nota_qualidade" SMALLINT NOT NULL,
    "nota_preco" SMALLINT NOT NULL,
    "comentario" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_lists" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "obra_id" UUID NOT NULL,
    "itens" JSONB NOT NULL,
    "origem" "material_list_origin" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_quotes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "material_list_id" UUID NOT NULL,
    "fornecedor_id" UUID NOT NULL,
    "itens_precos" JSONB NOT NULL,
    "frete_centavos" INTEGER,
    "prazo_dias" INTEGER,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects_catalog" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "arquiteto_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" "project_category" NOT NULL,
    "preco_centavos" INTEGER NOT NULL,
    "arquivos" TEXT[],
    "licenca" TEXT,
    "vendas_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "plano" TEXT NOT NULL,
    "valor_centavos" INTEGER NOT NULL,
    "psp_sub_id" TEXT,
    "status" TEXT NOT NULL,
    "renova_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "obra_id" UUID,
    "mensagens" JSONB NOT NULL,
    "tokens_usados" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicators" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tipo" "indicator_type" NOT NULL,
    "regiao" TEXT NOT NULL,
    "valor_centavos" INTEGER NOT NULL,
    "referencia_mes" DATE NOT NULL,
    "fonte" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avg_costs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "servico" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "valor_min_centavos" INTEGER NOT NULL,
    "valor_med_centavos" INTEGER NOT NULL,
    "valor_max_centavos" INTEGER NOT NULL,
    "mes" DATE NOT NULL,

    CONSTRAINT "avg_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "publicado_em" TIMESTAMP(3),

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "anunciante_id" UUID NOT NULL,
    "tipo" "ad_type" NOT NULL,
    "criativo" JSONB NOT NULL,
    "budget_centavos" INTEGER NOT NULL,
    "metricas" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_telefone_key" ON "users"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_cnpj_key" ON "users"("cpf_cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_rfq_proposal_id_key" ON "contracts"("rfq_proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_parties_contract_id_user_id_key" ON "contract_parties"("contract_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "milestones_contract_id_ordem_key" ON "milestones"("contract_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "indicators_tipo_regiao_referencia_mes_key" ON "indicators"("tipo", "regiao", "referencia_mes");

-- CreateIndex
CREATE UNIQUE INDEX "avg_costs_servico_cidade_mes_key" ON "avg_costs"("servico", "cidade", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- AddForeignKey
ALTER TABLE "profiles_prestador" ADD CONSTRAINT "profiles_prestador_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles_fornecedor" ADD CONSTRAINT "profiles_fornecedor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "profiles_fornecedor"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "works" ADD CONSTRAINT "works_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq" ADD CONSTRAINT "rfq_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq" ADD CONSTRAINT "rfq_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_proposals" ADD CONSTRAINT "rfq_proposals_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_proposals" ADD CONSTRAINT "rfq_proposals_proponente_id_fkey" FOREIGN KEY ("proponente_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_rfq_proposal_id_fkey" FOREIGN KEY ("rfq_proposal_id") REFERENCES "rfq_proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "works"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_parties" ADD CONSTRAINT "contract_parties_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_parties" ADD CONSTRAINT "contract_parties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_aprovado_por_fkey" FOREIGN KEY ("aprovado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_aberto_por_fkey" FOREIGN KEY ("aberto_por") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_mediador_id_fkey" FOREIGN KEY ("mediador_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_avaliado_id_fkey" FOREIGN KEY ("avaliado_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_lists" ADD CONSTRAINT "material_lists_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_quotes" ADD CONSTRAINT "purchase_quotes_material_list_id_fkey" FOREIGN KEY ("material_list_id") REFERENCES "material_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_quotes" ADD CONSTRAINT "purchase_quotes_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "profiles_fornecedor"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects_catalog" ADD CONSTRAINT "projects_catalog_arquiteto_id_fkey" FOREIGN KEY ("arquiteto_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "works"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_anunciante_id_fkey" FOREIGN KEY ("anunciante_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CLAUDE.md §5 regra 1: escrow_transactions é append-only — nunca UPDATE/DELETE.
-- CLAUDE.md §5 regra 4: audit_log é imutável.
-- Prisma Migrate não expressa isso no schema.prisma; o trigger é a garantia em nível de banco.
CREATE OR REPLACE FUNCTION reject_update_or_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION '% em % não é permitido: tabela append-only', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER escrow_transactions_append_only
  BEFORE UPDATE OR DELETE ON "escrow_transactions"
  FOR EACH ROW EXECUTE FUNCTION reject_update_or_delete();

CREATE TRIGGER audit_log_append_only
  BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION reject_update_or_delete();
