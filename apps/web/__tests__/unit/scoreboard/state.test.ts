import {
  awardSet,
  changePlayerPoint,
  createInitialScoreboardState,
  getCurrentScoreboardPath,
  shouldCreateFreshState,
  type ScoreboardPlayer,
} from "@/lib/contexts/scoreboard";

const players: [ScoreboardPlayer, ScoreboardPlayer] = [
  { id: "user-a", name: "Ana", avatarUrl: null },
  { id: "user-b", name: "Bia", avatarUrl: null },
];

describe("estado do placar", () => {
  it("monta caminho atual do placar pelo limite do contexto", () => {
    expect(getCurrentScoreboardPath("table-1")).toBe(
      "scoreboards/table-1/current",
    );
  });

  it("incrementa e decrementa pontos do jogador sem ficar abaixo de zero", () => {
    const initialState = createInitialScoreboardState({
      now: 100,
      players,
      tableId: "table-1",
    });

    const withPoint = changePlayerPoint(initialState, 0, 1, 200);
    expect(withPoint.points).toEqual([1, 0]);
    expect(withPoint.updatedAt).toBe(200);

    const backToZero = changePlayerPoint(withPoint, 0, -1, 300);
    expect(backToZero.points).toEqual([0, 0]);

    const stillZero = changePlayerPoint(backToZero, 0, -1, 400);
    expect(stillZero.points).toEqual([0, 0]);
  });

  it("atribui novo set ao jogador selecionado e reinicia pontos", () => {
    const initialState = createInitialScoreboardState({
      now: 100,
      players,
      tableId: "table-1",
    });
    const activeSet = changePlayerPoint(
      changePlayerPoint(initialState, 0, 1, 200),
      1,
      1,
      300,
    );

    const nextSet = awardSet(activeSet, 1, 400);

    expect(nextSet.points).toEqual([0, 0]);
    expect(nextSet.sets).toEqual([0, 1]);
    expect(nextSet.setNumber).toBe(2);
    expect(nextSet.updatedAt).toBe(400);
  });

  it("detecta quando a rodada ao vivo nao corresponde mais aos jogadores atuais", () => {
    const initialState = createInitialScoreboardState({
      players,
      tableId: "table-1",
    });

    expect(shouldCreateFreshState(initialState, "table-1", players)).toBe(
      false,
    );
    expect(
      shouldCreateFreshState(initialState, "table-1", [
        players[1],
        players[0],
      ]),
    ).toBe(true);
    expect(shouldCreateFreshState(initialState, "table-2", players)).toBe(
      true,
    );
  });
});
