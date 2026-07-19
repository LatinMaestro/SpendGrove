"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { Pause, Pencil, PiggyBank, Play, Plus, RotateCcw, Target, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatAudFromCents } from "@/lib/money";

type Contribution = {
  id: string;
  amountCents: number;
  contributionDate: string;
  note: string | null;
};

type Goal = {
  id: string;
  name: string;
  targetAmountCents: number;
  targetDate: string | null;
  progressCents: number;
  remainingCents: number;
  progressPercent: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
  completedAt: string | null;
  updatedAt: string;
  contributions: Contribution[];
};

type GoalResponse = { ok: true; goals: Goal[] } | { ok: false; error: string };

function parseCents(value: string) {
  const cleaned = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, decimal = ""] = cleaned.split(".");
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

function centsInput(cents: number) {
  return (cents / 100).toFixed(2);
}

function todayInBrisbane() {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

async function readResponse(response: Response): Promise<GoalResponse> {
  try {
    const payload = await response.json() as GoalResponse;
    if (response.ok && payload.ok) return payload;
    return { ok: false, error: payload.ok ? "Savings goals could not be loaded." : payload.error };
  } catch {
    return { ok: false, error: "Savings goals could not be loaded." };
  }
}

function GoalForm({
  initial,
  busy,
  onCancel,
  onSave,
}: {
  initial?: Goal;
  busy: boolean;
  onCancel: () => void;
  onSave: (fields: { name: string; targetAmountCents: number; targetDate: string | null; openingProgressCents: number }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [target, setTarget] = useState(initial ? centsInput(initial.targetAmountCents) : "");
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? "");
  const [opening, setOpening] = useState(initial ? centsInput(Math.max(0, initial.progressCents - initial.contributions.reduce((sum, item) => sum + item.amountCents, 0))) : "0.00");
  const [error, setError] = useState("");

  function submit() {
    const targetAmountCents = parseCents(target);
    const openingProgressCents = opening.trim() === "0" || opening.trim() === "0.00" ? 0 : parseCents(opening);
    if (!name.trim()) { setError("Enter a goal name."); return; }
    if (targetAmountCents === null || openingProgressCents === null) {
      setError("Enter valid dollar amounts greater than zero. Starting progress may be zero.");
      return;
    }
    setError("");
    onSave({ name, targetAmountCents, targetDate: targetDate || null, openingProgressCents });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-base p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-brand-deepTeal">Goal name
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className="mt-2 min-h-11 w-full rounded-xl border border-border px-3 text-sm font-normal" />
        </label>
        <label className="text-xs font-bold text-brand-deepTeal">Target amount (AUD)
          <input value={target} onChange={(event) => setTarget(event.target.value)} inputMode="decimal" placeholder="5000.00" className="mt-2 min-h-11 w-full rounded-xl border border-border px-3 text-sm font-normal" />
        </label>
        <label className="text-xs font-bold text-brand-deepTeal">Target date (optional)
          <input value={targetDate} onChange={(event) => setTargetDate(event.target.value)} type="date" className="mt-2 min-h-11 w-full rounded-xl border border-border px-3 text-sm font-normal" />
        </label>
        <label className="text-xs font-bold text-brand-deepTeal">Starting progress (AUD)
          <input value={opening} onChange={(event) => setOpening(event.target.value)} inputMode="decimal" className="mt-2 min-h-11 w-full rounded-xl border border-border px-3 text-sm font-normal" />
        </label>
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger-red">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={submit} className="min-h-11 rounded-full bg-brand-evergreen px-4 text-sm font-bold text-white disabled:opacity-50">{busy ? "Saving…" : initial ? "Save changes" : "Create goal"}</button>
        <button type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-full border border-border px-4 text-sm font-bold text-brand-deepTeal">Cancel</button>
      </div>
    </div>
  );
}

function ContributionForm({ goal, busy, onCancel, onSave }: {
  goal: Goal;
  busy: boolean;
  onCancel: () => void;
  onSave: (amountCents: number, contributionDate: string, note: string | null) => void;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInBrisbane());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const amountCents = parseCents(amount);
    if (amountCents === null) { setError("Enter a contribution greater than zero."); return; }
    onSave(amountCents, date, note.trim() || null);
  }

  return <div className="mt-3 rounded-2xl bg-surface-mint p-4">
    <p className="text-sm font-bold text-brand-deepTeal">Add manual progress to {goal.name}</p>
    <p className="mt-1 text-xs leading-5 text-brand-deepTeal/65">This planning entry does not create a transaction or move money.</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-3">
      <label className="text-xs font-bold text-brand-deepTeal">Amount (AUD)<input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className="mt-2 min-h-11 w-full rounded-xl border border-border px-3 text-sm font-normal" /></label>
      <label className="text-xs font-bold text-brand-deepTeal">Date<input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="mt-2 min-h-11 w-full rounded-xl border border-border px-3 text-sm font-normal" /></label>
      <label className="text-xs font-bold text-brand-deepTeal">Note (optional)<input value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} className="mt-2 min-h-11 w-full rounded-xl border border-border px-3 text-sm font-normal" /></label>
    </div>
    {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger-red">{error}</p>}
    <div className="mt-3 flex gap-2">
      <button type="button" disabled={busy} onClick={submit} className="min-h-11 rounded-full bg-brand-evergreen px-4 text-sm font-bold text-white">Add progress</button>
      <button type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-full border border-border px-4 text-sm font-bold text-brand-deepTeal">Cancel</button>
    </div>
  </div>;
}

export function SavingsGoals({ available = false }: { available?: boolean }) {
  const { isLoaded, isSignedIn } = useUser();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [ready, setReady] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const result = await readResponse(await fetch("/api/account/savings-goals", { cache: "no-store" }));
    if (result.ok) setGoals(result.goals); else setError(result.error);
    setReady(true);
  }

  useEffect(() => {
    if (!available || !isLoaded || !isSignedIn) return;
    void load();
  }, [available, isLoaded, isSignedIn]);

  async function mutate(payload: Record<string, unknown>, key: string, success: string) {
    if (busy) return;
    setBusy(key); setError(""); setMessage("");
    const result = await readResponse(await fetch("/api/account/savings-goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }));
    setBusy("");
    if (!result.ok) { setError(result.error); return; }
    setGoals(result.goals); setCreateOpen(false); setEditingId(null); setContributionGoalId(null); setMessage(success);
  }

  if (!available) return null;
  if (!isLoaded) return <p className="mt-6 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">Checking savings goals…</p>;
  if (!isSignedIn) return <section className="mt-6 rounded-[2rem] border border-border bg-surface-base p-5"><h2 className="text-xl font-bold text-brand-deepTeal">Savings goals</h2><p className="mt-2 text-sm text-brand-deepTeal/70">Sign in to keep private planning goals with your account.</p><SignInButton mode="modal"><button type="button" className="mt-4 min-h-11 rounded-full bg-brand-evergreen px-4 text-sm font-bold text-white">Sign in</button></SignInButton></section>;

  const active = goals.filter((goal) => goal.status !== "ARCHIVED");
  const archived = goals.filter((goal) => goal.status === "ARCHIVED");

  return <section className="mt-8 space-y-4" aria-labelledby="savings-goals-heading">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-semibold text-brand-teal">Planning</p><h2 id="savings-goals-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">Savings goals</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-brand-deepTeal/70">Track manual progress without creating transactions or moving money.</p></div>
      {!createOpen && <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white"><Plus aria-hidden="true" className="h-4 w-4" />Add goal</button>}
    </div>
    {message && <p role="status" className="rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{message}</p>}
    {error && <p role="alert" className="rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
    {createOpen && <GoalForm busy={busy === "create"} onCancel={() => setCreateOpen(false)} onSave={(fields) => void mutate({ action: "CREATE", ...fields }, "create", "Savings goal created.")} />}
    {!ready ? <p aria-busy="true" className="rounded-2xl bg-surface-mint p-4 text-sm text-brand-deepTeal">Loading goals…</p> : active.length === 0 && !createOpen ? <div className="rounded-2xl border border-border bg-surface-base p-5"><Target aria-hidden="true" className="h-6 w-6 text-brand-teal" /><p className="mt-3 font-bold text-brand-deepTeal">No active goals yet</p><p className="mt-1 text-sm text-brand-deepTeal/65">Add a goal when you have something you would like to plan for.</p></div> : null}
    <div className="grid gap-4 lg:grid-cols-2">
      {active.map((goal) => <article key={goal.id} className="rounded-[1.5rem] border border-border bg-surface-base p-5">
        {editingId === goal.id ? <GoalForm initial={goal} busy={busy === goal.id} onCancel={() => setEditingId(null)} onSave={(fields) => void mutate({ action: "UPDATE", goalId: goal.id, updatedAt: goal.updatedAt, ...fields }, goal.id, "Savings goal updated.")} /> : <>
          <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-brand-deepTeal">{goal.name}</p><p className="mt-1 text-sm text-brand-deepTeal/65">{formatAudFromCents(goal.progressCents)} of {formatAudFromCents(goal.targetAmountCents)}{goal.targetDate ? ` · by ${new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(new Date(`${goal.targetDate}T00:00:00Z`))}` : ""}</p></div>{goal.status !== "ACTIVE" && <span className="rounded-full bg-surface-mint px-3 py-1 text-xs font-bold text-brand-teal">{goal.status === "PAUSED" ? "Paused" : "Complete"}</span>}</div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-mint" aria-label={`${goal.name} progress ${goal.progressPercent}%`}><div className="h-full rounded-full bg-brand-green" style={{ width: `${Math.min(goal.progressPercent, 100)}%` }} /></div>
          <div className="mt-2 flex justify-between text-xs text-brand-deepTeal/60"><span>{goal.progressPercent}%</span><span>{formatAudFromCents(goal.remainingCents)} left</span></div>
          <div className="mt-4 flex flex-wrap gap-2">
            {goal.status !== "COMPLETED" && <button type="button" onClick={() => setContributionGoalId(goal.id)} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-brand-evergreen px-3 text-xs font-bold text-white"><Plus aria-hidden="true" className="h-3.5 w-3.5" />Add progress</button>}
            <button type="button" onClick={() => setEditingId(goal.id)} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal"><Pencil aria-hidden="true" className="h-3.5 w-3.5" />Edit</button>
            {goal.status === "ACTIVE" && <button type="button" onClick={() => void mutate({ action: "SET_STATUS", goalId: goal.id, updatedAt: goal.updatedAt, status: "PAUSED" }, goal.id, "Goal paused.")} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal"><Pause aria-hidden="true" className="h-3.5 w-3.5" />Pause</button>}
            {goal.status === "PAUSED" && <button type="button" onClick={() => void mutate({ action: "SET_STATUS", goalId: goal.id, updatedAt: goal.updatedAt, status: "ACTIVE" }, goal.id, "Goal resumed.")} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal"><Play aria-hidden="true" className="h-3.5 w-3.5" />Resume</button>}
          </div>
          {contributionGoalId === goal.id && <ContributionForm goal={goal} busy={busy === `contribution-${goal.id}`} onCancel={() => setContributionGoalId(null)} onSave={(amountCents, contributionDate, note) => void mutate({ action: "ADD_CONTRIBUTION", goalId: goal.id, amountCents, contributionDate, note }, `contribution-${goal.id}`, "Manual progress added.")} />}
          <details className="mt-4 border-t border-border pt-3"><summary className="cursor-pointer text-sm font-bold text-brand-deepTeal">History and more</summary>
            {goal.contributions.length === 0 ? <p className="mt-3 text-sm text-brand-deepTeal/60">No manual contributions yet.</p> : <ul className="mt-3 space-y-2">{goal.contributions.map((item) => <li key={item.id} className="flex items-start justify-between gap-3 text-sm"><span><span className="font-semibold text-brand-deepTeal">{new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(new Date(`${item.contributionDate}T00:00:00Z`))}</span>{item.note ? <span className="block text-xs text-brand-deepTeal/60">{item.note}</span> : null}</span><span className="flex items-center gap-2 font-bold text-brand-deepTeal">{formatAudFromCents(item.amountCents)}<button type="button" aria-label={`Remove contribution from ${goal.name}`} onClick={() => void mutate({ action: "DELETE_CONTRIBUTION", goalId: goal.id, contributionId: item.id }, `delete-${item.id}`, "Contribution removed.")} className="min-h-10 min-w-10 rounded-full border border-border p-2 text-danger-red"><Trash2 aria-hidden="true" className="h-4 w-4" /></button></span></li>)}</ul>}
            <div className="mt-3 flex flex-wrap gap-2">
              {goal.status !== "COMPLETED" && <button type="button" onClick={() => void mutate({ action: "SET_STATUS", goalId: goal.id, updatedAt: goal.updatedAt, status: "COMPLETED" }, goal.id, "Goal marked complete.")} className="min-h-10 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal">Mark complete</button>}
              <button type="button" onClick={() => void mutate({ action: "SET_STATUS", goalId: goal.id, updatedAt: goal.updatedAt, status: "ARCHIVED" }, goal.id, "Goal moved to deleted goals.")} className="min-h-10 rounded-full border border-border px-3 text-xs font-bold text-danger-red">Delete goal</button>
            </div>
          </details>
        </>}
      </article>)}
    </div>
    {archived.length > 0 && <details className="rounded-2xl border border-border bg-surface-base p-4"><summary className="cursor-pointer text-sm font-bold text-brand-deepTeal">Deleted goals ({archived.length})</summary><div className="mt-3 space-y-2">{archived.map((goal) => <div key={goal.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-mint p-3"><span className="font-semibold text-brand-deepTeal">{goal.name}</span><button type="button" onClick={() => void mutate({ action: "SET_STATUS", goalId: goal.id, updatedAt: goal.updatedAt, status: "ACTIVE" }, goal.id, "Goal restored.")} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal"><RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />Restore</button></div>)}</div></details>}
    <div className="flex items-start gap-2 rounded-2xl bg-surface-mint p-4"><PiggyBank aria-hidden="true" className="mt-0.5 h-5 w-5 text-brand-teal" /><p className="text-xs leading-5 text-brand-deepTeal/70">Savings goals are planning records. Contributions do not move money and do not change income, spending, budgets or transaction history.</p></div>
  </section>;
}
