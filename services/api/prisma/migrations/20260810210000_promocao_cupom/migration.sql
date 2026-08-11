-- AlterTable
ALTER TABLE "fornecedor_lojas" ADD COLUMN     "imagem_url" TEXT;

-- CreateTable
CREATE TABLE "promocao_validacoes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fornecedor_id" UUID NOT NULL,
    "promocao_id" UUID,
    "codigo" TEXT NOT NULL,
    "valido" BOOLEAN NOT NULL,
    "motivo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promocao_validacoes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "promocao_validacoes" ADD CONSTRAINT "promocao_validacoes_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "profiles_fornecedor"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promocao_validacoes" ADD CONSTRAINT "promocao_validacoes_promocao_id_fkey" FOREIGN KEY ("promocao_id") REFERENCES "promocoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
