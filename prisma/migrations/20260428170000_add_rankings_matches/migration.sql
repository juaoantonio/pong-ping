-- CreateTable
CREATE TABLE "PlayerRanking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "elo" INTEGER NOT NULL DEFAULT 1000,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "total_matches" INTEGER NOT NULL DEFAULT 0,
    "winRate" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerRanking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RankLevel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "minElo" INTEGER NOT NULL,
    "iconImgKey" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "winnerUserId" TEXT NOT NULL,
    "loserUserId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "kFactor" INTEGER NOT NULL,
    "winnerOldElo" INTEGER NOT NULL,
    "winnerNewElo" INTEGER NOT NULL,
    "loserOldElo" INTEGER NOT NULL,
    "loserNewElo" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_loserUserId_fkey" FOREIGN KEY ("loserUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerRanking_userId_key" ON "PlayerRanking"("userId");

-- CreateIndex
CREATE INDEX "PlayerRanking_elo_idx" ON "PlayerRanking"("elo");

-- CreateIndex
CREATE INDEX "PlayerRanking_wins_idx" ON "PlayerRanking"("wins");

-- CreateIndex
CREATE UNIQUE INDEX "RankLevel_name_key" ON "RankLevel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RankLevel_minElo_key" ON "RankLevel"("minElo");

-- CreateIndex
CREATE INDEX "RankLevel_minElo_idx" ON "RankLevel"("minElo");

-- CreateIndex
CREATE INDEX "Match_winnerUserId_idx" ON "Match"("winnerUserId");

-- CreateIndex
CREATE INDEX "Match_loserUserId_idx" ON "Match"("loserUserId");

-- CreateIndex
CREATE INDEX "Match_createdById_idx" ON "Match"("createdById");

-- CreateIndex
CREATE INDEX "Match_createdAt_idx" ON "Match"("createdAt");
