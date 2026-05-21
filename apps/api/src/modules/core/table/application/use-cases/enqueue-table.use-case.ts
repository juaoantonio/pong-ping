import { AthleteId } from "../../../athlete/domain";
import { type ClubId } from "../../../club/domain";
import { type QueueEntry, type Table } from "../../domain";
import { type TableId } from "../../domain/value-objects/table-id";
import { type TableRepository } from "../../infrastructure/typeorm/repositories/table.repository";
import { withLockedClubTable } from "./table-use-case-helpers";

export type EnqueueTableInput = {
  clubId: string | ClubId;
  tableId: string | TableId;
  athleteId: string | AthleteId;
  joinedAt?: Date;
};

export type EnqueueTableOutput = {
  table: Table;
  membershipCreated: boolean;
  queueEntry: QueueEntry;
};

export class EnqueueTableUseCase {
  public constructor(private readonly tables: TableRepository) {}

  public async execute(input: EnqueueTableInput): Promise<EnqueueTableOutput> {
    return withLockedClubTable(this.tables, input.clubId, input.tableId, async (table, tables) => {
      const result = table.enqueue(AthleteId.from(input.athleteId), input.joinedAt ?? new Date());

      await tables.save(table);

      return { table, ...result };
    });
  }
}
