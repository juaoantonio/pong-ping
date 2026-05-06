export const MATCH_ELO_K = 64;
export const DEFAULT_PLAYER_ELO = 1000;

export function calculateElo(
  winnerElo: number,
  loserElo: number,
  k: number,
): {
  winnerElo: number;
  loserElo: number;
} {
  const expectedWinnerScore =
    1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));

  const expectedLoserScore =
    1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

  return {
    winnerElo: Math.round(winnerElo + k * (1 - expectedWinnerScore)),
    loserElo: Math.round(loserElo + k * (0 - expectedLoserScore)),
  };
}

export function calculateWinRate(wins: number, totalMatches: number) {
  if (totalMatches <= 0) {
    return 0;
  }

  return Number(((wins / totalMatches) * 100).toFixed(2));
}
