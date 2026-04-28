import { canSignInWithEmail, ensureInitialSuperAdminAllowed, isInitialSuperAdminEmail } from "@/lib/auth/sign-in-policy";
import { allowEmail, isEmailAllowed } from "@/lib/auth/access";

jest.mock("@/lib/auth/access", () => ({
  allowEmail: jest.fn(),
  isEmailAllowed: jest.fn(),
  normalizeEmail: (email: string) => email.trim().toLowerCase(),
}));

const mockedAllowEmail = jest.mocked(allowEmail);
const mockedIsEmailAllowed = jest.mocked(isEmailAllowed);

describe("politica de login por email", () => {
  const originalSuperadminEmail = process.env.SUPERADMIN_EMAIL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPERADMIN_EMAIL = "root@example.com";
  });

  afterAll(() => {
    process.env.SUPERADMIN_EMAIL = originalSuperadminEmail;
  });

  it("reconhece o superadmin inicial ignorando maiusculas e espacos", () => {
    expect(isInitialSuperAdminEmail(" ROOT@Example.COM ")).toBe(true);
    expect(isInitialSuperAdminEmail("admin@example.com")).toBe(false);
  });

  it("permite login do superadmin inicial sem consultar a allowlist", async () => {
    await expect(canSignInWithEmail("root@example.com")).resolves.toBe(true);

    expect(mockedIsEmailAllowed).not.toHaveBeenCalled();
  });

  it("permite login de emails presentes na allowlist", async () => {
    mockedIsEmailAllowed.mockResolvedValue(true);

    await expect(canSignInWithEmail("user@example.com")).resolves.toBe(true);

    expect(mockedIsEmailAllowed).toHaveBeenCalledWith("user@example.com");
  });

  it("bloqueia login sem email ou fora da allowlist", async () => {
    mockedIsEmailAllowed.mockResolvedValue(false);

    await expect(canSignInWithEmail(null)).resolves.toBe(false);
    await expect(canSignInWithEmail("blocked@example.com")).resolves.toBe(false);
  });

  it("autoriza automaticamente apenas o superadmin inicial", async () => {
    mockedAllowEmail.mockResolvedValue({
      id: "allowed-email-id",
      email: "root@example.com",
      createdByUserId: "root-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(ensureInitialSuperAdminAllowed("root@example.com", "root-id")).resolves.toBe(true);
    await expect(ensureInitialSuperAdminAllowed("user@example.com", "user-id")).resolves.toBe(false);

    expect(mockedAllowEmail).toHaveBeenCalledTimes(1);
    expect(mockedAllowEmail).toHaveBeenCalledWith("root@example.com", "root-id");
  });
});
