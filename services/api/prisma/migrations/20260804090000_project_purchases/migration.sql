-- CreateTable
CREATE TABLE "project_purchases" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "project_id" UUID NOT NULL,
    "comprador_id" UUID NOT NULL,
    "preco_centavos" INTEGER NOT NULL,
    "comissao_centavos" INTEGER NOT NULL,
    "psp_ref" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAGO',
    "arquivos_entregues" TEXT[],
    "marca_dagua_aplicada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_purchases_project_id_comprador_id_key" ON "project_purchases"("project_id", "comprador_id");

-- AddForeignKey
ALTER TABLE "project_purchases" ADD CONSTRAINT "project_purchases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_purchases" ADD CONSTRAINT "project_purchases_comprador_id_fkey" FOREIGN KEY ("comprador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
