import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/roles";
import {
  calculateElo,
  calculateWinRate,
  DEFAULT_PLAYER_ELO,
  MATCH_ELO_K,
} from "@/lib/ranking/elo";

type MatchRequestBody = {
  winnerUserId?: unknown;
  loserUserId?: unknown;
};

async function deny(actorUserId: string | null, reason: string) {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: "admin_action_denied",
      metadata: { reason },
    },
  });
}

export async function POST(request: Request) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  if (!canAccessAdmin(actor.role)) {
    await deny(actor.id, "create_match_forbidden");
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as MatchRequestBody | null;
  const winnerUserId = body?.winnerUserId;
  const loserUserId = body?.loserUserId;

  if (typeof winnerUserId !== "string" || typeof loserUserId !== "string") {
    return NextResponse.json({ error: "Selecione dois usuarios." }, { status: 400 });
  }

  if (winnerUserId === loserUserId) {
    return NextResponse.json({ error: "Vencedor e perdedor devem ser usuarios diferentes." }, { status: 400 });
  }

  const match = await prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany({
      where: { id: { in: [winnerUserId, loserUserId] } },
      select: { id: true },
    });

    if (users.length !== 2) {
      throw new Error("users_not_found");
    }

    const [winnerRanking, loserRanking] = await Promise.all([
      tx.playerRanking.upsert({
        where: { userId: winnerUserId },
        update: {},
        create: { userId: winnerUserId, elo: DEFAULT_PLAYER_ELO },
      }),
      tx.playerRanking.upsert({
        where: { userId: loserUserId },
        update: {},
        create: { userId: loserUserId, elo: DEFAULT_PLAYER_ELO },
      }),
    ]);

    const nextElo = calculateElo(winnerRanking.elo, loserRanking.elo, MATCH_ELO_K);
    const winnerWins = winnerRanking.wins + 1;
    const winnerTotalMatches = winnerRanking.total_matches + 1;
    const loserTotalMatches = loserRanking.total_matches + 1;

    const [createdMatch] = await Promise.all([
      tx.match.create({
        data: {
          winnerUserId,
          loserUserId,
          createdById: actor.id,
          kFactor: MATCH_ELO_K,
          winnerOldElo: winnerRanking.elo,
          winnerNewElo: nextElo.winnerElo,
          loserOldElo: loserRanking.elo,
          loserNewElo: nextElo.loserElo,
        },
        select: {
          id: true,
          winnerNewElo: true,
          loserNewElo: true,
          createdAt: true,
        },
      }),
      tx.playerRanking.update({
        where: { userId: winnerUserId },
        data: {
          elo: nextElo.winnerElo,
          wins: winnerWins,
          total_matches: winnerTotalMatches,
          winRate: calculateWinRate(winnerWins, winnerTotalMatches),
        },
      }),
      tx.playerRanking.update({
        where: { userId: loserUserId },
        data: {
          elo: nextElo.loserElo,
          total_matches: loserTotalMatches,
          winRate: calculateWinRate(loserRanking.wins, loserTotalMatches),
        },
      }),
      tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: "match_finished",
          metadata: {
            winnerUserId,
            loserUserId,
            kFactor: MATCH_ELO_K,
          },
        },
      }),
    ]);

    return createdMatch;
  }).catch((error) => {
    if (error instanceof Error && error.message === "users_not_found") {
      return null;
    }

    throw error;
  });

  if (!match) {
    return NextResponse.json({ error: "Usuarios selecionados nao existem." }, { status: 400 });
  }

  return NextResponse.json({ match });
}
