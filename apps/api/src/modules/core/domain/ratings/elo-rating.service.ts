import { RatingPoints } from "./value-objects/rating-points";

export const MATCH_ELO_K = 64;

export class EloRatingService {
  public readonly kFactor: number;

  public constructor(kFactor = MATCH_ELO_K) {
    this.kFactor = kFactor;
  }

  public calculateAfterWin(
    winnerPoints: RatingPoints,
    loserPoints: RatingPoints,
  ): {
    winnerPoints: RatingPoints;
    loserPoints: RatingPoints;
  } {
    const expectedWinnerScore =
      1 / (1 + Math.pow(10, (loserPoints.value - winnerPoints.value) / 400));

    const expectedLoserScore =
      1 / (1 + Math.pow(10, (winnerPoints.value - loserPoints.value) / 400));

    return {
      winnerPoints: new RatingPoints(
        Math.round(winnerPoints.value + this.kFactor * (1 - expectedWinnerScore)),
      ),
      loserPoints: new RatingPoints(
        Math.round(loserPoints.value + this.kFactor * (0 - expectedLoserScore)),
      ),
    };
  }
}
