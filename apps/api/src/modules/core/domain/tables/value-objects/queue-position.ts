import { DomainRuleViolation } from "../../shared";

export class QueuePosition {
  public readonly value: number;

  public constructor(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new DomainRuleViolation(
        "invalid_queue_position",
        "Queue position must be a non-negative integer.",
      );
    }

    this.value = value;
  }

  public equals(other: QueuePosition): boolean {
    return this.value === other.value;
  }
}
