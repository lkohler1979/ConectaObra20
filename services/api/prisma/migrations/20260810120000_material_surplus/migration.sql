-- CreateEnum
CREATE TYPE "surplus_listing_status" AS ENUM ('DISPONIVEL', 'RESERVADO', 'VENDIDO', 'REMOVIDO');

-- CreateTable
CREATE TABLE "surplus_listings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "work_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "quantidade" DECIMAL(10,2) NOT NULL,
    "unidade" TEXT NOT NULL,
    "preco_centavos" INTEGER NOT NULL,
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "surplus_listing_status" NOT NULL DEFAULT 'DISPONIVEL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surplus_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surplus_orders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "surplus_listing_id" UUID NOT NULL,
    "comprador_nome" TEXT NOT NULL,
    "comprador_email" TEXT NOT NULL,
    "comprador_telefone" TEXT,
    "item_preco_centavos" INTEGER NOT NULL,
    "comissao_centavos" INTEGER NOT NULL,
    "total_pago_centavos" INTEGER NOT NULL,
    "psp_ref" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAGO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surplus_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "surplus_orders_surplus_listing_id_key" ON "surplus_orders"("surplus_listing_id");

-- AddForeignKey
ALTER TABLE "surplus_listings" ADD CONSTRAINT "surplus_listings_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surplus_listings" ADD CONSTRAINT "surplus_listings_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surplus_orders" ADD CONSTRAINT "surplus_orders_surplus_listing_id_fkey" FOREIGN KEY ("surplus_listing_id") REFERENCES "surplus_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
