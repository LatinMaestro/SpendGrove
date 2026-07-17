import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  getLoanCsvStructuralMode,
  loanCsvStructuralModes,
  namedLoanCsvProfiles,
} from "@/lib/loan-csv-format-registry";

const helpPath = new URL("../app/help/page.tsx", import.meta.url);

describe("Phase 7 loan CSV format registry", () => {
  it("publishes exactly the two implemented structural modes", () => {
    expect(loanCsvStructuralModes.map((mode) => mode.id)).toEqual([
      "COMPONENT_COLUMNS",
      "ROW_EVENT_LEDGER",
    ]);
    expect(loanCsvStructuralModes.every((mode) => mode.supportStatus === "CONFIRMED_STRUCTURAL_MODE")).toBe(true);
  });

  it("records the exact reviewed column requirements", () => {
    expect(getLoanCsvStructuralMode("COMPONENT_COLUMNS")).toMatchObject({
      requiredColumns: {
        allOf: ["DATE"],
        atLeastOneOf: ["TOTAL_PAYMENT", "PRINCIPAL", "INTEREST", "FEES"],
      },
      optionalColumns: ["BALANCE_AFTER"],
    });
    expect(getLoanCsvStructuralMode("ROW_EVENT_LEDGER")).toMatchObject({
      requiredColumns: {
        allOf: ["DATE", "SIGNED_AMOUNT", "EVENT_TYPE"],
        atLeastOneOf: [],
      },
      optionalColumns: ["BALANCE_AFTER"],
    });
  });

  it("does not claim named lender support without safe evidence", () => {
    expect(namedLoanCsvProfiles).toEqual([]);
  });

  it("keeps the registry limited to safe structural evidence", () => {
    const serialised = JSON.stringify(loanCsvStructuralModes);

    expect(serialised).not.toMatch(/account|bsb|customer|card|filename/i);
    expect(serialised).not.toMatch(/\d{6,}/);
    expect(loanCsvStructuralModes.every((mode) => mode.fixtureIds.length > 0)).toBe(true);
  });

  it("derives plain-English Help guidance from the registry", async () => {
    const help = await readFile(helpPath, "utf8");

    expect(help).toContain("loanCsvStructuralModes.map");
    expect(loanCsvStructuralModes.map((mode) => mode.displayName)).toEqual(["Repayment breakdown", "Loan ledger"]);
    expect(help).toContain("not claims of automatic support for a named lender");
    expect(help).toContain("Check every loan mapping before review");
  });
});
