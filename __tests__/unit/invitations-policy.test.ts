import {
  getInvitationClaimWhereGate,
  getInvitationUnavailableReason,
  isInvitationClaimable,
} from "@/lib/contexts/invitations";

describe("invitation policy", () => {
  const now = new Date("2026-05-04T12:00:00.000Z");

  it("treats invitations expiring at or before now as unavailable", () => {
    expect(
      getInvitationUnavailableReason(
        {
          expiresAt: new Date("2026-05-04T12:00:00.000Z"),
          oneTimeUse: false,
        },
        now,
      ),
    ).toBe("expired");

    expect(
      isInvitationClaimable(
        {
          expiresAt: new Date("2026-05-04T12:00:01.000Z"),
          oneTimeUse: false,
        },
        now,
      ),
    ).toBe(true);
  });

  it("blocks used one-time invitations but allows reusable invitations", () => {
    const usedAt = new Date("2026-05-04T11:00:00.000Z");

    expect(
      getInvitationUnavailableReason(
        {
          expiresAt: new Date("2026-05-04T12:01:00.000Z"),
          oneTimeUse: true,
          usedAt,
        },
        now,
      ),
    ).toBe("used");

    expect(
      getInvitationUnavailableReason(
        {
          expiresAt: new Date("2026-05-04T12:01:00.000Z"),
          oneTimeUse: false,
          usedAt,
        },
        now,
      ),
    ).toBeNull();
  });

  it("adds the usedAt gate only for one-time invitations", () => {
    expect(getInvitationClaimWhereGate({ oneTimeUse: true }, now)).toEqual({
      expiresAt: { gt: now },
      usedAt: null,
    });

    expect(getInvitationClaimWhereGate({ oneTimeUse: false }, now)).toEqual({
      expiresAt: { gt: now },
    });
  });
});
