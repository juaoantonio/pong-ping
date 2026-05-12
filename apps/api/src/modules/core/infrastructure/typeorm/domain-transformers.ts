import type { ValueTransformer } from "typeorm";
import type { AthleteGripStyle } from "../../athlete/domain/value-objects/athlete-grip-style.enum";
import type { AthletePlayingStyle } from "../../athlete/domain/value-objects/athlete-playing-style.enum";
import { AthleteProfile } from "../../athlete/domain/value-objects/athlete-profile";
import type { AthleteTechnicalLevel } from "../../athlete/domain/value-objects/athlete-technical-level.enum";
import { AthleteId } from "../../athlete/domain";
import { GameResult } from "../../competition/domain/game-result";
import { SideRatingChange } from "../../competition/domain/side-rating-change";
import { GameRecordId } from "../../competition/domain/value-objects/game-record-id";
import { ActorId, type DomainId } from "../../shared/domain";
import { ActiveGame, GameSide, TableMember, TableQueue } from "../../table/domain";

type DomainIdFactory<T extends DomainId> = {
  from(value: string | T): T;
};

export function domainIdTransformer<T extends DomainId>(
  ValueObject: DomainIdFactory<T>,
): ValueTransformer {
  return {
    to: (value: T | string | null | undefined) =>
      typeof value === "string" ? value : (value?.value ?? null),
    from: (value: string | null) => (value === null ? null : ValueObject.from(value)),
  };
}

export const nullableGameRecordIdTransformer: ValueTransformer = {
  to: (value: GameRecordId | null | undefined) => value?.value ?? null,
  from: (value: string | null) => (value === null ? null : GameRecordId.from(value)),
};

type AthleteProfileJson = {
  technicalLevel: AthleteTechnicalLevel | null;
  gripStyle: AthleteGripStyle | null;
  playingStyle: AthletePlayingStyle | null;
  bladeName: string | null;
  forehandRubberName: string | null;
  backhandRubberName: string | null;
  equipmentNotes: string | null;
};

export const athleteProfileTransformer: ValueTransformer = {
  to: (profile: AthleteProfile): AthleteProfileJson => ({
    technicalLevel: profile.technicalLevel,
    gripStyle: profile.gripStyle,
    playingStyle: profile.playingStyle,
    bladeName: profile.bladeName?.value ?? null,
    forehandRubberName: profile.forehandRubberName?.value ?? null,
    backhandRubberName: profile.backhandRubberName?.value ?? null,
    equipmentNotes: profile.equipmentNotes?.value ?? null,
  }),
  from: (profile: AthleteProfileJson | null) =>
    AthleteProfile.from({
      technicalLevel: profile?.technicalLevel ?? null,
      gripStyle: profile?.gripStyle ?? null,
      playingStyle: profile?.playingStyle ?? null,
      bladeName: profile?.bladeName ?? null,
      forehandRubberName: profile?.forehandRubberName ?? null,
      backhandRubberName: profile?.backhandRubberName ?? null,
      equipmentNotes: profile?.equipmentNotes ?? null,
    }),
};

type TableMemberJson = {
  athleteId: string;
  joinedAt: string;
};

export const tableMembersTransformer: ValueTransformer = {
  to: (members: readonly TableMember[]): TableMemberJson[] =>
    members.map((member) => ({
      athleteId: member.athleteId.value,
      joinedAt: member.joinedAt.toISOString(),
    })),
  from: (members: TableMemberJson[] | null) =>
    (members ?? []).map((member) =>
      TableMember.from({
        athleteId: member.athleteId,
        joinedAt: member.joinedAt,
      }),
    ),
};

type QueueEntryJson = {
  athleteId: string;
  position: number;
  joinedAt: string;
};

export const tableQueueTransformer: ValueTransformer = {
  to: (queue: TableQueue): QueueEntryJson[] =>
    queue.entries.map((entry) => ({
      athleteId: entry.athleteId.value,
      position: entry.position.value,
      joinedAt: entry.joinedAt.toISOString(),
    })),
  from: (entries: QueueEntryJson[] | null) => TableQueue.from(entries ?? []),
};

type GameSideJson = string[];

function gameSideToJson(side: GameSide): GameSideJson {
  return side.athletes.map((athleteId) => athleteId.value);
}

function gameSideFromJson(side: GameSideJson): GameSide {
  return GameSide.from({
    playMode: side.length === 1 ? "singles" : "doubles",
    athleteIds: side,
  });
}

type GameResultJson = {
  winner: GameSideJson;
  loser: GameSideJson;
};

export const gameResultTransformer: ValueTransformer = {
  to: (result: GameResult): GameResultJson => ({
    winner: gameSideToJson(result.winner),
    loser: gameSideToJson(result.loser),
  }),
  from: (result: GameResultJson) =>
    GameResult.from({
      winner: gameSideFromJson(result.winner),
      loser: gameSideFromJson(result.loser),
    }),
};

type SideRatingChangeJson = {
  side: GameSideJson;
  changes: Array<{
    athleteId: string;
    delta: {
      points: number;
      wins: number;
      totalMatches: number;
    };
  }>;
};

export const sideRatingChangeTransformer: ValueTransformer = {
  to: (change: SideRatingChange): SideRatingChangeJson => ({
    side: gameSideToJson(change.side),
    changes: change.changes.map((athleteChange) => ({
      athleteId: athleteChange.athleteId.value,
      delta: {
        points: athleteChange.delta.points,
        wins: athleteChange.delta.wins,
        totalMatches: athleteChange.delta.totalMatches,
      },
    })),
  }),
  from: (change: SideRatingChangeJson) =>
    SideRatingChange.from({
      side: gameSideFromJson(change.side),
      changes: change.changes,
    }),
};

export type PersistedActiveGame = {
  playMode: string;
  firstSide: GameSideJson;
  secondSide: GameSideJson;
};

export function activeGameFromPersistence(input: PersistedActiveGame): ActiveGame {
  return ActiveGame.from({
    playMode: input.playMode,
    firstSide: input.firstSide,
    secondSide: input.secondSide,
  });
}

export function actorIdTransformer(): ValueTransformer {
  return domainIdTransformer(ActorId);
}
