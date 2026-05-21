import { type ClubId } from "../../../club/domain";
import { type ActiveGame, type Table } from "../../domain";
import { type TableId } from "../../domain/value-objects/table-id";
import { type TableRepository } from "../../infrastructure/typeorm/repositories/table.repository";
import { withLockedClubTable } from "./table-use-case-helpers";

export type FormActiveGameInput = {
  clubId: string | ClubId;
  tableId: string | TableId;
};

export type FormActiveGameOutput = {
  table: Table;
  activeGame: ActiveGame;
};

export class FormActiveGameUseCase {
  public constructor(private readonly tables: TableRepository) {}

  public async execute(input: FormActiveGameInput): Promise<FormActiveGameOutput> {
    return withLockedClubTable(this.tables, input.clubId, input.tableId, async (table) => ({
      table,
      activeGame: table.formActiveGame(),
    }));
  }
}
