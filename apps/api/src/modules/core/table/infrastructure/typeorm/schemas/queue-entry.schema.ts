import { EntitySchema, type EntitySchemaOptions } from "typeorm";

export type QueueEntryPersistenceRecord = {
  tableId: string;
  athleteId: string;
  position: number;
  joinedAt: Date;
};

const queueEntrySchemaOptions: EntitySchemaOptions<QueueEntryPersistenceRecord> = {
  name: "QueueEntry",
  tableName: "table_queue_entries",
  synchronize: false,
  columns: {
    tableId: { name: "table_id", type: "varchar", primary: true, length: 80 },
    athleteId: { name: "athlete_id", type: "varchar", primary: true, length: 80 },
    position: { name: "position", type: "int" },
    joinedAt: { name: "joined_at", type: "timestamptz" },
  },
};

export const QueueEntrySchema = new EntitySchema<QueueEntryPersistenceRecord>(
  queueEntrySchemaOptions,
);
