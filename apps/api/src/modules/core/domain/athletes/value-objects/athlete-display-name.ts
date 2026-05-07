import { DomainRuleViolation } from "../../shared";

export class AthleteDisplayName {
  public readonly value: string;

  public constructor(value: string) {
    const normalized = value.trim().replace(/\s+/g, " ");

    if (normalized.length < 2 || normalized.length > 80) {
      throw new DomainRuleViolation(
        "invalid_athlete_display_name",
        "Athlete display name must contain between 2 and 80 characters.",
      );
    }

    this.value = normalized;
  }
}
