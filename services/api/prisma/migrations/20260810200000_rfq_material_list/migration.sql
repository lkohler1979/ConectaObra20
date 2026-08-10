-- AlterTable
ALTER TABLE "rfq" ADD COLUMN     "material_list_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "rfq_material_list_id_key" ON "rfq"("material_list_id");

-- AddForeignKey
ALTER TABLE "rfq" ADD CONSTRAINT "rfq_material_list_id_fkey" FOREIGN KEY ("material_list_id") REFERENCES "material_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
