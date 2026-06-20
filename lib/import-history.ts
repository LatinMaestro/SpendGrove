export const IMPORT_HISTORY_UPDATED_EVENT = "spendgrove:import-history-updated";

export type ImportHistoryOutcome = "IMPORTED" | "SKIPPED" | "MERGED" | "UNAVAILABLE";
export type ImportHistoryLinkedTransaction = "IMPORTED" | "MANUAL" | "NONE";
export type ImportHistoryLinkState = "ACTIVE" | "DELETED" | "UNAVAILABLE" | "NOT_APPLICABLE";

export type SafeImportRowOutcome = {
  rowNumber: number;
  outcome: ImportHistoryOutcome;
  linkedTransaction: ImportHistoryLinkedTransaction;
  linkState: ImportHistoryLinkState;
  warningCount: number;
};

export type SafeImportAuditTrail = {
  action: "IMPORTED";
  occurredAt: string;
  metadata: {
    totalCount: number;
    importedCount: number;
    skippedCount: number;
    mergedCount: number;
    warningCount: number;
    privateFieldCount: number;
  };
};

export type AccountImportHistoryEntry = {
  batchId: string;
  completedAt: string;
  totalCount: number;
  importedCount: number;
  skippedCount: number;
  mergedCount: number;
  warningCount: number;
  privateFieldCount: number;
  outcomes: SafeImportRowOutcome[];
  hiddenOutcomeCount: number;
  audit: SafeImportAuditTrail | null;
};

export type AccountImportHistoryResponse = {
  entries: AccountImportHistoryEntry[];
};
