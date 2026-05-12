import { describe, expect, it } from "vitest";
import { AthleteId } from "../../../athlete/domain";
import { ClubId } from "../../../club/domain";
import { DomainRuleViolation } from "../../../shared/domain";
import { Table } from "../../domain";
import { PlayMode, TableId, TableName } from "../../domain/value-objects";
import { type TableRepository } from "../../infrastructure/typeorm/repositories/table.repository";
import { CreateTableUseCase } from "./create-table.use-case";
import { EnqueueTableUseCase } from "./enqueue-table.use-case";
import { FormActiveGameUseCase } from "./form-active-game.use-case";
import { RemoveFromActiveGameUseCase } from "./remove-from-active-game.use-case";
import { RemoveFromQueueUseCase } from "./remove-from-queue.use-case";
import { RenameTableUseCase } from "./rename-table.use-case";
import { RotateWinnerStaysUseCase } from "./rotate-winner-stays.use-case";

class InMemoryTableRepository implements Pick<TableRepository, "findById" | "save"> {
  public readonly tables = new Map<string, Table>();

  public async findById(id: TableId): Promise<Table | null> {
    return this.tables.get(id.value) ?? null;
  }

  public async save(table: Table): Promise<Table> {
    this.tables.set(table.id.value, table);
    return table;
  }
}

function createTable(playMode = "singles"): Table {
  return Table.create({
    id: new TableId("table-1"),
    clubId: new ClubId("club-1"),
    name: new TableName("Mesa 1"),
    playMode: new PlayMode(playMode),
    createdByAthleteId: new AthleteId("athlete-creator"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  });
}

describe("use cases de mesa", () => {
  it("cria mesa e persiste membro criador", async () => {
    const repository = new InMemoryTableRepository();
    const useCase = new CreateTableUseCase(repository as TableRepository);

    const table = await useCase.execute({
      id: "table-1",
      clubId: "club-1",
      name: "Mesa 1",
      playMode: "singles",
      createdByAthleteId: "athlete-creator",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(table.createdByAthleteId.value).toBe("athlete-creator");
    expect(table.members[0]?.athleteId.value).toBe("athlete-creator");
    expect(await repository.findById(new TableId("table-1"))).toBe(table);
  });

  it("renomeia mesa existente", async () => {
    const repository = new InMemoryTableRepository();
    await repository.save(createTable());
    const useCase = new RenameTableUseCase(repository as TableRepository);

    const table = await useCase.execute({ tableId: "table-1", name: "Mesa Central" });

    expect(table.name.value).toBe("Mesa Central");
  });

  it("coloca atleta na fila e persiste mesa", async () => {
    const repository = new InMemoryTableRepository();
    await repository.save(createTable());
    const useCase = new EnqueueTableUseCase(repository as TableRepository);

    const output = await useCase.execute({ tableId: "table-1", athleteId: "athlete-2" });

    expect(output.membershipCreated).toBe(true);
    expect(output.table.queue.entries[0]?.athleteId.value).toBe("athlete-2");
  });

  it("remove atleta que nao esta no jogo atual", async () => {
    const repository = new InMemoryTableRepository();
    const table = createTable();
    table.enqueue(new AthleteId("athlete-2"));
    table.enqueue(new AthleteId("athlete-3"));
    table.enqueue(new AthleteId("athlete-4"));
    await repository.save(table);
    const useCase = new RemoveFromQueueUseCase(repository as TableRepository);

    const output = await useCase.execute({ tableId: "table-1", athleteId: "athlete-4" });

    expect(output.removedEntry.athleteId.value).toBe("athlete-4");
    expect(output.table.queue.entries).toHaveLength(2);
  });

  it("forma jogo ativo a partir da fila", async () => {
    const repository = new InMemoryTableRepository();
    const table = createTable();
    table.enqueue(new AthleteId("athlete-1"));
    table.enqueue(new AthleteId("athlete-2"));
    await repository.save(table);
    const useCase = new FormActiveGameUseCase(repository as TableRepository);

    const output = await useCase.execute({ tableId: "table-1" });

    expect(output.activeGame.firstSide.athletes[0]?.value).toBe("athlete-1");
    expect(output.activeGame.secondSide.athletes[0]?.value).toBe("athlete-2");
  });

  it("remove atleta do jogo ativo e persiste fila", async () => {
    const repository = new InMemoryTableRepository();
    const table = createTable();
    table.enqueue(new AthleteId("athlete-1"));
    table.enqueue(new AthleteId("athlete-2"));
    table.enqueue(new AthleteId("athlete-3"));
    await repository.save(table);
    const useCase = new RemoveFromActiveGameUseCase(repository as TableRepository);

    const output = await useCase.execute({ tableId: "table-1", athleteId: "athlete-1" });

    expect(output.removedEntry.athleteId.value).toBe("athlete-1");
    expect(output.table.queue.entries.map((entry) => entry.athleteId.value)).toEqual([
      "athlete-2",
      "athlete-3",
    ]);
  });

  it("rotaciona vencedor permanece e persiste nova ordem", async () => {
    const repository = new InMemoryTableRepository();
    const table = createTable();
    table.enqueue(new AthleteId("athlete-1"));
    table.enqueue(new AthleteId("athlete-2"));
    table.enqueue(new AthleteId("athlete-3"));
    await repository.save(table);
    const useCase = new RotateWinnerStaysUseCase(repository as TableRepository);

    await useCase.execute({ tableId: "table-1", winningAthleteIds: ["athlete-2"] });

    expect(table.queue.entries.map((entry) => entry.athleteId.value)).toEqual([
      "athlete-2",
      "athlete-3",
      "athlete-1",
    ]);
  });

  it("rejeita operacao em mesa inexistente", async () => {
    const useCase = new FormActiveGameUseCase(new InMemoryTableRepository() as TableRepository);

    await expect(useCase.execute({ tableId: "table-404" })).rejects.toThrow(DomainRuleViolation);
  });
});
