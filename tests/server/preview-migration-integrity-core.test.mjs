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


describe("Phase 6 Preview migration profile", () => {
  const migrationName = "20260717090000_phase_6_bulk_operation_foundation";

  it("defines the exact enums, tables and audit addition", () => {
    const profile = migrationProfileFor(migrationName);

    expect(profile).toBe(migrationProfiles[migrationName]);
    expect(profile?.absentTables).toEqual(["BulkOperation", "BulkOperationItem"]);
    expect(profile?.absentEnums).toEqual([
      "BulkOperationType",
      "BulkOperationStatus",
      "BulkOperationItemStatus",
      "BulkOperationReason",
    ]);
    expect(profile?.enums.BulkOperationType).toEqual([
      "SET_CATEGORY",
      "APPLY_MERCHANT_CATEGORY",
      "LINK_PROPERTY",
      "UNLINK_PROPERTY",
    ]);
    expect(profile?.enums.BulkOperationStatus).toEqual([
      "RUNNING",
      "COMPLETED",
      "PARTIAL",
      "FAILED",
      "REVERTED",
      "PARTIALLY_REVERTED",
    ]);
    expect(profile?.enums.BulkOperationItemStatus).toEqual([
      "APPLIED",
      "SKIPPED",
      "FAILED",
      "REVERTED",
      "UNDO_BLOCKED",
    ]);
    expect(profile?.enums.BulkOperationReason).toContain("NOT_FOUND_OR_NOT_OWNED");
    expect(profile?.auditEntityTypeAdditions).toEqual(["BULK_OPERATION"]);
  });

  it("requires the exact approved indexes and foreign keys", () => {
    const profile = migrationProfileFor(migrationName);

    expect(profile?.tables.BulkOperation.indexes).toEqual([
      "BulkOperation_pkey",
      "BulkOperation_targetCategoryId_idx",
      "BulkOperation_targetPropertyId_idx",
      "BulkOperation_userId_status_createdAt_idx",
      "BulkOperation_userId_type_createdAt_idx",
    ]);
    expect(profile?.tables.BulkOperation.constraints).toEqual([
      "BulkOperation_pkey",
      "BulkOperation_targetCategoryId_fkey",
      "BulkOperation_targetPropertyId_fkey",
      "BulkOperation_userId_fkey",
    ]);
    expect(profile?.tables.BulkOperationItem.indexes).toContain(
      "BulkOperationItem_operationId_transactionId_key",
    );
    expect(profile?.tables.BulkOperationItem.constraints).toEqual([
      "BulkOperationItem_operationId_fkey",
      "BulkOperationItem_pkey",
      "BulkOperationItem_transactionId_fkey",
      "BulkOperationItem_userId_fkey",
    ]);
  });

  it("keeps Phase 6 index verification order-insensitive but exact", () => {
    const expected = migrationProfileFor(migrationName)?.tables.BulkOperationItem.indexes ?? [];
    const reversed = [...expected].reverse();

    expect(exactNameSetMatches(reversed, expected)).toBe(true);
    expect(exactNameSetMatches(expected.slice(1), expected)).toBe(false);
    expect(exactNameSetMatches([...expected, "unexpected_idx"], expected)).toBe(false);
  });
});


describe("Phase 7 transfer-link Preview migration profile", () => {
  const migrationName = "20260717100000_phase_7_transfer_link_foundation";

  it("defines the exact empty table and audit addition", () => {
    const profile = migrationProfileFor(migrationName);

    expect(profile).toBe(migrationProfiles[migrationName]);
    expect(profile?.absentTables).toEqual(["TransferLink"]);
    expect(profile?.absentEnums).toEqual([]);
    expect(profile?.auditEntityTypeAdditions).toEqual(["TRANSFER_LINK"]);
    expect(profile?.existingCountDelegates).toEqual([
      ["BulkOperation", "bulkOperation"],
      ["BulkOperationItem", "bulkOperationItem"],
    ]);
  });

  it("requires active-only indexes and all owner/transaction foreign keys", () => {
    const table = migrationProfileFor(migrationName)?.tables.TransferLink;

    expect(table?.indexes).toEqual([
      "TransferLink_incomingTransactionId_active_key",
      "TransferLink_outgoingTransactionId_active_key",
      "TransferLink_pkey",
      "TransferLink_userId_incomingTransactionId_unlinkedAt_idx",
      "TransferLink_userId_outgoingTransactionId_unlinkedAt_idx",
      "TransferLink_userId_unlinkedAt_createdAt_idx",
    ]);
    expect(table?.constraints).toEqual([
      "TransferLink_incomingTransactionId_fkey",
      "TransferLink_outgoingTransactionId_fkey",
      "TransferLink_pkey",
      "TransferLink_userId_fkey",
    ]);
    expect(exactNameSetMatches(
      [...(table?.indexes ?? [])].reverse(),
      table?.indexes ?? [],
    )).toBe(true);
  });
});


describe("Phase 7 import-undo Preview migration profile", () => {
  const migrationName = "20260717110000_phase_7_import_undo_foundation";

  it("defines exact enums, tables, audit and altered-column checks", () => {
    const profile = migrationProfileFor(migrationName);

    expect(profile).toBe(migrationProfiles[migrationName]);
    expect(profile?.absentTables).toEqual(["ImportUndoOperation", "ImportUndoItem"]);
    expect(profile?.absentEnums).toEqual([
      "ImportUndoOperationStatus",
      "ImportUndoItemStatus",
      "ImportUndoReason",
    ]);
    expect(profile?.auditEntityTypeAdditions).toEqual(["IMPORT_UNDO_OPERATION"]);
    expect(profile?.absentColumns).toEqual({
      ImportRow: ["committedTransactionUpdatedAt"],
    });
    expect(profile?.requiredColumns).toEqual({
      ImportRow: ["committedTransactionUpdatedAt"],
    });
  });

  it("protects all earlier migration tables with safe counts", () => {
    expect(migrationProfileFor(migrationName)?.existingCountDelegates).toEqual([
      ["BulkOperation", "bulkOperation"],
      ["BulkOperationItem", "bulkOperationItem"],
      ["TransferLink", "transferLink"],
    ]);
  });

  it("requires exact operation and item indexes and foreign keys", () => {
    const tables = migrationProfileFor(migrationName)?.tables;

    expect(tables?.ImportUndoOperation.indexes).toContain(
      "ImportUndoOperation_importBatchId_key",
    );
    expect(tables?.ImportUndoOperation.constraints).toEqual([
      "ImportUndoOperation_importBatchId_fkey",
      "ImportUndoOperation_pkey",
      "ImportUndoOperation_userId_fkey",
    ]);
    expect(tables?.ImportUndoItem.indexes).toContain(
      "ImportUndoItem_operationId_importRowId_key",
    );
    expect(tables?.ImportUndoItem.constraints).toEqual([
      "ImportUndoItem_importRowId_fkey",
      "ImportUndoItem_operationId_fkey",
      "ImportUndoItem_pkey",
      "ImportUndoItem_transactionId_fkey",
      "ImportUndoItem_userId_fkey",
    ]);
  });
});

describe("Phase 9 advanced personal-finance Preview migration profile", () => {
  const migrationName = "20260717120000_phase_9_advanced_personal_finance_foundation";

  it("defines exact additive enums, tables, audit additions and altered RecurringItem fields", () => {
    const profile = migrationProfileFor(migrationName);

    expect(profile).toBe(migrationProfiles[migrationName]);
    expect(profile?.absentTables).toHaveLength(9);
    expect(profile?.absentTables).toContain("RecurringInstance");
    expect(profile?.absentTables).toContain("SavingsGoal");
    expect(profile?.absentTables).toContain("NetWorthSnapshotEntry");
    expect(profile?.absentTables).toContain("Reminder");
    expect(profile?.enums.RecurringItemStatus).toEqual([
      "ACTIVE",
      "PAUSED",
      "CANCELLED",
      "UNKNOWN",
      "NEEDS_REVIEW",
      "ARCHIVED",
    ]);
    expect(profile?.auditEntityTypeAdditions).toEqual([
      "RECURRING_INSTANCE",
      "SAVINGS_GOAL",
      "SAVINGS_GOAL_CONTRIBUTION",
      "NET_WORTH_ITEM",
      "NET_WORTH_VALUATION",
      "NET_WORTH_SNAPSHOT",
      "REMINDER_PREFERENCE",
      "REMINDER",
    ]);
    expect(profile?.absentColumns.RecurringItem).toEqual([
      "detectionConfidence",
      "expectedAmountMaxCents",
      "expectedAmountMinCents",
      "source",
    ]);
    expect(profile?.requiredIndexes.RecurringItem).toEqual([
      "RecurringItem_userId_source_idx",
    ]);
  });

  it("protects every earlier prepared migration table with aggregate counts", () => {
    expect(migrationProfileFor(migrationName)?.existingCountDelegates).toEqual([
      ["BulkOperation", "bulkOperation"],
      ["BulkOperationItem", "bulkOperationItem"],
      ["TransferLink", "transferLink"],
      ["ImportUndoOperation", "importUndoOperation"],
      ["ImportUndoItem", "importUndoItem"],
    ]);
  });

  it("requires owner and source foreign keys plus exact unique/index sets", () => {
    const tables = migrationProfileFor(migrationName)?.tables;

    expect(tables?.RecurringInstance.indexes).toContain("RecurringInstance_transactionId_key");
    expect(tables?.RecurringInstance.constraints).toEqual([
      "RecurringInstance_pkey",
      "RecurringInstance_recurringItemId_fkey",
      "RecurringInstance_transactionId_fkey",
      "RecurringInstance_userId_fkey",
    ]);
    expect(tables?.NetWorthItem.indexes).toContain("NetWorthItem_userId_propertyId_key");
    expect(tables?.NetWorthItem.indexes).toContain("NetWorthItem_userId_loanAccountId_key");
    expect(tables?.NetWorthSnapshotEntry.constraints).toContain("NetWorthSnapshotEntry_snapshotId_fkey");
    expect(tables?.ReminderPreference.indexes).toContain("ReminderPreference_userId_family_key");
    expect(tables?.Reminder.indexes).toContain("Reminder_userId_dedupeKey_key");
    expect(exactNameSetMatches(
      [...(tables?.Reminder.indexes ?? [])].reverse(),
      tables?.Reminder.indexes ?? [],
    )).toBe(true);
  });
});

