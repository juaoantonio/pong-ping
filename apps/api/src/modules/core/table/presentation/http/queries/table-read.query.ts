import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { FindOptionsWhere, Repository } from "typeorm";
import type { CorePageRequestContract, CorePageResponseContract, TableResponseContract } from "@pong-ping/contracts";
import { ClubId } from "../../../../club/domain";
import { DomainRuleViolation } from "../../../../shared/domain";
import { type Table } from "../../../domain";
import { TableId } from "../../../domain";
import { TableSchema, type TablePersistence } from "../../../infrastructure/typeorm/schemas/table.schema";
import { createCorePage, corePageSkip } from "../../../../shared/presentation/http/dtos/core-page.dtos";
import { toTableResponse } from "../serializers/table-contract.serializer";

@Injectable()
export class TableReadQuery {
  public constructor(
    @InjectRepository(TableSchema)
    private readonly tables: Repository<TablePersistence>,
  ) {}

  public async listTables(
    tenantId: string,
    request: CorePageRequestContract,
  ): Promise<CorePageResponseContract<TableResponseContract>> {
    const pageSize = request.pageSize ?? 20;
    const [tables, totalItems] = await this.tables.findAndCount({
      order: { createdAt: "DESC" },
      skip: corePageSkip(request),
      take: pageSize,
      where: {
        clubId: ClubId.from(tenantId),
      } as FindOptionsWhere<TablePersistence>,
    });

    return createCorePage(
      (tables as unknown as Table[]).map(toTableResponse),
      totalItems,
      request,
    );
  }

  public async getTableDetail(tenantId: string, tableId: string): Promise<TableResponseContract> {
    const table = (await this.tables.findOneBy({
      clubId: ClubId.from(tenantId),
      id: TableId.from(tableId),
    } as FindOptionsWhere<TablePersistence>)) as unknown as Table | null;

    if (!table) {
      throw new DomainRuleViolation("table_not_found", "Table was not found.");
    }

    return toTableResponse(table);
  }

  public async listTablesForDashboard(tenantId: string): Promise<TableResponseContract[]> {
    const tables = await this.tables.find({
      order: { createdAt: "DESC" },
      where: {
        clubId: ClubId.from(tenantId),
      } as FindOptionsWhere<TablePersistence>,
    });

    return (tables as unknown as Table[]).map(toTableResponse);
  }
}
