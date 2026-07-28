-- AlterTable
ALTER TABLE "profiles_prestador" ADD COLUMN     "ultimo_match_em" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "rfq_matches" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "rfq_id" UUID NOT NULL,
    "prestador_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rfq_matches_rfq_id_prestador_id_key" ON "rfq_matches"("rfq_id", "prestador_id");

-- AddForeignKey
ALTER TABLE "rfq_matches" ADD CONSTRAINT "rfq_matches_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_matches" ADD CONSTRAINT "rfq_matches_prestador_id_fkey" FOREIGN KEY ("prestador_id") REFERENCES "profiles_prestador"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
