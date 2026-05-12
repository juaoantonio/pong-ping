import type {
  GameRecordResponseContract,
  SideRatingChangeResponseContract,
} from "@pong-ping/contracts";
import { toGameSideResponse } from "../../../../table/presentation/http/serializers/table-contract.serializer";
import { type GameRecord, type SideRatingChange } from "../../../domain";

export function toGameRecordResponse(record: GameRecord): GameRecordResponseContract {
  return {
    id: record.id.value,
    clubId: record.clubId.value,
    tableId: record.tableId.value,
    winningSide: toGameSideResponse(record.winningSide),
    losingSide: toGameSideResponse(record.losingSide),
    ratingChanges: record.ratingChanges.map(toSideRatingChangeResponse),
    actorAthleteId: record.actorAthleteId.value,
    finishedAt: record.finishedAt.toISOString(),
    originalRecordId: record.originalRecordId?.value ?? null,
    correctionId: record.correctionId?.value ?? null,
    isCorrection: record.isCorrection,
  };
}

function toSideRatingChangeResponse(change: SideRatingChange): SideRatingChangeResponseContract {
  return {
    side: toGameSideResponse(change.side),
    changes: change.changes.map((athleteChange) => ({
      athleteId: athleteChange.athleteId.value,
      delta: {
        points: athleteChange.delta.points,
        wins: athleteChange.delta.wins,
        totalMatches: athleteChange.delta.totalMatches,
      },
    })),
  };
}
