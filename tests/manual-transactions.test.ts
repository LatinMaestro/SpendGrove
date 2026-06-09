import { describe, expect, it } from "vitest";
import { formatAudFromCents } from "@/lib/money";
import { manualCategories } from "@/lib/manual-categories";
import {
  createManualTransaction,
  duplicateManualTransactionToDraft,
  findManualTransactionDuplicates,
  formatAustralianTransactionDate,
  listActiveManualTransactions,
  parseManualTransactionStorage,
  serializeManualTransactionStorage,
  softDeleteManualTransaction,
  updateManualTransaction,
  validateManualTransactionDraft,
  type ManualTransactionDraft,
} from "@/lib/manual-transactions";

const groceriesCategory = manualCategories.find((category) => category.name === "Groceries")!;
const salaryCategory = manualCategories.find((category) => category.name === "Salary / wages")!;

const expenseDraft: ManualTransactionDraft = {
  type: "EXPENSE",
  amountInput: "12.34",
  date: "2026-06-09",
  description: "Local grocer",
  categoryId: groceriesCategory.id,
  notes: "",
  csvMatchHint: false,
};

describe("manual transaction domain", () => {
  it("creates, lists and edits transactions using integer cents", () => {
    const created = createManualTransaction([], expenseDraft, {
      id: "txn_1",
      now: new Date("2026-06-09T00:00:00.000Z"),
    });

    expect(created[0].amountCents).toBe(-1234);
    expect(listActiveManualTransactions(created)).toHaveLength(1);

    const edited = updateManualTransaction(created, "txn_1", {
      ...expenseDraft,
      amountInput: "$18.50",
      description: "Neighbourhood grocer",
      csvMatchHint: true,
    }, new Date("2026-06-10T00:00:00.000Z"));

    expect(edited[0]).toMatchObject({
      amountCents: -1850,
      description: "Neighbourhood grocer",
      csvMatchHint: true,
    });
  });

  it("soft-deletes transactions so active lists exclude them", () => {
    const created = createManualTransaction([], expenseDraft, { id: "txn_1" });
    const deleted = softDeleteManualTransaction(created, "txn_1", new Date("2026-06-10T00:00:00.000Z"));

    expect(deleted[0].deletedAt).toBe("2026-06-10T00:00:00.000Z");
    expect(listActiveManualTransactions(deleted)).toEqual([]);
  });

  it("duplicates into an unsaved prefilled draft", () => {
    const created = createManualTransaction([], expenseDraft, { id: "txn_1" });
    const duplicateDraft = duplicateManualTransactionToDraft(created[0]);

    expect(duplicateDraft).toEqual(expenseDraft);
    expect(created).toHaveLength(1);
  });

  it("requires a seeded category matching the transaction type", () => {
    expect(() => validateManualTransactionDraft({
      ...expenseDraft,
      type: "INCOME",
    })).toThrow();

    const income = validateManualTransactionDraft({
      ...expenseDraft,
      type: "INCOME",
      categoryId: salaryCategory.id,
    });
    expect(income.amountCents).toBe(1234);
  });

  it("preserves the future CSV-match hint without importing data", () => {
    const created = createManualTransaction([], { ...expenseDraft, csvMatchHint: true }, { id: "txn_1" });
    expect(created[0].csvMatchHint).toBe(true);
  });

  it("warns about likely duplicates without blocking a save", () => {
    const created = createManualTransaction([], expenseDraft, { id: "txn_1" });
    const candidate = validateManualTransactionDraft(expenseDraft);

    expect(findManualTransactionDuplicates(created, candidate)).toHaveLength(1);
    expect(createManualTransaction(created, expenseDraft, { id: "txn_2" })).toHaveLength(2);
  });

  it("round-trips versioned browser-local storage and safely recovers from corruption", () => {
    const created = createManualTransaction([], expenseDraft, { id: "txn_1" });
    const restored = parseManualTransactionStorage(serializeManualTransactionStorage(created));

    expect(restored).toEqual({ transactions: created, recoveredFromCorruption: false });
    expect(parseManualTransactionStorage("not-json")).toEqual({
      transactions: [],
      recoveredFromCorruption: true,
    });
    expect(parseManualTransactionStorage(JSON.stringify({ version: 99, transactions: [] }))).toEqual({
      transactions: [],
      recoveredFromCorruption: true,
    });
  });

  it("formats Australian dates and AUD currency", () => {
    expect(formatAustralianTransactionDate("2026-06-09")).toBe("9 June 2026");
    expect(formatAudFromCents(123456)).toContain("1,234.56");
  });
});
