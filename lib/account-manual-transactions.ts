import type { ManualTransaction } from "@/lib/manual-transactions";

export type AccountTransaction = Omit<ManualTransaction, "source"> & {
  source: "MANUAL" | "IMPORTED";
  merchantName?: string;
};

export type AccountTransactionResult =
  | { ok: true; transactions: AccountTransaction[] }
  | { ok: false; error: string };

export async function listAccountTransactionsForImportReview(): Promise<AccountTransactionResult> {
  try {
    const response = await fetch("/api/account/manual-transactions", { method: "GET", cache: "no-store" });
    const payload = await response.json() as AccountTransactionResult;
    if (payload.ok) return payload;
    return { ok: false, error: payload.error || "We could not load account transactions for duplicate review." };
  } catch {
    return { ok: false, error: "Account transactions are unavailable right now." };
  }
}
