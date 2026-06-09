import {
  MANUAL_TRANSACTION_STORAGE_KEY,
  parseManualTransactionStorage,
  serializeManualTransactionStorage,
  type ManualTransaction,
  type ManualTransactionStorageResult,
} from "@/lib/manual-transactions";

export type ManualTransactionStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type ManualTransactionLoadResult = ManualTransactionStorageResult & {
  storageAvailable: boolean;
};

export function loadManualTransactionsFromStorage(
  storage: ManualTransactionStorage,
): ManualTransactionLoadResult {
  try {
    return {
      ...parseManualTransactionStorage(storage.getItem(MANUAL_TRANSACTION_STORAGE_KEY)),
      storageAvailable: true,
    };
  } catch {
    return {
      transactions: [],
      recoveredFromCorruption: false,
      storageAvailable: false,
    };
  }
}

export function saveManualTransactionsToStorage(
  storage: ManualTransactionStorage,
  transactions: ManualTransaction[],
) {
  try {
    storage.setItem(
      MANUAL_TRANSACTION_STORAGE_KEY,
      serializeManualTransactionStorage(transactions),
    );
    return true;
  } catch {
    return false;
  }
}
