import { type ActiveGame, type Table } from "../../domain";
import { type TableId } from "../../domain/value-objects/table-id";
import { type TableRepository } from "../../infrastructure/typeorm/repositories/table.repository";
import { findTableOrThrow } from "./table-use-case-helpers";

export type FormActiveGameInput = {
  tableId: string | TableId;
};

export type FormActiveGameOutput = {
  table: Table;
  activeGame: ActiveGame;
};

export class FormActiveGameUseCase {
  public constructor(private readonly tables: TableRepository) {}

  public async execute(input: FormActiveGameInput): Promise<FormActiveGameOutput> {
    const table = await findTableOrThrow(this.tables, input.tableId);

    return { table, activeGame: table.formActiveGame() };
  }
}
