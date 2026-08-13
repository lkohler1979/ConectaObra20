ALTER TABLE "avaliacoes"
  ADD COLUMN "oculta" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "oculta_motivo" TEXT,
  ADD COLUMN "oculta_em" TIMESTAMP(3);
