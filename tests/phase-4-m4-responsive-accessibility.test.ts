import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const shell = readFileSync("components/app-shell.tsx", "utf8");
const navigation = readFileSync("components/bottom-nav.tsx", "utf8");
const primitives = readFileSync("components/ui/app-primitives.tsx", "utf8");
const home = readFileSync("app/page.tsx", "utf8");
const transactions = readFileSync("app/transactions/page.tsx", "utf8");
const importFlow = readFileSync("components/csv-import-foundation.tsx", "utf8");
const loans = readFileSync("components/loans-manager.tsx", "utf8");
const settings = readFileSync("app/settings/page.tsx", "utf8");

describe("Phase 4 Milestone 4 responsive and accessibility safeguards", () => {
  it("keeps exactly five understandable primary destinations", () => {
    for (const label of ["Home", "Transactions", "Loans", "Import", "Settings"]) {
      expect(navigation).toContain(`label: "${label}"`);
    }
    expect(navigation.match(/label: "/g)).toHaveLength(5);
    expect(navigation).toContain('aria-label="Primary"');
    expect(navigation).toContain('aria-current={active ? "page" : undefined}');
  });

  it("preserves mobile and desktop shell safeguards", () => {
    expect(shell).toContain("lg:grid-cols-[15.5rem_minmax(0,1fr)]");
    expect(shell).toContain("min-w-0");
    expect(shell).toContain("overflow-x-hidden");
    expect(shell).toContain("safe-area-inset-bottom");
    expect(shell).toContain("Skip to content");
    expect(navigation).toContain("min-h-14");
    expect(navigation).toContain("grid-cols-5");
  });

  it("keeps one semantic page heading on each primary public surface", () => {
    expect(home).toContain('title="Home"');
    expect(transactions).toContain('title="Transactions"');
    expect(importFlow).toContain('headingLevel={1}');
    expect(loans).toContain("<h1");
    expect(settings).toContain('title="Settings"');
    expect(primitives).toContain("<h1");
  });

  it("keeps visible focus and labelled icon controls", () => {
    const changedSurface = [shell, navigation, primitives, importFlow, loans, settings].join("\n");
    expect(changedSurface).toContain("focus-visible:ring");
    expect(changedSurface).toContain("focus:ring-2");
    expect(loans).toContain('aria-label="Close"');
    expect(loans).toContain('aria-expanded={isOpen}');
    expect(importFlow).toContain('aria-label="Import progress"');
  });

  it("keeps beginner surfaces free from prohibited feature language", () => {
    const beginnerSurface = [home, transactions, importFlow, loans, settings].join("\n");
    expect(beginnerSurface).not.toMatch(/net worth|property profit|property yield|equity valuation|ATO-ready|accountant approved|AI advice|live bank/i);
  });
});
