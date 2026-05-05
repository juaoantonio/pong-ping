import { Prisma } from "@prisma/client";
import { recordAuditEvent } from "@/lib/contexts/audit";
import {
  fail,
  type DomainError,
  type DomainResult,
} from "@/lib/contexts/shared";
import {
  getCurrentMatchParticipants,
  rotateQueueAfterFinishedMatch,
} from "@/lib/contexts/table-play";
import {
  calculateElo,
  calculateWinRate,
  DEFAULT_PLAYER_ELO,
  MATCH_ELO_K,
} from "@/lib/ranking/elo";

type Tx = Prisma.TransactionClient;

const COMPETITION_CONTEXT = "competition";

export type CompetitionErrorCode =
  | "table_not_found"
  | "not_enough_players"
  | "winner_not_in_current_match"
  | "match_not_found"
  | "cannot_rollback_rollback"
  | "match_already_rolled_back"
  | "ranking_not_found";

export type CompetitionError = DomainError<CompetitionErrorCode> & {
  context: typeof COMPETITION_CONTEXT;
};

export type FinishedMatchDto = {
  id: string;
  winnerId: string;
  loserId: string;
  winnerNewElo: number;
  loserNewElo: number;
};

export type RollbackMatchDto = {
  id: string;
  rollbackOfId: string | null;
  winnerId: string;
  loserId: string;
  winnerNewElo: number;
  loserNewElo: number;
};

function competitionError(code: CompetitionErrorCode): CompetitionError {
  return {
    context: COMPETITION_CONTEXT,
    code,
  };
}

export async function finishMatch(
  tx: Tx,
  input: {
    actorUserId: string;
    tenantId: string;
    tableId: string;
    winnerParticipantId: string;
  },
): Promise<DomainResult<FinishedMatchDto, CompetitionError>> {
  const table = await tx.pingPongTable.findFirst({
    where: { id: input.tableId, tenantId: input.tenantId, deletedAt: null },
    select: { id: true, tenantId: true },
  });

  if (!table) {
    return fail(competitionError("table_not_found"));
  }

  const currentPlayersResult = await getCurrentMatchParticipants(
    tx,
    input.tableId,
    input.tenantId,
  );

  if (!currentPlayersResult.ok) {
    if (currentPlayersResult.error.code === "not_enough_players") {
      return fail(competitionError("not_enough_players"));
    }

    return fail(competitionError("table_not_found"));
  }

  const currentPlayers = currentPlayersResult.value;
  const winnerParticipant = currentPlayers.find(
    (participant) => participant.id === input.winnerParticipantId,
  );
  const loserParticipant = currentPlayers.find(
    (participant) => participant.id !== input.winnerParticipantId,
  );

  if (!winnerParticipant || !loserParticipant) {
    return fail(competitionError("winner_not_in_current_match"));
  }

  const [winnerRanking, loserRanking] = await Promise.all([
    tx.playerRanking.upsert({
      where: { userId: winnerParticipant.userId },
      update: {},
      create: {
        tenantId: input.tenantId,
        userId: winnerParticipant.userId,
        elo: DEFAULT_PLAYER_ELO,
      },
    }),
    tx.playerRanking.upsert({
      where: { userId: loserParticipant.userId },
      update: {},
      create: {
        tenantId: input.tenantId,
        userId: loserParticipant.userId,
        elo: DEFAULT_PLAYER_ELO,
      },
    }),
  ]);

  const nextElo = calculateElo(
    winnerRanking.elo,
    loserRanking.elo,
    MATCH_ELO_K,
  );
  const winnerWins = winnerRanking.wins + 1;
  const winnerTotalMatches = winnerRanking.total_matches + 1;
  const loserTotalMatches = loserRanking.total_matches + 1;
  const winnerDiffPoints = nextElo.winnerElo - winnerRanking.elo;
  const loserDiffPoints = nextElo.loserElo - loserRanking.elo;

  const [createdMatch] = await Promise.all([
    tx.matchHistory.create({
      data: {
        tenantId: input.tenantId,
        tableId: input.tableId,
        winnerId: winnerParticipant.userId,
        loserId: loserParticipant.userId,
        kind: "match",
        createdById: input.actorUserId,
        kFactor: MATCH_ELO_K,
        winnerOldElo: winnerRanking.elo,
        winnerNewElo: nextElo.winnerElo,
        winnerDiffPoints,
        loserOldElo: loserRanking.elo,
        loserNewElo: nextElo.loserElo,
        loserDiffPoints,
      },
      select: {
        id: true,
        winnerId: true,
        loserId: true,
        winnerNewElo: true,
        loserNewElo: true,
      },
    }),
    tx.playerRanking.update({
      where: { userId: winnerParticipant.userId },
      data: {
        elo: nextElo.winnerElo,
        wins: winnerWins,
        total_matches: winnerTotalMatches,
        winRate: calculateWinRate(winnerWins, winnerTotalMatches),
      },
    }),
    tx.playerRanking.update({
      where: { userId: loserParticipant.userId },
      data: {
        elo: nextElo.loserElo,
        total_matches: loserTotalMatches,
        winRate: calculateWinRate(loserRanking.wins, loserTotalMatches),
      },
    }),
    recordAuditEvent(tx, {
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "table_match_finished",
      metadata: {
        tableId: input.tableId,
        winnerId: winnerParticipant.userId,
        loserId: loserParticipant.userId,
        kFactor: MATCH_ELO_K,
      },
    }),
  ]);

  const rotationResult = await rotateQueueAfterFinishedMatch(tx, {
    tableId: input.tableId,
    tenantId: input.tenantId,
    winnerParticipantId: input.winnerParticipantId,
  });

  if (!rotationResult.ok) {
    if (rotationResult.error.code === "winner_not_in_current_match") {
      return fail(competitionError("winner_not_in_current_match"));
    }

    return fail(competitionError("not_enough_players"));
  }

  return { ok: true, value: createdMatch };
}

export async function rollbackMatch(
  tx: Tx,
  input: {
    actorUserId: string;
    tenantId: string;
    matchHistoryId: string;
    tableId: string;
  },
): Promise<DomainResult<RollbackMatchDto, CompetitionError>> {
  const match = await tx.matchHistory.findFirst({
    where: {
      id: input.matchHistoryId,
      tableId: input.tableId,
      tenantId: input.tenantId,
    },
    select: {
      id: true,
      tenantId: true,
      tableId: true,
      winnerId: true,
      loserId: true,
      kind: true,
      kFactor: true,
      winnerDiffPoints: true,
      loserDiffPoints: true,
      rollbacks: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!match) {
    return fail(competitionError("match_not_found"));
  }

  if (match.kind === "rollback") {
    return fail(competitionError("cannot_rollback_rollback"));
  }

  if (match.rollbacks.length > 0) {
    return fail(competitionError("match_already_rolled_back"));
  }

  const [winnerRanking, loserRanking] = await Promise.all([
    tx.playerRanking.findFirst({
      where: { userId: match.winnerId, tenantId: input.tenantId },
    }),
    tx.playerRanking.findFirst({
      where: { userId: match.loserId, tenantId: input.tenantId },
    }),
  ]);

  if (!winnerRanking || !loserRanking) {
    return fail(competitionError("ranking_not_found"));
  }

  const nextWinnerElo = winnerRanking.elo - match.winnerDiffPoints;
  const nextLoserElo = loserRanking.elo - match.loserDiffPoints;
  const nextWinnerWins = Math.max(0, winnerRanking.wins - 1);
  const nextWinnerTotalMatches = Math.max(0, winnerRanking.total_matches - 1);
  const nextLoserTotalMatches = Math.max(0, loserRanking.total_matches - 1);

  const [rollback] = await Promise.all([
    tx.matchHistory.create({
      data: {
        tenantId: input.tenantId,
        tableId: input.tableId,
        winnerId: match.winnerId,
        loserId: match.loserId,
        kind: "rollback",
        rollbackOfId: match.id,
        createdById: input.actorUserId,
        kFactor: match.kFactor,
        winnerOldElo: winnerRanking.elo,
        winnerNewElo: nextWinnerElo,
        winnerDiffPoints: -match.winnerDiffPoints,
        loserOldElo: loserRanking.elo,
        loserNewElo: nextLoserElo,
        loserDiffPoints: -match.loserDiffPoints,
      },
      select: {
        id: true,
        rollbackOfId: true,
        winnerId: true,
        loserId: true,
        winnerNewElo: true,
        loserNewElo: true,
      },
    }),
    tx.playerRanking.update({
      where: { userId: match.winnerId },
      data: {
        elo: nextWinnerElo,
        wins: nextWinnerWins,
        total_matches: nextWinnerTotalMatches,
        winRate: calculateWinRate(nextWinnerWins, nextWinnerTotalMatches),
      },
    }),
    tx.playerRanking.update({
      where: { userId: match.loserId },
      data: {
        elo: nextLoserElo,
        total_matches: nextLoserTotalMatches,
        winRate: calculateWinRate(loserRanking.wins, nextLoserTotalMatches),
      },
    }),
    recordAuditEvent(tx, {
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "table_match_rolled_back",
      metadata: {
        tableId: input.tableId,
        matchHistoryId: input.matchHistoryId,
        winnerId: match.winnerId,
        loserId: match.loserId,
      },
    }),
  ]);

  return { ok: true, value: rollback };
}
