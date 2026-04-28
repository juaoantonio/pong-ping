-- CreateTable
CREATE TABLE "AllowedEmail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AllowedEmail_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuthInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "usedByEmail" TEXT,
    "createdByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthInvitation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Preserve access for existing accounts after introducing the allowlist.
INSERT OR IGNORE INTO "AllowedEmail" ("id", "email", "createdAt", "updatedAt")
SELECT lower("id"), lower("email"), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User"
WHERE "email" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AllowedEmail_email_key" ON "AllowedEmail"("email");

-- CreateIndex
CREATE INDEX "AllowedEmail_createdByUserId_idx" ON "AllowedEmail"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthInvitation_tokenHash_key" ON "AuthInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthInvitation_createdByUserId_idx" ON "AuthInvitation"("createdByUserId");

-- CreateIndex
CREATE INDEX "AuthInvitation_expiresAt_idx" ON "AuthInvitation"("expiresAt");

-- CreateIndex
CREATE INDEX "AuthInvitation_usedAt_idx" ON "AuthInvitation"("usedAt");
