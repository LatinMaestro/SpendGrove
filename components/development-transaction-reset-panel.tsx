"use client";

import { useState, type FormEvent } from "react";
import { useUser } from "@clerk/nextjs";
import { AlertTriangle, Trash2 } from "lucide-react";
import { DEVELOPMENT_TRANSACTION_RESET_CONFIRMATION } from "@/lib/development-testing";

type ResetSummary = {
  transactionsDeleted: number;
  loanLinksDetached: number;
  propertyLinksDetached: number;
};

export function DevelopmentTransactionResetPanel() {
  const { isLoaded, isSignedIn } = useUser();
  const [confirmation, setConfirmation] = useState("");
  const [summary, setSummary] = useState<ResetSummary | null>(null);
  const [error, setError] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const confirmationMatches = confirmation === DEVELOPMENT_TRANSACTION_RESET_CONFIRMATION;

  async function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSignedIn || !confirmationMatches || isResetting) return;

    setIsResetting(true);
    setError("");
    setSummary(null);

    try {
      const response = await fetch("/api/account/development-testing/transactions/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const result = await response.json() as {
        ok: boolean;
        summary?: ResetSummary;
        error?: string;
      };

      if (!response.ok || !result.ok || !result.summary) {
        setError(result.error ?? "The development transaction reset could not be completed safely.");
        return;
      }

      setSummary(result.summary);
      setConfirmation("");
    } catch {
      setError("The development transaction reset could not be completed safely.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-danger-red/25 bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="development-testing-heading">
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-danger-red" />
        <div>
          <p className="text-sm font-semibold text-danger-red">Development testing only</p>
          <h2 id="development-testing-heading" className="mt-1 text-xl font-bold text-brand-deepTeal">Delete all transactions for this account</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-deepTeal/70">
            This soft-deletes only your everyday transactions from the active app and detaches their active loan and Property links. Loan repayment breakdowns, Loan Accounts, Properties, categories, settings, merchant rules and import profiles remain intact.
          </p>
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={submitReset}>
        <label className="block" htmlFor="development-transaction-reset-confirmation">
          <span className="text-sm font-bold text-brand-deepTeal">Type DELETE TRANSACTIONS to confirm</span>
          <input
            id="development-transaction-reset-confirmation"
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-danger-red"
          />
        </label>

        {!isLoaded && <p className="text-sm font-semibold text-brand-deepTeal/70">Checking account access…</p>}
        {isLoaded && !isSignedIn && <p role="alert" className="rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Sign in before using this development-only action.</p>}
        {error && <p role="alert" className="rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
        {summary && (
          <p role="status" className="rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">
            Reset complete: {summary.transactionsDeleted} transaction{summary.transactionsDeleted === 1 ? "" : "s"} deleted, {summary.loanLinksDetached} loan link{summary.loanLinksDetached === 1 ? "" : "s"} detached and {summary.propertyLinksDetached} Property link{summary.propertyLinksDetached === 1 ? "" : "s"} detached.
          </p>
        )}

        <button
          type="submit"
          disabled={!isLoaded || !isSignedIn || !confirmationMatches || isResetting}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-danger-red px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-deepTeal"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          {isResetting ? "Deleting transactions…" : "Delete transactions"}
        </button>
      </form>
    </section>
  );
}
