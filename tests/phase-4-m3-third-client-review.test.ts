import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { propertyTransactionsForLoanView } from "@/lib/loan-display";

const loansPath = new URL("../components/loans-manager.tsx", import.meta.url);
const propertyActivityPath = new URL("../components/property-record-keeping-activity.tsx", import.meta.url);
const schemaPath = new URL("../prisma/schema.prisma", import.meta.url);
const migrationLockPath = new URL("../prisma/migrations/migration_lock.toml", import.meta.url);

describe("Phase 4 Milestone 3 canonical Loans presentation", () => {
  it("shows one concise overview and one expanded Loan at a time", async () => {
    const source = await readFile(loansPath, "utf8");

    expect(source).toContain("expandedLoanId === loan.id");
    expect(source).toContain("setExpandedLoanId(expanded ? null : loan.id)");
    expect(source).toContain("Latest repayment");
    expect(source).toContain("Up to date");
    expect(source).toContain("need matching");
    expect(source).toContain("No repayments imported yet");
    expect(source).not.toContain("<dt className=\"text-brand-deepTeal/60\">Repayment breakdowns</dt>");
    expect(source).not.toContain("<dt className=\"text-brand-deepTeal/60\">Linked transactions</dt>");
  });

  it("renders one canonical repayment row and keeps essential actions in details", async () => {
    const source = await readFile(loansPath, "utf8");

    expect(source).toContain("Loan repayments (");
    expect(source).toContain("visibleRepayments.slice(0, 3)");
    expect(source).toContain("View all repayments (");
    expect(source).toContain("This repayment is matched.");
    expect(source).toContain("Unlink repayment");
    expect(source).toContain("Edit repayment");
    expect(source).toContain("Delete repayment");
    expect(source).toContain("Restore repayment");
    expect(source).toContain("Match this repayment");
    expect(source).not.toContain("Linked everyday transactions");
    expect(source).not.toContain("View all linked transactions");
  });

  it("shows only other Property transactions and keeps the report secondary", async () => {
    const source = await readFile(propertyActivityPath, "utf8");

    expect(source).toContain('variant?: "full" | "loan-detail"');
    expect(source).toContain("propertyTransactionsForLoanView(activity.transactions, activity.loanTransactions)");
    expect(source).toContain("Property transactions");
    expect(source).toContain("propertyTransactions.slice(0, 3)");
    expect(source).toContain("View all property transactions (");
    expect(source).toContain("View property records");
    expect(source).toContain("<PropertyRecordReview propertyId={propertyId} />");
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

  it("keeps non-Property loans free of Property sections and privacy details secondary", async () => {
    const source = await readFile(loansPath, "utf8");

    expect(source).toContain("{loan.property && (");
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
