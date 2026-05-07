import { DomainRuleViolation } from "../../shared/domain";

export class InvitationExpiration {
  public readonly value: Date;

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
