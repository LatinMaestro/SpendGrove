import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("Phase 3A import review acceptance UI", () => {
  it("never reloads the page to synchronise merchant choices", async () => {
    const merchantManager = await source("components/merchant-rule-manager.tsx");
    expect(merchantManager).not.toContain("window.location.reload");
    expect(merchantManager).toContain("Your active import review was kept open");
  });

  it("places saved mapping controls after the column matching section", async () => {
    const importFoundation = await source("components/csv-import-foundation.tsx");
    expect(importFoundation.indexOf("column-mapping-heading")).toBeGreaterThan(-1);
    expect(importFoundation.indexOf("<SavedImportProfilesPanel")).toBeGreaterThan(
      importFoundation.indexOf("column-mapping-heading"),
    );
    expect(importFoundation).not.toContain("key={JSON.stringify(scan.mapping)}");
  });

  it("renders bounded review pages and labels the real readiness count", async () => {
    const reviewFoundation = await source("components/import-review-foundation.tsx");
    expect(reviewFoundation).toContain("getImportReviewPage");
    expect(reviewFoundation).toContain("up to 25 transactions at a time");
    expect(reviewFoundation).toContain("Needs review");
    expect(reviewFoundation).not.toContain("one continuous list");
  });
});
