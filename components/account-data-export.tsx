"use client";

import { useReverification } from "@clerk/nextjs";
import { Download } from "lucide-react";
import { useState } from "react";

function safeFileName(response: Response) {
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="(spendgrove-account-export-\d{4}-\d{2}-\d{2}\.json)"/);
  return match?.[1] ?? "spendgrove-account-export.json";
}

export function AccountDataExport() {
  const [isPreparing, setIsPreparing] = useState(false);
  const [message, setMessage] = useState("");
  const requestExport = useReverification(
    async () => fetch("/api/account/export", {
      method: "POST",
      cache: "no-store",
      headers: { Accept: "application/json" },
    }),
  );

  async function downloadExport() {
    if (isPreparing) return;
    setIsPreparing(true);
    setMessage("");

    try {
      const response = await requestExport();
      if (!response) {
        setMessage("Export cancelled. No file was created.");
        return;
      }
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error ?? "Your account export could not be prepared.");
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = safeFileName(response);
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      setMessage("Your account export has downloaded.");
    } catch (error) {
      setMessage(error instanceof Error
        ? error.message
        : "Your account export could not be prepared. Please try again.");
    } finally {
      setIsPreparing(false);
    }
  }

  return (
    <div className="border-t border-border px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Download your account data</p>
          <p className="mt-1 max-w-xl text-sm leading-5 text-muted">
            Get a private JSON copy of your SpendGrove records. You will be asked to verify it is you.
          </p>
        </div>
        <button
          type="button"
          disabled={isPreparing}
          onClick={() => void downloadExport()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-teal px-4 text-sm font-semibold text-brand-teal transition hover:bg-surface-mint focus:outline-none focus:ring-2 focus:ring-brand-green disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          {isPreparing ? "Preparing…" : "Download data"}
        </button>
      </div>
      {message ? (
        <p className="mt-3 text-sm text-muted" role="status" aria-live="polite">{message}</p>
      ) : null}
    </div>
  );
}
