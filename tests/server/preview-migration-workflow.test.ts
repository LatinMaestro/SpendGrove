import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(new URL("../../.github/workflows/preview-prisma-migrate.yml", import.meta.url), "utf8");
const integrityScript = readFileSync(new URL("../../scripts/preview-migration-integrity.mjs", import.meta.url), "utf8");

describe("Preview Prisma migration workflow integrity", () => {
  it("is main-only and maps Preview-only secrets", () => {
    expect(workflow).toContain('if [ "$GITHUB_REF" != "refs/heads/main" ]');
    expect(workflow).toContain("secrets.NEON_PREVIEW_DATABASE_URL");
    expect(workflow).toContain("secrets.NEON_PREVIEW_DIRECT_DATABASE_URL");
    expect(workflow).not.toMatch(/secrets\.[A-Z0-9_]*PROD(?:UCTION)?[A-Z0-9_]*/i);
  });

  it("requires an explicit mode-specific confirmation", () => {
    expect(workflow).toContain("type: choice");
    expect(workflow).toContain("- migrate");
    expect(workflow).toContain("- verify-only");
    expect(workflow).toContain('inputs.confirmation }}" != "RUN PREVIEW MIGRATION"');
    expect(workflow).toContain('inputs.confirmation }}" != "VERIFY PREVIEW MIGRATION"');
  });

  it("runs secret-safe integrity checks before and after one suppressed deploy", () => {
    const prePosition = workflow.indexOf("preview-migration-integrity.mjs pre");
    const deployPosition = workflow.indexOf("prisma migrate deploy");
    const postPosition = workflow.indexOf("preview-migration-integrity.mjs post");
    expect(prePosition).toBeGreaterThan(-1);
    expect(deployPosition).toBeGreaterThan(prePosition);
    expect(postPosition).toBeGreaterThan(deployPosition);
    expect(workflow.match(/prisma migrate deploy/g)).toHaveLength(1);
    expect(workflow).toContain("if: ${{ inputs.mode == 'migrate' }}");
    expect(workflow).toContain('> "$RUNNER_TEMP/prisma-migrate-deploy.log" 2>&1');
    expect(workflow).not.toMatch(/cat .*prisma-migrate-deploy/i);
  });

  it("checks migration state, exact schema objects, empty target tables and stable aggregate counts", () => {
    for (const expected of [
      "FAILED_OR_UNRESOLVED_MIGRATION",
      "TARGET_MIGRATION_ALREADY_PRESENT",
      "20260708090000_phase_4_recurring_budgets_foundation",
      "RecurringItem",
      "RecurringSuggestionDismissal",
      "CategoryBudget",
      "RecurringCadence",
      "RecurringItemStatus",
      "BudgetPeriod",
      "BudgetStatus",
      "EXPECTED_ENUM_MISMATCH",
      "EXPECTED_COLUMNS_MISMATCH",
      "EXPECTED_INDEXES_MISMATCH",
      "EXPECTED_CONSTRAINTS_MISMATCH",
      "EXPECTED_TABLE_NOT_EMPTY",
      "EXISTING_ROW_COUNTS_CHANGED",
      "c.contype IN ('p', 'f')",
      "exactNameSetMatches",
    ]) {
      expect(integrityScript).toContain(expected);
    }
  });

  it("uses the safe pre-migration aggregate baseline for verification-only mode", () => {
    expect(workflow).toContain("--expected-counts-json");
    const expectedBaseline = {
      User: 1,
      Category: 51,
      Transaction: 1500,
      ImportBatch: 15,
      ImportRow: 1568,
      Property: 2,
      LoanAccount: 3,
      LoanRepayment: 23,
      LoanReconciliationLink: 22,
      PropertyTransactionLink: 6,
      PropertyReportReview: 11,
    };
    for (const [table, count] of Object.entries(expectedBaseline)) {
      expect(workflow).toContain(`"${table}":${count}`);
    }
  });

  it("counts only approved existing models and emits no row query", () => {
    for (const expected of [
      "EXISTING_COUNT_DELEGATES",
      '["User", "user"]',
      '["Transaction", "transaction"]',
      '["Property", "property"]',
      '["LoanAccount", "loanAccount"]',
      '["LoanRepayment", "loanRepayment"]',
      '["LoanReconciliationLink", "loanReconciliationLink"]',
      '["PropertyTransactionLink", "propertyTransactionLink"]',
      '["PropertyReportReview", "propertyReportReview"]',
    ]) {
      expect(integrityScript).toContain(expected);
    }
    expect(integrityScript).toContain("await prisma[delegate].count()");
    expect(integrityScript).not.toMatch(/\.findMany\(|\.findFirst\(|\.findUnique\(/);
    expect(integrityScript).not.toMatch(/DATABASE_URL|DIRECT_DATABASE_URL|description|narration|merchantName|amountCents/);
  });

  it("uses safe failure codes and never prints caught database errors", () => {
    expect(integrityScript).toContain('SAFE_FAILURE_CODES.has(error.message) ? error.message : "DATABASE_CHECK_FAILED"');
    expect(integrityScript).not.toMatch(/console\.(?:log|error)\([^\n]*(?:error\.stack|error\.message)/);
    expect(integrityScript).not.toMatch(/console\.(?:log|error)\([^\n]*(?:description|narration|merchant|amount|nickname)/i);
  });
});