ALTER TABLE "users"
  ADD COLUMN "suspenso" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "suspenso_motivo" TEXT,
  ADD COLUMN "suspenso_em" TIMESTAMP(3);
