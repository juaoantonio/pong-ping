import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { FindOptionsWhere, Repository } from "typeorm";
import type {
  CorePageRequestContract,
  CorePageResponseContract,
  GameRecordResponseContract,
} from "@pong-ping/contracts";
import { ClubId } from "../../../../club/domain";
import { DomainRuleViolation } from "../../../../shared/domain";
import { type GameRecord } from "../../../domain";
import { GameRecordId } from "../../../domain";
import {
  GameRecordSchema,
  type GameRecordPersistence,
} from "../../../infrastructure/typeorm/schemas/game-record.schema";
import {
  createCorePage,
  corePageSkip,
} from "../../../../shared/presentation/http/dtos/core-page.dtos";
import { toGameRecordResponse } from "../serializers/competition-contract.serializer";

@Injectable()
export class GameReadQuery {
  public constructor(
    @InjectRepository(GameRecordSchema)
    private readonly records: Repository<GameRecordPersistence>,
  ) {}

  public async listGames(
    tenantId: string,
    request: CorePageRequestContract,
  ): Promise<CorePageResponseContract<GameRecordResponseContract>> {
    const pageSize = request.pageSize ?? 20;
    const [records, totalItems] = await this.records.findAndCount({
      order: { finishedAt: "DESC" },
      skip: corePageSkip(request),
      take: pageSize,
      where: {
        clubIdValue: ClubId.from(tenantId),
      } as FindOptionsWhere<GameRecordPersistence>,
    });

    return createCorePage(
      (records as unknown as GameRecord[]).map(toGameRecordResponse),
      totalItems,
      request,
    );
  }

  public async getGame(tenantId: string, gameRecordId: string): Promise<GameRecordResponseContract> {
    const record = (await this.records.findOneBy({
      clubIdValue: ClubId.from(tenantId),
      id: GameRecordId.from(gameRecordId),
    } as FindOptionsWhere<GameRecordPersistence>)) as unknown as GameRecord | null;

    if (!record) {
      throw new DomainRuleViolation("game_record_not_found", "Game record was not found.");
    }

    return toGameRecordResponse(record);
  }
}
