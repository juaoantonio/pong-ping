import { type AthleteId } from "../../../athlete/domain";
import { type ClubId } from "../../../club/domain";
import { type ActiveGame, type Table } from "../../domain";
import { type TableId } from "../../domain/value-objects/table-id";
import { type TableRepository } from "../../infrastructure/typeorm/repositories/table.repository";
import { toWinningSide, withLockedClubTable } from "./table-use-case-helpers";

export type RotateWinnerStaysInput = {
  clubId: string | ClubId;
  tableId: string | TableId;
  winningAthleteIds: readonly (string | AthleteId)[];
};

export type RotateWinnerStaysOutput = {
  table: Table;
  activeGame: ActiveGame;
};

export class RotateWinnerStaysUseCase {
  public constructor(private readonly tables: TableRepository) {}

  public async execute(input: RotateWinnerStaysInput): Promise<RotateWinnerStaysOutput> {
    return withLockedClubTable(this.tables, input.clubId, input.tableId, async (table, tables) => {
      const activeGame = table.rotateWinnerStays(toWinningSide(table, input.winningAthleteIds));

      await tables.save(table);

      return { table, activeGame };
    });
  }
}
