export type SafeImportUndoStatus = {
  available: boolean;
  eligible: boolean;
  operationId: string | null;
  status: string | null;
  requestedCount: number;
  undoneCount: number;
  noChangeCount: number;
  blockedCount: number;
  failedCount: number;
  restoredCount: number;
  restoreBlockedCount: number;
  canRestore: boolean;
  message: string;
};
