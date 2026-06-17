export type EnvSource = Record<string, string | undefined>;

export type EnvIssueKey =
  | "DATABASE_URL"
  | "DIRECT_DATABASE_URL"
  | "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  | "CLERK_SECRET_KEY";

export type EnvIssue = {
  key: EnvIssueKey;
  reason: string;
};

type EnvResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      issues: EnvIssue[];
    };

export type DatabaseRuntimeEnv = {
  DATABASE_URL: string;
};

export type DatabaseMigrationEnv = {
  DIRECT_DATABASE_URL: string;
};

export type ClerkRuntimeEnv = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
};

export type BuildSafeDatabaseEnvStatus = {
  runtimeDatabaseConfigured: boolean;
  migrationDatabaseConfigured: boolean;
  issues: EnvIssue[];
};

export type BuildSafeClerkEnvStatus = {
  clerkConfigured: boolean;
  publishableKeyConfigured: boolean;
  secretKeyConfigured: boolean;
  issues: EnvIssue[];
};

const POSTGRES_URL_PATTERN = /^postgres(?:ql)?:\/\//i;
const CLERK_PUBLISHABLE_KEY_PATTERN = /^pk_(test|live)_[A-Za-z0-9_-]+/;
const CLERK_SECRET_KEY_PATTERN = /^sk_(test|live)_[A-Za-z0-9_-]+/;

export class EnvValidationError extends Error {
  readonly issues: EnvIssue[];

  constructor(message: string, issues: EnvIssue[]) {
    super(message);
    this.name = "EnvValidationError";
    this.issues = issues;
  }
}

function hasValue(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validatePostgresUrl(key: EnvIssueKey, value: string | undefined, required: boolean): EnvIssue | null {
  if (!hasValue(value)) {
    return required ? { key, reason: "is required when database access is invoked" } : null;
  }

  if (!POSTGRES_URL_PATTERN.test(value.trim())) {
    return { key, reason: "must be a PostgreSQL connection string" };
  }

  return null;
}

function validateClerkKey(
  key: EnvIssueKey,
  value: string | undefined,
  required: boolean,
  pattern: RegExp,
): EnvIssue | null {
  if (!hasValue(value)) {
    return required ? { key, reason: "is required when Clerk authentication is invoked" } : null;
  }

  if (!pattern.test(value.trim())) {
    return { key, reason: "must use the expected Clerk key format" };
  }

  return null;
}

function formatIssues(issues: EnvIssue[]) {
  return issues.map((issue) => `${issue.key} ${issue.reason}`).join("; ");
}

function unwrapEnvResult<T>(result: EnvResult<T>, label: string): T {
  if (result.ok) {
    return result.value;
  }

  throw new EnvValidationError(`${label}: ${formatIssues(result.issues)}`, result.issues);
}

export function getBuildSafeDatabaseEnvStatus(env: EnvSource = process.env): BuildSafeDatabaseEnvStatus {
  const runtimeIssue = validatePostgresUrl("DATABASE_URL", env.DATABASE_URL, false);
  const migrationIssue = validatePostgresUrl("DIRECT_DATABASE_URL", env.DIRECT_DATABASE_URL, false);
  const issues = [runtimeIssue, migrationIssue].filter((issue): issue is EnvIssue => issue !== null);

  return {
    runtimeDatabaseConfigured: hasValue(env.DATABASE_URL) && runtimeIssue === null,
    migrationDatabaseConfigured: hasValue(env.DIRECT_DATABASE_URL) && migrationIssue === null,
    issues,
  };
}

export function getBuildSafeClerkEnvStatus(env: EnvSource = process.env): BuildSafeClerkEnvStatus {
  const publishableIssue = validateClerkKey(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    false,
    CLERK_PUBLISHABLE_KEY_PATTERN,
  );
  const secretIssue = validateClerkKey("CLERK_SECRET_KEY", env.CLERK_SECRET_KEY, false, CLERK_SECRET_KEY_PATTERN);
  const issues = [publishableIssue, secretIssue].filter((issue): issue is EnvIssue => issue !== null);
  const publishableKeyConfigured = hasValue(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) && publishableIssue === null;
  const secretKeyConfigured = hasValue(env.CLERK_SECRET_KEY) && secretIssue === null;

  return {
    clerkConfigured: publishableKeyConfigured && secretKeyConfigured,
    publishableKeyConfigured,
    secretKeyConfigured,
    issues,
  };
}

export function parseDatabaseRuntimeEnv(env: EnvSource = process.env): EnvResult<DatabaseRuntimeEnv> {
  const issue = validatePostgresUrl("DATABASE_URL", env.DATABASE_URL, true);

  if (issue) {
    return { ok: false, issues: [issue] };
  }

  return {
    ok: true,
    value: {
      DATABASE_URL: env.DATABASE_URL!.trim(),
    },
  };
}

export function parseDatabaseMigrationEnv(env: EnvSource = process.env): EnvResult<DatabaseMigrationEnv> {
  const issue = validatePostgresUrl("DIRECT_DATABASE_URL", env.DIRECT_DATABASE_URL, true);

  if (issue) {
    return { ok: false, issues: [issue] };
  }

  return {
    ok: true,
    value: {
      DIRECT_DATABASE_URL: env.DIRECT_DATABASE_URL!.trim(),
    },
  };
}

export function parseClerkRuntimeEnv(env: EnvSource = process.env): EnvResult<ClerkRuntimeEnv> {
  const publishableIssue = validateClerkKey(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    true,
    CLERK_PUBLISHABLE_KEY_PATTERN,
  );
  const secretIssue = validateClerkKey("CLERK_SECRET_KEY", env.CLERK_SECRET_KEY, true, CLERK_SECRET_KEY_PATTERN);
  const issues = [publishableIssue, secretIssue].filter((issue): issue is EnvIssue => issue !== null);

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!.trim(),
      CLERK_SECRET_KEY: env.CLERK_SECRET_KEY!.trim(),
    },
  };
}

export function getRequiredDatabaseRuntimeEnv(env: EnvSource = process.env): DatabaseRuntimeEnv {
  return unwrapEnvResult(parseDatabaseRuntimeEnv(env), "Database runtime environment is not configured");
}

export function getRequiredDatabaseMigrationEnv(env: EnvSource = process.env): DatabaseMigrationEnv {
  return unwrapEnvResult(parseDatabaseMigrationEnv(env), "Database migration environment is not configured");
}

export function getRequiredClerkRuntimeEnv(env: EnvSource = process.env): ClerkRuntimeEnv {
  return unwrapEnvResult(parseClerkRuntimeEnv(env), "Clerk runtime environment is not configured");
}
