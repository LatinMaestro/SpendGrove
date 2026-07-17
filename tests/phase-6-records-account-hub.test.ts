import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const settingsPanel = readFileSync("components/settings-panel.tsx", "utf8");
const reportCentre = readFileSync("app/reports/page.tsx", "utf8");

describe("records and reports consolidation", () => {
  it("keeps existing transaction and Property record workflows reachable from the Report Centre", () => {
    expect(settingsPanel).toContain('title="Records and reports"');
    expect(settingsPanel).toContain('href="/reports"');
    expect(settingsPanel).toContain("Report Centre");
    expect(reportCentre).toContain('href: "/transactions"');
    expect(reportCentre).toContain("Monthly income and spending");
    expect(reportCentre).toContain('href: "/reports/loans"');
    expect(reportCentre).toContain('href: "/reports/properties"');
    expect(reportCentre).toContain("Property records");
  });

  it("keeps account export, privacy and help reachable without adding calculations to Settings", () => {
    expect(settingsPanel).not.toContain("calculate");
    expect(settingsPanel).toContain("<AccountDataExport />");
    expect(settingsPanel).toContain('href="/privacy"');
    expect(settingsPanel).toContain('href="/help"');
  });
});
