CREATE TABLE "PingPongRoomMember" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PingPongRoomMember_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PingPongRoomMember" ("id", "roomId", "userId", "joinedAt")
SELECT "id", "roomId", "userId", "joinedAt"
FROM "PingPongRoomParticipant";

CREATE INDEX "PingPongRoomMember_roomId_idx" ON "PingPongRoomMember"("roomId");
CREATE INDEX "PingPongRoomMember_userId_idx" ON "PingPongRoomMember"("userId");
CREATE UNIQUE INDEX "PingPongRoomMember_roomId_userId_key" ON "PingPongRoomMember"("roomId", "userId");

ALTER TABLE "PingPongRoomMember" ADD CONSTRAINT "PingPongRoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "PingPongRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PingPongRoomMember" ADD CONSTRAINT "PingPongRoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
