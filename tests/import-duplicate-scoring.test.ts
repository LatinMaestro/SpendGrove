import { describe, expect, it } from "vitest";
import { manualCategories } from "@/lib/manual-categories";
import { loadManualTransactionsFromStorage } from "@/lib/manual-transaction-storage";
import { createManualTransaction, type ManualTransaction } from "@/lib/manual-transactions";
import {
  createMergeTargetReviewSelection,
  findImportDuplicateCandidates,
} from "@/lib/import-duplicate-scoring";
import type { ImportReviewRow } from "@/lib/import-review";

const groceries = manualCategories.find((category) => category.name === "Groceries")!;
const dining = manualCategories.find((category) => category.name === "Dining out")!;

function reviewRow(overrides: Partial<ImportReviewRow> = {}): ImportReviewRow {
  return {
    id: "row-1",
    rowNumber: 1,
    date: "2026-06-10",
    amountCents: -1299,
    description: "Woolworths Metro synthetic suburb",
    merchantName: "Woolworths",
    categoryId: groceries.id,
    action: "IMPORT",
    warningCodes: [],
    suggestionSource: "KEYWORD",
    suggestionConfidence: "HIGH",
    suggestionReason: "Synthetic local suggestion.",
    categoryConfirmed: false,
    merchantEdited: false,
    reviewState: "UNREVIEWED",
    ...overrides,
  };
}

function manualTransaction(overrides: Partial<ManualTransaction> = {}) {
  return createManualTransaction([], {
    type: "EXPENSE",
    amountInput: "12.99",
    date: "2026-06-10",
    description: "Woolworths Metro synthetic suburb",
    categoryId: groceries.id,
    notes: "",
    csvMatchHint: true,
  }, {
    id: "manual-1",
    now: new Date("2026-06-10T00:00:00.000Z"),
  }).map((transaction) => ({ ...transaction, ...overrides }))[0];
}

describe("import duplicate scoring", () => {
  it("shows existing browser-local manual transactions as likely merge targets", () => {
    const candidates = findImportDuplicateCandidates(
      reviewRow(),
      [reviewRow()],
      [manualTransaction()],
    );

    expect(candidates[0]).toMatchObject({
      source: "MANUAL_TRANSACTION",
      candidateId: "manual-1",
      confidence: "LIKELY",
      canMergeTarget: true,
      score: 100,
    });
    expect(candidates[0].reasons).toEqual(expect.arrayContaining(["Same amount", "Same day", "Similar merchant"]));
  });

  it("creates review-only merge target selections for manual candidates", () => {
    const row = reviewRow();
    const manual = manualTransaction();
    const [manualCandidate] = findImportDuplicateCandidates(row, [row], [manual]);
    const selection = createMergeTargetReviewSelection(row, manualCandidate, new Date("2026-06-16T00:00:00.000Z"));

    expect(selection).toEqual({
      rowId: "row-1",
      targetTransactionId: "manual-1",
      selectedAt: "2026-06-16T00:00:00.000Z",
      status: "REVIEW_ONLY",
    });
    expect(row.action).toBe("IMPORT");
    expect(manual.description).toBe("Woolworths Metro synthetic suburb");
  });

  it("downgrades four-to-seven-day matches to possible match at most", () => {
    const candidates = findImportDuplicateCandidates(
      reviewRow(),
      [reviewRow()],
      [manualTransaction({ date: "2026-06-15" })],
    );

    expect(candidates[0]).toMatchObject({
      source: "MANUAL_TRANSACTION",
      confidence: "POSSIBLE",
      canMergeTarget: true,
    });
    expect(candidates[0].score).toBeLessThan(85);
  });

  it("does not warn for monthly recurring-style spacing", () => {
    const candidates = findImportDuplicateCandidates(
      reviewRow(),
      [reviewRow()],
      [manualTransaction({ date: "2026-07-10" })],
    );

    expect(candidates).toEqual([]);
  });

  it("does not warn for same merchant and amount twenty-five to thirty-five days apart", () => {
    const source = reviewRow({ date: "2026-06-10", merchantName: "ChatGPT", description: "ChatGPT subscription" });
    const twentyFiveDays = manualTransaction({ date: "2026-07-05", description: "ChatGPT subscription" });
    const thirtyFiveDays = manualTransaction({ id: "manual-2", date: "2026-07-15", description: "ChatGPT subscription" });

    expect(findImportDuplicateCandidates(source, [source], [twentyFiveDays, thirtyFiveDays])).toEqual([]);
  });

  it("shows same-import matches as duplicate warnings, not merge targets", () => {
    const source = reviewRow();
    const duplicateInImport = reviewRow({
      id: "row-2",
      rowNumber: 2,
      description: "Woolworths Metro duplicate synthetic suburb",
    });

    const candidates = findImportDuplicateCandidates(source, [source, duplicateInImport], []);

    expect(candidates[0]).toMatchObject({
      source: "SAME_IMPORT",
      candidateId: "row-2",
      rowNumber: 2,
      canMergeTarget: false,
      confidence: "LIKELY",
    });
    expect(() => createMergeTargetReviewSelection(source, candidates[0])).toThrow("Only existing manual transactions can be selected as merge targets.");
  });

  it("does not treat same-import monthly billing rows as duplicates", () => {
    const source = reviewRow({ date: "2026-06-10", merchantName: "ChatGPT", description: "ChatGPT subscription" });
    const nextMonth = reviewRow({
      id: "row-2",
      rowNumber: 2,
      date: "2026-07-10",
      merchantName: "ChatGPT",
      description: "ChatGPT subscription",
    });

    expect(findImportDuplicateCandidates(source, [source, nextMonth], [])).toEqual([]);
  });

  it("excludes skipped rows, invalid rows, deleted transactions and split parents", () => {
    const source = reviewRow();
    const skippedImportRow = reviewRow({ id: "row-2", rowNumber: 2, action: "SKIP" });
    const deletedManual = manualTransaction({ deletedAt: "2026-06-11T00:00:00.000Z" });
    const splitParentManual = { ...manualTransaction({ id: "manual-split" }), splitRole: "PARENT" } as ManualTransaction;

    expect(findImportDuplicateCandidates(source, [source, skippedImportRow], [deletedManual, splitParentManual])).toEqual([]);
    expect(findImportDuplicateCandidates(reviewRow({ date: null }), [source], [manualTransaction()])).toEqual([]);
    expect(findImportDuplicateCandidates(reviewRow({ amountCents: null }), [source], [manualTransaction()])).toEqual([]);
    expect(findImportDuplicateCandidates(reviewRow({ action: "SKIP" }), [source], [manualTransaction()])).toEqual([]);
  });

  it("avoids prominent warnings when merchant and description are weak", () => {
    const candidates = findImportDuplicateCandidates(
      reviewRow({ merchantName: "Woolworths", description: "Woolworths Metro" }),
      [reviewRow()],
      [manualTransaction({ description: "Synthetic restaurant", categoryId: dining.id })],
    );

    expect(candidates).toEqual([]);
  });

  it("does not flag same amount and date with a different merchant as a likely false positive", () => {
    const candidates = findImportDuplicateCandidates(
      reviewRow({ merchantName: "Woolworths", description: "Woolworths Metro" }),
      [reviewRow()],
      [manualTransaction({ description: "Synthetic fuel station", categoryId: dining.id })],
    );

    expect(candidates).toEqual([]);
  });

  it("requires compatible money direction before suggesting a match", () => {
    const candidates = findImportDuplicateCandidates(
      reviewRow({ amountCents: -1299 }),
      [reviewRow()],
      [manualTransaction({ amountCents: 1299 })],
    );

    expect(candidates).toEqual([]);
  });

  it("keeps candidate output safe when source descriptions contain private-looking references", () => {
    const unsafeManual = {
      ...manualTransaction(),
      description: "Woolworths account 12345678 reference 9988776655 synthetic suburb",
    } as ManualTransaction;

    const [candidate] = findImportDuplicateCandidates(reviewRow(), [reviewRow()], [unsafeManual]);
    const candidateText = JSON.stringify(candidate);

    expect(candidate).toBeDefined();
    expect(candidateText).not.toContain("12345678");
    expect(candidateText).not.toContain("9988776655");
    expect(candidate.merchantName).toBe("Woolworths");
  });

  it("recovers safely when browser-local manual transaction storage is corrupted", () => {
    const result = loadManualTransactionsFromStorage({
      getItem: () => "not-json",
      setItem: () => undefined,
    });

    expect(result).toEqual({
      transactions: [],
      recoveredFromCorruption: true,
      storageAvailable: true,
    });
  });
});
