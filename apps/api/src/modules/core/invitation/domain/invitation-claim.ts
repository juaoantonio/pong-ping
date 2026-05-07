import { type ActorId, DomainRuleViolation } from "../../shared/domain";

type InvitationClaimInput = {
  claimedAt: Date;
  claimedBy: ActorId;
};

export class InvitationClaim {
  public readonly claimedAt: Date;
  public readonly claimedBy: ActorId;

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
