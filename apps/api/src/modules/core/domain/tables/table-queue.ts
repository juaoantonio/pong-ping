import { type AthleteId } from "../athletes";
import { DomainRuleViolation } from "../shared";
import { ActiveGame } from "./active-game";
import { GameSide } from "./game-side";
import { QueueEntry } from "./queue-entry";
import { type PlayMode, QueuePosition } from "./value-objects";

export class TableQueue {
  private entriesValue: QueueEntry[];

  private constructor(entries: QueueEntry[]) {
    this.entriesValue = sortAndReindexEntries(entries);
    ensureDistinctQueuedAthletes(this.entriesValue);
  }

  public static create(entries: QueueEntry[] = []): TableQueue {
    return new TableQueue(entries);
  }

  public get entries(): readonly QueueEntry[] {
    return [...this.entriesValue];
  }

  public hasAthlete(athleteId: AthleteId): boolean {
    return this.entriesValue.some((entry) => entry.athleteId.equals(athleteId));
  }

  public hasPlayableActiveGame(playMode: PlayMode): boolean {
    return this.entriesValue.length >= playMode.requiredAthletes;
  }

  public enqueue(athleteId: AthleteId, joinedAt: Date): QueueEntry {
    if (this.hasAthlete(athleteId)) {
      throw new DomainRuleViolation(
        "athlete_already_queued",
        "Athlete is already queued on this table.",
      );
    }

    const entry = QueueEntry.create({
      athleteId,
      position: new QueuePosition(this.entriesValue.length),
      joinedAt,
    });

    this.entriesValue = [...this.entriesValue, entry];

    return entry;
  }

  public remove(athleteId: AthleteId): QueueEntry {
    const removedEntry = this.entriesValue.find((entry) => entry.athleteId.equals(athleteId));

    if (!removedEntry) {
      throw new DomainRuleViolation("athlete_not_queued", "Athlete is not queued on this table.");
    }

    this.entriesValue = reindexEntries(
      this.entriesValue.filter((entry) => !entry.athleteId.equals(athleteId)),
    );

    return removedEntry;
  }

  public formActiveGame(playMode: PlayMode): ActiveGame {
    if (!this.hasPlayableActiveGame(playMode)) {
      throw new DomainRuleViolation(
        "not_enough_athletes",
        "Not enough athletes are queued to form an active game.",
      );
    }

    const activeEntries = this.entriesValue.slice(0, playMode.requiredAthletes);
    const firstSideEntries = activeEntries.slice(0, playMode.athletesPerSide);
    const secondSideEntries = activeEntries.slice(playMode.athletesPerSide);

    return ActiveGame.create({
      playMode,
      firstSide: GameSide.forPlayMode(
        playMode,
        firstSideEntries.map((entry) => entry.athleteId),
      ),
      secondSide: GameSide.forPlayMode(
        playMode,
        secondSideEntries.map((entry) => entry.athleteId),
      ),
    });
  }

  public rotateWinnerStays(playMode: PlayMode, winningSide: GameSide): ActiveGame {
    const activeGame = this.formActiveGame(playMode);

    if (!activeGame.containsSide(winningSide)) {
      throw new DomainRuleViolation(
        "winning_side_not_active",
        "Winning side must belong to the active game.",
      );
    }

    const athletesPerSide = playMode.athletesPerSide;
    const activeEntries = this.entriesValue.slice(0, playMode.requiredAthletes);
    const waitingEntries = this.entriesValue.slice(playMode.requiredAthletes);
    const firstSideEntries = activeEntries.slice(0, athletesPerSide);
    const secondSideEntries = activeEntries.slice(athletesPerSide);
    const reorderedActiveEntries = activeGame.firstSide.equals(winningSide)
      ? [...firstSideEntries, ...secondSideEntries]
      : [...secondSideEntries, ...firstSideEntries];

    this.entriesValue = reindexEntries([
      ...reorderedActiveEntries.slice(0, athletesPerSide),
      ...waitingEntries,
      ...reorderedActiveEntries.slice(athletesPerSide),
    ]);

    return this.formActiveGame(playMode);
  }

  public isCurrentAthlete(athleteId: AthleteId, playMode: PlayMode): boolean {
    if (!this.hasPlayableActiveGame(playMode)) {
      return false;
    }

    return this.entriesValue
      .slice(0, playMode.requiredAthletes)
      .some((entry) => entry.athleteId.equals(athleteId));
  }
}

function sortAndReindexEntries(entries: QueueEntry[]): QueueEntry[] {
  return reindexEntries(
    [...entries].sort(
      (leftEntry, rightEntry) => leftEntry.position.value - rightEntry.position.value,
    ),
  );
}

function reindexEntries(entries: QueueEntry[]): QueueEntry[] {
  return entries.map((entry, index) => entry.moveTo(new QueuePosition(index)));
}

function ensureDistinctQueuedAthletes(entries: readonly QueueEntry[]): void {
  const uniqueAthleteIds = new Set(entries.map((entry) => entry.athleteId.value));

  if (uniqueAthleteIds.size !== entries.length) {
    throw new DomainRuleViolation(
      "athlete_already_queued",
      "Athlete is already queued on this table.",
    );
  }
}
