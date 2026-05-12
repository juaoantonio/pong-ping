import { AthleteId } from "../../athlete/domain";
import { QueuePosition } from "./value-objects";

type QueueEntryInput = {
  athleteId: AthleteId;
  position: QueuePosition;
  joinedAt: Date;
};

export type QueueEntryData = {
  athleteId: string | AthleteId;
  position: number | QueuePosition;
  joinedAt: string | Date;
};

export class QueueEntry {
  public readonly athleteId: AthleteId;
  public readonly position: QueuePosition;
  public readonly joinedAt: Date;

  private constructor(input: QueueEntryInput) {
    this.athleteId = input.athleteId;
    this.position = input.position;
    this.joinedAt = input.joinedAt;
  }

  public static create(input: QueueEntryInput): QueueEntry {
    return new QueueEntry(input);
  }

  public static from(input: QueueEntry | QueueEntryData): QueueEntry {
    return input instanceof QueueEntry
      ? input
      : QueueEntry.create({
          athleteId: AthleteId.from(input.athleteId),
          position: QueuePosition.from(input.position),
          joinedAt: input.joinedAt instanceof Date ? input.joinedAt : new Date(input.joinedAt),
        });
  }

  public moveTo(position: QueuePosition): QueueEntry {
    return new QueueEntry({
      athleteId: this.athleteId,
      position,
      joinedAt: this.joinedAt,
    });
  }
}
