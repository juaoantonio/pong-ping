import { describe, expect, it } from "vitest";
import {
  calculateElo,
  calculateWinRate,
  canAccessAdmin,
  canDeleteUser,
  getInvitationExpiry,
  hashInvitationToken,
  rotateQueueAfterMatch,
} from "./rules";

describe("domain rules", () => {
  it("keeps role hierarchy protections", () => {
    expect(canAccessAdmin("admin")).toBe(true);
    expect(canAccessAdmin("user")).toBe(false);
    expect(canDeleteUser("admin", "user")).toBe(true);
    expect(canDeleteUser("admin", "superadmin")).toBe(false);
  });

  it("calculates Elo and win rate", () => {
    expect(calculateElo(1000, 1000, 64)).toEqual({
      winnerElo: 1032,
      loserElo: 968,
    });
    expect(calculateWinRate(2, 3)).toBe(66.67);
  });

  it("rotates the queue with winner staying at the table", () => {
    expect(rotateQueueAfterMatch(["a", "b", "c", "d"], "b")).toEqual([
      "b",
      "c",
      "d",
      "a",
    ]);
  });

  it("hashes and expires invitations deterministically", () => {
    expect(hashInvitationToken("abc")).toHaveLength(64);
    expect(getInvitationExpiry("15m", 0).toISOString()).toBe(
      "1970-01-01T00:15:00.000Z",
    );
  });
});
