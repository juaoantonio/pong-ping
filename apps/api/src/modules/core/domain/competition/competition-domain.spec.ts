import { describe, expect, it } from "vitest";
import { AthleteId } from "../athletes";
import { ClubId } from "../clubs";
import { RatingDelta } from "../ratings";
import { DomainRuleViolation } from "../shared";
import { ActiveGame, GameSide, PlayMode, TableId } from "../tables";
import { GameCorrection } from "./game-correction";
import { GameRecord } from "./game-record";
import { SideRatingChange } from "./side-rating-change";

function createSinglesSide(athleteId: string): GameSide {
  return GameSide.createSingles(new AthleteId(athleteId));
}

function createRecord() {
  const leftSide = createSinglesSide("athlete-1");
  const rightSide = createSinglesSide("athlete-2");

  return GameRecord.record({
    clubId: new ClubId("club-1"),
    tableId: new TableId("table-1"),
    activeGame: ActiveGame.create({
      playMode: new PlayMode("singles"),
      firstSide: leftSide,
      secondSide: rightSide,
    }),
    winningSide: leftSide,
    ratingChanges: [
      new SideRatingChange(leftSide, [
        {
          athleteId: new AthleteId("athlete-1"),
          delta: new RatingDelta({ points: 12, wins: 1, totalMatches: 1 }),
        },
      ]),
      new SideRatingChange(rightSide, [
        {
          athleteId: new AthleteId("athlete-2"),
          delta: new RatingDelta({ points: -12, wins: 0, totalMatches: 1 }),
        },
      ]),
    ],
    actorAthleteId: new AthleteId("athlete-9"),
    finishedAt: new Date("2026-05-07T12:00:00.000Z"),
  });
}

describe("dominio de competicao", () => {
  it("registra vencedor e perdedor como lados do jogo com mudancas de rating por lado", () => {
    const record = createRecord();

    expect(record.winningSide.athletes[0].value).toBe("athlete-1");
    expect(record.losingSide.athletes[0].value).toBe("athlete-2");
    expect(record.winnerRatingChange.changes[0].delta.points).toBe(12);
    expect(record.loserRatingChange.changes[0].delta.points).toBe(-12);
  });

  it("cria correcoes compensatorias que revertem deltas originais e referenciam o original", () => {
    const record = createRecord();

    const correction = GameCorrection.createCompensating(
      record,
      new AthleteId("athlete-8"),
      new Date("2026-05-07T13:00:00.000Z"),
    );

    expect(correction.originalRecordId?.equals(record.id)).toBe(true);
    expect(correction.winningSide.equals(record.losingSide)).toBe(true);
    expect(correction.losingSide.equals(record.winningSide)).toBe(true);
    expect(correction.winnerRatingChange.changes[0].delta.points).toBe(12);
    expect(correction.loserRatingChange.changes[0].delta.points).toBe(-12);
  });

  it("permite no maximo uma correcao por registro original", () => {
    const record = createRecord();

    const firstCorrection = record.correct({
      actorAthleteId: new AthleteId("athlete-8"),
      correctedAt: new Date("2026-05-07T13:00:00.000Z"),
    });

    expect(firstCorrection.originalRecordId?.equals(record.id)).toBe(true);
    expect(record.correctionId?.equals(firstCorrection.id)).toBe(true);

    expectCompetitionRuleViolation(
      () =>
        record.correct({
          actorAthleteId: new AthleteId("athlete-7"),
          correctedAt: new Date("2026-05-07T14:00:00.000Z"),
        }),
      "game_record_already_corrected",
    );
  });

  it("rejeita correcoes que miram registros de correcao", () => {
    const correction = createRecord().correct({
      actorAthleteId: new AthleteId("athlete-8"),
      correctedAt: new Date("2026-05-07T13:00:00.000Z"),
    });

    expectCompetitionRuleViolation(
      () =>
        correction.correct({
          actorAthleteId: new AthleteId("athlete-7"),
          correctedAt: new Date("2026-05-07T14:00:00.000Z"),
        }),
      "game_correction_target_is_correction",
    );
  });

  it("rejeita lados vencedores que nao estao presentes no jogo ativo", () => {
    const outsider = createSinglesSide("athlete-3");

    expect(() =>
      GameRecord.record({
        clubId: new ClubId("club-1"),
        tableId: new TableId("table-1"),
        activeGame: ActiveGame.create({
          playMode: new PlayMode("singles"),
          firstSide: createSinglesSide("athlete-1"),
          secondSide: createSinglesSide("athlete-2"),
        }),
        winningSide: outsider,
        ratingChanges: [
          new SideRatingChange(outsider, [
            {
              athleteId: new AthleteId("athlete-3"),
              delta: new RatingDelta({ points: 8, wins: 1, totalMatches: 1 }),
            },
          ]),
          new SideRatingChange(createSinglesSide("athlete-2"), [
            {
              athleteId: new AthleteId("athlete-2"),
              delta: new RatingDelta({ points: -8, wins: 0, totalMatches: 1 }),
            },
          ]),
        ],
        actorAthleteId: new AthleteId("athlete-9"),
        finishedAt: new Date("2026-05-07T12:00:00.000Z"),
      }),
    ).toThrow(DomainRuleViolation);
  });
});

function expectCompetitionRuleViolation(action: () => unknown, code: string): void {
  try {
    action();
    throw new Error(`Expected DomainRuleViolation with code ${code}.`);
  } catch (error) {
    expect(error).toBeInstanceOf(DomainRuleViolation);
    expect((error as DomainRuleViolation).code).toBe(code);
  }
}
