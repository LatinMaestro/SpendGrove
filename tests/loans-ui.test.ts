import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const managerPath = new URL("../components/loans-manager.tsx", import.meta.url);
const navPath = new URL("../components/bottom-nav.tsx", import.meta.url);

describe("Loans-first UI contract", () => {
  it("keeps Loans in primary navigation and lists the approved Loan choices", async () => {
    const [manager, nav] = await Promise.all([readFile(managerPath, "utf8"), readFile(navPath, "utf8")]);

    expect(nav).toContain('{ href: "/loans", label: "Loans"');
    for (const label of [
      "Owner-occupier home loan",
      "Investment property loan",
      "Car loan",
      "Personal loan",
      "Other loan",
    ]) {
      expect(manager).toContain(label);
    }
  });

  it("keeps Property context optional and privacy-safe", async () => {
    const manager = await readFile(managerPath, "utf8");

    expect(manager).toContain("Optional property link");
    expect(manager).toContain("No property");
    expect(manager).toContain("Property details are optional");
    expect(manager).toContain("No exact address is requested");
    expect(manager).not.toContain("Account number");
    expect(manager).not.toContain("Customer ID");
  });

  it("shows one focused Loan instead of expanding it under the overview", async () => {
    const manager = await readFile(managerPath, "utf8");

    expect(manager).toContain("selectedLoanId");
    expect(manager).toContain("selectedLoan ? (");
    expect(manager).toContain("Back to loans");
    expect(manager).toContain("View loan");
    expect(manager).not.toContain("Close details");
    expect(manager).not.toContain("Up to date");
  });

  it("keeps repayment details and recovery available without presenting extra spending", async () => {
    const manager = await readFile(managerPath, "utf8");

    expect(manager).toContain(">Loan repayments</h3>");
    expect(manager).toContain("openRepaymentId === repayment.id");
    expect(manager).toContain("Principal");
    expect(manager).toContain("Interest");
    expect(manager).toContain("Fees");
    expect(manager).toContain("Balance after");
    expect(manager).toContain("Delete repayment");
    expect(manager).toContain("Restore repayment");
    expect(manager).toContain("Deleted repayments");
    expect(manager).not.toContain("Deleted repayments and cleanup");
    expect(manager).not.toContain("Linked everyday transactions");
    expect(manager).not.toContain("This repayment is matched.");
    expect(manager).not.toContain("rawNarration");
  });

  it("uses plain matching language while preserving all existing link actions", async () => {
    const manager = await readFile(managerPath, "utf8");

    expect(manager).toContain("SpendGrove could not find a clear matching transaction.");
    expect(manager).toContain("Match transaction");
    expect(manager).toContain("Search for another transaction");
    expect(manager).toContain("Search by date");
    expect(manager).toContain("No matching transaction was found.");
    expect(manager).toContain("This transaction does not closely match the repayment. Are you sure you want to link it?");
    expect(manager).toContain("Link transaction");
    expect(manager).toContain("Unlink repayment");
    expect(manager).not.toContain("Search wider manually");
    expect(manager).not.toContain("Find another eligible transaction by exact date");
    expect(manager).not.toContain("explicit manual override search");
    expect(manager).not.toContain("high-confidence match may be linked automatically");
  });

  it("keeps editing secondary and a compact area only for other Properties", async () => {
    const manager = await readFile(managerPath, "utf8");

    expect(manager).toContain("Edit loan");
    expect(manager).toContain("Edit ${selectedLoan.property.nickname} Property");
    expect(manager).toContain("Other property records");
    expect(manager).toContain("Properties without an active loan");
    expect(manager).not.toContain("Optional supporting records");
    expect(manager).toContain('propertyRelevant: false');
    expect(manager).not.toMatch(/property profit|property yield|dashboard statistics|tax report/i);
  });

  it("preserves correction, unlink and bounded recoverable deletion safeguards", async () => {
    const manager = await readFile(managerPath, "utf8");

    expect(manager).toContain('Modal title="Edit repayment"');
    expect(manager).toContain("Save correction");
    expect(manager).toContain("Unlink repayment");
    expect(manager).toContain("Restore this repayment before editing it.");
    expect(manager).toContain("maximum 100");
    expect(manager).toContain("Delete selected");
    expect(manager).toContain("Restore selected");
    expect(manager).toContain("Everyday transactions are never changed or deleted.");
    expect(manager).toContain("expectedUpdatedAt");
    expect(manager).toContain("/api/account/loan-repayments/archive");
    expect(manager).not.toContain("oldAmount");
    expect(manager).not.toContain("newAmount");
  });
});
