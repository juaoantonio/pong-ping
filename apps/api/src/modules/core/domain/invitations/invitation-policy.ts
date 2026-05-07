import { DomainRuleViolation } from "../shared";
import { type InvitationClaim } from "./invitation-claim";
import { type InvitationExpiration } from "./invitation-expiration";

export type InvitationUnavailableReason = "invitation_expired" | "invitation_used";

export type InvitationAvailability = {
  expiration: InvitationExpiration;
  reusable: boolean;
  claims: readonly InvitationClaim[];
};

export class InvitationPolicy {
  public getUnavailableReason(
    invite: InvitationAvailability,
    now: Date,
  ): InvitationUnavailableReason | null {
    if (invite.expiration.isUnavailableAt(now)) {
      return "invitation_expired";
    }

    if (!invite.reusable && invite.claims.length > 0) {
      return "invitation_used";
    }

    return null;
  }

  public ensureAvailable(invite: InvitationAvailability, now: Date): void {
    const unavailableReason = this.getUnavailableReason(invite, now);

    if (unavailableReason === "invitation_expired") {
      throw new DomainRuleViolation(
        unavailableReason,
        "Invitation is expired and can no longer be claimed.",
      );
    }

    if (unavailableReason === "invitation_used") {
      throw new DomainRuleViolation(
        unavailableReason,
        "One-time invitation has already been claimed.",
      );
    }
  }
}
