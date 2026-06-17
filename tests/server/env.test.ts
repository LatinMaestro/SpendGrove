import { describe, expect, it } from "vitest";
import {
  EnvValidationError,
  getBuildSafeDatabaseEnvStatus,
  getRequiredDatabaseMigrationEnv,
  getRequiredDatabaseRuntimeEnv,
} from "@/src/server/env";

const VALID_DATABASE_URL = "postgresql://user:password@example.test:5432/spendgrove?schema=public";
const VALID_DIRECT_DATABASE_URL = "postgresql://user:password@example-direct.test:5432/spendgrove?schema=public";

describe("server environment validation", () => {
  it("keeps build-safe validation optional when database variables are absent", () => {
    const status = getBuildSafeDatabaseEnvStatus({});

    expect(status.runtimeDatabaseConfigured).toBe(false);
    expect(status.migrationDatabaseConfigured).toBe(false);
    expect(status.issues).toEqual([]);
  });

  it("requires DATABASE_URL only when runtime database access is invoked", () => {
    expect(() => getRequiredDatabaseRuntimeEnv({})).toThrow(EnvValidationError);
  });

  it("requires DIRECT_DATABASE_URL only for migration/admin database access", () => {
    expect(() => getRequiredDatabaseMigrationEnv({ DATABASE_URL: VALID_DATABASE_URL })).toThrow(EnvValidationError);
  });

  it("accepts the approved runtime and direct Neon/PostgreSQL variable names", () => {
    expect(getRequiredDatabaseRuntimeEnv({ DATABASE_URL: VALID_DATABASE_URL })).toEqual({
      DATABASE_URL: VALID_DATABASE_URL,
    });
    expect(getRequiredDatabaseMigrationEnv({ DIRECT_DATABASE_URL: VALID_DIRECT_DATABASE_URL })).toEqual({
      DIRECT_DATABASE_URL: VALID_DIRECT_DATABASE_URL,
    });
  });

  it("reports invalid variable names without leaking secret values", () => {
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
});
