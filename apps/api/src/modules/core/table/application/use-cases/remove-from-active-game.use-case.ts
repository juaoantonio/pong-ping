import { AthleteId } from "../../../athlete/domain";
import { type QueueEntry, type Table } from "../../domain";
import { type TableId } from "../../domain/value-objects/table-id";
import { type TableRepository } from "../../infrastructure/typeorm/repositories/table.repository";
import { findTableOrThrow } from "./table-use-case-helpers";

export type RemoveFromActiveGameInput = {
  tableId: string | TableId;
  athleteId: string | AthleteId;
};

export type RemoveFromActiveGameOutput = {
  table: Table;
  removedEntry: QueueEntry;
};

export class RemoveFromActiveGameUseCase {
  public constructor(private readonly tables: TableRepository) {}

  public async execute(input: RemoveFromActiveGameInput): Promise<RemoveFromActiveGameOutput> {
    const table = await findTableOrThrow(this.tables, input.tableId);
    const removedEntry = table.removeFromActiveGame(AthleteId.from(input.athleteId));

    await this.tables.save(table);

    return { table, removedEntry };
  }
}
