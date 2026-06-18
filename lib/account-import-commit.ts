import type { ImportCommitRequest, ImportCommitSummary } from "@/lib/import-commit";

export type AccountImportCommitResult =
  | { ok: true; summary: ImportCommitSummary }
  | { ok: false; error: string };

export async function commitReviewedImport(request: ImportCommitRequest): Promise<AccountImportCommitResult> {
  try {
    const response = await fetch("/api/account/import-commits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      cache: "no-store",
    });
    const payload = await response.json() as AccountImportCommitResult;
    if (payload.ok) return payload;
    return { ok: false, error: payload.error || "We could not save this reviewed import safely." };
  } catch {
    return { ok: false, error: "Account storage is unavailable right now. Your review is still open and nothing was partly saved." };
  }
}
