import { calculateElo, calculateWinRate, MATCH_ELO_K } from "@/lib/ranking/elo";

describe("elo do ranking", () => {
  it("calcula Elo com fator K configurado", () => {
    expect(calculateElo(1000, 1000, MATCH_ELO_K)).toEqual({
      winnerElo: 1032,
      loserElo: 968,
    });
  });

  it("calcula taxa de vitoria como percentual", () => {
    expect(calculateWinRate(3, 4)).toBe(75);
    expect(calculateWinRate(0, 0)).toBe(0);
  });
});
