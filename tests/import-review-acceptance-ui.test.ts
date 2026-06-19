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
    expect(importFoundation.indexOf("<SavedImportProfilesPanel")).toBeGreaterThan(importFoundation.indexOf("column-mapping-heading"));
    expect(importFoundation).not.toContain("key={JSON.stringify(scan.mapping)}");
  });

  it("renders bounded review pages and labels the real readiness count", async () => {
    const reviewFoundation = await source("components/import-review-foundation.tsx");
    expect(reviewFoundation).toContain("getImportReviewPage");
    expect(reviewFoundation).toContain("up to 25 transactions at a time");
    expect(reviewFoundation).toContain("Needs review");
    expect(reviewFoundation).not.toContain("one continuous list");
  });

  it("auto-learns category and merchant-name edits without More options", async () => {
    const reviewFoundation = await source("components/import-review-foundation.tsx");
    const rowCard = await source("components/import-review-row-card.tsx");
    expect(reviewFoundation).toContain("learnMerchantCategory");
    expect(reviewFoundation).toContain("learnEditedMerchantName");
    expect(reviewFoundation).toContain("Saved for next time:");
    expect(rowCard.indexOf("Edit merchant name")).toBeLessThan(rowCard.indexOf("More options"));
    expect(rowCard).toContain("Saved automatically when you finish editing");
  });

  it("uses SpendGrove UI instead of browser confirmation for Merge selection", async () => {
    const reviewFoundation = await source("components/import-review-foundation.tsx");
    const rowCard = await source("components/import-review-row-card.tsx");
    expect(reviewFoundation).not.toContain("Mark this row as Merge?");
    expect(reviewFoundation).not.toContain("Choose this existing manual transaction as the merge target?");
    expect(rowCard).toContain("Merge selected");
    expect(rowCard).toContain("Rows from this CSV cannot be merge targets");
  });

  it("provides a mobile-safe category picker above fixed navigation", async () => {
    const picker = await source("components/review-category-picker.tsx");
    expect(picker).toContain('role="dialog"');
    expect(picker).toContain("z-[70]");
    expect(picker).toContain("safe-area-inset-bottom");
    expect(picker).toContain("overscroll-contain");
  });

  it("shows account-save status near the review summary", async () => {
    const reviewFoundation = await source("components/import-review-foundation.tsx");
    expect(reviewFoundation).toContain("Sign in before final account save");
    expect(reviewFoundation).toContain("Ready for account save once review is complete");
    expect(reviewFoundation.indexOf("Sign in before final account save")).toBeLessThan(reviewFoundation.indexOf("Transactions to review"));
  });
});
