ALTER TABLE "AuthInvitation" ADD COLUMN "oneTimeUse" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "PingPongRoomInvitation" ADD COLUMN "oneTimeUse" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PingPongRoomInvitation" ADD COLUMN "usedAt" TIMESTAMP(3);
ALTER TABLE "PingPongRoomInvitation" ADD COLUMN "usedByUserId" TEXT;

CREATE INDEX "PingPongRoomInvitation_usedAt_idx" ON "PingPongRoomInvitation"("usedAt");
