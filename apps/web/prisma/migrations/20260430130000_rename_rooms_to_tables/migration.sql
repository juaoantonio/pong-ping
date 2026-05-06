ALTER TABLE "PingPongRoom" RENAME TO "PingPongTable";
ALTER TABLE "PingPongRoomParticipant" RENAME TO "PingPongTableParticipant";
ALTER TABLE "PingPongRoomInvitation" RENAME TO "PingPongTableInvitation";
ALTER TABLE "PingPongRoomMember" RENAME TO "PingPongTableMember";

ALTER TABLE "MatchHistory" RENAME COLUMN "roomId" TO "tableId";
ALTER TABLE "PingPongTableParticipant" RENAME COLUMN "roomId" TO "tableId";
ALTER TABLE "PingPongTableInvitation" RENAME COLUMN "roomId" TO "tableId";
ALTER TABLE "PingPongTableMember" RENAME COLUMN "roomId" TO "tableId";

ALTER TABLE "PingPongTable" RENAME CONSTRAINT "PingPongRoom_pkey" TO "PingPongTable_pkey";
ALTER TABLE "PingPongTable" RENAME CONSTRAINT "PingPongRoom_createdById_fkey" TO "PingPongTable_createdById_fkey";

ALTER TABLE "PingPongTableParticipant" RENAME CONSTRAINT "PingPongRoomParticipant_pkey" TO "PingPongTableParticipant_pkey";
ALTER TABLE "PingPongTableParticipant" RENAME CONSTRAINT "PingPongRoomParticipant_roomId_fkey" TO "PingPongTableParticipant_tableId_fkey";
ALTER TABLE "PingPongTableParticipant" RENAME CONSTRAINT "PingPongRoomParticipant_userId_fkey" TO "PingPongTableParticipant_userId_fkey";

ALTER TABLE "PingPongTableInvitation" RENAME CONSTRAINT "PingPongRoomInvitation_pkey" TO "PingPongTableInvitation_pkey";
ALTER TABLE "PingPongTableInvitation" RENAME CONSTRAINT "PingPongRoomInvitation_roomId_fkey" TO "PingPongTableInvitation_tableId_fkey";
ALTER TABLE "PingPongTableInvitation" RENAME CONSTRAINT "PingPongRoomInvitation_createdById_fkey" TO "PingPongTableInvitation_createdById_fkey";

ALTER TABLE "PingPongTableMember" RENAME CONSTRAINT "PingPongRoomMember_pkey" TO "PingPongTableMember_pkey";
ALTER TABLE "PingPongTableMember" RENAME CONSTRAINT "PingPongRoomMember_roomId_fkey" TO "PingPongTableMember_tableId_fkey";
ALTER TABLE "PingPongTableMember" RENAME CONSTRAINT "PingPongRoomMember_userId_fkey" TO "PingPongTableMember_userId_fkey";

ALTER TABLE "MatchHistory" RENAME CONSTRAINT "MatchHistory_roomId_fkey" TO "MatchHistory_tableId_fkey";

ALTER INDEX "MatchHistory_roomId_idx" RENAME TO "MatchHistory_tableId_idx";
ALTER INDEX "PingPongRoom_createdById_idx" RENAME TO "PingPongTable_createdById_idx";
ALTER INDEX "PingPongRoom_createdAt_idx" RENAME TO "PingPongTable_createdAt_idx";
ALTER INDEX "PingPongRoomParticipant_roomId_idx" RENAME TO "PingPongTableParticipant_tableId_idx";
ALTER INDEX "PingPongRoomParticipant_userId_idx" RENAME TO "PingPongTableParticipant_userId_idx";
ALTER INDEX "PingPongRoomParticipant_roomId_userId_key" RENAME TO "PingPongTableParticipant_tableId_userId_key";
ALTER INDEX "PingPongRoomParticipant_roomId_queuePosition_key" RENAME TO "PingPongTableParticipant_tableId_queuePosition_key";
ALTER INDEX "PingPongRoomInvitation_token_key" RENAME TO "PingPongTableInvitation_token_key";
ALTER INDEX "PingPongRoomInvitation_roomId_idx" RENAME TO "PingPongTableInvitation_tableId_idx";
ALTER INDEX "PingPongRoomInvitation_createdById_idx" RENAME TO "PingPongTableInvitation_createdById_idx";
ALTER INDEX "PingPongRoomInvitation_expiresAt_idx" RENAME TO "PingPongTableInvitation_expiresAt_idx";
ALTER INDEX "PingPongRoomInvitation_usedAt_idx" RENAME TO "PingPongTableInvitation_usedAt_idx";
ALTER INDEX "PingPongRoomMember_roomId_idx" RENAME TO "PingPongTableMember_tableId_idx";
ALTER INDEX "PingPongRoomMember_userId_idx" RENAME TO "PingPongTableMember_userId_idx";
ALTER INDEX "PingPongRoomMember_roomId_userId_key" RENAME TO "PingPongTableMember_tableId_userId_key";
