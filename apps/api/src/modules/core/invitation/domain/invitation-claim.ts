import { ActorId, DomainRuleViolation } from "../../shared/domain";

export type InvitationClaimInput = {
  claimedAt: Date;
  claimedBy: ActorId;
};

export type InvitationClaimData = {
  claimedAt: string | Date;
  claimedBy: string | ActorId;
};

export class InvitationClaim {
  public readonly claimedAt: Date;
  public readonly claimedBy: ActorId;

  public static from(input: InvitationClaim | InvitationClaimData): InvitationClaim {
    return input instanceof InvitationClaim
      ? input
      : new InvitationClaim({
          claimedAt: input.claimedAt instanceof Date ? input.claimedAt : new Date(input.claimedAt),
          claimedBy: ActorId.from(input.claimedBy),
        });
  }

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
