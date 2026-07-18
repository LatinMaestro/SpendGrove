import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(new URL("../../.github/workflows/preview-prisma-migrate.yml", import.meta.url), "utf8");
const integrityScript = readFileSync(new URL("../../scripts/preview-migration-integrity.mjs", import.meta.url), "utf8");
const integrityCore = readFileSync(new URL("../../scripts/preview-migration-integrity-core.mjs", import.meta.url), "utf8");
const batchCore = readFileSync(new URL("../../scripts/preview-migration-batch-core.mjs", import.meta.url), "utf8");
const identityScript = readFileSync(new URL("../../scripts/preview-database-identity.mjs", import.meta.url), "utf8");
const integritySources = `${integrityScript}\n${integrityCore}\n${batchCore}`;

const controlledMigrations = [
  "20260717090000_phase_6_bulk_operation_foundation",
  "20260717100000_phase_7_transfer_link_foundation",
  "20260717110000_phase_7_import_undo_foundation",
  "20260717120000_phase_9_advanced_personal_finance_foundation",
  "20260717130000_phase_10_household_accountant_foundation",
  "20260717140000_phase_11_document_metadata_foundation",
];

describe("Preview Prisma migration workflow integrity", () => {
  it("is main-only and maps Preview-only secrets", () => {
    expect(workflow).toContain('if [ "$GITHUB_REF" != "refs/heads/main" ]');
    expect(workflow).toContain("secrets.NEON_PREVIEW_DATABASE_URL");
    expect(workflow).toContain("secrets.NEON_PREVIEW_DIRECT_DATABASE_URL");
    expect(workflow).not.toMatch(/secrets\.[A-Z0-9_]*PROD(?:UCTION)?[A-Z0-9_]*/i);
  });

  it("pins the isolated Neon Preview identity before any database query or deploy", () => {
    expect(workflow).toContain("cold-field-54187673");
    expect(workflow).toContain("br-sweet-flower-aj2ng7ix");
    expect(workflow).toContain("ep-shy-mud-aj7fpz5c.c-3.us-east-2.aws.neon.tech");
    expect(workflow).toContain("ep-shy-mud-aj7fpz5c-pooler.c-3.us-east-2.aws.neon.tech");
    expect(workflow).toContain("node scripts/preview-database-identity.mjs");
    expect(identityScript).not.toMatch(/console\.(?:log|error).*DATABASE_URL/);
    expect(workflow.indexOf("preview-database-identity.mjs")).toBeLessThan(
      workflow.indexOf("preview-migration-integrity.mjs pre-all"),
    );
  });

  it("requires an explicit mode-specific confirmation", () => {
    expect(workflow).toContain("type: choice");
    expect(workflow).toContain("- migrate-all");
    expect(workflow).toContain("- verify-all");
    expect(workflow).toContain('inputs.confirmation }}" != "RUN ISOLATED PREVIEW MIGRATIONS"');
    expect(workflow).toContain('inputs.confirmation }}" != "VERIFY ISOLATED PREVIEW MIGRATIONS"');
  });

  it("runs one suppressed deploy between all-migration preflight and postflight", () => {
    const prePosition = workflow.indexOf("preview-migration-integrity.mjs pre-all");
    const deployPosition = workflow.indexOf("prisma migrate deploy");
    const postPosition = workflow.indexOf("preview-migration-integrity.mjs post-all");
    expect(prePosition).toBeGreaterThan(-1);
    expect(deployPosition).toBeGreaterThan(prePosition);
    expect(postPosition).toBeGreaterThan(deployPosition);
    expect(workflow.match(/prisma migrate deploy/g)).toHaveLength(1);
    expect(workflow).toContain("inputs.mode == 'migrate-all'");
    expect(workflow).toContain('> "$RUNNER_TEMP/prisma-migrate-deploy.log" 2>&1');
    expect(workflow).not.toMatch(/cat .*prisma-migrate-deploy/i);
  });

  it("inventories all six controlled migrations in exact order", () => {
    let previousPosition = -1;
    for (const migration of controlledMigrations) {
      const position = batchCore.indexOf(migration);
      expect(position).toBeGreaterThan(previousPosition);
      previousPosition = position;
      expect(integrityCore).toContain(migration);
    }
    expect(batchCore).toContain("repositoryMigrationPlan");
    expect(batchCore).toContain("sorted.slice(-CONTROLLED_PREVIEW_MIGRATIONS.length)");
  });

  it("accepts only an empty public schema or the exact earlier history", () => {
    for (const expected of [
      "UNEXPECTED_EMPTY_DATABASE_OBJECTS",
      "UNEXPECTED_MIGRATION_HISTORY",
      "FAILED_OR_UNRESOLVED_MIGRATION",
      "CONTROLLED_MIGRATION_ALREADY_PRESENT",
      "CONTROLLED_MIGRATION_NOT_APPLIED_ONCE",
      "classifyPreMigrationBaseline",
      "publicTableCount",
      "publicEnumCount",
      "exactStringSetMatches(appliedNames, plan.repositoryMigrations)",
    ]) {
      expect(integritySources).toContain(expected);
    }
  });

  it("checks every controlled schema profile, exact objects, empty tables and aggregate counts", () => {
    for (const expected of [
      "CONTROLLED_PREVIEW_MIGRATIONS.map",
      "migrationProfileFor",
      "EXPECTED_ENUM_MISMATCH",
      "EXPECTED_COLUMNS_MISMATCH",
      "EXPECTED_INDEXES_MISMATCH",
      "EXPECTED_CONSTRAINTS_MISMATCH",
      "EXPECTED_TABLE_NOT_EMPTY",
      "EXISTING_ROW_COUNTS_CHANGED",
      "c.contype IN ('p', 'f')",
      "exactNameSetMatches",
    ]) {
      expect(integritySources).toContain(expected);
    }
  });

  it("keeps a separately approved verify-all path without re-running deploy", () => {
    expect(workflow).toContain("expected_state_json:");
    expect(workflow).toContain("Verify-all requires the secret-safe state");
    expect(workflow).toContain('--expected-state-json "$EXPECTED_STATE_JSON"');
    expect(workflow).not.toContain('{"User":1,"Category":51');
  });

  it("uses aggregate counts only and never reads row contents", () => {
    expect(integrityScript).toContain("await prisma[delegate].count()");
    expect(integrityScript).not.toMatch(/\.findMany\(|\.findFirst\(|\.findUnique\(/);
    expect(integrityScript).not.toMatch(/description|narration|merchantName|amountCents|DATABASE_URL|DIRECT_DATABASE_URL/);
  });

  it("uses safe failure codes and never prints caught database errors", () => {
    expect(integrityScript).toContain('SAFE_FAILURE_CODES.has(error.message)');
    expect(integrityScript).not.toMatch(/console\.(?:log|error)\([^\n]*(?:error\.stack|error\.message)/);
    expect(integrityScript).not.toMatch(/console\.(?:log|error)\([^\n]*(?:description|narration|merchant|amount|nickname)/i);
  });
});
