"use client";

import { Link2, Pause, Play, RotateCcw, Trash2, Unlink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatAudFromCents } from "@/lib/money";

type Status = "ACTIVE" | "PAUSED" | "CANCELLED" | "UNKNOWN" | "NEEDS_REVIEW" | "ARCHIVED";
type Instance = { id: string; transactionId: string; date: string; amountCents: number };
type Item = {
  id: string;
  label: string;
  transactionType: "EXPENSE" | "INCOME";
  expectedAmountCents: number | null;
  expectedAmountMinCents: number | null;
  expectedAmountMaxCents: number | null;
  cadence: string;
  nextExpectedDate: string | null;
  source: string | null;
  detectionConfidence: string | null;
  status: Status;
  updatedAt: string;
  instances: Instance[];
};
type Candidate = { id: string; date: string; amountCents: number; type: string };
type Response = { ok: true; items: Item[]; candidates: Candidate[] } | { ok: false; error: string };

const statusLabel: Record<Status, string> = {
  ACTIVE: "Active", PAUSED: "Paused", CANCELLED: "Cancelled", UNKNOWN: "Not sure",
  NEEDS_REVIEW: "Needs review", ARCHIVED: "Deleted",
};
const cadenceLabel: Record<string, string> = {
  WEEKLY: "Weekly", FORTNIGHTLY: "Every 2 weeks", MONTHLY: "Monthly", OTHER: "Other",
};

async function readResponse(response: globalThis.Response): Promise<Response> {
  try {
    const payload = await response.json() as Response;
    if (response.ok && payload.ok) return payload;
    return { ok: false, error: payload.ok ? "Regular payment history could not be loaded." : payload.error };
  } catch {
    return { ok: false, error: "Regular payment history could not be loaded." };
  }
}

function amountLabel(item: Item) {
  if (item.expectedAmountMinCents !== null && item.expectedAmountMaxCents !== null
    && item.expectedAmountMinCents !== item.expectedAmountMaxCents) {
    return `${formatAudFromCents(item.expectedAmountMinCents)}–${formatAudFromCents(item.expectedAmountMaxCents)}`;
  }
  return item.expectedAmountCents === null ? "Amount not set" : formatAudFromCents(item.expectedAmountCents);
}

function confidenceLabel(item: Item) {
  if (item.detectionConfidence === "USER_CONFIRMED" || item.source === "USER_CREATED") return "Confirmed by you";
  if (item.detectionConfidence === "HIGH") return "Strong pattern";
  return "Review when needed";
}

function compatibleCandidates(item: Item, candidates: Candidate[]) {
  const values = [item.expectedAmountMinCents, item.expectedAmountMaxCents, item.expectedAmountCents]
    .filter((value): value is number => Number.isInteger(value));
  const minimum = values.length ? Math.min(...values) : null;
  const maximum = values.length ? Math.max(...values) : null;
  return candidates.filter((candidate) => (
    candidate.type === item.transactionType
    && (minimum === null || candidate.amountCents >= minimum)
    && (maximum === null || candidate.amountCents <= maximum)
  )).slice(0, 20);
}

export function AdvancedRecurringLifecycle({ available = false }: { available?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [candidateByItem, setCandidateByItem] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function apply(result: Extract<Response, { ok: true }>) { setItems(result.items); setCandidates(result.candidates); }
  async function load() {
    const result = await readResponse(await fetch("/api/account/advanced-recurring", { cache: "no-store" }));
    if (result.ok) apply(result); else setError(result.error);
    setReady(true);
  }
  useEffect(() => { if (available) void load(); }, [available]);

  async function mutate(payload: Record<string, unknown>, key: string, success: string) {
    if (busy) return;
    setBusy(key); setError(""); setMessage("");
    const result = await readResponse(await fetch("/api/account/advanced-recurring", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
    }));
    setBusy("");
    if (!result.ok) { setError(result.error); return; }
    apply(result); setLinkingId(null); setMessage(success);
  }

  const active = useMemo(() => items.filter((item) => item.status !== "ARCHIVED"), [items]);
  const archived = useMemo(() => items.filter((item) => item.status === "ARCHIVED"), [items]);

  if (!available) return null;
  return <details className="mt-8 rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6">
    <summary className="cursor-pointer text-lg font-bold text-brand-deepTeal">Payment status and history</summary>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-deepTeal/70">Pause or cancel a confirmed regular payment, and link an existing transaction as payment history. No predicted transaction is created.</p>
    {message && <p role="status" className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{message}</p>}
    {error && <p role="alert" className="mt-4 rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
    {!ready ? <p aria-busy="true" className="mt-4 text-sm text-brand-deepTeal/65">Loading payment history…</p> : active.length === 0 ? <p className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm text-brand-deepTeal/70">No confirmed regular payments are available for lifecycle management.</p> : null}
    <div className="mt-4 space-y-3">{active.map((item) => {
      const options = compatibleCandidates(item, candidates);
      return <article key={item.id} className="rounded-2xl border border-border p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold text-brand-deepTeal">{item.label}</p><p className="mt-1 text-sm text-brand-deepTeal/65">{amountLabel(item)} · {cadenceLabel[item.cadence] ?? "Other"}{item.nextExpectedDate ? ` · next expected ${item.nextExpectedDate}` : ""}</p><p className="mt-1 text-xs text-brand-deepTeal/55">{confidenceLabel(item)}</p></div>{item.status !== "ACTIVE" && <span className="w-fit rounded-full bg-surface-mint px-3 py-1 text-xs font-bold text-brand-teal">{statusLabel[item.status]}</span>}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {item.status === "ACTIVE" && <button type="button" onClick={() => void mutate({ action: "SET_STATUS", itemId: item.id, updatedAt: item.updatedAt, status: "PAUSED" }, item.id, "Regular payment paused.")} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal"><Pause aria-hidden="true" className="h-3.5 w-3.5" />Pause</button>}
          {["PAUSED", "CANCELLED", "UNKNOWN", "NEEDS_REVIEW"].includes(item.status) && <button type="button" onClick={() => void mutate({ action: "SET_STATUS", itemId: item.id, updatedAt: item.updatedAt, status: "ACTIVE" }, item.id, "Regular payment marked active.")} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal"><Play aria-hidden="true" className="h-3.5 w-3.5" />Mark active</button>}
          <button type="button" onClick={() => setLinkingId(item.id)} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal"><Link2 aria-hidden="true" className="h-3.5 w-3.5" />Link transaction</button>
        </div>
        {linkingId === item.id && <div className="mt-3 rounded-2xl bg-surface-mint p-3"><label className="text-xs font-bold text-brand-deepTeal">Existing matching transaction<select value={candidateByItem[item.id] ?? ""} onChange={(event) => setCandidateByItem((current) => ({ ...current, [item.id]: event.target.value }))} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal"><option value="">Choose a transaction</option>{options.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.date} · {formatAudFromCents(candidate.amountCents)}</option>)}</select></label>{options.length === 0 && <p className="mt-2 text-xs text-brand-deepTeal/65">No unlinked transaction matches this payment’s direction and amount.</p>}<div className="mt-3 flex gap-2"><button type="button" disabled={!candidateByItem[item.id] || busy === item.id} onClick={() => void mutate({ action: "LINK_INSTANCE", itemId: item.id, transactionId: candidateByItem[item.id] }, item.id, "Transaction linked to regular payment history.")} className="min-h-10 rounded-full bg-brand-evergreen px-3 text-xs font-bold text-white disabled:opacity-50">Confirm link</button><button type="button" onClick={() => setLinkingId(null)} className="min-h-10 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal">Cancel</button></div></div>}
        <details className="mt-4 border-t border-border pt-3"><summary className="cursor-pointer text-sm font-bold text-brand-deepTeal">Payment history ({item.instances.length})</summary>{item.instances.length === 0 ? <p className="mt-2 text-sm text-brand-deepTeal/60">No transactions linked yet.</p> : <ul className="mt-2 space-y-2">{item.instances.map((instance) => <li key={instance.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-mint p-3 text-sm"><span className="font-semibold text-brand-deepTeal">{instance.date} · {formatAudFromCents(instance.amountCents)}</span><button type="button" aria-label={`Unlink ${item.label} transaction from ${instance.date}`} onClick={() => void mutate({ action: "UNLINK_INSTANCE", itemId: item.id, instanceId: instance.id }, instance.id, "Transaction removed from regular payment history.")} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal"><Unlink aria-hidden="true" className="h-3.5 w-3.5" />Unlink</button></li>)}</ul>}<div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void mutate({ action: "SET_STATUS", itemId: item.id, updatedAt: item.updatedAt, status: "CANCELLED" }, item.id, "Regular payment marked cancelled.")} className="min-h-10 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal">Mark cancelled</button><button type="button" onClick={() => void mutate({ action: "SET_STATUS", itemId: item.id, updatedAt: item.updatedAt, status: "NEEDS_REVIEW" }, item.id, "Regular payment marked for review.")} className="min-h-10 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal">Needs review</button><button type="button" onClick={() => void mutate({ action: "SET_STATUS", itemId: item.id, updatedAt: item.updatedAt, status: "ARCHIVED" }, item.id, "Regular payment moved to deleted items.")} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-danger-red"><Trash2 aria-hidden="true" className="h-3.5 w-3.5" />Delete</button></div></details>
      </article>;
    })}</div>
    {archived.length > 0 && <details className="mt-4 rounded-2xl bg-surface-mint p-4"><summary className="cursor-pointer text-sm font-bold text-brand-deepTeal">Deleted regular payments ({archived.length})</summary><div className="mt-3 space-y-2">{archived.map((item) => <div key={item.id} className="flex items-center justify-between gap-3"><span className="font-semibold text-brand-deepTeal">{item.label}</span><button type="button" onClick={() => void mutate({ action: "SET_STATUS", itemId: item.id, updatedAt: item.updatedAt, status: "ACTIVE" }, item.id, "Regular payment restored.")} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal"><RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />Restore</button></div>)}</div></details>}
  </details>;
}
