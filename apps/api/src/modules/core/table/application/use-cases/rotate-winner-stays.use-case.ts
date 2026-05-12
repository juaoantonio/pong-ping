import { type AthleteId } from "../../../athlete/domain";
import { type ActiveGame, type Table } from "../../domain";
import { type TableId } from "../../domain/value-objects/table-id";
import { type TableRepository } from "../../infrastructure/typeorm/repositories/table.repository";
import { findTableOrThrow, toWinningSide } from "./table-use-case-helpers";

export type RotateWinnerStaysInput = {
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
    const table = await findTableOrThrow(this.tables, input.tableId);
    const activeGame = table.rotateWinnerStays(toWinningSide(table, input.winningAthleteIds));

    await this.tables.save(table);

    return { table, activeGame };
  }
}
