-- CreateEnum
CREATE TYPE "AthleteTechnicalLevel" AS ENUM ('beginner', 'intermediate', 'advanced', 'competitive');

-- CreateEnum
CREATE TYPE "AthleteGripStyle" AS ENUM ('classic', 'penhold');

-- CreateEnum
CREATE TYPE "AthletePlayingStyle" AS ENUM ('offensive', 'defensive', 'all_round');

-- CreateTable
CREATE TABLE "AthleteProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "technicalLevel" "AthleteTechnicalLevel",
    "gripStyle" "AthleteGripStyle",
    "playingStyle" "AthletePlayingStyle",
    "bladeName" TEXT,
    "forehandRubberName" TEXT,
    "backhandRubberName" TEXT,
    "equipmentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AthleteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AthleteProfile_userId_key" ON "AthleteProfile"("userId");
CREATE INDEX "AthleteProfile_tenantId_idx" ON "AthleteProfile"("tenantId");
CREATE INDEX "AthleteProfile_tenantId_updatedAt_idx" ON "AthleteProfile"("tenantId", "updatedAt");

-- AddForeignKey
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
