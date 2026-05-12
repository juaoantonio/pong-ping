import { describe, expect, it } from "vitest";
import { AthleteId } from "../../../athlete/domain";
import { ClubId } from "../../../club/domain";
import { EloRatingService, Rating } from "../../../rating/domain";
import { type RatingRepository } from "../../../rating/infrastructure/typeorm/repositories/rating.repository";
import { DomainRuleViolation } from "../../../shared/domain";
import { Table } from "../../../table/domain";
import { type TableRepository } from "../../../table/infrastructure/typeorm/repositories/table.repository";
import { PlayMode, TableId, TableName } from "../../../table/domain/value-objects";
import { type GameRecord } from "../../domain/game-record";
import { type GameRecordId } from "../../domain/value-objects/game-record-id";
import { type GameRecordRepository } from "../../infrastructure/typeorm/repositories/game-record.repository";
import { CorrectGameUseCase } from "./correct-game.use-case";
import { RecordGameUseCase } from "./record-game.use-case";

class InMemoryTableRepository implements Pick<TableRepository, "findById" | "save"> {
  public table: Table | null = null;

  public async findById(): Promise<Table | null> {
    return this.table;
  }

  public async save(table: Table): Promise<Table> {
    this.table = table;
    return table;
  }
}

class InMemoryGameRecordRepository implements Pick<
  GameRecordRepository,
  "findById" | "save" | "saveMany"
> {
  public readonly records = new Map<string, GameRecord>();

  public async findById(id: GameRecordId): Promise<GameRecord | null> {
    return this.records.get(id.value) ?? null;
  }

  public async save(record: GameRecord): Promise<GameRecord> {
    this.records.set(record.id.value, record);
    return record;
  }

  public async saveMany(records: readonly GameRecord[]): Promise<GameRecord[]> {
    records.forEach((record) => this.records.set(record.id.value, record));
    return [...records];
  }
}

class InMemoryRatingRepository implements Pick<
  RatingRepository,
  "findByAthleteId" | "getOrCreate" | "save" | "saveMany"
> {
  public readonly ratings = new Map<string, Rating>();

  public async findByAthleteId(athleteId: AthleteId): Promise<Rating | null> {
    return this.ratings.get(athleteId.value) ?? null;
  }

  public async getOrCreate(clubId: ClubId, athleteId: AthleteId): Promise<Rating> {
    const current = await this.findByAthleteId(athleteId);

    if (current) {
      return current;
    }

    const rating = Rating.createDefault({ clubId, athleteId });
    this.ratings.set(athleteId.value, rating);
    return rating;
  }

  public async save(rating: Rating): Promise<Rating> {
    this.ratings.set(rating.athleteId.value, rating);
    return rating;
  }

  public async saveMany(ratings: readonly Rating[]): Promise<Rating[]> {
    ratings.forEach((rating) => this.ratings.set(rating.athleteId.value, rating));
    return [...ratings];
  }
}

function createTable(): Table {
  const table = Table.create({
    id: new TableId("table-1"),
    clubId: new ClubId("club-1"),
    name: new TableName("Mesa 1"),
    playMode: new PlayMode("singles"),
    createdByAthleteId: new AthleteId("athlete-creator"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  });

  table.enqueue(new AthleteId("athlete-1"));
  table.enqueue(new AthleteId("athlete-2"));

  return table;
}

describe("use cases de competicao", () => {
  it("registra partida e atualiza ratings dos atletas", async () => {
    const tables = new InMemoryTableRepository();
    const records = new InMemoryGameRecordRepository();
    const ratings = new InMemoryRatingRepository();
    tables.table = createTable();
    const useCase = new RecordGameUseCase(
      tables as TableRepository,
      records as GameRecordRepository,
      ratings as RatingRepository,
      new EloRatingService(),
    );

    const record = await useCase.execute({
      tableId: "table-1",
      winningAthleteIds: ["athlete-1"],
      actorAthleteId: "athlete-1",
      finishedAt: new Date("2026-01-02T00:00:00.000Z"),
    });

    expect(record.winningSide.athletes[0]?.value).toBe("athlete-1");
    expect((await ratings.findByAthleteId(new AthleteId("athlete-1")))?.points.value).toBe(1032);
    expect((await ratings.findByAthleteId(new AthleteId("athlete-2")))?.points.value).toBe(968);
  });

  it("corrige partida aplicando deltas compensatorios", async () => {
    const tables = new InMemoryTableRepository();
    const records = new InMemoryGameRecordRepository();
    const ratings = new InMemoryRatingRepository();
    tables.table = createTable();
    const recordUseCase = new RecordGameUseCase(
      tables as TableRepository,
      records as GameRecordRepository,
      ratings as RatingRepository,
      new EloRatingService(),
    );
    const record = await recordUseCase.execute({
      tableId: "table-1",
      winningAthleteIds: ["athlete-1"],
      actorAthleteId: "athlete-1",
    });
    const correctionUseCase = new CorrectGameUseCase(
      records as GameRecordRepository,
      ratings as RatingRepository,
    );

    const correction = await correctionUseCase.execute({
      gameRecordId: record.id,
      actorAthleteId: "athlete-2",
    });

    expect(correction.originalRecordId?.equals(record.id)).toBe(true);
    expect((await ratings.findByAthleteId(new AthleteId("athlete-1")))?.points.value).toBe(1000);
    expect((await ratings.findByAthleteId(new AthleteId("athlete-2")))?.points.value).toBe(1000);
  });

  it("rejeita registro quando mesa nao existe", async () => {
    const useCase = new RecordGameUseCase(
      new InMemoryTableRepository() as TableRepository,
      new InMemoryGameRecordRepository() as GameRecordRepository,
      new InMemoryRatingRepository() as RatingRepository,
      new EloRatingService(),
    );

    await expect(
      useCase.execute({
        tableId: "table-404",
        winningAthleteIds: ["athlete-1"],
        actorAthleteId: "athlete-1",
      }),
    ).rejects.toThrow(DomainRuleViolation);
  });
});
