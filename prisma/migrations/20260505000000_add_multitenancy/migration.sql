-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- BackfillTenant
INSERT INTO "Tenant" ("id", "name", "slug")
VALUES ('default', 'Default Tenant', 'default');

-- Add nullable tenant columns first so existing rows can be backfilled.
ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Account" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "AllowedEmail" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "AuthInvitation" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "PlayerRanking" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "MatchHistory" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "PingPongTable" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "PingPongTableMember" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "PingPongTableParticipant" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "PingPongTableInvitation" ADD COLUMN "tenantId" TEXT;

-- Backfill existing single-tenant data.
UPDATE "User" SET "tenantId" = 'default' WHERE "tenantId" IS NULL;
UPDATE "Account" AS a
SET "tenantId" = COALESCE(u."tenantId", 'default')
FROM "User" AS u
WHERE a."userId" = u."id" AND a."tenantId" IS NULL;
UPDATE "Account" SET "tenantId" = 'default' WHERE "tenantId" IS NULL;
UPDATE "PingPongTable" SET "tenantId" = 'default' WHERE "tenantId" IS NULL;
UPDATE "AllowedEmail" SET "tenantId" = 'default' WHERE "tenantId" IS NULL;
UPDATE "AuthInvitation" SET "tenantId" = 'default' WHERE "tenantId" IS NULL;
UPDATE "AuditLog" SET "tenantId" = 'default' WHERE "tenantId" IS NULL;

UPDATE "PlayerRanking" AS pr
SET "tenantId" = COALESCE(u."tenantId", 'default')
FROM "User" AS u
WHERE pr."userId" = u."id" AND pr."tenantId" IS NULL;
UPDATE "PlayerRanking" SET "tenantId" = 'default' WHERE "tenantId" IS NULL;

UPDATE "MatchHistory" AS mh
SET "tenantId" = COALESCE(
  (SELECT t."tenantId" FROM "PingPongTable" AS t WHERE t."id" = mh."tableId"),
  (SELECT u."tenantId" FROM "User" AS u WHERE u."id" = mh."winnerId"),
  (SELECT u."tenantId" FROM "User" AS u WHERE u."id" = mh."loserId"),
  (SELECT u."tenantId" FROM "User" AS u WHERE u."id" = mh."createdById"),
  'default'
)
WHERE mh."tenantId" IS NULL;
UPDATE "MatchHistory" SET "tenantId" = 'default' WHERE "tenantId" IS NULL;

UPDATE "PingPongTableMember" AS tm
SET "tenantId" = COALESCE(
  (SELECT t."tenantId" FROM "PingPongTable" AS t WHERE t."id" = tm."tableId"),
  (SELECT u."tenantId" FROM "User" AS u WHERE u."id" = tm."userId"),
  'default'
)
WHERE tm."tenantId" IS NULL;
UPDATE "PingPongTableMember" SET "tenantId" = 'default' WHERE "tenantId" IS NULL;

UPDATE "PingPongTableParticipant" AS tp
SET "tenantId" = COALESCE(
  (SELECT t."tenantId" FROM "PingPongTable" AS t WHERE t."id" = tp."tableId"),
  (SELECT u."tenantId" FROM "User" AS u WHERE u."id" = tp."userId"),
  'default'
)
WHERE tp."tenantId" IS NULL;
UPDATE "PingPongTableParticipant" SET "tenantId" = 'default' WHERE "tenantId" IS NULL;

UPDATE "PingPongTableInvitation" AS ti
SET "tenantId" = COALESCE(
  (SELECT t."tenantId" FROM "PingPongTable" AS t WHERE t."id" = ti."tableId"),
  (SELECT u."tenantId" FROM "User" AS u WHERE u."id" = ti."createdById"),
  'default'
)
WHERE ti."tenantId" IS NULL;
UPDATE "PingPongTableInvitation" SET "tenantId" = 'default' WHERE "tenantId" IS NULL;

-- Enforce tenant ownership after backfill.
ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Account" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "AllowedEmail" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "AuthInvitation" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PlayerRanking" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "MatchHistory" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PingPongTable" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PingPongTableMember" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PingPongTableParticipant" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PingPongTableInvitation" ALTER COLUMN "tenantId" SET NOT NULL;

-- CreateIndex
DROP INDEX IF EXISTS "User_email_key";
DROP INDEX IF EXISTS "User_googleId_key";
DROP INDEX IF EXISTS "Account_provider_providerAccountId_key";
DROP INDEX IF EXISTS "AllowedEmail_email_key";

CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");
CREATE UNIQUE INDEX "User_tenantId_googleId_key" ON "User"("tenantId", "googleId");
CREATE INDEX "User_tenantId_createdAt_idx" ON "User"("tenantId", "createdAt");
CREATE INDEX "User_tenantId_role_idx" ON "User"("tenantId", "role");
CREATE UNIQUE INDEX "Account_tenantId_provider_providerAccountId_key" ON "Account"("tenantId", "provider", "providerAccountId");
CREATE INDEX "Account_tenantId_userId_idx" ON "Account"("tenantId", "userId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
CREATE INDEX "AuditLog_tenantId_action_idx" ON "AuditLog"("tenantId", "action");
CREATE UNIQUE INDEX "AllowedEmail_tenantId_email_key" ON "AllowedEmail"("tenantId", "email");
CREATE INDEX "AllowedEmail_tenantId_email_idx" ON "AllowedEmail"("tenantId", "email");
CREATE INDEX "AuthInvitation_tenantId_createdAt_idx" ON "AuthInvitation"("tenantId", "createdAt");
CREATE INDEX "PlayerRanking_tenantId_elo_idx" ON "PlayerRanking"("tenantId", "elo");
CREATE INDEX "PlayerRanking_tenantId_wins_idx" ON "PlayerRanking"("tenantId", "wins");
CREATE INDEX "MatchHistory_tenantId_tableId_idx" ON "MatchHistory"("tenantId", "tableId");
CREATE INDEX "MatchHistory_tenantId_createdAt_idx" ON "MatchHistory"("tenantId", "createdAt");
CREATE INDEX "PingPongTable_tenantId_deletedAt_createdAt_idx" ON "PingPongTable"("tenantId", "deletedAt", "createdAt");
CREATE INDEX "PingPongTableMember_tenantId_tableId_idx" ON "PingPongTableMember"("tenantId", "tableId");
CREATE INDEX "PingPongTableMember_tenantId_userId_idx" ON "PingPongTableMember"("tenantId", "userId");
CREATE INDEX "PingPongTableParticipant_tenantId_tableId_queuePosition_idx" ON "PingPongTableParticipant"("tenantId", "tableId", "queuePosition");
CREATE INDEX "PingPongTableParticipant_tenantId_userId_idx" ON "PingPongTableParticipant"("tenantId", "userId");
CREATE INDEX "PingPongTableInvitation_tenantId_tableId_idx" ON "PingPongTableInvitation"("tenantId", "tableId");
CREATE INDEX "PingPongTableInvitation_tenantId_createdAt_idx" ON "PingPongTableInvitation"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AllowedEmail" ADD CONSTRAINT "AllowedEmail_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuthInvitation" ADD CONSTRAINT "AuthInvitation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlayerRanking" ADD CONSTRAINT "PlayerRanking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MatchHistory" ADD CONSTRAINT "MatchHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PingPongTable" ADD CONSTRAINT "PingPongTable_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PingPongTableMember" ADD CONSTRAINT "PingPongTableMember_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PingPongTableParticipant" ADD CONSTRAINT "PingPongTableParticipant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PingPongTableInvitation" ADD CONSTRAINT "PingPongTableInvitation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
