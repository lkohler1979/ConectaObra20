-- AlterTable
ALTER TABLE "products" ADD COLUMN "codigo" TEXT,
ADD COLUMN "descricao" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "products_fornecedor_id_codigo_key" ON "products"("fornecedor_id", "codigo");
