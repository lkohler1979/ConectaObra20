-- CreateTable
CREATE TABLE "work_team_members" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "obra_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "added_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_team_members_obra_id_user_id_key" ON "work_team_members"("obra_id", "user_id");

-- AddForeignKey
ALTER TABLE "work_team_members" ADD CONSTRAINT "work_team_members_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_team_members" ADD CONSTRAINT "work_team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_team_members" ADD CONSTRAINT "work_team_members_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
