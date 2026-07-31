-- CreateTable
CREATE TABLE "fornecedor_lojas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fornecedor_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "regiao" TEXT,
    "telefone" TEXT,
    "geo" geography(Point, 4326),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fornecedor_lojas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fornecedor_lojas" ADD CONSTRAINT "fornecedor_lojas_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "profiles_fornecedor"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
