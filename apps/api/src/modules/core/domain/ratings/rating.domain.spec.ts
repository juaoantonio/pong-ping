import { describe, expect, it } from "vitest";
import { AthleteId } from "../athletes";
import { ClubId } from "../clubs";
import { DomainRuleViolation } from "../shared";
import { ClubLadder } from "./club-ladder";
import { EloRatingService, MATCH_ELO_K } from "./elo-rating.service";
import { Rating } from "./rating";
import { Tier } from "./tier";
import { RatingDelta } from "./value-objects/rating-delta";
import { DEFAULT_RATING_POINTS, RatingPoints } from "./value-objects/rating-points";
import { TierThreshold } from "./value-objects/tier-threshold";

function createDefaultRating(athleteId: string, clubId = "club-1") {
  return Rating.createDefault({
    clubId: new ClubId(clubId),
    athleteId: new AthleteId(athleteId),
  });
}

describe("dominio de ratings", () => {
  it("cria ratings padrao e preserva a formula Elo legada e o fator K", () => {
    const winner = createDefaultRating("athlete-1");
    const loser = createDefaultRating("athlete-2");
    const service = new EloRatingService();

    const { winnerDelta, loserDelta } = winner.recordWinAgainst(loser, service);

    expect(DEFAULT_RATING_POINTS).toBe(1000);
    expect(MATCH_ELO_K).toBe(64);
    expect(winner.points.value).toBe(1032);
    expect(loser.points.value).toBe(968);
    expect(winner.wins).toBe(1);
    expect(winner.totalMatches).toBe(1);
    expect(winner.winRate.value).toBe(100);
    expect(loser.winRate.value).toBe(0);
    expect(winnerDelta.points).toBe(32);
    expect(loserDelta.points).toBe(-32);
  });

  it("arredonda taxa de vitoria, aplica deltas de correcao e restaura os dois lados de forma consistente", () => {
    const winner = createDefaultRating("athlete-1");
    const loser = createDefaultRating("athlete-2");
    const service = new EloRatingService();
    const { winnerDelta, loserDelta } = winner.recordWinAgainst(loser, service);

    winner.applyCorrection(winnerDelta.invert());
    loser.applyCorrection(loserDelta.invert());

    expect(winner.points.value).toBe(1000);
    expect(loser.points.value).toBe(1000);
    expect(winner.wins).toBe(0);
    expect(winner.totalMatches).toBe(0);
    expect(winner.winRate.value).toBe(0);

    const rating = Rating.restore({
      clubId: new ClubId("club-1"),
      athleteId: new AthleteId("athlete-3"),
      points: new RatingPoints(1111),
      wins: 2,
      totalMatches: 3,
    });

    expect(rating.winRate.value).toBe(66.67);
  });

  it("ordena rankings por pontos, vitorias e id do atleta e resolve tiers por limites", () => {
    const tiers = [
      new Tier("Bronze", new TierThreshold(1000)),
      new Tier("Silver", new TierThreshold(1200)),
      new Tier("Gold", new TierThreshold(1400)),
    ];
    const ladder = ClubLadder.rank(
      [
        Rating.restore({
          clubId: new ClubId("club-1"),
          athleteId: new AthleteId("athlete-9"),
          points: new RatingPoints(1200),
          wins: 5,
          totalMatches: 8,
        }),
        Rating.restore({
          clubId: new ClubId("club-1"),
          athleteId: new AthleteId("athlete-1"),
          points: new RatingPoints(1200),
          wins: 5,
          totalMatches: 7,
        }),
        Rating.restore({
          clubId: new ClubId("club-1"),
          athleteId: new AthleteId("athlete-3"),
          points: new RatingPoints(1200),
          wins: 7,
          totalMatches: 10,
        }),
      ],
      tiers,
    );

    expect(ladder.map((entry) => entry.rating.athleteId.value)).toEqual([
      "athlete-3",
      "athlete-1",
      "athlete-9",
    ]);
    expect(ladder[0]?.tier?.name).toBe("Silver");
    expect(Tier.resolve(new RatingPoints(1450), tiers)?.name).toBe("Gold");
  });

  it("rejeita rankings com clubes mistos e correcoes que quebrariam invariantes de rating", () => {
    expect(() =>
      ClubLadder.rank([
        createDefaultRating("athlete-1", "club-1"),
        createDefaultRating("athlete-2", "club-2"),
      ]),
    ).toThrow(DomainRuleViolation);

    expect(() =>
      createDefaultRating("athlete-1").applyCorrection(
        new RatingDelta({ points: -1, wins: 0, totalMatches: -1 }),
      ),
    ).toThrow(DomainRuleViolation);
  });
});
