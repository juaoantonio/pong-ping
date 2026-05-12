import type {
  ActiveGameResponseContract,
  GameSideResponseContract,
  QueueEntryResponseContract,
  TableMemberResponseContract,
  TableResponseContract,
} from "@pong-ping/contracts";
import { type ActiveGame, type GameSide, type QueueEntry, type TableMember } from "../../../domain";
import { type Table } from "../../../domain";

export function toTableResponse(table: Table): TableResponseContract {
  const queue = table.queue;
  const activeGame = queue.hasPlayableActiveGame(table.playMode)
    ? toActiveGameResponse(queue.formActiveGame(table.playMode))
    : null;

  return {
    id: table.id.value,
    clubId: table.clubId.value,
    name: table.name.value,
    playMode: table.playMode.value,
    createdByAthleteId: table.createdByAthleteId.value,
    createdAt: table.createdAt.toISOString(),
    members: table.members.map(toTableMemberResponse),
    queue: queue.entries.map(toQueueEntryResponse),
    activeGame,
  };
}

export function toTableMemberResponse(member: TableMember): TableMemberResponseContract {
  return {
    athleteId: member.athleteId.value,
    joinedAt: member.joinedAt.toISOString(),
  };
}

export function toQueueEntryResponse(entry: QueueEntry): QueueEntryResponseContract {
  return {
    athleteId: entry.athleteId.value,
    position: entry.position.value,
    joinedAt: entry.joinedAt.toISOString(),
  };
}

export function toActiveGameResponse(activeGame: ActiveGame): ActiveGameResponseContract {
  return {
    playMode: activeGame.playMode.value,
    firstSide: toGameSideResponse(activeGame.firstSide),
    secondSide: toGameSideResponse(activeGame.secondSide),
  };
}

export function toGameSideResponse(side: GameSide): GameSideResponseContract {
  return {
    athleteIds: side.athletes.map((athleteId) => athleteId.value),
  };
}
