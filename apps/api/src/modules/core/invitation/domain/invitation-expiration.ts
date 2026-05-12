import { DomainRuleViolation } from "../../shared/domain";

export class InvitationExpiration {
  public readonly value: Date;

  public static from(value: string | number | Date | InvitationExpiration): InvitationExpiration {
    return value instanceof InvitationExpiration
      ? value
      : new InvitationExpiration(value instanceof Date ? value : new Date(value));
  }

  public constructor(value: Date) {
    if (Number.isNaN(value.getTime())) {
      throw new DomainRuleViolation(
        "invalid_invitation_expiration",
        "Invitation expiration must be a valid date.",
      );
    }

    this.value = new Date(value);
  }

  public isUnavailableAt(now: Date): boolean {
    return this.value.getTime() <= now.getTime();
  }
}
