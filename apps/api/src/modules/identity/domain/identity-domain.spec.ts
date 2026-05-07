import { describe, expect, it } from "vitest";
import { DomainRuleViolation } from "../../core/domain/shared";
import { User } from "./user";
import { Email } from "./value-objects/email";
import { UserId } from "./value-objects/user-id";

describe("Identity domain", () => {
  it("creates generic users with normalized email and active state", () => {
    const user = User.create({
      id: new UserId("user-1"),
      email: new Email(" User@Example.COM "),
      role: "admin",
    });

    expect(user.email.value).toBe("user@example.com");
    expect(user.role).toBe("admin");
    expect(user.active).toBe(true);
  });

  it("changes email and activation state through identity behavior only", () => {
    const user = User.create({
      id: new UserId("user-1"),
      email: new Email("first@example.com"),
      role: "user",
    });

    user.changeEmail(new Email("second@example.com"));
    user.deactivate();
    expect(user.email.value).toBe("second@example.com");
    expect(user.active).toBe(false);

    user.activate();
    expect(user.active).toBe(true);
  });

  it("rejects invalid email addresses and unsupported roles", () => {
    expect(() => new Email("bad-email")).toThrow(DomainRuleViolation);
    expect(() =>
      User.create({
        id: new UserId("user-1"),
        email: new Email("valid@example.com"),
        role: "owner",
      }),
    ).toThrow(DomainRuleViolation);
  });
});
