import type { ManualTransaction } from "@/lib/manual-transactions";

export type AccountManualTransactionResult =
  | { ok: true; transactions: ManualTransaction[] }
  | { ok: false; error: string };

export async function listAccountManualTransactions(): Promise<AccountManualTransactionResult> {
  try {
    const response = await fetch("/api/account/manual-transactions", { method: "GET", cache: "no-store" });
    const payload = await response.json() as AccountManualTransactionResult;
    if (payload.ok) return payload;
    return { ok: false, error: payload.error || "We could not load account transactions for duplicate review." };
  } catch {
    return { ok: false, error: "Account transactions are unavailable right now." };
  }
}
