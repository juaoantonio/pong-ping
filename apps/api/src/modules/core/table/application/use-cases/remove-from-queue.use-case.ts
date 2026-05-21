import { AthleteId } from "../../../athlete/domain";
import { type ClubId } from "../../../club/domain";
import { type QueueEntry, type Table } from "../../domain";
import { type TableId } from "../../domain/value-objects/table-id";
import { type TableRepository } from "../../infrastructure/typeorm/repositories/table.repository";
import { withLockedClubTable } from "./table-use-case-helpers";

export type RemoveFromQueueInput = {
  clubId: string | ClubId;
  tableId: string | TableId;
  athleteId: string | AthleteId;
};

export type RemoveFromQueueOutput = {
  table: Table;
  removedEntry: QueueEntry;
};

export class RemoveFromQueueUseCase {
  public constructor(private readonly tables: TableRepository) {}

  public async execute(input: RemoveFromQueueInput): Promise<RemoveFromQueueOutput> {
    return withLockedClubTable(this.tables, input.clubId, input.tableId, async (table, tables) => {
      const removedEntry = table.removeFromQueue(AthleteId.from(input.athleteId));

      await tables.save(table);

      return { table, removedEntry };
    });
  }
}
