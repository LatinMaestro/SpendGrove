import { describe, expect, it } from "vitest";
import {
  CONTROLLED_MIGRATION_BLOB_SHAS,
  CONTROLLED_PREVIEW_MIGRATIONS,
  classifyPreMigrationBaseline,
  exactStringSetMatches,
  repositoryMigrationPlan,
} from "../../scripts/preview-migration-batch-core.mjs";

const earlier = [
  "20260701000000_initial",
  "20260708090000_phase_4_recurring_budgets_foundation",
];
const repository = [...earlier, ...CONTROLLED_PREVIEW_MIGRATIONS];

describe("controlled Preview migration inventory", () => {
  it("keeps the six migrations in exact required order", () => {
    expect(CONTROLLED_PREVIEW_MIGRATIONS).toEqual([
      "20260717090000_phase_6_bulk_operation_foundation",
      "20260717100000_phase_7_transfer_link_foundation",
      "20260717110000_phase_7_import_undo_foundation",
      "20260717120000_phase_9_advanced_personal_finance_foundation",
      "20260717130000_phase_10_household_accountant_foundation",
      "20260717140000_phase_11_document_metadata_foundation",
    ]);
  });

  it("pins an approved blob identity for every controlled migration", () => {
    expect(Object.keys(CONTROLLED_MIGRATION_BLOB_SHAS)).toEqual(CONTROLLED_PREVIEW_MIGRATIONS);
    for (const sha of Object.values(CONTROLLED_MIGRATION_BLOB_SHAS)) {
      expect(sha).toMatch(/^[a-f0-9]{40}$/);
    }
  });

  it("accepts only a repository whose tail is exactly the controlled batch", () => {
    expect(repositoryMigrationPlan(repository)).toEqual({
      repositoryMigrations: repository,
      earlierMigrations: earlier,
      controlledMigrations: CONTROLLED_PREVIEW_MIGRATIONS,
    });
    expect(repositoryMigrationPlan(repository.slice(0, -1))).toBeNull();
    expect(repositoryMigrationPlan([...repository, "20260717150000_unapproved"])).toBeNull();
  });
});

describe("Preview pre-migration baseline classification", () => {
  it("accepts a genuinely empty public schema without migration history", () => {
    expect(classifyPreMigrationBaseline({
      migrationTableExists: false,
      publicTableCount: 0,
      publicEnumCount: 0,
      appliedMigrationNames: [],
      earlierMigrationNames: earlier,
    })).toEqual({ ok: true, mode: "empty", earlierMigrationCount: 0 });
  });

  it("rejects untracked objects in a database without migration history", () => {
    expect(classifyPreMigrationBaseline({
      migrationTableExists: false,
      publicTableCount: 1,
      publicEnumCount: 0,
      appliedMigrationNames: [],
      earlierMigrationNames: earlier,
    })).toEqual({ ok: false, code: "UNEXPECTED_EMPTY_DATABASE_OBJECTS" });
  });

  it("accepts only the exact earlier migration set for an established baseline", () => {
    expect(classifyPreMigrationBaseline({
      migrationTableExists: true,
      publicTableCount: 20,
      publicEnumCount: 4,
      appliedMigrationNames: [...earlier].reverse(),
      earlierMigrationNames: earlier,
    })).toEqual({ ok: true, mode: "existing", earlierMigrationCount: earlier.length });

    expect(classifyPreMigrationBaseline({
      migrationTableExists: true,
      publicTableCount: 20,
      publicEnumCount: 4,
      appliedMigrationNames: [earlier[0]],
      earlierMigrationNames: earlier,
    })).toEqual({ ok: false, code: "UNEXPECTED_MIGRATION_HISTORY" });
  });

  it("compares migration identities as an exact order-insensitive set", () => {
    expect(exactStringSetMatches([...repository].reverse(), repository)).toBe(true);
    expect(exactStringSetMatches(repository.slice(1), repository)).toBe(false);
  });
});
