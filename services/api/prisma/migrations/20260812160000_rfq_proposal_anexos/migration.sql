-- AlterTable
ALTER TABLE "rfq_proposals" ADD COLUMN     "anexos" TEXT[] DEFAULT ARRAY[]::TEXT[];
