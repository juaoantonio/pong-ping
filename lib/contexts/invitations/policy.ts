export type InvitationClaimPolicyInput = {
  expiresAt: Date;
  oneTimeUse: boolean;
  usedAt?: Date | null;
};

export type InvitationUnavailableReason = "expired" | "used";

export function getInvitationUnavailableReason(
  invitation: InvitationClaimPolicyInput,
  now: Date,
): InvitationUnavailableReason | null {
  if (invitation.expiresAt <= now) {
    return "expired";
  }

  if (invitation.oneTimeUse && invitation.usedAt) {
    return "used";
  }

  return null;
}

export function isInvitationClaimable(
  invitation: InvitationClaimPolicyInput,
  now: Date,
) {
  return getInvitationUnavailableReason(invitation, now) === null;
}

export function getInvitationClaimWhereGate(
  invitation: Pick<InvitationClaimPolicyInput, "oneTimeUse">,
  now: Date,
) {
  return {
    expiresAt: { gt: now },
    ...(invitation.oneTimeUse ? { usedAt: null } : {}),
  };
}
