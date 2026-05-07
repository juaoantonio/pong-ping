import { describe, expect, it } from "vitest";
import { ClubId } from "../clubs";
import { UserId } from "../../../identity/domain";
import { DomainRuleViolation } from "../shared";
import { TableId } from "../tables";
import { ClubInvite } from "./club-invite";
import { InvitationExpiration } from "./invitation-expiration";
import { InvitationPolicy } from "./invitation-policy";
import { InvitationToken } from "./invitation-token";
import { TableInvite } from "./table-invite";

function expiresAt(value: string): InvitationExpiration {
  return new InvitationExpiration(new Date(value));
}

describe("Invitations domain", () => {
  it("rejects unsafe invitation tokens", () => {
    expect(() => new InvitationToken("bad token")).toThrow(DomainRuleViolation);
  });

  it("makes invites unavailable when they expire at or before now", () => {
    const invite = ClubInvite.create({
      clubId: new ClubId("club-1"),
      token: new InvitationToken("club_invite_1"),
      expiration: expiresAt("2026-05-07T12:00:00.000Z"),
    });

    const unavailableReason = new InvitationPolicy().getUnavailableReason(
      invite,
      new Date("2026-05-07T12:00:00.000Z"),
    );

    expect(unavailableReason).toBe("invitation_expired");
  });

  it("rejects a second claim for one-time invites", () => {
    const invite = ClubInvite.create({
      clubId: new ClubId("club-1"),
      token: new InvitationToken("clubinvite1"),
      expiration: expiresAt("2026-05-08T00:00:00.000Z"),
    });

    invite.claim({
      claimedAt: new Date("2026-05-07T10:00:00.000Z"),
      claimedBy: new UserId("user-1"),
    });

    expectInvitationRuleViolation(
      () =>
        invite.claim({
          claimedAt: new Date("2026-05-07T11:00:00.000Z"),
          claimedBy: new UserId("user-2"),
        }),
      "invitation_used",
    );
  });

  it("allows reusable invites to be claimed repeatedly until expiration", () => {
    const invite = TableInvite.create({
      tableId: new TableId("table-1"),
      token: new InvitationToken("tableinvite1"),
      expiration: expiresAt("2026-05-08T00:00:00.000Z"),
      reusable: true,
    });

    const firstClaim = invite.claim({
      claimedAt: new Date("2026-05-07T10:00:00.000Z"),
      claimedBy: new UserId("user-1"),
    });
    const secondClaim = invite.claim({
      claimedAt: new Date("2026-05-07T11:00:00.000Z"),
      claimedBy: new UserId("user-2"),
    });

    expect(invite.claims).toHaveLength(2);
    expect(firstClaim.claimedBy.value).toBe("user-1");
    expect(secondClaim.claimedBy.value).toBe("user-2");
  });

  it("keeps club and table references on their specific invite types", () => {
    const clubInvite = ClubInvite.create({
      clubId: new ClubId("club-1"),
      token: new InvitationToken("clubinvite2"),
      expiration: expiresAt("2026-05-08T00:00:00.000Z"),
    });
    const tableInvite = TableInvite.create({
      tableId: new TableId("table-9"),
      token: new InvitationToken("tableinvite9"),
      expiration: expiresAt("2026-05-08T00:00:00.000Z"),
    });

    expect(clubInvite.clubId).toEqual(new ClubId("club-1"));
    expect(tableInvite.tableId).toEqual(new TableId("table-9"));
  });
});

function expectInvitationRuleViolation(action: () => unknown, code: string): void {
  try {
    action();
    throw new Error(`Expected DomainRuleViolation with code ${code}.`);
  } catch (error) {
    expect(error).toBeInstanceOf(DomainRuleViolation);
    expect((error as DomainRuleViolation).code).toBe(code);
  }
}
