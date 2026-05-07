import { describe, expect, it } from "vitest";
import { AthleteId } from "../athletes";
import { ClubId } from "../clubs";
import { DomainRuleViolation } from "../shared";
import { ActiveGame } from "./active-game";
import { GameSide } from "./game-side";
import { Table } from "./table";
import { PlayMode, QueuePosition, TableId, TableName } from "./value-objects";

function createAthleteId(value: string): AthleteId {
  return new AthleteId(value);
}

function createTable(playMode = "singles"): Table {
  return Table.create({
    id: new TableId("table-1"),
    clubId: new ClubId("club-1"),
    name: new TableName("Center Table"),
    playMode: new PlayMode(playMode),
    createdByAthleteId: createAthleteId("athlete-creator"),
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
  });
}

describe("objetos de valor do dominio de mesas", () => {
  it("cria lados de simples e duplas que combinam com o modo de jogo configurado", () => {
    const singlesGame = ActiveGame.create({
      playMode: new PlayMode("singles"),
      firstSide: GameSide.createSingles(createAthleteId("athlete-1")),
      secondSide: GameSide.createSingles(createAthleteId("athlete-2")),
    });
    const doublesGame = ActiveGame.create({
      playMode: new PlayMode("doubles"),
      firstSide: GameSide.createDoubles(createAthleteId("athlete-1"), createAthleteId("athlete-2")),
      secondSide: GameSide.createDoubles(
        createAthleteId("athlete-3"),
        createAthleteId("athlete-4"),
      ),
    });

    expect(singlesGame.firstSide.athletes).toHaveLength(1);
    expect(doublesGame.firstSide.athletes).toHaveLength(2);
    expect(doublesGame.secondSide.athletes.map((athleteId) => athleteId.value)).toEqual([
      "athlete-3",
      "athlete-4",
    ]);
  });

  it("rejeita atletas duplicados em um jogo ativo e posicoes de fila invalidas", () => {
    expect(() =>
      ActiveGame.create({
        playMode: new PlayMode("doubles"),
        firstSide: GameSide.createDoubles(
          createAthleteId("athlete-1"),
          createAthleteId("athlete-2"),
        ),
        secondSide: GameSide.createDoubles(
          createAthleteId("athlete-2"),
          createAthleteId("athlete-3"),
        ),
      }),
    ).toThrow(DomainRuleViolation);
    expect(() => new QueuePosition(-1)).toThrow(DomainRuleViolation);
  });
});

describe("Mesa", () => {
  it("coloca atletas na fila e informa se a associacao deve ser criada", () => {
    const table = createTable();

    const creatorEnqueue = table.enqueue(createAthleteId("athlete-creator"));
    const challengerEnqueue = table.enqueue(createAthleteId("athlete-2"));

    expect(creatorEnqueue.membershipCreated).toBe(false);
    expect(challengerEnqueue.membershipCreated).toBe(true);
    expect(table.queue.entries.map((entry) => entry.athleteId.value)).toEqual([
      "athlete-creator",
      "athlete-2",
    ]);
  });

  it("rejeita entradas duplicadas em fila ativa", () => {
    const table = createTable();

    table.enqueue(createAthleteId("athlete-2"));

    expect(() => table.enqueue(createAthleteId("athlete-2"))).toThrow(DomainRuleViolation);
  });

  it("forma jogos ativos de simples a partir das duas primeiras entradas da fila", () => {
    const table = createTable("singles");

    table.enqueue(createAthleteId("athlete-2"));
    table.enqueue(createAthleteId("athlete-3"));

    const activeGame = table.formActiveGame();

    expect(activeGame.firstSide.athletes[0].value).toBe("athlete-2");
    expect(activeGame.secondSide.athletes[0].value).toBe("athlete-3");
  });

  it("forma jogos ativos de duplas a partir das quatro primeiras entradas da fila", () => {
    const table = createTable("doubles");

    table.enqueue(createAthleteId("athlete-2"));
    table.enqueue(createAthleteId("athlete-3"));
    table.enqueue(createAthleteId("athlete-4"));
    table.enqueue(createAthleteId("athlete-5"));

    const activeGame = table.formActiveGame();

    expect(activeGame.firstSide.athletes.map((athleteId) => athleteId.value)).toEqual([
      "athlete-2",
      "athlete-3",
    ]);
    expect(activeGame.secondSide.athletes.map((athleteId) => athleteId.value)).toEqual([
      "athlete-4",
      "athlete-5",
    ]);
  });

  it("rotaciona vencedor-permanece preservando a ordem dos lados", () => {
    const table = createTable("doubles");

    table.enqueue(createAthleteId("athlete-2"));
    table.enqueue(createAthleteId("athlete-3"));
    table.enqueue(createAthleteId("athlete-4"));
    table.enqueue(createAthleteId("athlete-5"));
    table.enqueue(createAthleteId("athlete-6"));
    table.enqueue(createAthleteId("athlete-7"));

    const rotatedGame = table.rotateWinnerStays(
      GameSide.createDoubles(createAthleteId("athlete-4"), createAthleteId("athlete-5")),
    );

    expect(table.queue.entries.map((entry) => entry.athleteId.value)).toEqual([
      "athlete-4",
      "athlete-5",
      "athlete-6",
      "athlete-7",
      "athlete-2",
      "athlete-3",
    ]);
    expect(rotatedGame.firstSide.athletes.map((athleteId) => athleteId.value)).toEqual([
      "athlete-4",
      "athlete-5",
    ]);
  });

  it("impede jogadores atuais de sair da fila normal enquanto um jogo pode ser disputado", () => {
    const table = createTable("singles");

    table.enqueue(createAthleteId("athlete-2"));
    table.enqueue(createAthleteId("athlete-3"));
    table.enqueue(createAthleteId("athlete-4"));

    expect(() => table.removeFromQueue(createAthleteId("athlete-2"))).toThrow(DomainRuleViolation);
    expect(() => table.removeFromQueue(createAthleteId("athlete-4"))).not.toThrow();
    expect(table.queue.entries.map((entry) => entry.athleteId.value)).toEqual([
      "athlete-2",
      "athlete-3",
    ]);
  });
});
