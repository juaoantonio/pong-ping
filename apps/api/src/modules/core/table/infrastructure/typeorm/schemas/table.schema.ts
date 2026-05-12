import { EntitySchema, type EntitySchemaOptions } from "typeorm";
import { AthleteId } from "../../../../athlete/domain";
import { ClubId } from "../../../../club/domain";
import {
  domainIdTransformer,
  tableMembersTransformer,
  tableQueueTransformer,
} from "../../../../infrastructure/typeorm/domain-transformers";
import { Table } from "../../../domain/table";
import { type TableMember } from "../../../domain/table-member";
import { type TableQueue } from "../../../domain/table-queue";
import { PlayMode } from "../../../domain/value-objects/play-mode";
import { TableId } from "../../../domain/value-objects/table-id";
import { TableName } from "../../../domain/value-objects/table-name";

export type TablePersistence = {
  id: TableId;
  clubId: ClubId;
  createdByAthleteId: AthleteId;
  createdAt: Date;
  nameValue: TableName;
  playModeValue: PlayMode;
  membersValue: TableMember[];
  queueValue: TableQueue;
};

const tableSchemaOptions: EntitySchemaOptions<TablePersistence> = {
  target: Table,
  name: "Table",
  tableName: "tables",
  columns: {
    id: {
      type: "varchar",
      primary: true,
      length: 80,
      transformer: domainIdTransformer(TableId),
    },
    clubId: {
      name: "club_id",
      type: "varchar",
      length: 80,
      transformer: domainIdTransformer(ClubId),
    },
    nameValue: {
      name: "name",
      type: "varchar",
      length: 120,
      transformer: {
        to: (name: TableName) => name.value,
        from: (value: string) => TableName.from(value),
      },
    },
    playModeValue: {
      name: "play_mode",
      type: "varchar",
      length: 20,
      transformer: {
        to: (playMode: PlayMode) => playMode.value,
        from: (value: string) => PlayMode.from(value),
      },
    },
    createdByAthleteId: {
      name: "created_by_athlete_id",
      type: "varchar",
      length: 80,
      transformer: domainIdTransformer(AthleteId),
    },
    createdAt: {
      name: "created_at",
      type: "timestamptz",
    },
    membersValue: {
      name: "members",
      type: "jsonb",
      transformer: tableMembersTransformer,
    },
    queueValue: {
      name: "queue",
      type: "jsonb",
      transformer: tableQueueTransformer,
    },
  },
  indices: [{ name: "IDX_tables_club_id", columns: ["clubId"] }],
};

export const TableSchema = new EntitySchema<TablePersistence>(tableSchemaOptions);
