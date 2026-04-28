import {
  canAccessAdmin,
  canChangeRole,
  canDeleteUser,
  canManageUser,
  hasRole,
  isAdmin,
  isRole,
  isSuperAdmin,
  isUser,
} from "@/lib/auth/roles";

describe("regras de autorizacao por role", () => {
  it("valida valores aceitos para role", () => {
    expect(isRole("user")).toBe(true);
    expect(isRole("admin")).toBe(true);
    expect(isRole("superadmin")).toBe(true);
    expect(isRole("owner")).toBe(false);
  });

  it("aplica hierarquia de acesso corretamente", () => {
    expect(hasRole("superadmin", "admin")).toBe(true);
    expect(hasRole("admin", "user")).toBe(true);
    expect(hasRole("user", "admin")).toBe(false);
  });

  it("identifica roles em objetos de usuario", () => {
    expect(isUser({ role: "user" })).toBe(true);
    expect(isAdmin({ role: "admin" })).toBe(true);
    expect(isSuperAdmin({ role: "superadmin" })).toBe(true);
  });

  it("restringe painel admin, alteracao de role e remocao por permissao", () => {
    expect(canAccessAdmin("admin")).toBe(true);
    expect(canAccessAdmin("user")).toBe(false);
    expect(canChangeRole("superadmin")).toBe(true);
    expect(canChangeRole("admin")).toBe(false);
    expect(canManageUser("admin", "user")).toBe(true);
    expect(canManageUser("admin", "superadmin")).toBe(false);
    expect(canDeleteUser("superadmin", "admin")).toBe(true);
  });
});
