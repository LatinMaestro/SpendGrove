import { describe, expect, it, vi } from "vitest";
import {
  BROWSER_LOCAL_PROTOTYPE_STORAGE_KEYS,
  hasBrowserLocalPrototypeData,
} from "@/lib/browser-local-data";

describe("browser-local prototype preservation", () => {
  it("detects known prototype keys without writing, deleting or parsing their values", () => {
    const getItem = vi.fn((key: string) => (
      key === "spendgrove.phase1.transactions.v1" ? "opaque-private-value" : null
    ));

    expect(hasBrowserLocalPrototypeData({ getItem })).toBe(true);
    expect(getItem).toHaveBeenCalled();
  });

  it("does not report data when none of the known keys exist", () => {
    expect(hasBrowserLocalPrototypeData({ getItem: () => null })).toBe(false);
  });

  it("keeps the audited key inventory explicit", () => {
    expect(BROWSER_LOCAL_PROTOTYPE_STORAGE_KEYS).toEqual([
      "spendgrove.phase1.settings",
      "spendgrove.phase1.transactions.v1",
      "spendgrove.phase1.import-history.v1",
      "spendgrove.phase1.merchant-rules.v1",
      "spendgrove.phase2.custom-categories.v2",
      "spendgrove.phase2.import-profiles.v1",
      "spendgrove.phase2.merchant-rules.v2",
    ]);
  });
});
