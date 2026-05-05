/**
 * @jest-environment node
 */

import { POST as rollbackRound } from "@/app/api/admin/rounds/[roundId]/rollback/route";
import { POST as rollbackTableMatch } from "@/app/api/admin/tables/[tableId]/matches/[matchId]/rollback/route";
import { POST as finishTableMatch } from "@/app/api/admin/tables/[tableId]/matches/route";
import { requireAdmin } from "@/app/api/admin/_shared";
import { isSuperAdmin } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { finishMatch, rollbackMatch } from "@/lib/contexts/competition";
import { prisma } from "@/lib/prisma";

jest.mock("@/app/api/admin/_shared", () => ({
  deny: jest.fn(),
  getKnownTenantIdForActor: jest.fn(async () => "tenant-1"),
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/auth/roles", () => ({
  isSuperAdmin: jest.fn(),
}));

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/contexts/competition", () => ({
  finishMatch: jest.fn(),
  mapCompetitionErrorToHttp: jest.requireActual(
    "@/lib/contexts/competition/errors",
  )
    .mapCompetitionErrorToHttp,
  rollbackMatch: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
    matchHistory: {
      findFirst: jest.fn(),
    },
  },
}));

const mockedRequireAdmin = jest.mocked(requireAdmin);
const mockedIsSuperAdmin = jest.mocked(isSuperAdmin);
const mockedGetCurrentUser = jest.mocked(getCurrentUser);
const mockedFinishMatch = jest.mocked(finishMatch);
const mockedRollbackMatch = jest.mocked(rollbackMatch);
const mockedTransaction = jest.mocked(prisma.$transaction);
const mockedPrisma = jest.mocked(prisma);

function actor() {
  return {
    id: "admin-1",
    role: "superadmin" as const,
    email: "admin@example.com",
    name: "Admin",
    avatarUrl: null,
    image: null,
    createdAt: new Date("2026-05-04T12:00:00.000Z"),
    tenantId: "tenant-1",
  };
}

function tableContext() {
  return {
    params: Promise.resolve({ tableId: "table-1" }),
  };
}

function tableRollbackContext() {
  return {
    params: Promise.resolve({ tableId: "table-1", matchId: "match-1" }),
  };
}

function roundRollbackContext() {
  return {
    params: Promise.resolve({ roundId: "match-1" }),
  };
}

describe("competition match routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAdmin.mockResolvedValue({ actor: actor() });
    mockedGetCurrentUser.mockResolvedValue(actor());
    mockedIsSuperAdmin.mockReturnValue(true);
    mockedTransaction.mockImplementation(async (callback) =>
      callback({} as never),
    );
  });

  it("finishes a match through the competition use case", async () => {
    mockedFinishMatch.mockResolvedValue({
      ok: true,
      value: {
        id: "match-1",
        winnerId: "winner-1",
        loserId: "loser-1",
        winnerNewElo: 1032,
        loserNewElo: 968,
      },
    });

    const response = await finishTableMatch(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({ winnerParticipantId: "participant-1" }),
      }),
      tableContext(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      match: {
        id: "match-1",
        winnerId: "winner-1",
        loserId: "loser-1",
        winnerNewElo: 1032,
        loserNewElo: 968,
      },
    });
    expect(mockedFinishMatch).toHaveBeenCalledWith(expect.anything(), {
      tableId: "table-1",
      tenantId: "tenant-1",
      winnerParticipantId: "participant-1",
      actorUserId: "admin-1",
    });
  });

  it("maps competition finish errors without raw message branching", async () => {
    mockedFinishMatch.mockResolvedValue({
      ok: false,
      error: {
        context: "competition",
        code: "winner_not_in_current_match",
      },
    });

    const response = await finishTableMatch(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({ winnerParticipantId: "participant-3" }),
      }),
      tableContext(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "O vencedor precisa estar na mesa atual.",
    });
  });

  it("rolls back a table match through the competition use case", async () => {
    mockedRollbackMatch.mockResolvedValue({
      ok: true,
      value: {
        id: "rollback-1",
        rollbackOfId: "match-1",
        winnerId: "winner-1",
        loserId: "loser-1",
        winnerNewElo: 1000,
        loserNewElo: 1000,
      },
    });

    const response = await rollbackTableMatch(
      new Request("http://test.local", { method: "POST" }),
      tableRollbackContext(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      rollback: {
        id: "rollback-1",
        rollbackOfId: "match-1",
        winnerId: "winner-1",
        loserId: "loser-1",
        winnerNewElo: 1000,
        loserNewElo: 1000,
      },
    });
    expect(mockedRollbackMatch).toHaveBeenCalledWith(expect.anything(), {
      tableId: "table-1",
      tenantId: "tenant-1",
      matchHistoryId: "match-1",
      actorUserId: "admin-1",
    });
  });

  it("maps rollback competition errors", async () => {
    mockedRollbackMatch.mockResolvedValue({
      ok: false,
      error: {
        context: "competition",
        code: "match_already_rolled_back",
      },
    });

    const response = await rollbackTableMatch(
      new Request("http://test.local", { method: "POST" }),
      tableRollbackContext(),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Esta rodada ja foi revertida.",
    });
  });

  it("keeps admin round rollback table-id precheck and uses competition rollback", async () => {
    mockedPrisma.matchHistory.findFirst.mockResolvedValue({
      tableId: "table-1",
    });
    mockedRollbackMatch.mockResolvedValue({
      ok: true,
      value: {
        id: "rollback-1",
        rollbackOfId: "match-1",
        winnerId: "winner-1",
        loserId: "loser-1",
        winnerNewElo: 1000,
        loserNewElo: 1000,
      },
    });

    const response = await rollbackRound(
      new Request("http://test.local", { method: "POST" }),
      roundRollbackContext(),
    );

    expect(response.status).toBe(200);
    expect(mockedRollbackMatch).toHaveBeenCalledWith(expect.anything(), {
      tableId: "table-1",
      tenantId: "tenant-1",
      matchHistoryId: "match-1",
      actorUserId: "admin-1",
    });
  });
});
