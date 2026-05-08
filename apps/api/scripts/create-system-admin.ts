import "reflect-metadata";
import { createInterface } from "node:readline/promises";
import chalk from "chalk";
import dataSource from "../data-source";
import { IdentityUserEntity, SystemRoleAssignmentEntity } from "../src/modules/identity/entities";
import { IDENTITY_SYSTEM_ROLE } from "../src/modules/identity/identity-roles";

export type CliOptions = {
  email: string;
  displayName: string | null;
  googleSubject: string | null;
};

export type CreateSystemAdminResult = {
  user: IdentityUserEntity;
  createdUser: boolean;
  createdRole: boolean;
};

type RepositoryLike<T extends object> = {
  create(input?: Partial<T>): T;
  findOne(options: { where: Partial<T> }): Promise<T | null>;
  save(entity: T): Promise<T>;
};
type TransactionManager = {
  getRepository<T extends object>(target: unknown): RepositoryLike<T>;
};
type TransactionSource = {
  transaction(
    isolationLevel: "SERIALIZABLE",
    runInTransaction: (manager: TransactionManager) => Promise<CreateSystemAdminResult>,
  ): Promise<CreateSystemAdminResult>;
};
type CliDataSource = TransactionSource & {
  initialize(): Promise<unknown>;
  destroy(): Promise<void>;
};
type CliOutput = Pick<typeof console, "log">;
type CliPrompt = {
  question(query: string): Promise<string>;
  close(): void;
};

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

export async function runCli(
  args: string[],
  source: CliDataSource = dataSource as unknown as CliDataSource,
  output: CliOutput = console,
  prompt?: CliPrompt,
): Promise<void> {
  const parsed = parseArgs(args);
  if (parsed.help) {
    output.log(usage());
    return;
  }
  const options = parsed.interactive
    ? await promptForOptions(parsed.options, output, prompt)
    : requireCompleteOptions(parsed.options);

  await source.initialize();
  try {
    const result = await createSystemAdmin(options, source);

    output.log(
      result.createdUser
        ? chalk.green("Created system admin user.")
        : chalk.green("Updated system admin user."),
    );
    output.log(`${chalk.bold("User ID:")} ${result.user.id}`);
    output.log(`${chalk.bold("Email:")} ${result.user.email}`);
    output.log(`${chalk.bold("Display name:")} ${result.user.displayName ?? chalk.dim("(none)")}`);
    output.log(
      `${chalk.bold("Google subject:")} ${
        result.user.googleSubject ?? chalk.dim("(pending first Google login)")
      }`,
    );
    output.log(
      result.createdRole
        ? `${chalk.bold("Assigned role:")} ${chalk.cyan(IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN)}`
        : `${chalk.bold("Role already assigned:")} ${chalk.cyan(IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN)}`,
    );
  } finally {
    await source.destroy();
  }
}

export async function createSystemAdmin(
  options: CliOptions,
  source: TransactionSource = dataSource as unknown as TransactionSource,
): Promise<CreateSystemAdminResult> {
  return source.transaction("SERIALIZABLE", async (manager) => {
    const users = manager.getRepository<IdentityUserEntity>(IdentityUserEntity);
    const systemRoles = manager.getRepository<SystemRoleAssignmentEntity>(
      SystemRoleAssignmentEntity,
    );

    const existingByEmail = await users.findOne({ where: { email: options.email } });
    const existingByGoogleSubject = options.googleSubject
      ? await users.findOne({ where: { googleSubject: options.googleSubject } })
      : null;

    if (
      existingByEmail &&
      existingByGoogleSubject &&
      existingByEmail.id !== existingByGoogleSubject.id
    ) {
      throw new Error(
        `Cannot assign ${options.email}: Google subject is already linked to ${existingByGoogleSubject.email}.`,
      );
    }

    const user = existingByEmail ?? existingByGoogleSubject ?? users.create();
    const createdUser = !user.id;

    if (
      user.googleSubject &&
      options.googleSubject &&
      user.googleSubject !== options.googleSubject
    ) {
      throw new Error(
        `Cannot assign ${options.email}: user is already linked to a different Google subject.`,
      );
    }

    user.email = options.email;
    user.displayName = options.displayName ?? user.displayName ?? null;
    user.googleSubject = options.googleSubject ?? user.googleSubject ?? null;
    user.avatarUrl = user.avatarUrl ?? null;
    user.active = true;

    const savedUser = await users.save(user);
    const existingRole = await systemRoles.findOne({
      where: { userId: savedUser.id, role: IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN },
    });

    if (!existingRole) {
      await systemRoles.save(
        systemRoles.create({
          userId: savedUser.id,
          role: IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN,
        }),
      );
    }

    return {
      user: savedUser,
      createdUser,
      createdRole: !existingRole,
    };
  });
}

export type ParsedCliArgs = {
  help: boolean;
  interactive: boolean;
  options: Partial<CliOptions>;
};

export function parseArgs(args: string[]): ParsedCliArgs {
  const values = new Map<string, string>();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return { help: true, interactive: false, options: {} };
    }

    if (arg === "--interactive" || arg === "-i") {
      values.set("interactive", "true");
      continue;
    }

    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}\n\n${usage()}`);
    }

    const equalsIndex = arg.indexOf("=");
    if (equalsIndex !== -1) {
      values.set(arg.slice(2, equalsIndex), arg.slice(equalsIndex + 1));
      continue;
    }

    const key = arg.slice(2);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}\n\n${usage()}`);
    }

    values.set(key, value);
    index += 1;
  }

  const unknownKeys = [...values.keys()].filter(
    (key) => !["email", "display-name", "google-subject", "interactive"].includes(key),
  );
  if (unknownKeys.length > 0) {
    throw new Error(`Unknown option: --${unknownKeys[0]}\n\n${usage()}`);
  }

  return {
    help: false,
    interactive:
      values.get("interactive") === "true" || args.filter((arg) => arg !== "--").length === 0,
    options: {
      email: normalizeOptional(values.get("email")) ?? undefined,
      displayName: normalizeOptional(values.get("display-name")),
      googleSubject: normalizeOptional(values.get("google-subject")),
    },
  };
}

async function promptForOptions(
  initialOptions: Partial<CliOptions>,
  output: CliOutput,
  injectedPrompt?: CliPrompt,
): Promise<CliOptions> {
  const prompt =
    injectedPrompt ??
    createInterface({
      input: process.stdin,
      output: process.stdout,
    });

  try {
    output.log(chalk.bold.cyan("\nSystem admin bootstrap\n"));

    const email = initialOptions.email
      ? normalizeEmail(initialOptions.email)
      : normalizeEmail(await askRequired(prompt, output, "Email"));
    const displayName =
      initialOptions.displayName ??
      normalizeOptional(await prompt.question(label("Display name", "optional")));
    const googleSubject =
      initialOptions.googleSubject ??
      normalizeOptional(
        await prompt.question(label("Google subject", "optional, blank to link by email")),
      );

    const options = requireCompleteOptions({
      email,
      displayName,
      googleSubject,
    });

    output.log("");
    output.log(`${chalk.bold("Email:")} ${options.email}`);
    output.log(`${chalk.bold("Display name:")} ${options.displayName ?? chalk.dim("(none)")}`);
    output.log(
      `${chalk.bold("Google subject:")} ${
        options.googleSubject ?? chalk.dim("(pending first Google login)")
      }`,
    );

    const confirmed = await prompt.question(
      chalk.yellow("? ") + "Create/update this system admin? [Y/n] ",
    );
    if (confirmed.trim() && !["y", "yes"].includes(confirmed.trim().toLowerCase())) {
      throw new Error("Aborted.");
    }

    return options;
  } finally {
    prompt.close();
  }
}

async function askRequired(prompt: CliPrompt, output: CliOutput, name: string): Promise<string> {
  while (true) {
    const value = normalizeOptional(await prompt.question(label(name, "required")));
    if (value) return value;
    output.log(chalk.red(`${name} is required.`));
  }
}

function requireCompleteOptions(options: Partial<CliOptions>): CliOptions {
  const email = normalizeEmail(options.email ?? "");
  if (!email) {
    throw new Error(`--email is required unless using --interactive.\n\n${usage()}`);
  }

  return {
    email,
    displayName: options.displayName ?? null,
    googleSubject: options.googleSubject ?? null,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeOptional(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

async function main(): Promise<void> {
  await runCli(process.argv.slice(2));
}

function usage(): string {
  return [
    "Usage:",
    "  pnpm --filter @pong-ping/api system-admin:create -- --email admin@example.com \\",
    '    [--display-name "Admin"] [--google-subject 123]',
    "  pnpm --filter @pong-ping/api system-admin:create",
    "  pnpm --filter @pong-ping/api system-admin:create -- --interactive",
    "",
    "Creates or updates an identity user and assigns the system_admin role.",
    "Run without arguments, or pass --interactive, to answer prompts.",
    "If --google-subject is omitted, the user is linked automatically on first Google login with the same email.",
  ].join("\n");
}

function label(name: string, hint: string): string {
  return `${chalk.yellow("?")} ${chalk.bold(name)} ${chalk.dim(`(${hint})`)}: `;
}
