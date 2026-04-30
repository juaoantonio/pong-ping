import { MigrationInterface, QueryRunner } from "typeorm";

export class PrismaCompatibleBaseline20260430000000 implements MigrationInterface {
  name = "PrismaCompatibleBaseline20260430000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('superadmin', 'admin', 'user');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "MatchHistoryKind" AS ENUM ('match', 'rollback');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "User" (
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
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Account" (
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
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT NOT NULL,
        "sessionToken" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        "identifier" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL
      );
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL,
        "actorUserId" TEXT,
        "targetUserId" TEXT,
        "action" TEXT NOT NULL,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "AllowedEmail" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "createdByUserId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AllowedEmail_pkey" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "AuthInvitation" (
        "id" TEXT NOT NULL,
        "tokenHash" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "oneTimeUse" BOOLEAN NOT NULL DEFAULT true,
        "usedAt" TIMESTAMP(3),
        "usedByEmail" TEXT,
        "createdByUserId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuthInvitation_pkey" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "PlayerRanking" (
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
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "RankLevel" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "minElo" INTEGER NOT NULL,
        "iconImgKey" TEXT NOT NULL,
        CONSTRAINT "RankLevel_pkey" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "PingPongRoom" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "createdById" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP(3),
        CONSTRAINT "PingPongRoom_pkey" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "PingPongRoomParticipant" (
        "id" TEXT NOT NULL,
        "roomId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "queuePosition" INTEGER NOT NULL,
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PingPongRoomParticipant_pkey" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "PingPongRoomInvitation" (
        "id" TEXT NOT NULL,
        "roomId" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "createdById" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "oneTimeUse" BOOLEAN NOT NULL DEFAULT false,
        "usedAt" TIMESTAMP(3),
        "usedByUserId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PingPongRoomInvitation_pkey" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "MatchHistory" (
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
    `);

    await this.addCompatibilityColumns(queryRunner);
    await this.addIndexes(queryRunner);
    await this.addForeignKeys(queryRunner);
  }

  public async down(): Promise<void> {
    // Baseline migration is intentionally non-destructive to protect migrated data.
  }

  private async addCompatibilityColumns(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE "AuthInvitation" ADD COLUMN IF NOT EXISTS "oneTimeUse" BOOLEAN NOT NULL DEFAULT true;`);
    await queryRunner.query(`ALTER TABLE "PingPongRoomInvitation" ADD COLUMN IF NOT EXISTS "oneTimeUse" BOOLEAN NOT NULL DEFAULT false;`);
    await queryRunner.query(`ALTER TABLE "PingPongRoomInvitation" ADD COLUMN IF NOT EXISTS "usedAt" TIMESTAMP(3);`);
    await queryRunner.query(`ALTER TABLE "PingPongRoomInvitation" ADD COLUMN IF NOT EXISTS "usedByUserId" TEXT;`);
    await queryRunner.query(`ALTER TABLE "PingPongRoom" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);`);
  }

  private async addIndexes(queryRunner: QueryRunner) {
    const indexes = [
      `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken")`,
      `CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token")`,
      `CREATE INDEX IF NOT EXISTS "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId")`,
      `CREATE INDEX IF NOT EXISTS "AuditLog_targetUserId_idx" ON "AuditLog"("targetUserId")`,
      `CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "AllowedEmail_email_key" ON "AllowedEmail"("email")`,
      `CREATE INDEX IF NOT EXISTS "AllowedEmail_createdByUserId_idx" ON "AllowedEmail"("createdByUserId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "AuthInvitation_tokenHash_key" ON "AuthInvitation"("tokenHash")`,
      `CREATE INDEX IF NOT EXISTS "AuthInvitation_createdByUserId_idx" ON "AuthInvitation"("createdByUserId")`,
      `CREATE INDEX IF NOT EXISTS "AuthInvitation_expiresAt_idx" ON "AuthInvitation"("expiresAt")`,
      `CREATE INDEX IF NOT EXISTS "AuthInvitation_usedAt_idx" ON "AuthInvitation"("usedAt")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "PlayerRanking_userId_key" ON "PlayerRanking"("userId")`,
      `CREATE INDEX IF NOT EXISTS "PlayerRanking_elo_idx" ON "PlayerRanking"("elo")`,
      `CREATE INDEX IF NOT EXISTS "PlayerRanking_wins_idx" ON "PlayerRanking"("wins")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "RankLevel_name_key" ON "RankLevel"("name")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "RankLevel_minElo_key" ON "RankLevel"("minElo")`,
      `CREATE INDEX IF NOT EXISTS "RankLevel_minElo_idx" ON "RankLevel"("minElo")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "MatchHistory_rollbackOfId_key" ON "MatchHistory"("rollbackOfId")`,
      `CREATE INDEX IF NOT EXISTS "MatchHistory_roomId_idx" ON "MatchHistory"("roomId")`,
      `CREATE INDEX IF NOT EXISTS "MatchHistory_winnerId_idx" ON "MatchHistory"("winnerId")`,
      `CREATE INDEX IF NOT EXISTS "MatchHistory_loserId_idx" ON "MatchHistory"("loserId")`,
      `CREATE INDEX IF NOT EXISTS "MatchHistory_createdById_idx" ON "MatchHistory"("createdById")`,
      `CREATE INDEX IF NOT EXISTS "MatchHistory_kind_idx" ON "MatchHistory"("kind")`,
      `CREATE INDEX IF NOT EXISTS "MatchHistory_createdAt_idx" ON "MatchHistory"("createdAt")`,
      `CREATE INDEX IF NOT EXISTS "PingPongRoom_createdById_idx" ON "PingPongRoom"("createdById")`,
      `CREATE INDEX IF NOT EXISTS "PingPongRoom_createdAt_idx" ON "PingPongRoom"("createdAt")`,
      `CREATE INDEX IF NOT EXISTS "PingPongRoomParticipant_roomId_idx" ON "PingPongRoomParticipant"("roomId")`,
      `CREATE INDEX IF NOT EXISTS "PingPongRoomParticipant_userId_idx" ON "PingPongRoomParticipant"("userId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "PingPongRoomParticipant_roomId_userId_key" ON "PingPongRoomParticipant"("roomId", "userId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "PingPongRoomParticipant_roomId_queuePosition_key" ON "PingPongRoomParticipant"("roomId", "queuePosition")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "PingPongRoomInvitation_token_key" ON "PingPongRoomInvitation"("token")`,
      `CREATE INDEX IF NOT EXISTS "PingPongRoomInvitation_roomId_idx" ON "PingPongRoomInvitation"("roomId")`,
      `CREATE INDEX IF NOT EXISTS "PingPongRoomInvitation_createdById_idx" ON "PingPongRoomInvitation"("createdById")`,
      `CREATE INDEX IF NOT EXISTS "PingPongRoomInvitation_expiresAt_idx" ON "PingPongRoomInvitation"("expiresAt")`,
      `CREATE INDEX IF NOT EXISTS "PingPongRoomInvitation_usedAt_idx" ON "PingPongRoomInvitation"("usedAt")`,
    ];

    for (const sql of indexes) {
      await queryRunner.query(sql);
    }
  }

  private async addForeignKeys(queryRunner: QueryRunner) {
    const constraints = [
      [`Account_userId_fkey`, `ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
      [`Session_userId_fkey`, `ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
      [`AuditLog_actorUserId_fkey`, `ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`],
      [`AllowedEmail_createdByUserId_fkey`, `ALTER TABLE "AllowedEmail" ADD CONSTRAINT "AllowedEmail_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`],
      [`AuthInvitation_createdByUserId_fkey`, `ALTER TABLE "AuthInvitation" ADD CONSTRAINT "AuthInvitation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`],
      [`PlayerRanking_userId_fkey`, `ALTER TABLE "PlayerRanking" ADD CONSTRAINT "PlayerRanking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
      [`MatchHistory_roomId_fkey`, `ALTER TABLE "MatchHistory" ADD CONSTRAINT "MatchHistory_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "PingPongRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE`],
      [`MatchHistory_winnerId_fkey`, `ALTER TABLE "MatchHistory" ADD CONSTRAINT "MatchHistory_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`],
      [`MatchHistory_loserId_fkey`, `ALTER TABLE "MatchHistory" ADD CONSTRAINT "MatchHistory_loserId_fkey" FOREIGN KEY ("loserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`],
      [`MatchHistory_createdById_fkey`, `ALTER TABLE "MatchHistory" ADD CONSTRAINT "MatchHistory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`],
      [`MatchHistory_rollbackOfId_fkey`, `ALTER TABLE "MatchHistory" ADD CONSTRAINT "MatchHistory_rollbackOfId_fkey" FOREIGN KEY ("rollbackOfId") REFERENCES "MatchHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE`],
      [`PingPongRoom_createdById_fkey`, `ALTER TABLE "PingPongRoom" ADD CONSTRAINT "PingPongRoom_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`],
      [`PingPongRoomParticipant_roomId_fkey`, `ALTER TABLE "PingPongRoomParticipant" ADD CONSTRAINT "PingPongRoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "PingPongRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
      [`PingPongRoomParticipant_userId_fkey`, `ALTER TABLE "PingPongRoomParticipant" ADD CONSTRAINT "PingPongRoomParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
      [`PingPongRoomInvitation_roomId_fkey`, `ALTER TABLE "PingPongRoomInvitation" ADD CONSTRAINT "PingPongRoomInvitation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "PingPongRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
      [`PingPongRoomInvitation_createdById_fkey`, `ALTER TABLE "PingPongRoomInvitation" ADD CONSTRAINT "PingPongRoomInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`],
    ];

    for (const [name, sql] of constraints) {
      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN
            ${sql};
          END IF;
        END $$;
      `);
    }
  }
}
