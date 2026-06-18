import type { AccountImportHistoryEntry, AccountImportHistoryResponse } from "@/lib/import-history";

export type AccountImportHistoryResult =
  | { ok: true; entries: AccountImportHistoryEntry[] }
  | { ok: false; error: string };

export async function listAccountImportHistory(signal?: AbortSignal): Promise<AccountImportHistoryResult> {
  try {
    const response = await fetch("/api/account/import-history", { cache: "no-store", signal });
    const payload = await response.json() as AccountImportHistoryResponse & { error?: string };
    if (!response.ok) {
      return { ok: false, error: payload.error || "Account import history is unavailable right now." };
    }
    return { ok: true, entries: Array.isArray(payload.entries) ? payload.entries : [] };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return {
      ok: false,
      error: "Account import history is unavailable right now. Your browser-local review summaries are unaffected.",
    };
  }
}
