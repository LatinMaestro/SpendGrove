import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const rowCard = readFileSync(new URL("../components/import-review-row-card.tsx", import.meta.url), "utf8");
const foundation = readFileSync(new URL("../components/import-review-foundation.tsx", import.meta.url), "utf8");
const importReview = readFileSync(new URL("../lib/import-review.ts", import.meta.url), "utf8");

describe("Phase 3C Milestone 3 import-review Property link UI", () => {
  it("shows an optional neutral Property record control during import review", () => {
    expect(rowCard).toContain("Include in property records");
    expect(rowCard).toContain("Link to property");
    expect(rowCard).toContain("No Property link");
    expect(rowCard).toContain("Record keeping only - not tax advice");
    expect(rowCard).toContain("onPropertyLinkChange(event.target.value || null)");
  });

  it("keeps Skip and Merge rows out of pre-commit Property linking", () => {
    expect(rowCard).toContain("Skipped rows do not create transactions or Property links.");
    expect(rowCard).toContain("Merge rows are linked after import by editing the existing transaction.");
    expect(importReview).toContain('propertyLinkPropertyId: validatedAction === "IMPORT" ? row.propertyLinkPropertyId ?? null : null');
  });

  it("loads only active safe Property options from existing account metadata", () => {
    expect(foundation).toContain('fetch("/api/account/loans", { cache: "no-store" })');
    expect(foundation).toContain("setPropertyOptions(properties.map((property) => ({");
    expect(foundation).toContain("nickname: property.nickname");
    expect(foundation).toContain("usage: property.usage");
    expect(foundation).not.toContain("address");
  });

  it("does not add forbidden report or tax wording to the import-review Property control", () => {
    const propertyBlock = rowCard.slice(rowCard.indexOf("Include in property records"), rowCard.indexOf("Apply to {matchingRowCount}"));

    expect(propertyBlock).not.toMatch(/deductible|claimable|taxable|ATO-ready|tax-ready|accountant approved|automatically classified for tax/i);
  });
});
