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
    expect(manager).toContain("Properties support relevant loans");
    expect(manager).toContain("No exact address is requested");
    expect(manager).not.toContain("Account number");
    expect(manager).not.toContain("Customer ID");
  });

  it("shows repayment breakdown history without presenting extra spending", async () => {
    const manager = await readFile(managerPath, "utf8");

    expect(manager).toContain("Repayment history");
    expect(manager).toContain("Breakdowns only — these are not extra payments or spending entries.");
    expect(manager).toContain("Principal");
    expect(manager).toContain("Interest");
    expect(manager).toContain("Fees");
    expect(manager).toContain("Balance after");
    expect(manager).toContain("Archive breakdown");
    expect(manager).toContain("Restore breakdown");
    expect(manager).not.toContain("rawNarration");
  });
});
