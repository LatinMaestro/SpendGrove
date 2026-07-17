"use client";

import { useReverification } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
import { Trash2 } from "lucide-react";
import { useState } from "react";

type DeletionResponse = {
  ok?: boolean;
  appDataDeleted?: boolean;
  identityDeleted?: boolean;
  message?: string;
  error?: string;
};

export function AccountDeletion() {
  const [isOpen, setIsOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");

  const requestDeletion = useReverification(
    async () => fetch("/api/account/delete", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ confirmation }),
    }),
  );

  function close() {
    if (isDeleting) return;
    setIsOpen(false);
    setUnderstood(false);
    setConfirmation("");
    setMessage("");
  }

  async function deleteAccount() {
    if (isDeleting || !understood || confirmation !== "DELETE") return;
    setIsDeleting(true);
    setMessage("");

    try {
      const response = await requestDeletion();
      const result = await response.json().catch(() => null) as DeletionResponse | null;

      if (result?.ok && result.appDataDeleted && result.identityDeleted) {
        window.location.assign("/onboarding?accountDeleted=1");
        return;
      }
      if (result?.appDataDeleted && !result.identityDeleted) {
        setMessage(result.message ?? "Your SpendGrove records were deleted, but sign-in account removal needs another try.");
        return;
      }
      throw new Error(result?.error ?? "Your account could not be deleted. Nothing was changed.");
    } catch (error) {
      setMessage(isReverificationCancelledError(error)
        ? "Account deletion cancelled. Nothing was changed."
        : error instanceof Error
          ? error.message
          : "Your account could not be deleted. Nothing was changed.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section aria-labelledby="delete-account-heading" className="mt-6">
      <div className="mb-2 px-1">
        <h2 id="delete-account-heading" className="text-base font-semibold text-foreground">Delete account</h2>
        <p className="mt-0.5 text-sm text-muted">Permanent account removal stays separate from everyday settings.</p>
      </div>

      {!isOpen ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-base px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Permanently delete SpendGrove data</p>
            <p className="mt-1 text-sm text-muted">Download your account data first if you want to keep a copy.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-danger-red/50 px-4 text-sm font-semibold text-danger-red focus:outline-none focus:ring-2 focus:ring-danger-red"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" /> Delete account
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-danger-red/35 bg-surface-base p-4">
          <h3 className="text-base font-semibold text-foreground">Permanently delete your account?</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            This permanently removes your transactions, imports, categories, budgets, regular payments, loans,
            Properties and settings. It cannot be undone.
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Download your account data above before continuing if you want to keep a copy.
          </p>

          <label className="mt-4 flex min-h-11 items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={understood}
              onChange={(event) => setUnderstood(event.target.checked)}
              className="mt-1 h-5 w-5 rounded border-border text-brand-teal focus:ring-brand-green"
            />
            <span>I understand this permanently deletes my SpendGrove account data.</span>
          </label>

          <label className="mt-4 block text-sm font-semibold text-foreground">
            Type DELETE to confirm
            <input
              type="text"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-base font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-danger-red"
            />
          </label>

          {message ? <p role="alert" className="mt-3 text-sm text-danger-red">{message}</p> : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isDeleting || !understood || confirmation !== "DELETE"}
              onClick={() => void deleteAccount()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-danger-red px-4 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-danger-red disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              {isDeleting ? "Deleting…" : "Permanently delete account"}
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={close}
              className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
