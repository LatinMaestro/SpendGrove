"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import type { SafeImportUndoStatus } from "@/lib/import-undo";

type ApiResponse = { ok: boolean; result?: SafeImportUndoStatus; error?: string };

async function safeJson(response: Response): Promise<ApiResponse> {
  try { return await response.json() as ApiResponse; }
  catch { return { ok: false, error: "The import operation returned an unreadable response." }; }
}

export function ImportUndoControls({ batchId }: { batchId: string }) {
  const [status, setStatus] = useState<SafeImportUndoStatus | null>(null);
  const [mode, setMode] = useState<"idle" | "undo" | "restore">("idle");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadStatus(signal?: AbortSignal) {
    const response = await fetch(`/api/account/import-history/${encodeURIComponent(batchId)}/undo-status`, {
      cache: "no-store",
      signal,
    });
    const payload = await safeJson(response);
    if (!payload.ok || !payload.result) throw new Error(payload.error || "Import undo status is unavailable.");
    setStatus(payload.result);
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadStatus(controller.signal).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Import undo status is unavailable.");
    });
    return () => controller.abort();
  }, [batchId]);

  async function submit(action: "undo" | "restore") {
    setBusy(true); setError("");
    const response = await fetch(`/api/account/import-history/${encodeURIComponent(batchId)}/${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });
    const payload = await safeJson(response);
    setBusy(false);
    if (!payload.ok || !payload.result) { setError(payload.error || "The import could not be changed safely."); return; }
    setStatus(payload.result);
    setMode("idle");
    setConfirmation("");
  }

  if (error && !status) return <p role="status" className="mt-3 text-xs text-brand-deepTeal/60">Import undo is unavailable right now.</p>;
  if (!status) return <p className="mt-3 text-xs text-brand-deepTeal/60">Checking undo availability…</p>;

  const operationComplete = Boolean(status.status && status.status !== "RUNNING" && status.status !== "RESTORING");
  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface-subtle p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-brand-deepTeal">Import recovery</p>
          <p className="mt-1 text-xs leading-5 text-brand-deepTeal/65">{status.message}</p>
          {operationComplete && (
            <p className="mt-1 text-xs text-brand-deepTeal/60">
              {status.undoneCount} removed · {status.noChangeCount} unchanged · {status.blockedCount} blocked · {status.failedCount} failed
            </p>
          )}
        </div>
        {status.eligible && mode === "idle" && (
          <button type="button" onClick={() => setMode("undo")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal">
            <Undo2 aria-hidden="true" className="h-4 w-4" />Undo import
          </button>
        )}
        {status.canRestore && mode === "idle" && (
          <button type="button" onClick={() => setMode("restore")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal">
            <RotateCcw aria-hidden="true" className="h-4 w-4" />Restore import
          </button>
        )}
      </div>

      {mode !== "idle" && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-sm font-semibold text-brand-deepTeal">
            {mode === "undo"
              ? "Imported transactions will leave active views. Skipped and merged rows will not change."
              : "Only transactions removed by this import operation and still unchanged will return."}
          </p>
          <label className="mt-3 block text-xs font-bold text-brand-deepTeal" htmlFor={`import-${mode}-confirmation-${batchId}`}>
            Type {mode === "undo" ? "UNDO IMPORT" : "RESTORE IMPORT"} to confirm
          </label>
          <input
            id={`import-${mode}-confirmation-${batchId}`}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand-deepTeal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || confirmation !== (mode === "undo" ? "UNDO IMPORT" : "RESTORE IMPORT")}
              onClick={() => void submit(mode)}
              className="min-h-11 rounded-full bg-brand-teal px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Working safely…" : mode === "undo" ? "Confirm undo" : "Confirm restore"}
            </button>
            <button type="button" disabled={busy} onClick={() => { setMode("idle"); setConfirmation(""); setError(""); }} className="min-h-11 rounded-full border border-border px-4 text-sm font-bold text-brand-deepTeal">Cancel</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger-red">{error}</p>}
    </div>
  );
}
