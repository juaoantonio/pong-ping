import { type AthleteId } from "../athletes";
import { type ClubId } from "../clubs";
import { AggregateRoot, DomainRuleViolation } from "../shared";
import { type EloRatingService } from "./elo-rating.service";
import { RatingDelta } from "./value-objects/rating-delta";
import { RatingPoints } from "./value-objects/rating-points";
import { WinRate } from "./value-objects/win-rate";

type RatingState = {
  clubId: ClubId;
  athleteId: AthleteId;
  points: RatingPoints;
  wins: number;
  totalMatches: number;
};

export class Rating extends AggregateRoot<AthleteId> {
  public readonly clubId: ClubId;
  private pointsValue: RatingPoints;
  private winsValue: number;
  private totalMatchesValue: number;

  private constructor(state: RatingState) {
    super(state.athleteId);
    this.clubId = state.clubId;
    this.pointsValue = state.points;
    this.winsValue = state.wins;
    this.totalMatchesValue = state.totalMatches;
    this.ensureState(this.pointsValue, this.winsValue, this.totalMatchesValue);
  }

  public static createDefault(input: { clubId: ClubId; athleteId: AthleteId }): Rating {
    return new Rating({
      clubId: input.clubId,
      athleteId: input.athleteId,
      points: RatingPoints.default(),
      wins: 0,
      totalMatches: 0,
    });
  }

  public static restore(state: RatingState): Rating {
    return new Rating(state);
  }

  public get athleteId(): AthleteId {
    return this.id;
  }

  public get points(): RatingPoints {
    return this.pointsValue;
  }

  public get wins(): number {
    return this.winsValue;
  }

  public get totalMatches(): number {
    return this.totalMatchesValue;
  }

  public get winRate(): WinRate {
    return WinRate.fromRecord(this.winsValue, this.totalMatchesValue);
  }

  public recordWinAgainst(
    opponent: Rating,
    service: EloRatingService,
  ): {
    winnerDelta: RatingDelta;
    loserDelta: RatingDelta;
  } {
    this.ensureSameClub(opponent);

    if (this.athleteId.equals(opponent.athleteId)) {
      throw new DomainRuleViolation("self_rating_match", "A rating cannot play against itself.");
    }

    const nextPoints = service.calculateAfterWin(this.pointsValue, opponent.pointsValue);
    const winnerDelta = new RatingDelta({
      points: nextPoints.winnerPoints.value - this.pointsValue.value,
      wins: 1,
      totalMatches: 1,
    });
    const loserDelta = new RatingDelta({
      points: nextPoints.loserPoints.value - opponent.pointsValue.value,
      wins: 0,
      totalMatches: 1,
    });

    this.applyDelta(winnerDelta);
    opponent.applyDelta(loserDelta);

    return { winnerDelta, loserDelta };
  }

  public applyCorrection(delta: RatingDelta): void {
    this.applyDelta(delta);
  }

  private applyDelta(delta: RatingDelta): void {
    const nextPoints = new RatingPoints(this.pointsValue.value + delta.points);
    const nextWins = this.winsValue + delta.wins;
    const nextTotalMatches = this.totalMatchesValue + delta.totalMatches;

    this.ensureState(nextPoints, nextWins, nextTotalMatches);

    this.pointsValue = nextPoints;
    this.winsValue = nextWins;
    this.totalMatchesValue = nextTotalMatches;
  }

  private ensureState(points: RatingPoints, wins: number, totalMatches: number): void {
    if (
      !Number.isInteger(points.value) ||
      !Number.isInteger(wins) ||
      !Number.isInteger(totalMatches) ||
      wins < 0 ||
      totalMatches < 0 ||
      wins > totalMatches
    ) {
      throw new DomainRuleViolation(
        "invalid_rating_state",
        "Rating wins and total matches must stay consistent.",
      );
    }
  }

  private ensureSameClub(opponent: Rating): void {
    if (!this.clubId.equals(opponent.clubId)) {
      throw new DomainRuleViolation(
        "cross_club_rating_match",
        "Ratings from different clubs cannot play each other.",
      );
    }
  }
}
