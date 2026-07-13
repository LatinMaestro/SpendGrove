import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { scoreReconciliationCandidate, type LoanReconciliationCandidate } from "@/lib/loan-reconciliation";
import { selectUniqueHighConfidenceCandidate } from "@/src/server/loan-auto-reconciliation";
import { createLoanReconciliationLinkAuditEvent } from "@/src/server/loan-reconciliation-links";

const autoSourcePath = new URL("../../src/server/loan-auto-reconciliation.ts", import.meta.url);
const commitSourcePath = new URL("../../src/server/loan-repayments.ts", import.meta.url);
const everydayImportCommitSourcePath = new URL("../../src/server/import-commit.ts", import.meta.url);
const linksSourcePath = new URL("../../src/server/loan-reconciliation-links.ts", import.meta.url);

function candidate(overrides: Partial<LoanReconciliationCandidate> = {}): LoanReconciliationCandidate {
  return {
    transactionId: "transaction_1",
    transactionDate: "2026-07-02",
    transactionAmountCents: -100000,
    existingAllocationCents: 0,
    amountVarianceCents: 0,
    dateDifferenceDays: 0,
    confidence: "HIGH",
    reasonCode: "EXACT_AMOUNT_NEAR_DATE",
    ...overrides,
  };
}

describe("automatic high-confidence loan reconciliation", () => {
  it("selects exactly one high-confidence candidate", () => {
    expect(selectUniqueHighConfidenceCandidate([candidate()])).toEqual(candidate());
  });

  it("leaves zero and multiple high-confidence candidates for manual review", () => {
    expect(selectUniqueHighConfidenceCandidate([])).toBeNull();
    expect(selectUniqueHighConfidenceCandidate([
      candidate(),
      candidate({ transactionId: "transaction_2" }),
    ])).toBeNull();
  });

  it("never auto-selects medium, manual, or override candidates", () => {
    expect(selectUniqueHighConfidenceCandidate([candidate({ confidence: "MEDIUM", reasonCode: "ROUNDING_VARIANCE" })])).toBeNull();
    expect(selectUniqueHighConfidenceCandidate([candidate({ confidence: "MANUAL", reasonCode: "MANUAL_OVERRIDE" })])).toBeNull();
  });

  it("does not auto-link when remaining split-loan allocation is not an exact match", () => {
    const conflicted = scoreReconciliationCandidate({
      repaymentTotalCents: 100000,
      repaymentDate: "2026-07-02",
      transactionId: "transaction_1",
      transactionDate: "2026-07-02",
      transactionAmountCents: -200000,
      existingAllocationCents: 50000,
      mode: "SUGGESTED",
    });
    expect(conflicted).toBeNull();
    expect(selectUniqueHighConfidenceCandidate(conflicted ? [conflicted] : [])).toBeNull();
  });

  it("uses the shared atomic link validation and never writes an everyday transaction", async () => {
    const [autoSource, commitSource] = await Promise.all([
      readFile(autoSourcePath, "utf8"),
      readFile(commitSourcePath, "utf8"),
    ]);

    expect(autoSource).toContain("linkLoanRepaymentWithinTransaction");
    expect(autoSource).toContain('selectionMode: "SUGGESTED"');
    expect(autoSource).toContain('"AUTO_HIGH_CONFIDENCE"');
    expect(autoSource).toContain('status: "ACTIVE"');
    expect(autoSource).toContain("deletedAt: null");
    expect(autoSource).toContain('splitRole: { not: "PARENT" }');
    expect(autoSource).toContain("linked.userId !== userId");
    expect(autoSource).not.toMatch(/transaction\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/);
    expect(commitSource.indexOf("loanRepayment.createMany")).toBeLessThan(commitSource.lastIndexOf("autoReconcileHighConfidenceRepayments"));
    expect(commitSource).toContain("autoReconcileHighConfidenceRepayments(prisma, userId, committed.repaymentIds)");
  });

  it("rechecks existing unlinked repayments after a later everyday import without failing the import", async () => {
    const [autoSource, importSource] = await Promise.all([
      readFile(autoSourcePath, "utf8"),
      readFile(everydayImportCommitSourcePath, "utf8"),
    ]);

    expect(autoSource).toContain("autoReconcileHighConfidenceRepaymentsForTransactions");
    expect(autoSource).toContain('type: "EXPENSE"');
    expect(autoSource).toContain('status: "ACTIVE"');
    expect(autoSource).toContain('splitRole: { not: "PARENT" }');
    expect(autoSource).toContain("repayment.reconciliationLink.unlinkedAt !== null");
    expect(importSource.indexOf("tx.transaction.createMany")).toBeLessThan(
      importSource.lastIndexOf("autoReconcileHighConfidenceRepaymentsForTransactions"),
    );
    expect(importSource).toContain("The import remains successful; changed or ambiguous candidates stay available for manual review.");
    expect(importSource).not.toMatch(/AUTO_HIGH_CONFIDENCE[\s\S]{0,300}(?:amountCents|description|merchantName|filename|accountNumber)/);
  });

  it("audits only safe automatic state, method, confidence and reason codes", () => {
    const audit = createLoanReconciliationLinkAuditEvent({
      userId: "user_1",
      linkId: "link_1",
      action: "CREATED",
      methodCode: "SUGGESTED",
      confidenceCode: "HIGH",
      reasonCode: "EXACT_AMOUNT_NEAR_DATE",
      triggerCode: "AUTO_HIGH_CONFIDENCE",
    });
    expect(audit.metadata).toEqual({
      methodCode: "SUGGESTED",
      confidenceCode: "HIGH",
      reasonCode: "EXACT_AMOUNT_NEAR_DATE",
      triggerCode: "AUTO_HIGH_CONFIDENCE",
    });
    expect(Object.keys(audit.metadata)).not.toEqual(expect.arrayContaining([
      "amountCents",
      "balanceAfterCents",
      "merchantName",
      "rawNarration",
      "filename",
      "accountNumber",
      "reference",
      "transactionDate",
    ]));
  });

  it("keeps an automatic link reversible through the existing unlink path", async () => {
    const [autoSource, linksSource] = await Promise.all([
      readFile(autoSourcePath, "utf8"),
      readFile(linksSourcePath, "utf8"),
    ]);
    expect(autoSource).toContain("linkLoanRepaymentWithinTransaction");
    expect(linksSource).toContain("export async function unlinkLoanRepayment");
    expect(linksSource).toContain("data: { unlinkedAt: now }");
    expect(linksSource).toContain('data: { reconciliationStatus: "UNMATCHED" }');
  });
});
