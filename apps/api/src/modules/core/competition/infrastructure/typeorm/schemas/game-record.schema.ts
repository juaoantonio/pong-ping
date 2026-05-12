import { EntitySchema, type EntitySchemaOptions } from "typeorm";
import { AthleteId } from "../../../../athlete/domain";
import { ClubId } from "../../../../club/domain";
import {
  domainIdTransformer,
  gameResultTransformer,
  nullableGameRecordIdTransformer,
  sideRatingChangeTransformer,
} from "../../../../infrastructure/typeorm/domain-transformers";
import { TableId } from "../../../../table/domain";
import { GameRecord } from "../../../domain/game-record";
import { type GameResult } from "../../../domain/game-result";
import { type SideRatingChange } from "../../../domain/side-rating-change";
import { GameRecordId } from "../../../domain/value-objects/game-record-id";

export type GameRecordPersistence = {
  id: GameRecordId;
  clubIdValue: ClubId;
  tableIdValue: TableId;
  resultValue: GameResult;
  winnerRatingChangeValue: SideRatingChange;
  loserRatingChangeValue: SideRatingChange;
  actorAthleteIdValue: AthleteId;
  finishedAt: Date;
  originalRecordIdValue: GameRecordId | null;
  correctionIdValue: GameRecordId | null;
};

const gameRecordSchemaOptions: EntitySchemaOptions<GameRecordPersistence> = {
  target: GameRecord,
  name: "GameRecord",
  tableName: "game_records",
  columns: {
    id: {
      type: "varchar",
      primary: true,
      length: 120,
      transformer: domainIdTransformer(GameRecordId),
    },
    clubIdValue: {
      name: "club_id",
      type: "varchar",
      length: 80,
      transformer: domainIdTransformer(ClubId),
    },
    tableIdValue: {
      name: "table_id",
      type: "varchar",
      length: 80,
      transformer: domainIdTransformer(TableId),
    },
    resultValue: {
      name: "result",
      type: "jsonb",
      transformer: gameResultTransformer,
    },
    winnerRatingChangeValue: {
      name: "winner_rating_change",
      type: "jsonb",
      transformer: sideRatingChangeTransformer,
    },
    loserRatingChangeValue: {
      name: "loser_rating_change",
      type: "jsonb",
      transformer: sideRatingChangeTransformer,
    },
    actorAthleteIdValue: {
      name: "actor_athlete_id",
      type: "varchar",
      length: 80,
      transformer: domainIdTransformer(AthleteId),
    },
    finishedAt: {
      name: "finished_at",
      type: "timestamptz",
    },
    originalRecordIdValue: {
      name: "original_record_id",
      type: "varchar",
      length: 120,
      nullable: true,
      transformer: nullableGameRecordIdTransformer,
    },
    correctionIdValue: {
      name: "correction_id",
      type: "varchar",
      length: 120,
      nullable: true,
      transformer: nullableGameRecordIdTransformer,
    },
  },
  indices: [
    { name: "IDX_game_records_club_id", columns: ["clubIdValue"] },
    { name: "IDX_game_records_table_id", columns: ["tableIdValue"] },
  ],
};

export const GameRecordSchema = new EntitySchema<GameRecordPersistence>(gameRecordSchemaOptions);
