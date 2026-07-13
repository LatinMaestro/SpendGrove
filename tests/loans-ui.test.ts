import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const managerPath = new URL("../components/loans-manager.tsx", import.meta.url);
const navPath = new URL("../components/bottom-nav.tsx", import.meta.url);

describe("Loans-first UI contract", () => {
  it("makes Loans a primary navigation section and lists approved loan choices", async () => {
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

  it("keeps property context optional and privacy-safe", async () => {
    const manager = await readFile(managerPath, "utf8");

    expect(manager).toContain("Optional property link");
    expect(manager).toContain("No property");
    expect(manager).toContain("Property details are optional");
    expect(manager).toContain("No exact address is requested");
    expect(manager).not.toContain("Account number");
    expect(manager).not.toContain("Customer ID");
  });

  it("shows repayment breakdown history without presenting extra spending", async () => {
    const manager = await readFile(managerPath, "utf8");

    expect(manager).toContain("Repayment breakdowns ({repayments.length})");
    expect(manager).toContain("Details only — your everyday transaction is still counted once.");
    expect(manager).toContain("Principal");
    expect(manager).toContain("Interest");
    expect(manager).toContain("Fees");
    expect(manager).toContain("Balance after");
    expect(manager).toContain("Archive breakdown");
    expect(manager).toContain("Restore breakdown");
    expect(manager).not.toContain("rawNarration");
  });

  it("auto-links only clear high-confidence matches and keeps wider cases in manual review", async () => {
    const manager = await readFile(managerPath, "utf8");

    expect(manager).toContain("Find possible matches");
    expect(manager).toContain("Search wider manually");
    expect(manager).toContain("More possible matches");
    expect(manager).toContain("nearby everyday transactions");
    expect(manager).toContain("Transactions on this date");
    expect(manager).toContain("search one exact date below");
    expect(manager).toContain("One clear high-confidence match may be linked automatically when a repayment is saved.");
    expect(manager).toContain("Ambiguous, medium and manual matches stay here for your review.");
    expect(manager).toContain("Strong match");
    expect(manager).toContain("Possible match");
    expect(manager).toContain("Choose manually");
    expect(manager).toContain("Link this breakdown");
    expect(manager).toContain("Unlink breakdown");
    expect(manager).toContain("Search this exact date");
    expect(manager).toContain("explicit manual override search, not a likely-match suggestion");
    expect(manager).toContain("Manual links and automatic high-confidence links are reversible.");
    expect(manager).toContain("only cashflow and spending record");
    expect(manager).not.toContain("Nothing is linked automatically");
  });

  it("keeps editing on active Loan Account cards and uses a compact area only for other Properties", async () => {
    const manager = await readFile(managerPath, "utf8");

    expect(manager).toContain("View loan");
    expect(manager).toContain("Edit loan");
    expect(manager).toContain("Edit ${loan.property.nickname} Property");
    expect(manager).toContain("Other property records");
    expect(manager).toContain("Properties without an active loan");
    expect(manager).toContain("not linked to an active loan");
    expect(manager).not.toContain("Optional supporting records");
    expect(manager).toContain('propertyRelevant: false');
    expect(manager).not.toMatch(/property profit|property yield|dashboard statistics|tax report/i);
  });

  it("offers structured repayment correction with unlink and restore safeguards", async () => {
    const manager = await readFile(managerPath, "utf8");

    expect(manager).toContain("Edit repayment breakdown");
    expect(manager).toContain("Edit breakdown");
    expect(manager).toContain("Save correction");
    expect(manager).toContain("Unlink this breakdown before editing its date or amounts.");
    expect(manager).toContain("Restore this breakdown before editing it.");
    expect(manager).toContain("expectedUpdatedAt");
    expect(manager).toContain('method: "PUT"');
    expect(manager).not.toContain("oldAmount");
    expect(manager).not.toContain("newAmount");
  });

  it("filters active and archived repayments and offers bounded confirmed cleanup", async () => {
    const manager = await readFile(managerPath, "utf8");

    expect(manager).toContain("Repayment history filter");
    expect(manager).toContain("Finish selecting");
    expect(manager).toContain('historyFilter === "ACTIVE" ? "archive" : "restore"');
    expect(manager).toContain("maximum 100");
    expect(manager).toContain("Archive selected");
    expect(manager).toContain("Restore selected");
    expect(manager).toContain("Linked — unlink before archiving");
    expect(manager).toContain("Everyday transactions are never changed or deleted.");
    expect(manager).toContain("expectedUpdatedAt");
    expect(manager).toContain("/api/account/loan-repayments/archive");
  });
});
