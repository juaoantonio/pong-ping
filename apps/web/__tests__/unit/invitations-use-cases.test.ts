/**
 * @jest-environment node
 */

import { hashInvitationToken } from "@/lib/auth/access";
import {
  claimAccessInvitation,
  claimTableInvitation,
  createTableInvitation,
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
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  return {
    tx,
    store: {
      pingPongTable: {
        findFirst: jest.fn(),
      },
      pingPongTableInvitation: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => callback(tx as never)),
    } as any,
  };
}

describe("casos de uso de convite", () => {
  const now = new Date("2026-05-04T12:00:00.000Z");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reivindica convite de acesso e grava registros de allowlist e auditoria", async () => {
    const { store, tx } = createAccessStore();
    tx.authInvitation.findUnique.mockResolvedValue({
      id: "invitation-1",
      tenantId: "tenant-1",
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
        tenantId: true,
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
      where: {
        tenantId_email: {
          tenantId: "tenant-1",
          email: "person@example.com",
        },
      },
      create: {
        tenantId: "tenant-1",
        email: "person@example.com",
        createdByUserId: "admin-1",
      },
      update: {},
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant-1",
        actorUserId: "admin-1",
        targetUserId: undefined,
        action: "invitation_used",
        metadata: {
          invitationId: "invitation-1",
          tenantId: "tenant-1",
          email: "person@example.com",
          oneTimeUse: true,
        },
      },
    });
  });

  it("permite que convites de acesso reutilizaveis sobrescrevam uso sem trava usedAt", async () => {
    const { store, tx } = createAccessStore();
    tx.authInvitation.findUnique.mockResolvedValue({
      id: "invitation-1",
      tenantId: "tenant-1",
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

  it("retorna invitation_unavailable quando trava de corrida da reivindicacao de acesso falha", async () => {
    const { store, tx } = createAccessStore();
    tx.authInvitation.findUnique.mockResolvedValue({
      id: "invitation-1",
      tenantId: "tenant-1",
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

  it("retorna invitation_unavailable para convites de acesso ausentes ou gastos", async () => {
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
      tenantId: "tenant-1",
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

  it("cria convites de mesa dentro do tenant do ator", async () => {
    const { store, tx } = createTableStore();
    const expiresAt = new Date("2026-05-11T12:00:00.000Z");

    store.pingPongTable.findFirst.mockResolvedValue({ id: "table-1" });
    tx.pingPongTableInvitation.create.mockResolvedValue({
      id: "table-invitation-1",
      expiresAt,
      oneTimeUse: false,
    });

    await expect(
      createTableInvitation(store, {
        actorUserId: "admin-1",
        tenantId: "tenant-1",
        tableId: "table-1",
        expiresIn: "7d",
        oneTimeUse: false,
        now: Date.parse("2026-05-04T12:00:00.000Z"),
      }),
    ).resolves.toMatchObject({
      ok: true,
      value: {
        id: "table-invitation-1",
        expiresAt,
        oneTimeUse: false,
      },
    });

    expect(store.pingPongTable.findFirst).toHaveBeenCalledWith({
      where: { id: "table-1", tenantId: "tenant-1", deletedAt: null },
      select: { id: true },
    });
    expect(tx.pingPongTableInvitation.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant-1",
        tableId: "table-1",
        token: expect.any(String),
        createdById: "admin-1",
        expiresAt,
        oneTimeUse: false,
      },
      select: {
        id: true,
        expiresAt: true,
        oneTimeUse: true,
      },
    });
  });

  it("reivindica convite de mesa apos garantir associacao", async () => {
    const { store, tx } = createTableStore();
    store.pingPongTableInvitation.findUnique.mockResolvedValue({
      id: "table-invitation-1",
      tenantId: "tenant-1",
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
        tenantId: "tenant-1",
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
      "tenant-1",
    );
    expect(tx.pingPongTableInvitation.updateMany).toHaveBeenCalledWith({
      where: {
        id: "table-invitation-1",
        tenantId: "tenant-1",
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
        tenantId: "tenant-1",
        actorUserId: "user-1",
        targetUserId: undefined,
        action: "table_joined_via_invitation",
        metadata: {
          tenantId: "tenant-1",
          tableId: "table-1",
          invitationId: "table-invitation-1",
          oneTimeUse: true,
        },
      },
    });
  });

  it("permite que convites de mesa reutilizaveis sobrescrevam uso sem trava usedAt", async () => {
    const { store, tx } = createTableStore();
    store.pingPongTableInvitation.findUnique.mockResolvedValue({
      id: "table-invitation-1",
      tenantId: "tenant-1",
      tableId: "table-1",
      expiresAt: new Date("2026-05-04T12:05:00.000Z"),
      oneTimeUse: false,
      usedAt: new Date("2026-05-04T11:00:00.000Z"),
    });
    tx.pingPongTableInvitation.updateMany.mockResolvedValue({ count: 1 });
    mockedEnsureTableMembership.mockResolvedValue({ id: "member-1" } as never);

    await claimTableInvitation(store, {
      token: "table-token",
      tenantId: "tenant-1",
      userId: "user-1",
      now,
    });

    expect(tx.pingPongTableInvitation.updateMany).toHaveBeenCalledWith({
      where: {
        id: "table-invitation-1",
        tenantId: "tenant-1",
        expiresAt: { gt: now },
      },
      data: {
        usedAt: now,
        usedByUserId: "user-1",
      },
    });
  });

  it("retorna invitation_unavailable quando trava de corrida da reivindicacao de mesa falha", async () => {
    const { store, tx } = createTableStore();
    store.pingPongTableInvitation.findUnique.mockResolvedValue({
      id: "table-invitation-1",
      tenantId: "tenant-1",
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
        tenantId: "tenant-1",
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

  it("nao cria associacao quando convite de mesa pertence a outro tenant", async () => {
    const { store } = createTableStore();
    store.pingPongTableInvitation.findUnique.mockResolvedValue({
      id: "table-invitation-1",
      tenantId: "tenant-a",
      tableId: "table-1",
      expiresAt: new Date("2026-05-04T12:05:00.000Z"),
      oneTimeUse: true,
      usedAt: null,
    });

    await expect(
      claimTableInvitation(store, {
        token: "table-token",
        tenantId: "tenant-b",
        userId: "user-b",
        now,
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "invitations",
        code: "invitation_not_found",
      },
    });

    expect(mockedEnsureTableMembership).not.toHaveBeenCalled();
    expect(store.$transaction).not.toHaveBeenCalled();
  });

  it("retorna erros tipados para convites indisponiveis e falhas de associacao", async () => {
    const { store } = createTableStore();
    store.pingPongTableInvitation.findUnique.mockResolvedValueOnce(null);

    await expect(
      claimTableInvitation(store, {
        token: "missing",
        tenantId: "tenant-1",
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
      tenantId: "tenant-1",
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
        tenantId: "tenant-1",
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
