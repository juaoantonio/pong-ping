import { Injectable, Optional } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import type { DataSource, FindOptionsWhere, Repository } from "typeorm";
import { RatingRepository } from "../../../../rating/infrastructure/typeorm/repositories/rating.repository";
import { RatingSchema } from "../../../../rating/infrastructure/typeorm/schemas/rating.schema";
import type { RatingPersistence } from "../../../../rating/infrastructure/typeorm/schemas/rating.schema";
import { GameRecord } from "../../../domain/game-record";
import { GameRecordId } from "../../../domain/value-objects/game-record-id";
import { GameRecordSchema } from "../schemas/game-record.schema";
import type { GameRecordPersistence } from "../schemas/game-record.schema";

export type CompetitionRepositories = {
  gameRecords: GameRecordRepository;
  ratings: RatingRepository;
};

@Injectable()
export class GameRecordRepository {
  public constructor(
    @InjectRepository(GameRecordSchema)
    private readonly records: Repository<GameRecordPersistence>,
    @Optional()
    @InjectDataSource()
    private readonly dataSource?: DataSource,
  ) {}

  public async findById(id: GameRecordId): Promise<GameRecord | null> {
    return (await this.records.findOneBy({
      id,
    } as FindOptionsWhere<GameRecordPersistence>)) as GameRecord | null;
  }

  public async save(record: GameRecord): Promise<GameRecord> {
    return (await this.records.save(
      record as unknown as GameRecordPersistence,
    )) as unknown as GameRecord;
  }

  public async saveMany(records: readonly GameRecord[]): Promise<GameRecord[]> {
    return (await this.records.save(
      records as readonly unknown[] as GameRecordPersistence[],
    )) as unknown as GameRecord[];
  }

  public async transaction<T>(
    ratings: RatingRepository,
    work: (repositories: CompetitionRepositories) => Promise<T>,
  ): Promise<T> {
    if (!this.dataSource) {
      return work({ gameRecords: this, ratings });
    }

    return this.dataSource.transaction((manager) =>
      work({
        gameRecords: new GameRecordRepository(
          manager.getRepository(GameRecordSchema) as Repository<GameRecordPersistence>,
        ),
        ratings: ratings.withRepository(
          manager.getRepository(RatingSchema) as Repository<RatingPersistence>,
        ),
      }),
    );
  }
}
