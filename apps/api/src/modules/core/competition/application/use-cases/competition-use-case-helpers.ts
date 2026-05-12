import { AthleteId } from "../../../athlete/domain";
import { DomainRuleViolation } from "../../../shared/domain";
import { type ActiveGame, GameSide } from "../../../table/domain";

export function toWinningSide(
  activeGame: ActiveGame,
  athleteIds: readonly (string | AthleteId)[],
): GameSide {
  const side = GameSide.forPlayMode(
    activeGame.playMode,
    athleteIds.map((athleteId) => AthleteId.from(athleteId)),
  );

  if (!activeGame.containsSide(side)) {
    throw new DomainRuleViolation(
      "winning_side_not_active",
      "Winning side must be one of the active game sides.",
    );
  }

  return side;
}
