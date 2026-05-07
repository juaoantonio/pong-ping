import { describe, expect, it } from "vitest";
import { DomainRuleViolation } from "../../core/domain/shared";
import { User } from "./user";
import { Email } from "./value-objects/email";
import { UserId } from "./value-objects/user-id";

describe("dominio de identidade", () => {
  it("cria usuarios genericos com email normalizado e estado ativo", () => {
    const user = User.create({
      id: new UserId("user-1"),
      email: new Email(" User@Example.COM "),
      role: "admin",
    });

    expect(user.email.value).toBe("user@example.com");
    expect(user.role).toBe("admin");
    expect(user.active).toBe(true);
  });

  it("altera email e estado de ativacao apenas por comportamento da identidade", () => {
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

  it("rejeita emails invalidos e roles nao suportadas", () => {
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
