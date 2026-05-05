import { Prisma } from "@prisma/client";

type AuditClient = Pick<Prisma.TransactionClient, "auditLog">;

export type AuditAction =
  | "admin_action_denied"
  | "email_allowed"
  | "invitation_created"
  | "invitation_used"
  | "role_changed"
  | "table_created"
  | "table_invitation_created"
  | "table_joined_via_invitation"
  | "table_match_finished"
  | "table_match_rolled_back"
  | "table_member_added"
  | "table_participant_removed"
  | "table_queue_joined"
  | "table_queue_left"
  | "user_deleted";

export type AuditEvent = {
  actorUserId: string | null;
  action: AuditAction;
  metadata?: Prisma.InputJsonValue;
  targetUserId?: string | null;
  tenantId?: string | null;
};

export async function recordAuditEvent(
  client: AuditClient,
  event: AuditEvent,
) {
  await client.auditLog.create({
    data: {
      ...(event.tenantId ? { tenantId: event.tenantId } : {}),
      actorUserId: event.actorUserId,
      targetUserId: event.targetUserId,
      action: event.action,
      metadata: event.metadata,
    },
  });
}

export async function recordAdminDenied(
  client: AuditClient,
  input: {
    actorUserId: string | null;
    reason: string;
    targetUserId?: string | null;
    tenantId?: string | null;
  },
) {
  await recordAuditEvent(client, {
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    action: "admin_action_denied",
    metadata: {
      reason: input.reason,
      tenantContext: input.tenantId ? "known" : "missing",
    },
  });
}
