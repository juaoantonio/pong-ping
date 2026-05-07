import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AthleteId } from "../athletes";
import { ClubId } from "../clubs";
import { DomainRuleViolation } from "../shared";
import { ActiveGame, GameSide, PlayMode, TableId } from "../tables";
import { Scoreboard } from "./scoreboard";

function createActiveGame(): ActiveGame {
  return ActiveGame.create({
    playMode: new PlayMode("singles"),
    firstSide: GameSide.createSingles(new AthleteId("athlete-1")),
    secondSide: GameSide.createSingles(new AthleteId("athlete-2")),
  });
}

describe("placar", () => {
  it("acompanha pontos ao vivo apenas do jogo ativo e os reinicia", () => {
    const scoreboard = Scoreboard.create({
      clubId: new ClubId("club-1"),
      tableId: new TableId("table-1"),
      activeGame: createActiveGame(),
    });

    scoreboard.pointFor(scoreboard.activeGame.firstSide);
    scoreboard.pointFor(scoreboard.activeGame.firstSide);
    scoreboard.pointFor(scoreboard.activeGame.secondSide);

    expect(scoreboard.firstSide.points.value).toBe(2);
    expect(scoreboard.secondSide.points.value).toBe(1);
    expect(scoreboard.clubId.value).toBe("club-1");
    expect(scoreboard.tableId.value).toBe("table-1");

    scoreboard.reset();

    expect(scoreboard.firstSide.points.value).toBe(0);
    expect(scoreboard.secondSide.points.value).toBe(0);
  });

  it("nao permite que pontos ao vivo fiquem negativos", () => {
    const scoreboard = Scoreboard.create({
      clubId: new ClubId("club-1"),
      tableId: new TableId("table-1"),
      activeGame: createActiveGame(),
    });

    expect(() => scoreboard.undoPoint(scoreboard.activeGame.firstSide)).toThrow(
      DomainRuleViolation,
    );
  });

  it("nao importa modulos de competicao ou ratings", () => {
    const source = readFileSync(
      join(process.cwd(), "src/modules/core/domain/scoreboards/scoreboard.ts"),
      "utf8",
    );

    expect(source).not.toMatch(/competition/);
    expect(source).not.toMatch(/ratings/);
  });
});
