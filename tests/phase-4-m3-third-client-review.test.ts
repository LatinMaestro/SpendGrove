import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { propertyTransactionsForLoanView } from "@/lib/loan-display";

const loansPath = new URL("../components/loans-manager.tsx", import.meta.url);
const propertyActivityPath = new URL("../components/property-record-keeping-activity.tsx", import.meta.url);
const schemaPath = new URL("../prisma/schema.prisma", import.meta.url);
const migrationLockPath = new URL("../prisma/migrations/migration_lock.toml", import.meta.url);

describe("Phase 4 Milestone 3 canonical Loans presentation", () => {
  it("shows compact overview cards and replaces them with one focused Loan", async () => {
    const source = await readFile(loansPath, "utf8");

    expect(source).toContain("selectedLoanId");
    expect(source).toContain("selectedLoan ? (");
    expect(source).toContain("Back to loans");
    expect(source).toContain("Latest repayment");
    expect(source).toContain("Needs review");
    expect(source).toContain("No repayments imported yet");
    expect(source).not.toContain("Close details");
    expect(source).not.toContain("Up to date");
    expect(source).not.toContain("expandedLoanId");
  });

  it("renders repayments first, once, with controlled details and secondary actions", async () => {
    const source = await readFile(loansPath, "utf8");
    const repaymentPosition = source.indexOf("<RepaymentHistory");
    const propertyPosition = source.indexOf("<PropertyRecordKeepingActivity key");

    expect(repaymentPosition).toBeGreaterThan(-1);
    expect(propertyPosition).toBeGreaterThan(repaymentPosition);
    expect(source).toContain("openRepaymentId === repayment.id");
    expect(source).toContain("visibleRepayments.slice(0, 3)");
    expect(source).toContain("View all repayments (");
    expect(source).toContain("Unlink repayment");
    expect(source).toContain("Edit repayment");
    expect(source).toContain("Delete repayment");
    expect(source).toContain("Restore repayment");
    expect(source).not.toContain("This repayment is matched.");
    expect(source).not.toContain("Linked everyday transactions");
  });

  it("shows only other Property transactions and opens the report in a dialog", async () => {
    const source = await readFile(propertyActivityPath, "utf8");

    expect(source).toContain('variant?: "full" | "loan-detail"');
    expect(source).toContain("propertyTransactionsForLoanView(activity.transactions, activity.loanTransactions)");
    expect(source).toContain("Property transactions");
    expect(source).toContain("propertyTransactions.slice(0, 3)");
    expect(source).toContain("View all property transactions (");
    expect(source).toContain("View property report");
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-label="Close property report"');
    expect(source).toContain("<PropertyRecordReview propertyId={propertyId} />");
    expect(source).not.toContain("View property records");
  });

  it("excludes every repayment-derived cashflow while retaining other linked income and expenses", () => {
    const manual = [
      { id: "rates", date: "2026-07-01", amountCents: -12000, type: "EXPENSE" as const, merchantName: null, categoryName: "Rates" },
      { id: "repayment", date: "2026-07-02", amountCents: -200000, type: "EXPENSE" as const, merchantName: null, categoryName: "Loan" },
      { id: "rent", date: "2026-07-03", amountCents: 180000, type: "INCOME" as const, merchantName: null, categoryName: "Income" },
    ];

    expect(propertyTransactionsForLoanView(manual, [{ id: "repayment" }])).toEqual([manual[0], manual[2]]);
    expect(propertyTransactionsForLoanView(manual, [{ id: "repayment" }, { id: "repayment" }])).toEqual([manual[0], manual[2]]);
    expect(manual).toHaveLength(3);
  });

  it("leads Property rows with safe identity and keeps money direction secondary", async () => {
    const source = await readFile(propertyActivityPath, "utf8");

    expect(source).toContain('const title = transaction.categoryName ?? transaction.merchantName ?? "Everyday transaction"');
    expect(source).toContain('{dateLabel(transaction.date)} · {transaction.type === "INCOME" ? "Money in" : "Money out"}');
    expect(source).toContain('className="shrink-0"');
  });

  it("keeps non-Property loans free of Property sections and privacy details secondary", async () => {
    const source = await readFile(loansPath, "utf8");

    expect(source).toContain("{selectedLoan.property && (");
    expect(source).toContain('variant="loan-detail"');
    expect(source).toContain("How SpendGrove keeps loan information private");
    expect(source).toContain("More");
    expect(source).toContain("Delete loan");
  });

  it("does not alter schema or migration foundations", async () => {
    const [schema, migrationLock] = await Promise.all([
      readFile(schemaPath, "utf8"),
      readFile(migrationLockPath, "utf8"),
    ]);

    expect(schema).toContain("model LoanRepayment");
    expect(schema).toContain("model LoanReconciliationLink");
    expect(schema).toContain("model PropertyTransactionLink");
    expect(migrationLock).toContain('provider = "postgresql"');
  });
});
