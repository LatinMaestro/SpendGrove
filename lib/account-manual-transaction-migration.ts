import type { ManualTransactionStorage } from "@/lib/manual-transaction-storage";
import { saveManualTransactionsToStorage } from "@/lib/manual-transaction-storage";
import type { ManualTransaction } from "@/lib/manual-transactions";

export type AccountManualTransactionMigrationResult =
  | { ok: true; transactions: ManualTransaction[]; importedCount: number; skippedCount: number }
  | { ok: false; error: string };

export async function migrateAccountManualTransactions(
  transactions: ManualTransaction[],
): Promise<AccountManualTransactionMigrationResult> {
  try {
    const response = await fetch("/api/account/manual-transactions/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions }),
    });
    const payload = await response.json() as AccountManualTransactionMigrationResult;
    if (payload.ok) return payload;
    return { ok: false, error: payload.error || "We could not move those manual transactions safely." };
  } catch {
    return { ok: false, error: "Account storage is unavailable. Your device copy was not changed." };
  }
}

export function clearDeviceManualTransactionsAfterMigration(
  storage: ManualTransactionStorage,
  result: AccountManualTransactionMigrationResult,
) {
  if (!result.ok) return false;
  return saveManualTransactionsToStorage(storage, []);
}
