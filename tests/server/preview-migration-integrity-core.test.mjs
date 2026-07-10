import { describe, expect, it } from "vitest";
import {
  exactNameSetMatches,
  migrationProfileFor,
  migrationProfiles,
  primaryAndForeignKeyNames,
} from "../../scripts/preview-migration-integrity-core.mjs";

describe("Preview migration constraint filtering", () => {
  it("keeps only primary and foreign keys and ignores unrelated constraints", () => {
    const names = primaryAndForeignKeyNames([
      { name: "unrelated_check", type: "c" },
      { name: "PropertyReportReview_userId_fkey", type: "f" },
      { name: "unrelated_unique_constraint", type: "u" },
      { name: "PropertyReportReview_pkey", type: "p" },
      { name: "PropertyReportReview_transactionId_fkey", type: "f" },
      { name: "PropertyReportReview_propertyId_fkey", type: "f" },
      { name: "unrelated_exclusion", type: "x" },
    ]);

    expect(names).toEqual([
      "PropertyReportReview_pkey",
      "PropertyReportReview_propertyId_fkey",
      "PropertyReportReview_transactionId_fkey",
      "PropertyReportReview_userId_fkey",
    ]);
  });
});

describe("Preview migration exact name-set matching", () => {
  const expectedIndexes = [
    "RecurringItem_pkey",
    "RecurringItem_userId_categoryId_idx",
    "RecurringItem_userId_cadence_idx",
    "RecurringItem_userId_status_idx",
  ];

  it("accepts the approved index set regardless of database return order", () => {
    expect(exactNameSetMatches([
      "RecurringItem_userId_status_idx",
      "RecurringItem_userId_cadence_idx",
      "RecurringItem_userId_categoryId_idx",
      "RecurringItem_pkey",
    ], expectedIndexes)).toBe(true);
  });

  it("still rejects missing or extra index names", () => {
    expect(exactNameSetMatches(expectedIndexes.slice(0, -1), expectedIndexes)).toBe(false);
    expect(exactNameSetMatches([...expectedIndexes, "unexpected_idx"], expectedIndexes)).toBe(false);
  });
});

describe("Preview migration profiles", () => {
  it("keeps the existing Phase 3C profile separate", () => {
    const profile = migrationProfileFor("20260703090000_phase_3c_property_reporting_review");

    expect(profile?.absentTables).toEqual(["PropertyReportReview"]);
    expect(Object.keys(profile?.tables ?? {})).toEqual(["PropertyReportReview"]);
    expect(profile?.enums.PropertyRecordClassification).toEqual([
      "PROPERTY_INCOME",
      "PROPERTY_OUTGOING",
      "REFUND_OR_REVERSAL",
      "LOAN_PAYMENT_CONTEXT",
      "TRANSFER_CONTEXT",
      "OTHER_PROPERTY_RECORD",
      "EXCLUDED",
    ]);
  });

  it("defines the exact Phase 4 recurring and budget migration profile", () => {
    const profile = migrationProfileFor("20260708090000_phase_4_recurring_budgets_foundation");

    expect(profile).toBe(migrationProfiles["20260708090000_phase_4_recurring_budgets_foundation"]);
    expect(profile?.absentTables).toEqual([
      "RecurringItem",
      "RecurringSuggestionDismissal",
      "CategoryBudget",
    ]);
    expect(profile?.absentEnums).toEqual([
      "RecurringCadence",
      "RecurringItemStatus",
      "BudgetPeriod",
      "BudgetStatus",
    ]);
    expect(profile?.enums).toEqual({
      RecurringCadence: ["WEEKLY", "FORTNIGHTLY", "MONTHLY", "OTHER"],
      RecurringItemStatus: ["ACTIVE", "ARCHIVED"],
      BudgetPeriod: ["MONTHLY"],
      BudgetStatus: ["ACTIVE", "ARCHIVED"],
    });
    expect(profile?.auditEntityTypeAdditions).toEqual([
      "RECURRING_ITEM",
      "RECURRING_SUGGESTION_DISMISSAL",
      "CATEGORY_BUDGET",
    ]);
  });

  it("checks Phase 4 indexes, unique suggestion key and foreign keys", () => {
    const profile = migrationProfileFor("20260708090000_phase_4_recurring_budgets_foundation");

    expect(profile?.tables.RecurringItem.indexes).toEqual([
      "RecurringItem_pkey",
      "RecurringItem_userId_categoryId_idx",
      "RecurringItem_userId_cadence_idx",
      "RecurringItem_userId_status_idx",
    ]);
    expect(profile?.tables.RecurringItem.constraints).toEqual([
      "RecurringItem_categoryId_fkey",
      "RecurringItem_pkey",
      "RecurringItem_userId_fkey",
    ]);
    expect(profile?.tables.RecurringSuggestionDismissal.indexes).toContain(
      "RecurringSuggestionDismissal_userId_suggestionKey_key",
    );
    expect(profile?.tables.RecurringSuggestionDismissal.constraints).toEqual([
      "RecurringSuggestionDismissal_pkey",
      "RecurringSuggestionDismissal_userId_fkey",
    ]);
    expect(profile?.tables.CategoryBudget.constraints).toEqual([
      "CategoryBudget_categoryId_fkey",
      "CategoryBudget_pkey",
      "CategoryBudget_userId_fkey",
    ]);
  });
});
