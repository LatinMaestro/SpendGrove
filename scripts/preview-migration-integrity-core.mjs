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
