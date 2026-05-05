import { Prisma } from "@prisma/client";
import {
  fail,
  type DomainError,
  type DomainResult,
} from "@/lib/contexts/shared";
import { rotateQueueAfterMatch } from "@/lib/tables/queue";

type Tx = Prisma.TransactionClient;

export type TablePlayErrorCode =
  | "table_not_found"
  | "user_not_found"
  | "user_not_in_table"
  | "user_already_queued"
  | "participant_not_found"
  | "user_not_queued"
  | "current_player_cannot_leave_queue"
  | "not_enough_players"
  | "winner_not_in_current_match";

export type TablePlayError = DomainError<TablePlayErrorCode>;

type TableMembership = {
  id: string;
};

type TableParticipant = {
  id: string;
  tableId: string;
  userId: string;
  queuePosition: number;
  joinedAt: Date;
};

type RemovedTableParticipant = {
  id: string;
  queuePosition: number;
};

export type CurrentMatchParticipant = {
  id: string;
  userId: string;
  queuePosition: number;
};

const TABLE_PLAY_CONTEXT = "table-play";

const tablePlayMessages: Record<TablePlayErrorCode, string> = {
  table_not_found: "Mesa nao encontrada.",
  user_not_found: "Usuario nao encontrado.",
  user_not_in_table: "Entre na mesa antes de entrar na fila.",
  user_already_queued: "Voce ja esta na fila desta mesa.",
  participant_not_found: "Participante nao encontrado.",
  user_not_queued: "Voce nao esta na fila desta mesa.",
  current_player_cannot_leave_queue:
    "Jogadores da rodada atual nao podem sair da fila.",
  not_enough_players: "A fila precisa de pelo menos dois jogadores.",
  winner_not_in_current_match: "O vencedor precisa estar na mesa atual.",
};

function tablePlayError(code: TablePlayErrorCode): TablePlayError {
  return {
    context: TABLE_PLAY_CONTEXT,
    code,
    message: tablePlayMessages[code],
  };
}

async function getNextQueuePosition(tx: Tx, tableId: string) {
  const lastParticipant = await tx.pingPongTableParticipant.findFirst({
    where: { tableId },
    orderBy: { queuePosition: "desc" },
    select: { queuePosition: true },
  });

  return (lastParticipant?.queuePosition ?? -1) + 1;
}

export async function reorderTableQueue(
  tx: Tx,
  participantIds: string[],
): Promise<DomainResult<void, TablePlayError>> {
  const temporaryOffset = participantIds.length + 1000;

  await Promise.all(
    participantIds.map((participantId, index) =>
      tx.pingPongTableParticipant.update({
        where: { id: participantId },
        data: { queuePosition: temporaryOffset + index },
      }),
    ),
  );

  await Promise.all(
    participantIds.map((participantId, index) =>
      tx.pingPongTableParticipant.update({
        where: { id: participantId },
        data: { queuePosition: index },
      }),
    ),
  );

  return { ok: true, value: undefined };
}

export async function ensureTableMembership(
  tx: Tx,
  tableId: string,
  userId: string,
): Promise<DomainResult<TableMembership, TablePlayError>> {
  const [table, user, existingMember] = await Promise.all([
    tx.pingPongTable.findFirst({
      where: { id: tableId, deletedAt: null },
      select: { id: true },
    }),
    tx.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }),
    tx.pingPongTableMember.findUnique({
      where: {
        tableId_userId: { tableId, userId },
      },
      select: { id: true },
    }),
  ]);

  if (!table) {
    return fail(tablePlayError("table_not_found"));
  }

  if (!user) {
    return fail(tablePlayError("user_not_found"));
  }

  if (existingMember) {
    return { ok: true, value: existingMember };
  }

  const member = await tx.pingPongTableMember.create({
    data: {
      tableId,
      userId,
    },
    select: { id: true },
  });

  return { ok: true, value: member };
}

export async function enqueueUserInTable(
  tx: Tx,
  tableId: string,
  userId: string,
): Promise<DomainResult<TableParticipant, TablePlayError>> {
  const [table, membership, existingParticipant] = await Promise.all([
    tx.pingPongTable.findFirst({
      where: { id: tableId, deletedAt: null },
      select: { id: true },
    }),
    tx.pingPongTableMember.findUnique({
      where: {
        tableId_userId: { tableId, userId },
      },
      select: { id: true },
    }),
    tx.pingPongTableParticipant.findUnique({
      where: {
        tableId_userId: { tableId, userId },
      },
      select: { id: true },
    }),
  ]);

  if (!table) {
    return fail(tablePlayError("table_not_found"));
  }

  if (!membership) {
    return fail(tablePlayError("user_not_in_table"));
  }

  if (existingParticipant) {
    return fail(tablePlayError("user_already_queued"));
  }

  const participant = await tx.pingPongTableParticipant.create({
    data: {
      tableId,
      userId,
      queuePosition: await getNextQueuePosition(tx, tableId),
    },
  });

  return { ok: true, value: participant };
}

export async function removeParticipantFromTable(
  tx: Tx,
  tableId: string,
  participantId: string,
): Promise<DomainResult<void, TablePlayError>> {
  const participants = await tx.pingPongTableParticipant.findMany({
    where: { tableId },
    orderBy: { queuePosition: "asc" },
    select: { id: true },
  });

  const nextQueue = participants.filter(
    (participant) => participant.id !== participantId,
  );

  if (nextQueue.length === participants.length) {
    return fail(tablePlayError("participant_not_found"));
  }

  await tx.pingPongTableParticipant.delete({
    where: { id: participantId },
  });

  return reorderTableQueue(
    tx,
    nextQueue.map((participant) => participant.id),
  );
}

export async function removeUserFromTableQueue(
  tx: Tx,
  tableId: string,
  userId: string,
): Promise<DomainResult<RemovedTableParticipant, TablePlayError>> {
  const [table, participant, queueCount] = await Promise.all([
    tx.pingPongTable.findFirst({
      where: { id: tableId, deletedAt: null },
      select: { id: true },
    }),
    tx.pingPongTableParticipant.findUnique({
      where: {
        tableId_userId: { tableId, userId },
      },
      select: { id: true, queuePosition: true },
    }),
    tx.pingPongTableParticipant.count({
      where: { tableId },
    }),
  ]);

  if (!table) {
    return fail(tablePlayError("table_not_found"));
  }

  if (!participant) {
    return fail(tablePlayError("user_not_queued"));
  }

  if (participant.queuePosition < 2 && queueCount >= 2) {
    return fail(tablePlayError("current_player_cannot_leave_queue"));
  }

  const removeResult = await removeParticipantFromTable(
    tx,
    tableId,
    participant.id,
  );

  if (!removeResult.ok) {
    return removeResult;
  }

  return { ok: true, value: participant };
}

export async function getCurrentMatchParticipants(
  tx: Tx,
  tableId: string,
): Promise<
  DomainResult<[CurrentMatchParticipant, CurrentMatchParticipant], TablePlayError>
> {
  const queue = await tx.pingPongTableParticipant.findMany({
    where: { tableId },
    orderBy: { queuePosition: "asc" },
    select: { id: true, userId: true, queuePosition: true },
  });

  if (queue.length < 2) {
    return fail(tablePlayError("not_enough_players"));
  }

  return { ok: true, value: [queue[0], queue[1]] };
}

export async function rotateQueueAfterFinishedMatch(
  tx: Tx,
  input: {
    tableId: string;
    winnerParticipantId: string;
  },
): Promise<DomainResult<void, TablePlayError>> {
  const queue = await tx.pingPongTableParticipant.findMany({
    where: { tableId: input.tableId },
    orderBy: { queuePosition: "asc" },
    select: { id: true },
  });

  try {
    const reorderedQueueIds = rotateQueueAfterMatch(
      queue.map((participant) => participant.id),
      input.winnerParticipantId,
    );

    return reorderTableQueue(tx, reorderedQueueIds);
  } catch (error) {
    if (error instanceof Error && error.message === "not_enough_players") {
      return fail(tablePlayError("not_enough_players"));
    }

    if (
      error instanceof Error &&
      error.message === "winner_not_in_current_match"
    ) {
      return fail(tablePlayError("winner_not_in_current_match"));
    }

    throw error;
  }
}

export { rotateQueueAfterMatch };
