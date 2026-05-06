-- CreateEnum
CREATE TYPE "Role" AS ENUM ('superadmin', 'admin', 'user');

-- CreateEnum
CREATE TYPE "MatchHistoryKind" AS ENUM ('match', 'rollback');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "googleId" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "targetUserId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllowedEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllowedEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthInvitation" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByEmail" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerRanking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "elo" INTEGER NOT NULL DEFAULT 1000,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "total_matches" INTEGER NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerRanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankLevel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minElo" INTEGER NOT NULL,
    "iconImgKey" TEXT NOT NULL,

    CONSTRAINT "RankLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchHistory" (
    "id" TEXT NOT NULL,
    "roomId" TEXT,
    "winnerId" TEXT NOT NULL,
    "loserId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "rollbackOfId" TEXT,
    "kind" "MatchHistoryKind" NOT NULL DEFAULT 'match',
    "kFactor" INTEGER NOT NULL,
    "winnerOldElo" INTEGER NOT NULL,
    "winnerNewElo" INTEGER NOT NULL,
    "winnerDiffPoints" INTEGER NOT NULL,
    "loserOldElo" INTEGER NOT NULL,
    "loserNewElo" INTEGER NOT NULL,
    "loserDiffPoints" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PingPongRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PingPongRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PingPongRoomParticipant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "queuePosition" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PingPongRoomParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PingPongRoomInvitation" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PingPongRoomInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_targetUserId_idx" ON "AuditLog"("targetUserId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

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
CREATE UNIQUE INDEX "MatchHistory_rollbackOfId_key" ON "MatchHistory"("rollbackOfId");

-- CreateIndex
CREATE INDEX "MatchHistory_roomId_idx" ON "MatchHistory"("roomId");

-- CreateIndex
CREATE INDEX "MatchHistory_winnerId_idx" ON "MatchHistory"("winnerId");

-- CreateIndex
CREATE INDEX "MatchHistory_loserId_idx" ON "MatchHistory"("loserId");

-- CreateIndex
CREATE INDEX "MatchHistory_createdById_idx" ON "MatchHistory"("createdById");

-- CreateIndex
CREATE INDEX "MatchHistory_kind_idx" ON "MatchHistory"("kind");

-- CreateIndex
CREATE INDEX "MatchHistory_createdAt_idx" ON "MatchHistory"("createdAt");

-- CreateIndex
CREATE INDEX "PingPongRoom_createdById_idx" ON "PingPongRoom"("createdById");

-- CreateIndex
CREATE INDEX "PingPongRoom_createdAt_idx" ON "PingPongRoom"("createdAt");

-- CreateIndex
CREATE INDEX "PingPongRoomParticipant_roomId_idx" ON "PingPongRoomParticipant"("roomId");

-- CreateIndex
CREATE INDEX "PingPongRoomParticipant_userId_idx" ON "PingPongRoomParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PingPongRoomParticipant_roomId_userId_key" ON "PingPongRoomParticipant"("roomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PingPongRoomParticipant_roomId_queuePosition_key" ON "PingPongRoomParticipant"("roomId", "queuePosition");

-- CreateIndex
CREATE UNIQUE INDEX "PingPongRoomInvitation_token_key" ON "PingPongRoomInvitation"("token");

-- CreateIndex
CREATE INDEX "PingPongRoomInvitation_roomId_idx" ON "PingPongRoomInvitation"("roomId");

-- CreateIndex
CREATE INDEX "PingPongRoomInvitation_createdById_idx" ON "PingPongRoomInvitation"("createdById");

-- CreateIndex
CREATE INDEX "PingPongRoomInvitation_expiresAt_idx" ON "PingPongRoomInvitation"("expiresAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllowedEmail" ADD CONSTRAINT "AllowedEmail_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthInvitation" ADD CONSTRAINT "AuthInvitation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRanking" ADD CONSTRAINT "PlayerRanking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchHistory" ADD CONSTRAINT "MatchHistory_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "PingPongRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchHistory" ADD CONSTRAINT "MatchHistory_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchHistory" ADD CONSTRAINT "MatchHistory_loserId_fkey" FOREIGN KEY ("loserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchHistory" ADD CONSTRAINT "MatchHistory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchHistory" ADD CONSTRAINT "MatchHistory_rollbackOfId_fkey" FOREIGN KEY ("rollbackOfId") REFERENCES "MatchHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PingPongRoom" ADD CONSTRAINT "PingPongRoom_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PingPongRoomParticipant" ADD CONSTRAINT "PingPongRoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "PingPongRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PingPongRoomParticipant" ADD CONSTRAINT "PingPongRoomParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PingPongRoomInvitation" ADD CONSTRAINT "PingPongRoomInvitation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "PingPongRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PingPongRoomInvitation" ADD CONSTRAINT "PingPongRoomInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
