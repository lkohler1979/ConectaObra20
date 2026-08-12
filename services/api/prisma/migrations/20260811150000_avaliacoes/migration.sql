-- CreateEnum
CREATE TYPE "avaliacao_tipo" AS ENUM ('PRESTADOR', 'FORNECEDOR', 'PRODUTO');

-- AlterTable
ALTER TABLE "profiles_fornecedor" ADD COLUMN     "logo_url" TEXT;

-- AlterTable
ALTER TABLE "profiles_prestador" ADD COLUMN     "foto_url" TEXT;

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "autor_id" UUID NOT NULL,
    "tipo" "avaliacao_tipo" NOT NULL,
    "prestador_id" UUID,
    "fornecedor_id" UUID,
    "produto_id" UUID,
    "obra_id" UUID,
    "nota" SMALLINT NOT NULL,
    "comentario" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_prestador_id_fkey" FOREIGN KEY ("prestador_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "works"("id") ON DELETE SET NULL ON UPDATE CASCADE;
