import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import type { DataSource, FindOptionsWhere, Repository } from "typeorm";
import { ClubId } from "../../../../club/domain";
import { Table } from "../../../domain/table";
import { TableId } from "../../../domain/value-objects/table-id";
import { TableSchema } from "../schemas/table.schema";
import type { TablePersistence } from "../schemas/table.schema";

type TableWork<T> = (table: Table, tables: TableRepository) => Promise<T>;

@Injectable()
export class TableRepository {
  public constructor(
    @InjectRepository(TableSchema)
    private readonly tables: Repository<TablePersistence>,
    @InjectDataSource()
    private readonly dataSource?: DataSource,
  ) {}

  public async findById(id: TableId): Promise<Table | null> {
    return (await this.tables.findOneBy({
      id,
    } as FindOptionsWhere<TablePersistence>)) as Table | null;
  }

  public async findByIdForClub(clubId: ClubId, id: TableId): Promise<Table | null> {
    return this.findByIdForClubWithLock(clubId, id, false);
  }

  public async save(table: Table): Promise<Table> {
    return (await this.tables.save(table as unknown as TablePersistence)) as unknown as Table;
  }

  public async withLockedTable<T>(
    clubId: ClubId,
    id: TableId,
    work: TableWork<T>,
  ): Promise<T | null> {
    if (!this.dataSource) {
      const table = await this.findByIdForClub(clubId, id);
      return table ? work(table, this) : null;
    }

    return this.dataSource.transaction(async (manager) => {
      const tables = new TableRepository(
        manager.getRepository(TableSchema) as Repository<TablePersistence>,
      );
      const table = await tables.findByIdForClubWithLock(clubId, id, true);

      return table ? work(table, tables) : null;
    });
  }

  private async findByIdForClubWithLock(
    clubId: ClubId,
    id: TableId,
    lock: boolean,
  ): Promise<Table | null> {
    return (await this.tables.findOne({
      lock: lock ? { mode: "pessimistic_write" } : undefined,
      where: {
        clubId,
        id,
      } as FindOptionsWhere<TablePersistence>,
    })) as Table | null;
  }
}
