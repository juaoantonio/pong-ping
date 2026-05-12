import { DomainRuleViolation } from "../../../shared/domain";

const EQUIPMENT_NAME_MAX_LENGTH = 120;
const EQUIPMENT_NOTES_MAX_LENGTH = 500;

export class AthleteEquipmentText {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static from(
    value: string | AthleteEquipmentText,
    maxLength = EQUIPMENT_NOTES_MAX_LENGTH,
  ): AthleteEquipmentText {
    if (value instanceof AthleteEquipmentText) {
      return value;
    }

    const normalized = value.trim();

    if (!normalized) {
      throw new DomainRuleViolation(
        "invalid_athlete_equipment_text",
        "Athlete equipment text cannot be blank.",
      );
    }

    if (normalized.length > maxLength) {
      throw new DomainRuleViolation(
        "invalid_athlete_equipment_text",
        `Athlete equipment text must not exceed ${maxLength} characters.`,
      );
    }

    return new AthleteEquipmentText(normalized);
  }

  public static optionalName(
    value: string | AthleteEquipmentText | null | undefined,
  ): AthleteEquipmentText | null {
    return AthleteEquipmentText.optional(value, EQUIPMENT_NAME_MAX_LENGTH);
  }

  public static optionalNotes(
    value: string | AthleteEquipmentText | null | undefined,
  ): AthleteEquipmentText | null {
    return AthleteEquipmentText.optional(value, EQUIPMENT_NOTES_MAX_LENGTH);
  }

  private static optional(
    value: string | AthleteEquipmentText | null | undefined,
    maxLength: number,
  ): AthleteEquipmentText | null {
    if (value instanceof AthleteEquipmentText) {
      return value;
    }

    const normalized = value?.trim() ?? "";

    if (!normalized) {
      return null;
    }

    return AthleteEquipmentText.from(normalized, maxLength);
  }
}
