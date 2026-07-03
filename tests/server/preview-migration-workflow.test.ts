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

  it("runs secret-safe integrity checks before and after one suppressed deploy", () => {
    const prePosition = workflow.indexOf("preview-migration-integrity.mjs pre");
    const deployPosition = workflow.indexOf("prisma migrate deploy");
    const postPosition = workflow.indexOf("preview-migration-integrity.mjs post");
    expect(prePosition).toBeGreaterThan(-1);
    expect(deployPosition).toBeGreaterThan(prePosition);
    expect(postPosition).toBeGreaterThan(deployPosition);
    expect(workflow.match(/prisma migrate deploy/g)).toHaveLength(1);
    expect(workflow).toContain('> "$RUNNER_TEMP/prisma-migrate-deploy.log" 2>&1');
    expect(workflow).not.toMatch(/cat .*prisma-migrate-deploy/i);
  });

  it("checks migration state, exact schema objects, empty review state and stable aggregate counts", () => {
    for (const expected of [
      "FAILED_OR_UNRESOLVED_MIGRATION",
      "TARGET_MIGRATION_ALREADY_PRESENT",
      "PropertyReportReview",
      "PropertyRecordClassification",
      "EXPECTED_ENUM_VALUES",
      "EXPECTED_COLUMNS",
      "EXPECTED_INDEXES",
      "EXPECTED_CONSTRAINTS",
      "propertyReportReview.count() !== 0",
      "EXISTING_ROW_COUNTS_CHANGED",
    ]) {
      expect(integrityScript).toContain(expected);
    }
  });

  it("counts only the seven approved existing models and emits no row query", () => {
    for (const model of [
      "prisma.user.count()",
      "prisma.transaction.count()",
      "prisma.property.count()",
      "prisma.loanAccount.count()",
      "prisma.loanRepayment.count()",
      "prisma.loanReconciliationLink.count()",
      "prisma.propertyTransactionLink.count()",
    ]) {
      expect(integrityScript).toContain(model);
    }
    expect(integrityScript).not.toMatch(/\.findMany\(|\.findFirst\(|\.findUnique\(/);
    expect(integrityScript).not.toMatch(/DATABASE_URL|DIRECT_DATABASE_URL|description|narration|merchantName|amountCents/);
  });

  it("uses safe failure codes and never prints caught database errors", () => {
    expect(integrityScript).toContain('SAFE_FAILURE_CODES.has(error.message) ? error.message : "DATABASE_CHECK_FAILED"');
    expect(integrityScript).not.toMatch(/console\.(?:log|error)\([^\n]*(?:error\.stack|error\.message)/);
    expect(integrityScript).not.toMatch(/console\.(?:log|error)\([^\n]*(?:description|narration|merchant|amount|nickname)/i);
  });
});
