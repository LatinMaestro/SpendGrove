export const migrationProfiles = {
  "20260703090000_phase_3c_property_reporting_review": {
    migrationName: "20260703090000_phase_3c_property_reporting_review",
    absentTables: ["PropertyReportReview"],
    absentEnums: ["PropertyRecordClassification"],
    enums: {
      PropertyRecordClassification: [
        "PROPERTY_INCOME",
        "PROPERTY_OUTGOING",
        "REFUND_OR_REVERSAL",
        "LOAN_PAYMENT_CONTEXT",
        "TRANSFER_CONTEXT",
        "OTHER_PROPERTY_RECORD",
        "EXCLUDED",
      ],
    },
    auditEntityTypeAdditions: [],
    tables: {
      PropertyReportReview: {
        columns: [
          "classification",
          "createdAt",
          "id",
          "propertyId",
          "transactionId",
          "updatedAt",
          "userId",
        ],
        indexes: [
          "PropertyReportReview_pkey",
          "PropertyReportReview_transactionId_key",
          "PropertyReportReview_userId_classification_idx",
          "PropertyReportReview_userId_propertyId_classification_idx",
        ],
        constraints: [
          "PropertyReportReview_pkey",
          "PropertyReportReview_propertyId_fkey",
          "PropertyReportReview_transactionId_fkey",
          "PropertyReportReview_userId_fkey",
        ],
        delegate: "propertyReportReview",
      },
    },
  },
  "20260708090000_phase_4_recurring_budgets_foundation": {
    migrationName: "20260708090000_phase_4_recurring_budgets_foundation",
    absentTables: ["RecurringItem", "RecurringSuggestionDismissal", "CategoryBudget"],
    absentEnums: ["RecurringCadence", "RecurringItemStatus", "BudgetPeriod", "BudgetStatus"],
    enums: {
      RecurringCadence: ["WEEKLY", "FORTNIGHTLY", "MONTHLY", "OTHER"],
      RecurringItemStatus: ["ACTIVE", "ARCHIVED"],
      BudgetPeriod: ["MONTHLY"],
      BudgetStatus: ["ACTIVE", "ARCHIVED"],
    },
    auditEntityTypeAdditions: [
      "RECURRING_ITEM",
      "RECURRING_SUGGESTION_DISMISSAL",
      "CATEGORY_BUDGET",
    ],
    tables: {
      RecurringItem: {
        columns: [
          "archivedAt",
          "cadence",
          "categoryId",
          "createdAt",
          "expectedAmountCents",
          "id",
          "label",
          "nextExpectedDate",
          "status",
          "transactionType",
          "updatedAt",
          "userId",
        ],
        indexes: [
          "RecurringItem_pkey",
          "RecurringItem_userId_categoryId_idx",
          "RecurringItem_userId_cadence_idx",
          "RecurringItem_userId_status_idx",
        ],
        constraints: [
          "RecurringItem_categoryId_fkey",
          "RecurringItem_pkey",
          "RecurringItem_userId_fkey",
        ],
        delegate: "recurringItem",
      },
      RecurringSuggestionDismissal: {
        columns: [
          "createdAt",
          "dismissedAt",
          "id",
          "suggestionKey",
          "updatedAt",
          "userId",
        ],
        indexes: [
          "RecurringSuggestionDismissal_pkey",
          "RecurringSuggestionDismissal_userId_dismissedAt_idx",
          "RecurringSuggestionDismissal_userId_suggestionKey_key",
        ],
        constraints: [
          "RecurringSuggestionDismissal_pkey",
          "RecurringSuggestionDismissal_userId_fkey",
        ],
        delegate: "recurringSuggestionDismissal",
      },
      CategoryBudget: {
        columns: [
          "amountCents",
          "archivedAt",
          "categoryId",
          "createdAt",
          "id",
          "period",
          "status",
          "updatedAt",
          "userId",
        ],
        indexes: [
          "CategoryBudget_pkey",
          "CategoryBudget_userId_categoryId_idx",
          "CategoryBudget_userId_categoryId_period_status_idx",
          "CategoryBudget_userId_period_status_idx",
        ],
        constraints: [
          "CategoryBudget_categoryId_fkey",
          "CategoryBudget_pkey",
          "CategoryBudget_userId_fkey",
        ],
        delegate: "categoryBudget",
      },
    },
  },
  "20260717090000_phase_6_bulk_operation_foundation": {
    migrationName: "20260717090000_phase_6_bulk_operation_foundation",
    absentTables: ["BulkOperation", "BulkOperationItem"],
    absentEnums: [
      "BulkOperationType",
      "BulkOperationStatus",
      "BulkOperationItemStatus",
      "BulkOperationReason",
    ],
    enums: {
      BulkOperationType: [
        "SET_CATEGORY",
        "APPLY_MERCHANT_CATEGORY",
        "LINK_PROPERTY",
        "UNLINK_PROPERTY",
      ],
      BulkOperationStatus: [
        "RUNNING",
        "COMPLETED",
        "PARTIAL",
        "FAILED",
        "REVERTED",
        "PARTIALLY_REVERTED",
      ],
      BulkOperationItemStatus: [
        "APPLIED",
        "SKIPPED",
        "FAILED",
        "REVERTED",
        "UNDO_BLOCKED",
      ],
      BulkOperationReason: [
        "ALREADY_APPLIED",
        "ALREADY_LINKED_TO_PROPERTY",
        "ALREADY_LINKED_TO_ANOTHER_PROPERTY",
        "CATEGORY_INCOMPATIBLE",
        "CATEGORY_UNAVAILABLE",
        "PROPERTY_UNAVAILABLE",
        "NOT_ACTIVE",
        "SPLIT_PARENT",
        "DIRECTION_NEEDS_CORRECTION",
        "MERCHANT_IDENTITY_MISMATCH",
        "STALE_RECORD",
        "NOT_FOUND_OR_NOT_OWNED",
        "UNEXPECTED_SAFE_FAILURE",
      ],
    },
    auditEntityTypeAdditions: ["BULK_OPERATION"],
    tables: {
      BulkOperation: {
        columns: [
          "appliedCount",
          "completedAt",
          "createdAt",
          "failedCount",
          "id",
          "requestedCount",
          "revertedAt",
          "skippedCount",
          "status",
          "targetCategoryId",
          "targetPropertyId",
          "type",
          "undoBlockedCount",
          "undoExpiresAt",
          "updatedAt",
          "userId",
        ],
        indexes: [
          "BulkOperation_pkey",
          "BulkOperation_targetCategoryId_idx",
          "BulkOperation_targetPropertyId_idx",
          "BulkOperation_userId_status_createdAt_idx",
          "BulkOperation_userId_type_createdAt_idx",
        ],
        constraints: [
          "BulkOperation_pkey",
          "BulkOperation_targetCategoryId_fkey",
          "BulkOperation_targetPropertyId_fkey",
          "BulkOperation_userId_fkey",
        ],
        delegate: "bulkOperation",
      },
      BulkOperationItem: {
        columns: [
          "afterCategoryId",
          "afterPropertyId",
          "appliedTransactionUpdatedAt",
          "beforeCategoryId",
          "beforePropertyId",
          "beforeTransactionUpdatedAt",
          "createdAt",
          "id",
          "operationId",
          "reason",
          "revertedAt",
          "status",
          "transactionId",
          "updatedAt",
          "userId",
        ],
        indexes: [
          "BulkOperationItem_operationId_status_idx",
          "BulkOperationItem_operationId_transactionId_key",
          "BulkOperationItem_pkey",
          "BulkOperationItem_transactionId_createdAt_idx",
          "BulkOperationItem_userId_status_createdAt_idx",
        ],
        constraints: [
          "BulkOperationItem_operationId_fkey",
          "BulkOperationItem_pkey",
          "BulkOperationItem_transactionId_fkey",
          "BulkOperationItem_userId_fkey",
        ],
        delegate: "bulkOperationItem",
      },
    },
  },
  "20260717100000_phase_7_transfer_link_foundation": {
    migrationName: "20260717100000_phase_7_transfer_link_foundation",
    absentTables: ["TransferLink"],
    absentEnums: [],
    enums: {},
    auditEntityTypeAdditions: ["TRANSFER_LINK"],
    existingCountDelegates: [
      ["BulkOperation", "bulkOperation"],
      ["BulkOperationItem", "bulkOperationItem"],
    ],
    tables: {
      TransferLink: {
        columns: [
          "confirmedAt",
          "createdAt",
          "id",
          "incomingTransactionId",
          "outgoingTransactionId",
          "unlinkedAt",
          "updatedAt",
          "userId",
        ],
        indexes: [
          "TransferLink_incomingTransactionId_active_key",
          "TransferLink_outgoingTransactionId_active_key",
          "TransferLink_pkey",
          "TransferLink_userId_incomingTransactionId_unlinkedAt_idx",
          "TransferLink_userId_outgoingTransactionId_unlinkedAt_idx",
          "TransferLink_userId_unlinkedAt_createdAt_idx",
        ],
        constraints: [
          "TransferLink_incomingTransactionId_fkey",
          "TransferLink_outgoingTransactionId_fkey",
          "TransferLink_pkey",
          "TransferLink_userId_fkey",
        ],
        delegate: "transferLink",
      },
    },
  },
};

export function migrationProfileFor(migrationName) {
  return migrationProfiles[migrationName];
}

export function exactNameSetMatches(actual, expected) {
  const sortedActual = [...actual].sort();
  const sortedExpected = [...expected].sort();
  return sortedActual.length === sortedExpected.length
    && sortedActual.every((value, index) => value === sortedExpected[index]);
}

export function primaryAndForeignKeyNames(rows) {
  return rows
    .filter((row) => row.type === "p" || row.type === "f")
    .map((row) => row.name)
    .sort();
}
