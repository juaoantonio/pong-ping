import { DomainRuleViolation } from "../errors/domain-rule-violation";

export abstract class DomainId {
  public readonly value: string;

  public static from<T extends DomainId>(this: new (value: string) => T, value: string | T): T {
    return value instanceof this ? value : new this(value as string);
  }

  protected constructor(value: string, code: string) {
    const normalized = value.trim();

    if (!normalized) {
      throw new DomainRuleViolation(code, "Domain identity cannot be blank.");
    }

    this.value = normalized;
  }

  public equals(other: DomainId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
