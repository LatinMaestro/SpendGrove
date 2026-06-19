import { describe, expect, it } from "vitest";
import type { ImportReviewRow } from "@/lib/import-review";
import { hasPossibleOppositeTransferPair, isAmbiguousTransferText } from "@/lib/import-review-merchant-identity";

function row(id: string, amountCents: number, merchantName: string, date = "2026-06-19"): ImportReviewRow {
  return { id, rowNumber: Number(id), date, amountCents, description: merchantName, merchantName, categoryId: "review-needs-review-expense", action: "IMPORT", warningCodes: [], suggestionSource: "FALLBACK", suggestionConfidence: "LOW", suggestionReason: "Review", categoryConfirmed: false, merchantEdited: false, reviewState: "UNREVIEWED" };
}

describe("ambiguous transfer assistance", () => {
  it("flags transfer-like wording but not clear own-account movements", () => {
    expect(isAmbiguousTransferText("Bank transfer to CBA")).toBe(true);
    expect(isAmbiguousTransferText("Internal transfer to savings")).toBe(false);
  });

  it("suggests a nearby opposite-amount pair without auto-classifying", () => {
    const outgoing = row("1", -25000, "Bank transfer to CBA");
    const incoming = row("2", 25000, "Transfer from CBA", "2026-06-20");
    expect(hasPossibleOppositeTransferPair(outgoing, [outgoing, incoming])).toBe(true);
    expect(outgoing.categoryConfirmed).toBe(false);
  });
});
