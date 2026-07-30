-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "purchase_quote_id" UUID NOT NULL,
    "itens_total_centavos" INTEGER NOT NULL,
    "frete_centavos" INTEGER NOT NULL,
    "comissao_centavos" INTEGER NOT NULL,
    "total_pago_centavos" INTEGER NOT NULL,
    "psp_ref" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAGO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_purchase_quote_id_key" ON "purchase_orders"("purchase_quote_id");

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_purchase_quote_id_fkey" FOREIGN KEY ("purchase_quote_id") REFERENCES "purchase_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
