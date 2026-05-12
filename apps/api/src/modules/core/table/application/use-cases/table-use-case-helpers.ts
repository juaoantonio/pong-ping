import { AthleteId } from "../../../athlete/domain";
import { DomainRuleViolation } from "../../../shared/domain";
import { GameSide, type Table } from "../../domain";
import { TableId } from "../../domain/value-objects/table-id";
import { type TableRepository } from "../../infrastructure/typeorm/repositories/table.repository";

export async function findTableOrThrow(
  tables: TableRepository,
  tableId: string | TableId,
): Promise<Table> {
  const table = await tables.findById(TableId.from(tableId));

  if (!table) {
    throw new DomainRuleViolation("table_not_found", "Table was not found.");
  }

  return table;
}

export function toWinningSide(table: Table, athleteIds: readonly (string | AthleteId)[]): GameSide {
  return GameSide.forPlayMode(
    table.playMode,
    athleteIds.map((athleteId) => AthleteId.from(athleteId)),
  );
}
