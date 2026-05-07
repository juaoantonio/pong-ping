import { DomainRuleViolation } from "../../shared";

export class TableName {
  public readonly value: string;

  public constructor(value: string) {
    const normalized = value.trim().replace(/\s+/g, " ");

    if (normalized.length < 2) {
      throw new DomainRuleViolation(
        "invalid_table_name",
        "Table name must have at least 2 characters.",
      );
    }

    this.value = normalized;
  }
}
