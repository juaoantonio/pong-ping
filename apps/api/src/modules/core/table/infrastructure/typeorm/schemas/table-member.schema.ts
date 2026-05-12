import { EntitySchema, type EntitySchemaOptions } from "typeorm";

export type TableMemberPersistenceRecord = {
  tableId: string;
  athleteId: string;
  joinedAt: Date;
};

const tableMemberSchemaOptions: EntitySchemaOptions<TableMemberPersistenceRecord> = {
  name: "TableMember",
  tableName: "table_members",
  synchronize: false,
  columns: {
    tableId: { name: "table_id", type: "varchar", primary: true, length: 80 },
    athleteId: { name: "athlete_id", type: "varchar", primary: true, length: 80 },
    joinedAt: { name: "joined_at", type: "timestamptz" },
  },
};

export const TableMemberSchema = new EntitySchema<TableMemberPersistenceRecord>(
  tableMemberSchemaOptions,
);
