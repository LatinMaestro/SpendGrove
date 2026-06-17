import { describe, expect, it } from "vitest";
import {
  EnvValidationError,
  getBuildSafeClerkEnvStatus,
  getBuildSafeDatabaseEnvStatus,
  getRequiredClerkRuntimeEnv,
  getRequiredDatabaseMigrationEnv,
  getRequiredDatabaseRuntimeEnv,
} from "@/src/server/env";

const VALID_DATABASE_URL = "postgresql://user:password@example.test:5432/spendgrove?schema=public";
const VALID_DIRECT_DATABASE_URL = "postgresql://user:password@example-direct.test:5432/spendgrove?schema=public";
const VALID_CLERK_ENV = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_SYNTHETIC",
  CLERK_SECRET_KEY: "sk_test_SYNTHETIC",
};

describe("server environment validation", () => {
  it("keeps build-safe database validation optional when database variables are absent", () => {
    const status = getBuildSafeDatabaseEnvStatus({});

    expect(status.runtimeDatabaseConfigured).toBe(false);
    expect(status.migrationDatabaseConfigured).toBe(false);
    expect(status.issues).toEqual([]);
  });

  it("keeps build-safe Clerk validation optional when Clerk variables are absent", () => {
    const status = getBuildSafeClerkEnvStatus({});

    expect(status.clerkConfigured).toBe(false);
    expect(status.publishableKeyConfigured).toBe(false);
    expect(status.secretKeyConfigured).toBe(false);
    expect(status.issues).toEqual([]);
  });

  it("requires DATABASE_URL only when runtime database access is invoked", () => {
    expect(() => getRequiredDatabaseRuntimeEnv({})).toThrow(EnvValidationError);
  });

  it("requires DIRECT_DATABASE_URL only for migration/admin database access", () => {
    expect(() => getRequiredDatabaseMigrationEnv({ DATABASE_URL: VALID_DATABASE_URL })).toThrow(EnvValidationError);
  });

  it("requires Clerk keys only when Clerk authentication is invoked", () => {
    expect(() => getRequiredClerkRuntimeEnv({})).toThrow(EnvValidationError);
    expect(getRequiredClerkRuntimeEnv(VALID_CLERK_ENV)).toEqual(VALID_CLERK_ENV);
  });

  it("accepts the approved runtime and direct Neon/PostgreSQL variable names", () => {
    expect(getRequiredDatabaseRuntimeEnv({ DATABASE_URL: VALID_DATABASE_URL })).toEqual({
      DATABASE_URL: VALID_DATABASE_URL,
    });
    expect(getRequiredDatabaseMigrationEnv({ DIRECT_DATABASE_URL: VALID_DIRECT_DATABASE_URL })).toEqual({
      DIRECT_DATABASE_URL: VALID_DIRECT_DATABASE_URL,
    });
  });

  it("reports invalid database values without leaking secret values", () => {
    const secretValue = "not-postgres://user:VERY_PRIVATE_PASSWORD@example.test/db";

    try {
      getRequiredDatabaseRuntimeEnv({ DATABASE_URL: secretValue });
      throw new Error("expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      expect(String((error as Error).message)).toContain("DATABASE_URL");
      expect(String((error as Error).message)).not.toContain("VERY_PRIVATE_PASSWORD");
      expect(String((error as Error).message)).not.toContain(secretValue);
    }
  });

  it("reports invalid Clerk values without leaking secret keys", () => {
    const secretValue = "sk_test_PRIVATE_SECRET_VALUE";

    try {
      getRequiredClerkRuntimeEnv({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "not-a-publishable-key",
        CLERK_SECRET_KEY: secretValue,
      });
      throw new Error("expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      expect(String((error as Error).message)).toContain("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
      expect(String((error as Error).message)).not.toContain("PRIVATE_SECRET_VALUE");
      expect(String((error as Error).message)).not.toContain(secretValue);
    }
  });
});
