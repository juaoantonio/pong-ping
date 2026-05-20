import { Injectable } from "@nestjs/common";
import type { CoreDashboardSummaryContract } from "@pong-ping/contracts";
import { AthleteReadQuery } from "../../../athlete/presentation/http/queries/athlete-read.query";
import { GameReadQuery } from "../../../competition/presentation/http/queries/game-read.query";
import { RatingReadQuery } from "../../../rating/presentation/http/queries/rating-read.query";
import { TableReadQuery } from "../../../table/presentation/http/queries/table-read.query";

@Injectable()
export class CoreDashboardReadQuery {
  public constructor(
    private readonly tables: TableReadQuery,
    private readonly athletes: AthleteReadQuery,
    private readonly ratings: RatingReadQuery,
    private readonly games: GameReadQuery,
  ) {}

  public async getDashboard(tenantId: string): Promise<CoreDashboardSummaryContract> {
    const [tables, activeAthleteCount, recentGames, ranking] = await Promise.all([
      this.tables.listTablesForDashboard(tenantId),
      this.athletes.countAthletes(tenantId),
      this.games.listGames(tenantId, { page: 1, pageSize: 5 }),
      this.ratings.listRatings(tenantId, { page: 1, pageSize: 5 }),
    ]);

    return {
      tables: {
        totalTables: tables.length,
        activeTables: tables.filter((table) => table.activeGame !== null).length,
        queuedAthletes: tables.reduce((total, table) => total + table.queue.length, 0),
        tables: tables.slice(0, 5),
      },
      activeAthleteCount,
      recentGames: recentGames.items,
      ranking: ranking.items,
    };
  }
}
