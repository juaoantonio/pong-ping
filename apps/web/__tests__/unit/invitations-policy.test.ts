import {
  getInvitationClaimWhereGate,
  getInvitationUnavailableReason,
  isInvitationClaimable,
} from "@/lib/contexts/invitations";

describe("politica de convites", () => {
  const now = new Date("2026-05-04T12:00:00.000Z");

  it("trata convites que expiram agora ou antes como indisponiveis", () => {
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

  it("bloqueia convites de uso unico usados e permite convites reutilizaveis", () => {
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

  it("adiciona a trava usedAt apenas para convites de uso unico", () => {
    expect(getInvitationClaimWhereGate({ oneTimeUse: true }, now)).toEqual({
      expiresAt: { gt: now },
      usedAt: null,
    });

    expect(getInvitationClaimWhereGate({ oneTimeUse: false }, now)).toEqual({
      expiresAt: { gt: now },
    });
  });
});
