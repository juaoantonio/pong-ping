import { AthleteId } from "../../../athlete/domain";
import { ClubId } from "../../../club/domain";
import { DomainRuleViolation } from "../../../shared/domain";
import { GameSide, type Table } from "../../domain";
import { TableId } from "../../domain/value-objects/table-id";
import { type TableRepository } from "../../infrastructure/typeorm/repositories/table.repository";

export async function withLockedClubTable<T>(
  tables: TableRepository,
  clubId: string | ClubId,
  tableId: string | TableId,
  work: (table: Table, tables: TableRepository) => Promise<T>,
): Promise<T> {
  const output = await tables.withLockedTable(
    ClubId.from(clubId),
    TableId.from(tableId),
    work,
  );

  if (output === null) {
    throw new DomainRuleViolation("table_not_found", "Table was not found.");
  }

  return output;
}

export function toWinningSide(table: Table, athleteIds: readonly (string | AthleteId)[]): GameSide {
  return GameSide.forPlayMode(
    table.playMode,
    athleteIds.map((athleteId) => AthleteId.from(athleteId)),
  );
}
