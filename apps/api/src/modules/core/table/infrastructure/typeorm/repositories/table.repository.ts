import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { FindOptionsWhere, Repository } from "typeorm";
import { Table } from "../../../domain/table";
import { TableId } from "../../../domain/value-objects/table-id";
import { TableSchema } from "../schemas/table.schema";
import type { TablePersistence } from "../schemas/table.schema";

@Injectable()
export class TableRepository {
  public constructor(
    @InjectRepository(TableSchema)
    private readonly tables: Repository<TablePersistence>,
  ) {}

  public async findById(id: TableId): Promise<Table | null> {
    return (await this.tables.findOneBy({
      id,
    } as FindOptionsWhere<TablePersistence>)) as Table | null;
  }

  public async save(table: Table): Promise<Table> {
    return (await this.tables.save(table as unknown as TablePersistence)) as unknown as Table;
  }
}
