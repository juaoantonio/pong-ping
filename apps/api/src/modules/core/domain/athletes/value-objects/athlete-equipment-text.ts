import { DomainRuleViolation } from "../../shared";

const EQUIPMENT_NAME_MAX_LENGTH = 120;
const EQUIPMENT_NOTES_MAX_LENGTH = 500;

export class AthleteEquipmentText {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static optionalName(value: string | null | undefined): AthleteEquipmentText | null {
    return AthleteEquipmentText.optional(value, EQUIPMENT_NAME_MAX_LENGTH);
  }

  public static optionalNotes(value: string | null | undefined): AthleteEquipmentText | null {
    return AthleteEquipmentText.optional(value, EQUIPMENT_NOTES_MAX_LENGTH);
  }

  private static optional(
    value: string | null | undefined,
    maxLength: number,
  ): AthleteEquipmentText | null {
    const normalized = value?.trim() ?? "";

    if (!normalized) {
      return null;
    }

    if (normalized.length > maxLength) {
      throw new DomainRuleViolation(
        "invalid_athlete_equipment_text",
        `Athlete equipment text must not exceed ${maxLength} characters.`,
      );
    }

    return new AthleteEquipmentText(normalized);
  }
}
