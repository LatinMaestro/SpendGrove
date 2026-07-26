"use client";

import { useEffect, useState } from "react";
import { Clock3, RefreshCw } from "lucide-react";
import type { ActivityHistoryItem } from "@/src/server/activity-history";

type ActivityResponse =
  | { ok: true; activity: ActivityHistoryItem[] }
  | { ok: false; error: string };

function formatActivityTime(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Brisbane",
  }).format(new Date(value));
}

function ActivityList({ items, emptyText }: Readonly<{ items: ActivityHistoryItem[]; emptyText: string }>) {
  if (items.length === 0) {
    return <p className="rounded-xl bg-surface-subtle p-4 text-sm leading-6 text-muted">{emptyText}</p>;
  }

  return (
    <ol className="space-y-2" aria-label="Activity events">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-border bg-surface-base p-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-mint text-brand-evergreen">
              <Clock3 aria-hidden="true" className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm font-semibold text-foreground">{item.summary}</p>
                <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-xs font-semibold text-muted">{item.family}</span>
              </div>
              <time dateTime={item.occurredAt} className="mt-1 block text-xs text-muted">
                {formatActivityTime(item.occurredAt)}
              </time>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ActivityHistoryPanel({ endpoint, title, description, emptyText, compact = false }: Readonly<{
  endpoint: string;
  title: string;
  description: string;
  emptyText: string;
  compact?: boolean;
}>) {
  const [items, setItems] = useState<ActivityHistoryItem[]>([]);
  const [status, setStatus] = useState<"LOADING" | "READY" | "ERROR">("LOADING");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("LOADING");
      setError("");
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        const payload = await response.json() as ActivityResponse;
        if (cancelled) return;
        if (!response.ok || !payload.ok) {
          setItems([]);
          setError(payload.ok === false ? payload.error : "Activity history could not be loaded safely.");
          setStatus("ERROR");
          return;
        }
        setItems(payload.activity);
        setStatus("READY");
      } catch {
        if (cancelled) return;
        setItems([]);
        setError("Activity history could not be loaded safely.");
        setStatus("ERROR");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [endpoint, reloadKey]);

  return (
    <section className={compact ? "mt-5 border-t border-border pt-5" : "rounded-2xl border border-border bg-surface-base p-4 sm:p-5"} aria-labelledby={`${title.toLocaleLowerCase("en-AU").replace(/[^a-z0-9]+/g, "-")}-heading`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id={`${title.toLocaleLowerCase("en-AU").replace(/[^a-z0-9]+/g, "-")}-heading`} className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>
        <button type="button" onClick={() => setReloadKey((current) => current + 1)} aria-label={`Refresh ${title.toLocaleLowerCase("en-AU")}`} className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3" aria-live="polite">
        {status === "LOADING" && <p className="rounded-xl bg-surface-subtle p-4 text-sm font-semibold text-muted">Loading activity…</p>}
        {status === "ERROR" && <div role="alert" className="rounded-xl border border-warning-amber/30 bg-warning-amber/5 p-4 text-sm leading-6 text-foreground"><p>{error}</p><button type="button" onClick={() => setReloadKey((current) => current + 1)} className="mt-2 min-h-10 rounded-lg px-2 font-bold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Try again</button></div>}
        {status === "READY" && <ActivityList items={items} emptyText={emptyText} />}
      </div>
    </section>
  );
}

export function AccountActivityHistory() {
  return (
    <ActivityHistoryPanel
      endpoint="/api/account/activity-history"
      title="Recent activity"
      description="A privacy-safe summary of recent account changes. Financial values and raw import details are not shown here."
      emptyText="No user-facing activity is available yet."
    />
  );
}

export function TransactionActivityHistory({ transactionId }: Readonly<{ transactionId: string }>) {
  return (
    <ActivityHistoryPanel
      endpoint={`/api/account/manual-transactions/${encodeURIComponent(transactionId)}/activity`}
      title="Activity history"
      description="Read-only change history for this transaction. Use the approved transaction controls for corrections, links or recovery."
      emptyText="No activity is available for this transaction yet."
      compact
    />
  );
}
