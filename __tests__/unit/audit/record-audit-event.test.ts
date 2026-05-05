import {
  recordAdminDenied,
  recordAuditEvent,
  type AuditEvent,
} from "@/lib/contexts/audit";

describe("audit context", () => {
  it("maps typed audit events to AuditLog records", async () => {
    const create = jest.fn().mockResolvedValue({});
    const client = { auditLog: { create } };
    const event: AuditEvent = {
      tenantId: "tenant-1",
      actorUserId: "admin-1",
      targetUserId: "user-1",
      action: "table_match_finished",
      metadata: {
        tableId: "table-1",
        winnerId: "winner-1",
        loserId: "loser-1",
        kFactor: 64,
      },
    };

    await recordAuditEvent(client as never, event);

    expect(create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant-1",
        actorUserId: "admin-1",
        targetUserId: "user-1",
        action: "table_match_finished",
        metadata: {
          tableId: "table-1",
          winnerId: "winner-1",
          loserId: "loser-1",
          kFactor: 64,
        },
      },
    });
  });

  it("preserves admin denied metadata semantics", async () => {
    const create = jest.fn().mockResolvedValue({});
    const client = { auditLog: { create } };

    await recordAdminDenied(client as never, {
      tenantId: "tenant-1",
      actorUserId: "admin-1",
      targetUserId: "user-1",
      reason: "role_change_forbidden",
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant-1",
        actorUserId: "admin-1",
        targetUserId: "user-1",
        action: "admin_action_denied",
        metadata: {
          reason: "role_change_forbidden",
          tenantContext: "known",
        },
      },
    });
  });

  it("marks admin denial metadata when tenant context is missing", async () => {
    const create = jest.fn().mockResolvedValue({});
    const client = { auditLog: { create } };

    await recordAdminDenied(client as never, {
      actorUserId: null,
      reason: "admin_context_missing",
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        actorUserId: null,
        targetUserId: undefined,
        action: "admin_action_denied",
        metadata: {
          reason: "admin_context_missing",
          tenantContext: "missing",
        },
      },
    });
  });

  it("covers table queue and invitation audit event names", async () => {
    const create = jest.fn().mockResolvedValue({});
    const client = { auditLog: { create } };

    await recordAuditEvent(client as never, {
      tenantId: "tenant-1",
      actorUserId: "user-1",
      targetUserId: "user-1",
      action: "table_queue_joined",
      metadata: { tableId: "table-1" },
    });
    await recordAuditEvent(client as never, {
      tenantId: "tenant-1",
      actorUserId: "admin-1",
      action: "invitation_used",
      metadata: { invitationId: "invite-1", email: "user@example.com" },
    });

    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({ action: "table_queue_joined" }),
      }),
    );
    expect(create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({ action: "invitation_used" }),
      }),
    );
  });
});
