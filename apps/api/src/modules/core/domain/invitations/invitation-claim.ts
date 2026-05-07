import { type UserId } from "../../../identity/domain";
import { DomainRuleViolation } from "../shared";

type InvitationClaimInput = {
  claimedAt: Date;
  claimedBy: UserId;
};

export class InvitationClaim {
  public readonly claimedAt: Date;
  public readonly claimedBy: UserId;

  public constructor(input: InvitationClaimInput) {
    if (Number.isNaN(input.claimedAt.getTime())) {
      throw new DomainRuleViolation(
        "invalid_invitation_claimed_at",
        "Invitation claim must have a valid claim date.",
      );
    }

    this.claimedAt = new Date(input.claimedAt);
    this.claimedBy = input.claimedBy;
  }
}
