-- AlterTable
ALTER TABLE "audit_log" ADD COLUMN     "obra_id" UUID;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "works"("id") ON DELETE SET NULL ON UPDATE CASCADE;
