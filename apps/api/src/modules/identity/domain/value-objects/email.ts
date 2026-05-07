import { DomainRuleViolation } from "../../../core/shared/domain";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  public readonly value: string;

  public constructor(value: string) {
    const normalized = value.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalized)) {
      throw new DomainRuleViolation("invalid_email", "Email must be a valid address.");
    }

    this.value = normalized;
  }
}
