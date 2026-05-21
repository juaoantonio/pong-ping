import { type ClubId } from "../../../club/domain";
import { type Table } from "../../domain";
import { TableName, type TableId } from "../../domain/value-objects";
import { type TableRepository } from "../../infrastructure/typeorm/repositories/table.repository";
import { withLockedClubTable } from "./table-use-case-helpers";

export type RenameTableInput = {
  clubId: string | ClubId;
  tableId: string | TableId;
  name: string | TableName;
};

export class RenameTableUseCase {
  public constructor(private readonly tables: TableRepository) {}

  public async execute(input: RenameTableInput): Promise<Table> {
    return withLockedClubTable(this.tables, input.clubId, input.tableId, async (table, tables) => {
      table.rename(TableName.from(input.name));

      return tables.save(table);
    });
  }
}
