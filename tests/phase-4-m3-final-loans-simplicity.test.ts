import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const loansPath = new URL("../components/loans-manager.tsx", import.meta.url);
const propertyActivityPath = new URL("../components/property-record-keeping-activity.tsx", import.meta.url);
const navPath = new URL("../components/bottom-nav.tsx", import.meta.url);
const reportPath = new URL("../components/property-record-review.tsx", import.meta.url);

describe("Phase 4 Milestone 3 final Loans simplicity", () => {
  it("uses one selected-loan subview and keeps the Loans navigation unchanged", async () => {
    const [loans, nav] = await Promise.all([readFile(loansPath, "utf8"), readFile(navPath, "utf8")]);

    expect(loans).toContain("setSelectedLoanId(loan.id)");
    expect(loans).toContain("setSelectedLoanId(null)");
    expect(loans).toContain("Back to loans");
    expect(loans).not.toContain("Close details");
    expect(nav).toContain('{ href: "/loans", label: "Loans"');
    expect(nav).not.toContain("/loans/[loanId]");
  });

  it("keeps healthy repayment rows quiet and opens only one detail at a time", async () => {
    const loans = await readFile(loansPath, "utf8");

    expect(loans).toContain("openRepaymentId === repayment.id");
    expect(loans).toContain("setOpenRepaymentId(isOpen ? null : repayment.id)");
    expect(loans).toContain('repayment.reconciliationStatus === "NEEDS_REVIEW"');
    expect(loans).not.toContain('repayment.reconciliationStatus === "LINKED" ? "Matched"');
    expect(loans).not.toContain("This repayment is matched.");
  });

  it("keeps matching validation wired while removing technical explanation copy", async () => {
    const loans = await readFile(loansPath, "utf8");

    expect(loans).toContain('candidate.confidence !== "HIGH" || review.mode === "OVERRIDE"');
    expect(loans).toContain('onLoadCandidates(repayment, "SUGGESTED")');
    expect(loans).toContain('onLoadCandidates(repayment, "MANUAL")');
    expect(loans).toContain('onLoadCandidates(repayment, "OVERRIDE", overrideDates[repayment.id])');
    expect(loans).toContain("This transaction does not closely match the repayment. Are you sure you want to link it?");
    expect(loans).not.toContain("Strong match");
    expect(loans).not.toContain("Possible match");
    expect(loans).not.toContain("Choose manually");
    expect(loans).not.toContain("likely-match suggestion");
  });

  it("keeps the Property report separate from the Loan detail flow", async () => {
    const [activity, report] = await Promise.all([readFile(propertyActivityPath, "utf8"), readFile(reportPath, "utf8")]);

    expect(activity).toContain("setIsReportOpen(true)");
    expect(activity).toContain("setIsReportOpen(false)");
    expect(activity).toContain('aria-modal="true"');
    expect(report).toContain("Financial year");
    expect(activity).not.toContain("<details className=\"border-t border-border pt-4\">");
  });
});
