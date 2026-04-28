-- AlterTable
ALTER TABLE "Match" ADD COLUMN "roomId" TEXT;

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
CREATE INDEX "Match_roomId_idx" ON "Match"("roomId");

-- CreateIndex
CREATE INDEX "PingPongRoom_createdById_idx" ON "PingPongRoom"("createdById");

-- CreateIndex
CREATE INDEX "PingPongRoom_createdAt_idx" ON "PingPongRoom"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PingPongRoomParticipant_roomId_userId_key" ON "PingPongRoomParticipant"("roomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PingPongRoomParticipant_roomId_queuePosition_key" ON "PingPongRoomParticipant"("roomId", "queuePosition");

-- CreateIndex
CREATE INDEX "PingPongRoomParticipant_roomId_idx" ON "PingPongRoomParticipant"("roomId");

-- CreateIndex
CREATE INDEX "PingPongRoomParticipant_userId_idx" ON "PingPongRoomParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PingPongRoomInvitation_token_key" ON "PingPongRoomInvitation"("token");

-- CreateIndex
CREATE INDEX "PingPongRoomInvitation_roomId_idx" ON "PingPongRoomInvitation"("roomId");

-- CreateIndex
CREATE INDEX "PingPongRoomInvitation_createdById_idx" ON "PingPongRoomInvitation"("createdById");

-- CreateIndex
CREATE INDEX "PingPongRoomInvitation_expiresAt_idx" ON "PingPongRoomInvitation"("expiresAt");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "PingPongRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
