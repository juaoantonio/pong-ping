import { type Table } from "../../domain";
import { TableName, type TableId } from "../../domain/value-objects";
import { type TableRepository } from "../../infrastructure/typeorm/repositories/table.repository";
import { findTableOrThrow } from "./table-use-case-helpers";

export type RenameTableInput = {
  tableId: string | TableId;
  name: string | TableName;
};

export class RenameTableUseCase {
  public constructor(private readonly tables: TableRepository) {}

  public async execute(input: RenameTableInput): Promise<Table> {
    const table = await findTableOrThrow(this.tables, input.tableId);

    table.rename(TableName.from(input.name));

    return this.tables.save(table);
  }
}
