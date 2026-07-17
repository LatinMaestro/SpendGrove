import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const settingsPanel = readFileSync("components/settings-panel.tsx", "utf8");

describe("Phase 6 records and reports consolidation", () => {
  it("keeps existing transaction and Property record workflows reachable from Settings", () => {
    expect(settingsPanel).toContain('title="Records and reports"');
    expect(settingsPanel).toContain('href="/transactions"');
    expect(settingsPanel).toContain("Transactions and monthly spending");
    expect(settingsPanel).toContain('href="/loans"');
    expect(settingsPanel).toContain("Property records and exports");
  });

  it("does not add a report route, navigation destination or new calculation", () => {
    expect(settingsPanel).not.toContain('href="/reports"');
    expect(settingsPanel).not.toContain('href="/insights"');
    expect(settingsPanel).not.toContain("calculate");
    expect(settingsPanel).toContain("<AccountDataExport />");
    expect(settingsPanel).toContain('href="/privacy"');
    expect(settingsPanel).toContain('href="/help"');
  });
});
