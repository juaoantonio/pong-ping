import { type AthleteId } from "../athletes";
import { type QueuePosition } from "./value-objects";

type QueueEntryInput = {
  athleteId: AthleteId;
  position: QueuePosition;
  joinedAt: Date;
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

  public moveTo(position: QueuePosition): QueueEntry {
    return new QueueEntry({
      athleteId: this.athleteId,
      position,
      joinedAt: this.joinedAt,
    });
  }
}
