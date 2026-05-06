import { calculateElo, calculateWinRate, MATCH_ELO_K } from "@/lib/ranking/elo";

describe("ranking elo", () => {
  it("calculates Elo with configured K factor", () => {
    expect(calculateElo(1000, 1000, MATCH_ELO_K)).toEqual({
      winnerElo: 1032,
      loserElo: 968,
    });
  });

  it("calculates win rate as percent", () => {
    expect(calculateWinRate(3, 4)).toBe(75);
    expect(calculateWinRate(0, 0)).toBe(0);
  });
});
