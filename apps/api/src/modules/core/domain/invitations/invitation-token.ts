import { DomainRuleViolation } from "../shared";

const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/;

export class InvitationToken {
  public readonly value: string;

  public constructor(value: string) {
    const normalized = value.trim();

    if (!INVITATION_TOKEN_PATTERN.test(normalized)) {
      throw new DomainRuleViolation(
        "invalid_invitation_token",
        "Invitation token must contain only letters, numbers, underscores, or hyphens.",
      );
    }

    this.value = normalized;
  }
}
