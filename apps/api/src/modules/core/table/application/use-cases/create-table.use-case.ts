import { AthleteId } from "../../../athlete/domain";
import { ClubId } from "../../../club/domain";
import { Table } from "../../domain";
import { PlayMode, TableId, TableName } from "../../domain/value-objects";
import { type TableRepository } from "../../infrastructure/typeorm/repositories/table.repository";

export type CreateTableInput = {
  id: string | TableId;
  clubId: string | ClubId;
  name: string | TableName;
  playMode: string | PlayMode;
  createdByAthleteId: string | AthleteId;
  createdAt?: Date;
};

export class CreateTableUseCase {
  public constructor(private readonly tables: TableRepository) {}

  public async execute(input: CreateTableInput): Promise<Table> {
    const table = Table.create({
      id: TableId.from(input.id),
      clubId: ClubId.from(input.clubId),
      name: TableName.from(input.name),
      playMode: PlayMode.from(input.playMode),
      createdByAthleteId: AthleteId.from(input.createdByAthleteId),
      createdAt: input.createdAt ?? new Date(),
    });

    return this.tables.save(table);
  }
}
