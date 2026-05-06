import { createHash, randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";
import { recordAuditEvent } from "@/lib/contexts/audit";
import {
  fail,
  type DomainError,
  type DomainResult,
} from "@/lib/contexts/shared";
import { ensureTableMembership } from "@/lib/tables/service";
import {
  getInvitationExpiry,
  type InvitationExpiryPreset,
} from "@/lib/invitations";
import {
  getInvitationUnavailableReason,
  getInvitationClaimWhereGate,
  isInvitationClaimable,
} from "./policy";

const INVITATIONS_CONTEXT = "invitations";

export type InvitationErrorCode =
  | "invitation_unavailable"
  | "invitation_not_found"
  | "invitation_expired"
  | "invitation_used"
  | "table_not_found"
  | "user_not_found";

export type InvitationError<
  TCode extends InvitationErrorCode = InvitationErrorCode,
> = DomainError<TCode> & {
  context: typeof INVITATIONS_CONTEXT;
};

type TransactionRunner = {
  $transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T>;
};

type AccessInvitationStore = TransactionRunner;

type TableInvitationStore = TransactionRunner &
  Pick<Prisma.TransactionClient, "pingPongTable" | "pingPongTableInvitation">;

export type CreateAccessInvitationInput = {
  actorUserId: string;
  tenantId: string;
  expiresIn: InvitationExpiryPreset;
  oneTimeUse: boolean;
  now?: number;
};

export type CreatedAccessInvitation = {
  id: string;
  expiresAt: Date;
  oneTimeUse: boolean;
  createdAt: Date;
  token: string;
};

export type CreateTableInvitationInput = {
  actorUserId: string;
  expiresIn: InvitationExpiryPreset;
  oneTimeUse: boolean;
  tableId: string;
  tenantId: string;
  now?: number;
};

export type CreatedTableInvitation = {
  id: string;
  expiresAt: Date;
  oneTimeUse: boolean;
  token: string;
};

export type ClaimAccessInvitationInput = {
  email: string;
  token: string;
  now?: Date;
};

export type ClaimedAccessInvitation = {
  email: string;
  invitationId: string;
  oneTimeUse: boolean;
};

export type ClaimTableInvitationInput = {
  token: string;
  tenantId: string;
  userId: string;
  now?: Date;
};

export type ClaimedTableInvitation = {
  invitationId: string;
  tableId: string;
  userId: string;
  oneTimeUse: boolean;
};

function invitationUnavailable(): InvitationError<"invitation_unavailable"> {
  return {
    context: INVITATIONS_CONTEXT,
    code: "invitation_unavailable",
  };
}

function invitationError<TCode extends InvitationErrorCode>(
  code: TCode,
): InvitationError<TCode> {
  return {
    context: INVITATIONS_CONTEXT,
    code,
  };
}

function knownInvitationError<
  TCode extends "table_not_found" | "user_not_found",
>(code: TCode): InvitationError<TCode> {
  return {
    context: INVITATIONS_CONTEXT,
    code,
  };
}

function hashAccessInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createAccessInvitationToken() {
  return randomBytes(32).toString("base64url");
}

function createTableInvitationToken() {
  return randomBytes(24).toString("hex");
}

export async function createAccessInvitation(
  store: Pick<Prisma.TransactionClient, "authInvitation" | "auditLog">,
  input: CreateAccessInvitationInput,
): Promise<DomainResult<CreatedAccessInvitation>> {
  const token = createAccessInvitationToken();
  const invitation = await store.authInvitation.create({
    data: {
      tokenHash: hashAccessInvitationToken(token),
      tenantId: input.tenantId,
      expiresAt: getInvitationExpiry(input.expiresIn, input.now),
      oneTimeUse: input.oneTimeUse,
      createdByUserId: input.actorUserId,
    },
    select: {
      id: true,
      expiresAt: true,
      oneTimeUse: true,
      createdAt: true,
    },
  });

  await recordAuditEvent(store, {
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: "invitation_created",
    metadata: {
      invitationId: invitation.id,
      tenantId: input.tenantId,
      expiresAt: invitation.expiresAt,
      oneTimeUse: invitation.oneTimeUse,
    },
  });

  return { ok: true, value: { ...invitation, token } };
}

export async function createTableInvitation(
  store: TableInvitationStore,
  input: CreateTableInvitationInput,
): Promise<
  DomainResult<CreatedTableInvitation, InvitationError<"table_not_found">>
> {
  const table = await store.pingPongTable.findFirst({
    where: { id: input.tableId, tenantId: input.tenantId, deletedAt: null },
    select: { id: true },
  });

  if (!table) {
    return fail(knownInvitationError("table_not_found"));
  }

  const token = createTableInvitationToken();
  const expiresAt = getInvitationExpiry(input.expiresIn, input.now);
  const invite = await store.$transaction(async (tx) => {
    const createdInvite = await tx.pingPongTableInvitation.create({
      data: {
        tenantId: input.tenantId,
        tableId: input.tableId,
        token,
        createdById: input.actorUserId,
        expiresAt,
        oneTimeUse: input.oneTimeUse,
      },
      select: {
        id: true,
        expiresAt: true,
        oneTimeUse: true,
      },
    });

    await recordAuditEvent(tx, {
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "table_invitation_created",
      metadata: {
        tenantId: input.tenantId,
        tableId: input.tableId,
        invitationId: createdInvite.id,
        expiresAt: createdInvite.expiresAt.toISOString(),
        oneTimeUse: createdInvite.oneTimeUse,
      },
    });

    return createdInvite;
  });

  return { ok: true, value: { ...invite, token } };
}

export async function claimAccessInvitation(
  store: AccessInvitationStore,
  input: ClaimAccessInvitationInput,
): Promise<
  DomainResult<
    ClaimedAccessInvitation,
    InvitationError<"invitation_unavailable">
  >
> {
  const now = input.now ?? new Date();
  const tokenHash = hashAccessInvitationToken(input.token);

  return store.$transaction(async (tx) => {
    const invitation = await tx.authInvitation.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        tenantId: true,
        createdByUserId: true,
        expiresAt: true,
        oneTimeUse: true,
        usedAt: true,
      },
    });

    if (!invitation || !isInvitationClaimable(invitation, now)) {
      return fail(invitationUnavailable());
    }

    const claimed = await tx.authInvitation.updateMany({
      where: {
        tokenHash,
        ...getInvitationClaimWhereGate(invitation, now),
      },
      data: {
        usedAt: now,
        usedByEmail: input.email,
      },
    });

    if (claimed.count === 0) {
      return fail(invitationUnavailable());
    }

    await tx.allowedEmail.upsert({
      where: {
        tenantId_email: {
          tenantId: invitation.tenantId,
          email: input.email,
        },
      },
      create: {
        tenantId: invitation.tenantId,
        email: input.email,
        createdByUserId: invitation.createdByUserId,
      },
      update: {},
    } as never);

    await recordAuditEvent(tx, {
      tenantId: invitation.tenantId,
      actorUserId: invitation.createdByUserId,
      action: "invitation_used",
      metadata: {
        invitationId: invitation.id,
        tenantId: invitation.tenantId,
        email: input.email,
        oneTimeUse: invitation.oneTimeUse,
      },
    });

    return {
      ok: true,
      value: {
        email: input.email,
        invitationId: invitation.id,
        oneTimeUse: invitation.oneTimeUse,
      },
    };
  });
}

export async function claimTableInvitation(
  store: TableInvitationStore,
  input: ClaimTableInvitationInput,
): Promise<DomainResult<ClaimedTableInvitation, InvitationError>> {
  const now = input.now ?? new Date();
  const invitation = await store.pingPongTableInvitation.findUnique({
    where: { token: input.token },
    select: {
      id: true,
      tenantId: true,
      tableId: true,
      expiresAt: true,
      oneTimeUse: true,
      usedAt: true,
    },
  });

  if (!invitation) {
    return fail(invitationError("invitation_not_found"));
  }

  if (invitation.tenantId !== input.tenantId) {
    return fail(invitationError("invitation_not_found"));
  }

  const unavailableReason = getInvitationUnavailableReason(invitation, now);

  if (unavailableReason === "expired") {
    return fail(invitationError("invitation_expired"));
  }

  if (unavailableReason === "used") {
    return fail(invitationError("invitation_used"));
  }

  try {
    return await store.$transaction(async (tx) => {
      await ensureTableMembership(
        tx,
        invitation.tableId,
        input.userId,
        invitation.tenantId,
      );

      const claimed = await tx.pingPongTableInvitation.updateMany({
        where: {
          id: invitation.id,
          tenantId: invitation.tenantId,
          ...getInvitationClaimWhereGate(invitation, now),
        },
        data: {
          usedAt: now,
          usedByUserId: input.userId,
        },
      });

      if (claimed.count === 0) {
        return fail(invitationUnavailable());
      }

      await recordAuditEvent(tx, {
        tenantId: invitation.tenantId,
        actorUserId: input.userId,
        action: "table_joined_via_invitation",
        metadata: {
          tenantId: invitation.tenantId,
          tableId: invitation.tableId,
          invitationId: invitation.id,
          oneTimeUse: invitation.oneTimeUse,
        },
      });

      return {
        ok: true,
        value: {
          invitationId: invitation.id,
          tableId: invitation.tableId,
          userId: input.userId,
          oneTimeUse: invitation.oneTimeUse,
        },
      };
    });
  } catch (error) {
    if (error instanceof Error && error.message === "table_not_found") {
      return fail(knownInvitationError("table_not_found"));
    }

    if (error instanceof Error && error.message === "user_not_found") {
      return fail(knownInvitationError("user_not_found"));
    }

    throw error;
  }
}
