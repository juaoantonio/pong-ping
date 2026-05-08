import { beforeEach, describe, expect, it, vi } from "vitest";
import { IdentityUserEntity, SystemRoleAssignmentEntity } from "../src/modules/identity/entities";
import { IDENTITY_SYSTEM_ROLE } from "../src/modules/identity/identity-roles";
import {
  createSystemAdmin,
  type CreateSystemAdminResult,
  parseArgs,
  runCli,
} from "./create-system-admin";

type EntityWithId = {
  id?: string;
};

type FindOptions = {
  where: Record<string, unknown>;
};

class FakeRepository<T extends EntityWithId> {
  public saved: T[] = [];

  private sequence = 0;

  public constructor(
    private readonly prefix: string,
    public readonly records: T[] = [],
  ) {}

  public create(input: Partial<T> = {}): T {
    return { ...input } as T;
  }

  public async findOne(options: FindOptions): Promise<T | null> {
    return (
      this.records.find((record) =>
        Object.entries(options.where).every(([key, value]) => record[key as keyof T] === value),
      ) ?? null
    );
  }

  public async save(entity: T): Promise<T> {
    if (!entity.id) {
      this.sequence += 1;
      entity.id = `${this.prefix}-${this.sequence}`;
      this.records.push(entity);
    }

    this.saved.push(entity);
    return entity;
  }
}

function createFakeSource(
  userRecords: IdentityUserEntity[] = [],
  roleRecords: SystemRoleAssignmentEntity[] = [],
) {
  const users = new FakeRepository<IdentityUserEntity>("user", userRecords);
  const systemRoles = new FakeRepository<SystemRoleAssignmentEntity>("role", roleRecords);
  const manager = {
    getRepository<T extends EntityWithId>(target: unknown): FakeRepository<T> {
      if (target === IdentityUserEntity) return users as unknown as FakeRepository<T>;
      if (target === SystemRoleAssignmentEntity) return systemRoles as unknown as FakeRepository<T>;
      throw new Error("Unexpected repository target.");
    },
  };
  const source = {
    initialize: vi.fn(async () => undefined),
    destroy: vi.fn(async () => undefined),
    transaction: vi.fn(
      async (
        _isolation: "SERIALIZABLE",
        callback: (value: typeof manager) => Promise<CreateSystemAdminResult>,
      ) => callback(manager),
    ),
  };

  return { source, users, systemRoles };
}

describe("create-system-admin CLI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses and normalizes CLI options", () => {
    expect(
      parseArgs([
        "--email",
        " ADMIN@example.TEST ",
        "--display-name=Root Admin",
        "--google-subject",
        "google-123",
      ]),
    ).toEqual({
      help: false,
      interactive: false,
      options: {
        email: "ADMIN@example.TEST",
        displayName: "Root Admin",
        googleSubject: "google-123",
      },
    });
  });

  it("detects help and interactive mode", () => {
    expect(parseArgs(["--help"])).toEqual({
      help: true,
      interactive: false,
      options: {},
    });
    expect(parseArgs(["-h"])).toEqual({
      help: true,
      interactive: false,
      options: {},
    });
    expect(parseArgs([])).toEqual({
      help: false,
      interactive: true,
      options: {
        email: undefined,
        displayName: null,
        googleSubject: null,
      },
    });
    expect(parseArgs(["--interactive"])).toMatchObject({
      help: false,
      interactive: true,
    });
  });

  it("creates a pending system admin user and role", async () => {
    const { source, users, systemRoles } = createFakeSource();

    const result = await createSystemAdmin(
      {
        email: "admin@example.test",
        displayName: "Admin",
        googleSubject: null,
      },
      source,
    );

    expect(result).toMatchObject({
      createdUser: true,
      createdRole: true,
    });
    expect(users.records).toEqual([
      expect.objectContaining({
        id: "user-1",
        email: "admin@example.test",
        displayName: "Admin",
        googleSubject: null,
        avatarUrl: null,
        active: true,
      }),
    ]);
    expect(systemRoles.records).toEqual([
      expect.objectContaining({
        id: "role-1",
        userId: "user-1",
        role: IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN,
      }),
    ]);
  });

  it("updates an existing user without duplicating the role", async () => {
    const existingUser = Object.assign(new IdentityUserEntity(), {
      id: "user-1",
      email: "admin@example.test",
      displayName: "Old Name",
      googleSubject: null,
      avatarUrl: null,
      active: false,
    });
    const existingRole = Object.assign(new SystemRoleAssignmentEntity(), {
      id: "role-1",
      userId: "user-1",
      role: IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN,
    });
    const { source, users, systemRoles } = createFakeSource([existingUser], [existingRole]);

    const result = await createSystemAdmin(
      {
        email: "admin@example.test",
        displayName: "Admin",
        googleSubject: "google-123",
      },
      source,
    );

    expect(result).toMatchObject({
      createdUser: false,
      createdRole: false,
    });
    expect(users.records).toHaveLength(1);
    expect(users.records[0]).toMatchObject({
      id: "user-1",
      displayName: "Admin",
      googleSubject: "google-123",
      active: true,
    });
    expect(systemRoles.records).toHaveLength(1);
  });

  it("rejects conflicting email and Google subject links", async () => {
    const existingByEmail = Object.assign(new IdentityUserEntity(), {
      id: "user-1",
      email: "admin@example.test",
      googleSubject: null,
    });
    const existingByGoogleSubject = Object.assign(new IdentityUserEntity(), {
      id: "user-2",
      email: "other@example.test",
      googleSubject: "google-123",
    });
    const { source } = createFakeSource([existingByEmail, existingByGoogleSubject]);

    await expect(
      createSystemAdmin(
        {
          email: "admin@example.test",
          displayName: null,
          googleSubject: "google-123",
        },
        source,
      ),
    ).rejects.toThrow("Google subject is already linked to other@example.test");
  });

  it("initializes and destroys the data source when running the CLI", async () => {
    const { source } = createFakeSource();
    const output = { log: vi.fn() };

    await runCli(["--email", "admin@example.test"], source, output);

    expect(source.initialize).toHaveBeenCalledOnce();
    expect(source.destroy).toHaveBeenCalledOnce();
    expect(output.log).toHaveBeenCalledWith(expect.stringContaining("Created system admin user."));
  });

  it("prompts interactively when no arguments are provided", async () => {
    const { source, users } = createFakeSource();
    const output = { log: vi.fn() };
    const answers = [" admin@example.TEST ", "Root Admin", "", "yes"];
    const prompt = {
      question: vi.fn(async () => answers.shift() ?? ""),
      close: vi.fn(),
    };

    await runCli([], source, output, prompt);

    expect(prompt.question).toHaveBeenCalledTimes(4);
    expect(prompt.close).toHaveBeenCalledOnce();
    expect(users.records[0]).toMatchObject({
      email: "admin@example.test",
      displayName: "Root Admin",
      googleSubject: null,
      active: true,
    });
  });
});
