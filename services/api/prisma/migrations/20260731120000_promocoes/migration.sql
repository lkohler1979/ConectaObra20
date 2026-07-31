-- CreateTable
CREATE TABLE "promocoes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fornecedor_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor_original_centavos" INTEGER,
    "valor_promocional_centavos" INTEGER NOT NULL,
    "imagem_url" TEXT,
    "validade_inicio" TIMESTAMP(3),
    "validade_fim" TIMESTAMP(3) NOT NULL,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promocoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promocoes_fornecedor_id_codigo_key" ON "promocoes"("fornecedor_id", "codigo");

-- AddForeignKey
ALTER TABLE "promocoes" ADD CONSTRAINT "promocoes_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "profiles_fornecedor"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
