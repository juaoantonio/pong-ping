import { describe, expect, it } from "vitest";
import { ClubId } from "../../club/domain";
import { UserId } from "../../../identity/domain";
import { DomainRuleViolation } from "../../shared/domain";
import { TableId } from "../../table/domain";
import { ClubInvite } from "./club-invite";
import { InvitationExpiration } from "./invitation-expiration";
import { InvitationPolicy } from "./invitation-policy";
import { InvitationToken } from "./invitation-token";
import { TableInvite } from "./table-invite";

function expiresAt(value: string): InvitationExpiration {
  return new InvitationExpiration(new Date(value));
}

describe("dominio de convites", () => {
  it("rejeita tokens de convite inseguros", () => {
    expect(() => new InvitationToken("bad token")).toThrow(DomainRuleViolation);
  });

  it("torna convites indisponiveis quando expiram agora ou antes", () => {
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

  it("rejeita segunda reivindicacao de convites de uso unico", () => {
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

  it("permite reivindicar convites reutilizaveis repetidamente ate expirarem", () => {
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

  it("mantem referencias de clube e mesa nos tipos especificos de convite", () => {
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
