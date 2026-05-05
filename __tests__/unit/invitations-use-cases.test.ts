/**
 * @jest-environment node
 */

import { hashInvitationToken } from "@/lib/auth/access";
import {
  claimAccessInvitation,
  claimTableInvitation,
} from "@/lib/contexts/invitations";
import { ensureTableMembership } from "@/lib/tables/service";

jest.mock("@/lib/tables/service", () => ({
  ensureTableMembership: jest.fn(),
}));

const mockedEnsureTableMembership = jest.mocked(ensureTableMembership);

function createAccessStore() {
  const tx = {
    authInvitation: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    allowedEmail: {
      upsert: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  return {
    tx,
    store: {
      $transaction: jest.fn(async (callback) => callback(tx as never)),
    },
  };
}

function createTableStore() {
  const tx = {
    pingPongTableInvitation: {
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  return {
    tx,
    store: {
      pingPongTableInvitation: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => callback(tx as never)),
    },
  };
}

describe("invitation use cases", () => {
  const now = new Date("2026-05-04T12:00:00.000Z");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("claims an access invitation and writes allowlist and audit records", async () => {
    const { store, tx } = createAccessStore();
    tx.authInvitation.findUnique.mockResolvedValue({
      id: "invitation-1",
      createdByUserId: "admin-1",
      expiresAt: new Date("2026-05-04T12:05:00.000Z"),
      oneTimeUse: true,
      usedAt: null,
    });
    tx.authInvitation.updateMany.mockResolvedValue({ count: 1 });
    tx.allowedEmail.upsert.mockResolvedValue({ id: "allowed-1" });

    await expect(
      claimAccessInvitation(store, {
        token: "raw-token",
        email: "person@example.com",
        now,
      }),
    ).resolves.toEqual({
      ok: true,
      value: {
        email: "person@example.com",
        invitationId: "invitation-1",
        oneTimeUse: true,
      },
    });

    expect(tx.authInvitation.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashInvitationToken("raw-token") },
      select: {
        id: true,
        createdByUserId: true,
        expiresAt: true,
        oneTimeUse: true,
        usedAt: true,
      },
    });
    expect(tx.authInvitation.updateMany).toHaveBeenCalledWith({
      where: {
        tokenHash: hashInvitationToken("raw-token"),
        expiresAt: { gt: now },
        usedAt: null,
      },
      data: {
        usedAt: now,
        usedByEmail: "person@example.com",
      },
    });
    expect(tx.allowedEmail.upsert).toHaveBeenCalledWith({
      where: { email: "person@example.com" },
      create: {
        email: "person@example.com",
        createdByUserId: "admin-1",
      },
      update: {},
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "admin-1",
        targetUserId: undefined,
        action: "invitation_used",
        metadata: {
          invitationId: "invitation-1",
          email: "person@example.com",
          oneTimeUse: true,
        },
      },
    });
  });

  it("lets reusable access invitations overwrite usage without a usedAt gate", async () => {
    const { store, tx } = createAccessStore();
    tx.authInvitation.findUnique.mockResolvedValue({
      id: "invitation-1",
      createdByUserId: "admin-1",
      expiresAt: new Date("2026-05-04T12:05:00.000Z"),
      oneTimeUse: false,
      usedAt: new Date("2026-05-04T11:00:00.000Z"),
    });
    tx.authInvitation.updateMany.mockResolvedValue({ count: 1 });
    tx.allowedEmail.upsert.mockResolvedValue({ id: "allowed-1" });

    await claimAccessInvitation(store, {
      token: "raw-token",
      email: "person@example.com",
      now,
    });

    expect(tx.authInvitation.updateMany).toHaveBeenCalledWith({
      where: {
        tokenHash: hashInvitationToken("raw-token"),
        expiresAt: { gt: now },
      },
      data: {
        usedAt: now,
        usedByEmail: "person@example.com",
      },
    });
  });

  it("returns invitation_unavailable when access claim race gate fails", async () => {
    const { store, tx } = createAccessStore();
    tx.authInvitation.findUnique.mockResolvedValue({
      id: "invitation-1",
      createdByUserId: "admin-1",
      expiresAt: new Date("2026-05-04T12:05:00.000Z"),
      oneTimeUse: true,
      usedAt: null,
    });
    tx.authInvitation.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      claimAccessInvitation(store, {
        token: "raw-token",
        email: "person@example.com",
        now,
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "invitations",
        code: "invitation_unavailable",
      },
    });

    expect(tx.allowedEmail.upsert).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("returns invitation_unavailable for missing or spent access invitations", async () => {
    const { store, tx } = createAccessStore();
    tx.authInvitation.findUnique.mockResolvedValueOnce(null);

    await expect(
      claimAccessInvitation(store, {
        token: "missing",
        email: "person@example.com",
        now,
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "invitations",
        code: "invitation_unavailable",
      },
    });

    tx.authInvitation.findUnique.mockResolvedValueOnce({
      id: "invitation-2",
      createdByUserId: "admin-1",
      expiresAt: new Date("2026-05-04T12:05:00.000Z"),
      oneTimeUse: true,
      usedAt: new Date("2026-05-04T11:00:00.000Z"),
    });

    await expect(
      claimAccessInvitation(store, {
        token: "spent",
        email: "person@example.com",
        now,
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "invitations",
        code: "invitation_unavailable",
      },
    });
  });

  it("claims a table invitation after ensuring membership", async () => {
    const { store, tx } = createTableStore();
    store.pingPongTableInvitation.findUnique.mockResolvedValue({
      id: "table-invitation-1",
      tableId: "table-1",
      expiresAt: new Date("2026-05-04T12:05:00.000Z"),
      oneTimeUse: true,
      usedAt: null,
    });
    tx.pingPongTableInvitation.updateMany.mockResolvedValue({ count: 1 });
    mockedEnsureTableMembership.mockResolvedValue({ id: "member-1" } as never);

    await expect(
      claimTableInvitation(store, {
        token: "table-token",
        userId: "user-1",
        now,
      }),
    ).resolves.toEqual({
      ok: true,
      value: {
        invitationId: "table-invitation-1",
        tableId: "table-1",
        userId: "user-1",
        oneTimeUse: true,
      },
    });

    expect(mockedEnsureTableMembership).toHaveBeenCalledWith(
      tx,
      "table-1",
      "user-1",
    );
    expect(tx.pingPongTableInvitation.updateMany).toHaveBeenCalledWith({
      where: {
        id: "table-invitation-1",
        expiresAt: { gt: now },
        usedAt: null,
      },
      data: {
        usedAt: now,
        usedByUserId: "user-1",
      },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "user-1",
        targetUserId: undefined,
        action: "table_joined_via_invitation",
        metadata: {
          tableId: "table-1",
          invitationId: "table-invitation-1",
          oneTimeUse: true,
        },
      },
    });
  });

  it("lets reusable table invitations overwrite usage without a usedAt gate", async () => {
    const { store, tx } = createTableStore();
    store.pingPongTableInvitation.findUnique.mockResolvedValue({
      id: "table-invitation-1",
      tableId: "table-1",
      expiresAt: new Date("2026-05-04T12:05:00.000Z"),
      oneTimeUse: false,
      usedAt: new Date("2026-05-04T11:00:00.000Z"),
    });
    tx.pingPongTableInvitation.updateMany.mockResolvedValue({ count: 1 });
    mockedEnsureTableMembership.mockResolvedValue({ id: "member-1" } as never);

    await claimTableInvitation(store, {
      token: "table-token",
      userId: "user-1",
      now,
    });

    expect(tx.pingPongTableInvitation.updateMany).toHaveBeenCalledWith({
      where: {
        id: "table-invitation-1",
        expiresAt: { gt: now },
      },
      data: {
        usedAt: now,
        usedByUserId: "user-1",
      },
    });
  });

  it("returns invitation_unavailable when table claim race gate fails", async () => {
    const { store, tx } = createTableStore();
    store.pingPongTableInvitation.findUnique.mockResolvedValue({
      id: "table-invitation-1",
      tableId: "table-1",
      expiresAt: new Date("2026-05-04T12:05:00.000Z"),
      oneTimeUse: true,
      usedAt: null,
    });
    tx.pingPongTableInvitation.updateMany.mockResolvedValue({ count: 0 });
    mockedEnsureTableMembership.mockResolvedValue({ id: "member-1" } as never);

    await expect(
      claimTableInvitation(store, {
        token: "table-token",
        userId: "user-1",
        now,
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "invitations",
        code: "invitation_unavailable",
      },
    });

    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("returns typed errors for unavailable invitations and membership failures", async () => {
    const { store } = createTableStore();
    store.pingPongTableInvitation.findUnique.mockResolvedValueOnce(null);

    await expect(
      claimTableInvitation(store, {
        token: "missing",
        userId: "user-1",
        now,
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "invitations",
        code: "invitation_not_found",
      },
    });

    store.pingPongTableInvitation.findUnique.mockResolvedValueOnce({
      id: "table-invitation-1",
      tableId: "table-1",
      expiresAt: new Date("2026-05-04T12:05:00.000Z"),
      oneTimeUse: true,
      usedAt: null,
    });
    mockedEnsureTableMembership.mockRejectedValueOnce(
      new Error("table_not_found"),
    );

    await expect(
      claimTableInvitation(store, {
        token: "table-token",
        userId: "user-1",
        now,
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "invitations",
        code: "table_not_found",
      },
    });
  });
});
