"use client";

import { Archive, Landmark, Plus, RotateCcw, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatAudFromCents } from "@/lib/money";

type Kind = "ASSET" | "LIABILITY";
type Category = "CASH" | "PROPERTY" | "INVESTMENT" | "SUPERANNUATION" | "VEHICLE" | "OTHER_ASSET" | "HOME_LOAN" | "PERSONAL_LOAN" | "CREDIT_CARD" | "OTHER_LIABILITY";
type Item = {
  id: string;
  name: string;
  kind: Kind;
  category: Category;
  status: "ACTIVE" | "ARCHIVED";
  propertyId: string | null;
  loanAccountId: string | null;
  currentValueCents: number | null;
  valuationDate: string | null;
  updatedAt: string;
  valuations: Array<{ id: string; valueCents: number; valuationDate: string; note: string | null }>;
};
type Snapshot = { id: string; snapshotDate: string; totalAssetCents: number; totalLiabilityCents: number; netWorthCents: number; entryCount: number };
type Option = { id: string; nickname: string };
type Overview = {
  ok: true;
  items: Item[];
  snapshots: Snapshot[];
  linkOptions: { properties: Option[]; loanAccounts: Option[] };
} | { ok: false; error: string };

const labels: Record<Category, string> = {
  CASH: "Cash", PROPERTY: "Property", INVESTMENT: "Investments", SUPERANNUATION: "Superannuation",
  VEHICLE: "Vehicle", OTHER_ASSET: "Other asset", HOME_LOAN: "Home loan",
  PERSONAL_LOAN: "Personal loan", CREDIT_CARD: "Credit card", OTHER_LIABILITY: "Other liability",
};
const categories: Record<Kind, Category[]> = {
  ASSET: ["CASH", "PROPERTY", "INVESTMENT", "SUPERANNUATION", "VEHICLE", "OTHER_ASSET"],
  LIABILITY: ["HOME_LOAN", "PERSONAL_LOAN", "CREDIT_CARD", "OTHER_LIABILITY"],
};

function parseCents(value: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, decimal = ""] = value.trim().split(".");
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

function todayInBrisbane() {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

async function readOverview(response: Response): Promise<Overview> {
  try {
    const payload = await response.json() as Overview;
    if (response.ok && payload.ok) return payload;
    return { ok: false, error: payload.ok ? "Net worth could not be loaded." : payload.error };
  } catch {
    return { ok: false, error: "Net worth could not be loaded." };
  }
}

function ItemForm({ options, busy, onCancel, onSave }: {
  options: { properties: Option[]; loanAccounts: Option[] };
  busy: boolean;
  onCancel: () => void;
  onSave: (input: { name: string; kind: Kind; category: Category; propertyId: string | null; loanAccountId: string | null }) => void;
}) {
  const [kind, setKind] = useState<Kind>("ASSET");
  const [category, setCategory] = useState<Category>("CASH");
  const [name, setName] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [error, setError] = useState("");
  const sourceOptions = category === "PROPERTY" ? options.properties : kind === "LIABILITY" ? options.loanAccounts : [];

  function changeKind(next: Kind) {
    setKind(next); setCategory(categories[next][0]); setSourceId("");
  }
  function submit() {
    if (!name.trim()) { setError("Enter a name."); return; }
    onSave({
      name,
      kind,
      category,
      propertyId: category === "PROPERTY" && sourceId ? sourceId : null,
      loanAccountId: kind === "LIABILITY" && sourceId ? sourceId : null,
    });
  }

  return <div className="rounded-2xl border border-border bg-surface-base p-4">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-bold text-brand-deepTeal">Record type<select value={kind} onChange={(event) => changeKind(event.target.value as Kind)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal"><option value="ASSET">Asset</option><option value="LIABILITY">Liability</option></select></label>
      <label className="text-xs font-bold text-brand-deepTeal">Category<select value={category} onChange={(event) => { setCategory(event.target.value as Category); setSourceId(""); }} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal">{categories[kind].map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></label>
      <label className="text-xs font-bold text-brand-deepTeal">Name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className="mt-2 min-h-11 w-full rounded-xl border border-border px-3 text-sm font-normal" /></label>
      {sourceOptions.length > 0 && <label className="text-xs font-bold text-brand-deepTeal">Link existing record (optional)<select value={sourceId} onChange={(event) => setSourceId(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal"><option value="">Keep manual and separate</option>{sourceOptions.map((option) => <option key={option.id} value={option.id}>{option.nickname}</option>)}</select></label>}
    </div>
    <p className="mt-3 text-xs leading-5 text-brand-deepTeal/65">Link a Property or Loan Account only when this manual record represents that same item. SpendGrove will not infer or update its value automatically.</p>
    {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger-red">{error}</p>}
    <div className="mt-3 flex gap-2"><button type="button" disabled={busy} onClick={submit} className="min-h-11 rounded-full bg-brand-evergreen px-4 text-sm font-bold text-white">Create record</button><button type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-full border border-border px-4 text-sm font-bold text-brand-deepTeal">Cancel</button></div>
  </div>;
}

function ValuationForm({ item, busy, onCancel, onSave }: {
  item: Item; busy: boolean; onCancel: () => void;
  onSave: (valueCents: number, valuationDate: string, note: string | null) => void;
}) {
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayInBrisbane());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  function submit() {
    const valueCents = parseCents(value);
    if (valueCents === null) { setError("Enter a value greater than zero."); return; }
    onSave(valueCents, date, note.trim() || null);
  }
  return <div className="mt-3 rounded-2xl bg-surface-mint p-4"><p className="text-sm font-bold text-brand-deepTeal">Add manual value for {item.name}</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="text-xs font-bold text-brand-deepTeal">Value (AUD)<input value={value} onChange={(event) => setValue(event.target.value)} inputMode="decimal" className="mt-2 min-h-11 w-full rounded-xl border border-border px-3 text-sm font-normal" /></label><label className="text-xs font-bold text-brand-deepTeal">Valuation date<input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="mt-2 min-h-11 w-full rounded-xl border border-border px-3 text-sm font-normal" /></label><label className="text-xs font-bold text-brand-deepTeal">Note (optional)<input value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} className="mt-2 min-h-11 w-full rounded-xl border border-border px-3 text-sm font-normal" /></label></div>{error && <p role="alert" className="mt-3 text-sm font-semibold text-danger-red">{error}</p>}<div className="mt-3 flex gap-2"><button type="button" disabled={busy} onClick={submit} className="min-h-11 rounded-full bg-brand-evergreen px-4 text-sm font-bold text-white">Save value</button><button type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-full border border-border px-4 text-sm font-bold text-brand-deepTeal">Cancel</button></div></div>;
}

export function NetWorthPanel({ available = false }: { available?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [options, setOptions] = useState<{ properties: Option[]; loanAccounts: Option[] }>({ properties: [], loanAccounts: [] });
  const [ready, setReady] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [valuationId, setValuationId] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function apply(result: Extract<Overview, { ok: true }>) { setItems(result.items); setSnapshots(result.snapshots); setOptions(result.linkOptions); }
  async function load() {
    const result = await readOverview(await fetch("/api/account/net-worth", { cache: "no-store" }));
    if (result.ok) apply(result); else setError(result.error);
    setReady(true);
  }
  useEffect(() => { if (available) void load(); }, [available]);
  async function mutate(payload: Record<string, unknown>, key: string, success: string) {
    if (busy) return;
    setBusy(key); setError(""); setMessage("");
    const result = await readOverview(await fetch("/api/account/net-worth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }));
    setBusy("");
    if (!result.ok) { setError(result.error); return; }
    apply(result); setCreateOpen(false); setValuationId(null); setMessage(success);
  }

  const active = items.filter((item) => item.status === "ACTIVE");
  const archived = items.filter((item) => item.status === "ARCHIVED");
  const totals = useMemo(() => {
    const assets = active.filter((item) => item.kind === "ASSET").reduce((sum, item) => sum + (item.currentValueCents ?? 0), 0);
    const liabilities = active.filter((item) => item.kind === "LIABILITY").reduce((sum, item) => sum + (item.currentValueCents ?? 0), 0);
    return { assets, liabilities, net: assets - liabilities };
  }, [active]);

  if (!available) return null;
  return <section className="mt-8 space-y-4" aria-labelledby="net-worth-heading">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-brand-teal">Manual planning</p><h2 id="net-worth-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">Net worth</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-brand-deepTeal/70">Track manual asset and liability values. Nothing is linked to a bank or market data provider.</p></div>{!createOpen && <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white"><Plus aria-hidden="true" className="h-4 w-4" />Add record</button>}</div>
    {message && <p role="status" className="rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{message}</p>}
    {error && <p role="alert" className="rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
    {createOpen && <ItemForm options={options} busy={busy === "create"} onCancel={() => setCreateOpen(false)} onSave={(fields) => void mutate({ action: "CREATE_ITEM", ...fields }, "create", "Manual net worth record created.")} />}
    <div className="grid gap-3 sm:grid-cols-3">{[["Assets", totals.assets], ["Liabilities", totals.liabilities], ["Net worth", totals.net]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-border bg-surface-base p-4"><p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-teal">{label}</p><p className="mt-2 text-xl font-bold text-brand-deepTeal">{formatAudFromCents(Number(value))}</p></div>)}</div>
    {!ready ? <p aria-busy="true" className="rounded-2xl bg-surface-mint p-4 text-sm text-brand-deepTeal">Loading manual values…</p> : active.length === 0 ? <div className="rounded-2xl border border-border bg-surface-base p-5"><Landmark aria-hidden="true" className="h-6 w-6 text-brand-teal" /><p className="mt-3 font-bold text-brand-deepTeal">No active net worth records</p><p className="mt-1 text-sm text-brand-deepTeal/65">Add only the assets and liabilities you want to track manually.</p></div> : null}
    <div className="grid gap-4 lg:grid-cols-2">{active.map((item) => <article key={item.id} className="rounded-2xl border border-border bg-surface-base p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-brand-deepTeal">{item.name}</p><p className="mt-1 text-xs text-brand-deepTeal/60">{labels[item.category]} · {item.kind === "ASSET" ? "Asset" : "Liability"}</p></div><p className="text-right text-lg font-bold text-brand-deepTeal">{item.currentValueCents === null ? "No value yet" : formatAudFromCents(item.currentValueCents)}</p></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setValuationId(item.id)} className="min-h-10 rounded-full bg-brand-evergreen px-3 text-xs font-bold text-white">Add value</button><button type="button" onClick={() => void mutate({ action: "SET_ITEM_STATUS", itemId: item.id, updatedAt: item.updatedAt, status: "ARCHIVED" }, item.id, "Record moved to deleted items.")} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal"><Archive aria-hidden="true" className="h-3.5 w-3.5" />Delete</button></div>{valuationId === item.id && <ValuationForm item={item} busy={busy === item.id} onCancel={() => setValuationId(null)} onSave={(valueCents, valuationDate, note) => void mutate({ action: "ADD_VALUATION", itemId: item.id, valueCents, valuationDate, note }, item.id, "Manual value added.")} />}<details className="mt-4 border-t border-border pt-3"><summary className="cursor-pointer text-sm font-bold text-brand-deepTeal">Value history ({item.valuations.length})</summary>{item.valuations.length === 0 ? <p className="mt-2 text-sm text-brand-deepTeal/60">No values recorded.</p> : <ul className="mt-2 space-y-2">{item.valuations.map((value) => <li key={value.id} className="flex justify-between gap-3 text-sm"><span><span className="font-semibold text-brand-deepTeal">{value.valuationDate}</span>{value.note && <span className="block text-xs text-brand-deepTeal/60">{value.note}</span>}</span><strong className="text-brand-deepTeal">{formatAudFromCents(value.valueCents)}</strong></li>)}</ul>}</details></article>)}</div>
    <div className="rounded-2xl border border-border bg-surface-base p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-brand-deepTeal">Snapshot history</p><p className="mt-1 text-sm text-brand-deepTeal/65">Save today’s current manual values as a point-in-time history entry.</p></div><button type="button" onClick={() => void mutate({ action: "CREATE_SNAPSHOT", snapshotDate: todayInBrisbane() }, "snapshot", "Net worth snapshot saved.")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal"><TrendingUp aria-hidden="true" className="h-4 w-4" />Save snapshot</button></div>{snapshots.length > 0 && <ul className="mt-4 space-y-2">{snapshots.map((snapshot) => <li key={snapshot.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-mint p-3 text-sm"><span className="font-semibold text-brand-deepTeal">{snapshot.snapshotDate} · {snapshot.entryCount} record{snapshot.entryCount === 1 ? "" : "s"}</span><strong className="text-brand-deepTeal">{formatAudFromCents(snapshot.netWorthCents)}</strong></li>)}</ul>}</div>
    {archived.length > 0 && <details className="rounded-2xl border border-border bg-surface-base p-4"><summary className="cursor-pointer text-sm font-bold text-brand-deepTeal">Deleted net worth records ({archived.length})</summary><div className="mt-3 space-y-2">{archived.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-surface-mint p-3"><span className="font-semibold text-brand-deepTeal">{item.name}</span><button type="button" onClick={() => void mutate({ action: "SET_ITEM_STATUS", itemId: item.id, updatedAt: item.updatedAt, status: "ACTIVE" }, item.id, "Record restored.")} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal"><RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />Restore</button></div>)}</div></details>}
    <p className="rounded-2xl bg-surface-mint p-4 text-xs leading-5 text-brand-deepTeal/70">Values are entered by you and may be out of date. SpendGrove does not provide valuations, financial advice or live account balances. Link existing Property or Loan records only to avoid tracking the same item twice.</p>
  </section>;
}
