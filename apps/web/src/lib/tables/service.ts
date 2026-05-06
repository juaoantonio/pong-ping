import { Prisma } from "@prisma/client";
import {
  ensureTableMembership as ensureTableMembershipResult,
  enqueueUserInTable as enqueueUserInTableResult,
  removeParticipantFromTable as removeParticipantFromTableResult,
  removeUserFromTableQueue as removeUserFromTableQueueResult,
  type TablePlayError,
} from "@/lib/contexts/table-play";
import { type DomainResult } from "@/lib/contexts/shared";

type Tx = Prisma.TransactionClient;

function unwrapTablePlayResult<TValue>(
  result: DomainResult<TValue, TablePlayError>,
) {
  if (!result.ok) {
    throw new Error(result.error.code);
  }

  return result.value;
}

export async function ensureTableMembership(
  tx: Tx,
  tableId: string,
  userId: string,
  tenantId: string,
) {
  return unwrapTablePlayResult(
    await ensureTableMembershipResult(tx, tableId, userId, tenantId),
  );
}

export async function enqueueUserInTable(
  tx: Tx,
  tableId: string,
  userId: string,
  tenantId: string,
) {
  return unwrapTablePlayResult(
    await enqueueUserInTableResult(tx, tableId, userId, tenantId),
  );
}

export async function removeParticipantFromTable(
  tx: Tx,
  tableId: string,
  participantId: string,
  tenantId: string,
) {
  return unwrapTablePlayResult(
    await removeParticipantFromTableResult(
      tx,
      tableId,
      participantId,
      tenantId,
    ),
  );
}

export async function removeUserFromTableQueue(
  tx: Tx,
  tableId: string,
  userId: string,
  tenantId: string,
) {
  return unwrapTablePlayResult(
    await removeUserFromTableQueueResult(tx, tableId, userId, tenantId),
  );
}
