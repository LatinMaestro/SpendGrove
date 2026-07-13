"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { CalendarClock, CheckCircle2, Pencil, Repeat2, RotateCcw, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatAudFromCents } from "@/lib/money";

type Cadence = "WEEKLY" | "FORTNIGHTLY" | "MONTHLY" | "OTHER";

type Suggestion = {
  key: string;
  label: string;
  categoryId: string;
  categoryLabel: string;
  transactionType: "INCOME" | "EXPENSE";
  expectedAmountCents: number;
  cadence: Exclude<Cadence, "OTHER">;
  nextExpectedDate: string;
  confidence: "HIGH" | "REVIEW";
  occurrenceCount: number;
  why: string;
};

type RecurringItem = {
  id: string;
  label: string;
  categoryId: string | null;
  categoryLabel: string | null;
  transactionType: string;
  expectedAmountCents: number | null;
  cadence: Cadence;
  nextExpectedDate: string | null;
  status: "ACTIVE" | "ARCHIVED";
  updatedAt: string;
};

type RecurringSnapshotResult =
  | { ok: true; suggestions: Suggestion[]; dismissedSuggestions: Suggestion[]; items: RecurringItem[] }
  | { ok: false; error: string };

type RecurringDraft = {
  label: string;
  amountInput: string;
  cadence: Cadence;
  nextExpectedDate: string;
};

const cadenceLabels: Record<Cadence, string> = {
  WEEKLY: "Weekly",
  FORTNIGHTLY: "Every 2 weeks",
  MONTHLY: "Monthly",
  OTHER: "Other",
};

function centsToInput(cents: number | null) {
  return cents === null ? "" : (cents / 100).toFixed(2);
}

function inputToCents(value: string) {
  const cleaned = value.trim();
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, decimal = ""] = cleaned.split(".");
  const sign = whole.startsWith("-") ? -1 : 1;
  const digits = whole.replace("-", "");
  const cents = Number(digits) * 100 + Number(decimal.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents === 0) return null;
  return cents * sign;
}

function suggestionDraft(suggestion: Suggestion): RecurringDraft {
  return {
    label: suggestion.label,
    amountInput: centsToInput(suggestion.expectedAmountCents),
    cadence: suggestion.cadence,
    nextExpectedDate: suggestion.nextExpectedDate,
  };
}

function itemDraft(item: RecurringItem): RecurringDraft {
  return {
    label: item.label,
    amountInput: centsToInput(item.expectedAmountCents),
    cadence: item.cadence,
    nextExpectedDate: item.nextExpectedDate ?? "",
  };
}

async function readSnapshot(response: Response): Promise<RecurringSnapshotResult> {
  try {
    const payload = await response.json() as RecurringSnapshotResult;
    if (response.ok && payload.ok) return payload;
    return { ok: false, error: payload.ok === false ? payload.error : "Recurring items could not be loaded safely." };
  } catch {
    return { ok: false, error: "Recurring items could not be loaded safely." };
  }
}

async function requestSnapshot(init?: RequestInit): Promise<RecurringSnapshotResult> {
  try {
    return readSnapshot(await fetch("/api/account/recurring", {
      cache: "no-store",
      ...init,
    }));
  } catch {
    return { ok: false, error: "Recurring items could not be loaded safely. Check your connection and try again." };
  }
}

function SignedOutRecurringCard() {
  return (
    <section className="mt-5 rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-surface-mint p-3 text-brand-green">
          <Repeat2 aria-hidden="true" className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-teal">Recurring payments</p>
          <h2 className="mt-1 text-2xl font-bold text-brand-deepTeal">Sign in to review recurring suggestions</h2>
          <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">
            Suggestions use only cleaned account transactions and remain suggestions until you confirm them.
          </p>
          <SignInButton mode="modal">
            <button type="button" className="mt-4 min-h-12 rounded-full bg-brand-green px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal">
              Sign in to review
            </button>
          </SignInButton>
        </div>
      </div>
    </section>
  );
}

function RecurringExperience() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Suggestion[]>([]);
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, RecurringDraft>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function applySnapshot(snapshot: Extract<RecurringSnapshotResult, { ok: true }>) {
    setSuggestions(snapshot.suggestions);
    setDismissedSuggestions(snapshot.dismissedSuggestions);
    setItems(snapshot.items);
    setDrafts((current) => {
      const next = { ...current };
      for (const suggestion of [...snapshot.suggestions, ...snapshot.dismissedSuggestions]) {
        next[suggestion.key] ??= suggestionDraft(suggestion);
      }
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsReady(false);
      const result = await requestSnapshot();
      if (cancelled) return;
      if (result.ok) applySnapshot(result);
      else setError(result.error);
      setIsReady(true);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const activeItems = useMemo(() => items.filter((item) => item.status === "ACTIVE"), [items]);
  const archivedItems = useMemo(() => items.filter((item) => item.status === "ARCHIVED"), [items]);

  async function mutate(payload: Record<string, unknown>, busy: string, successMessage: string) {
    if (busyKey) return;
    setBusyKey(busy);
    setError("");
    setMessage("");
    const result = await requestSnapshot({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusyKey(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    applySnapshot(result);
    setEditingId(null);
    setMessage(successMessage);
  }

  function confirmSuggestion(suggestion: Suggestion) {
    const draft = drafts[suggestion.key] ?? suggestionDraft(suggestion);
    const expectedAmountCents = inputToCents(draft.amountInput);
    if (expectedAmountCents === null) {
      setError("Enter a non-zero expected amount using dollars and cents.");
      return;
    }
    void mutate({
      action: "CONFIRM",
      suggestionKey: suggestion.key,
      label: draft.label,
      expectedAmountCents,
      cadence: draft.cadence,
      nextExpectedDate: draft.nextExpectedDate || null,
    }, suggestion.key, "Regular payment confirmed. You can edit or delete it from the active list at any time.");
  }

  function dismissSuggestion(suggestion: Suggestion) {
    void mutate({
      action: "DISMISS",
      suggestionKey: suggestion.key,
    }, suggestion.key, "Suggestion dismissed.");
  }

  function saveItem(item: RecurringItem) {
    const draft = drafts[item.id] ?? itemDraft(item);
    const expectedAmountCents = inputToCents(draft.amountInput);
    if (expectedAmountCents === null) {
      setError("Enter a non-zero expected amount using dollars and cents.");
      return;
    }
    void mutate({
      action: "UPDATE",
      itemId: item.id,
      updatedAt: item.updatedAt,
      label: draft.label,
      expectedAmountCents,
      cadence: draft.cadence,
      nextExpectedDate: draft.nextExpectedDate || null,
    }, item.id, "Recurring item updated.");
  }

  function archiveItem(item: RecurringItem) {
    void mutate({
      action: "ARCHIVE",
      itemId: item.id,
      updatedAt: item.updatedAt,
    }, item.id, "Regular payment removed from the active list.");
  }

  function restoreItem(item: RecurringItem) {
    void mutate({
      action: "RESTORE",
      itemId: item.id,
      updatedAt: item.updatedAt,
    }, item.id, "Recurring item restored. No transaction or payment was created.");
  }

  function undoDismissal(suggestion: Suggestion) {
    void mutate({
      action: "UNDO_DISMISSAL",
      suggestionKey: suggestion.key,
    }, suggestion.key, "The suggestion is available for review again.");
  }

  function DraftFields({ draftKey, draft, disabled }: Readonly<{ draftKey: string; draft: RecurringDraft; disabled: boolean }>) {
    return (
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
          Label
          <input
            disabled={disabled}
            value={draft.label}
            maxLength={60}
            onChange={(event) => setDrafts((current) => ({ ...current, [draftKey]: { ...draft, label: event.target.value } }))}
            className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm font-normal normal-case tracking-normal text-brand-deepTeal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          />
        </label>
        <label className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
          Expected amount (AUD)
          <input
            disabled={disabled}
            value={draft.amountInput}
            inputMode="decimal"
            onChange={(event) => setDrafts((current) => ({ ...current, [draftKey]: { ...draft, amountInput: event.target.value } }))}
            className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm font-normal normal-case tracking-normal text-brand-deepTeal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          />
        </label>
        <label className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
          Repeats
          <select
            disabled={disabled}
            value={draft.cadence}
            onChange={(event) => setDrafts((current) => ({ ...current, [draftKey]: { ...draft, cadence: event.target.value as Cadence } }))}
            className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm font-normal normal-case tracking-normal text-brand-deepTeal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          >
            {Object.entries(cadenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
          Next expected date
          <input
            disabled={disabled}
            type="date"
            value={draft.nextExpectedDate}
            onChange={(event) => setDrafts((current) => ({ ...current, [draftKey]: { ...draft, nextExpectedDate: event.target.value } }))}
            className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm font-normal normal-case tracking-normal text-brand-deepTeal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          />
        </label>
      </div>
    );
  }

  return (
    <section className="mt-5 rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="recurring-heading">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-surface-mint p-3 text-brand-green">
          <Repeat2 aria-hidden="true" className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-teal">Regular payments</p>
          <h2 id="recurring-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">Review regular payments</h2>
          <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">
            Review patterns found in your transactions. Nothing is confirmed until you choose it.
          </p>
        </div>
      </div>

      {message && <p role="status" className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}

      {!isReady ? (
        <p className="mt-5 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal/70" aria-busy="true">Checking for regular payments…</p>
      ) : (
        <>
          <div className="mt-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand-teal">Suggested regular payments</p>
                <h3 className="mt-1 text-xl font-bold text-brand-deepTeal">{suggestions.length} to review</h3>
              </div>
              
            </div>
            {suggestions.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-surface-mint p-4 text-sm leading-6 text-brand-deepTeal/70">
                No clear recurring patterns need review yet. More reviewed transactions may provide enough evidence later.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {suggestions.map((suggestion) => {
                  const draft = drafts[suggestion.key] ?? suggestionDraft(suggestion);
                  const busy = busyKey === suggestion.key;
                  return (
                    <article key={suggestion.key} className="rounded-3xl border border-border bg-surface-mint/50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-bold text-brand-deepTeal">{suggestion.label}</p>
                          </div>
                          <p className="mt-1 text-sm text-brand-deepTeal/65">
                            {suggestion.categoryLabel} · {formatAudFromCents(suggestion.expectedAmountCents)} · {cadenceLabels[suggestion.cadence]}
                          </p>
                          <details className="mt-2 text-xs leading-5 text-brand-deepTeal/65"><summary className="cursor-pointer font-bold focus:outline-none focus:ring-2 focus:ring-brand-green">Why this was suggested</summary><p className="mt-1">{suggestion.why}</p></details>
                        </div>
                      </div>
                      <DraftFields draftKey={suggestion.key} draft={draft} disabled={busy} />
                      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button disabled={busy} type="button" onClick={() => dismissSuggestion(suggestion)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
                          <X aria-hidden="true" className="h-4 w-4" /> Dismiss
                        </button>
                        <button disabled={busy} type="button" onClick={() => confirmSuggestion(suggestion)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-green px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal">
                          <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> {busy ? "Saving…" : "Confirm regular payment"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {dismissedSuggestions.length > 0 && (
          <details className="mt-6 border-t border-border pt-5">
            <summary className="cursor-pointer text-base font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">Dismissed ({dismissedSuggestions.length})</summary>
            {dismissedSuggestions.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-brand-deepTeal/65">No dismissed suggestion currently matches an active recurring pattern.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {dismissedSuggestions.map((suggestion) => (
                  <article key={suggestion.key} className="rounded-3xl border border-border bg-surface-mint/50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-bold text-brand-deepTeal">{suggestion.label}</p>
                        <p className="mt-1 text-sm text-brand-deepTeal/65">{suggestion.categoryLabel} · {formatAudFromCents(suggestion.expectedAmountCents)} · {cadenceLabels[suggestion.cadence]}</p>
                        <p className="mt-2 text-xs leading-5 text-brand-deepTeal/60">This pattern is still present in current reviewed transactions.</p>
                      </div>
                      <button type="button" disabled={busyKey === suggestion.key} onClick={() => undoDismissal(suggestion)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal bg-white px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
                        <RotateCcw aria-hidden="true" className="h-4 w-4" /> Show suggestion again
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </details>
          )}

          <div className="mt-6 border-t border-border pt-5">
            <p className="text-sm font-semibold text-brand-teal">Confirmed regular payments</p>
            <h3 className="mt-1 text-xl font-bold text-brand-deepTeal">{activeItems.length} active</h3>
            {activeItems.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-brand-deepTeal/65">Confirmed regular payments will appear here. They do not move money.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {activeItems.map((item) => {
                  const editing = editingId === item.id;
                  const draft = drafts[item.id] ?? itemDraft(item);
                  const busy = busyKey === item.id;
                  return (
                    <article key={item.id} className="rounded-3xl border border-border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-lg font-bold text-brand-deepTeal">{item.label}</p>
                          <p className="mt-1 text-sm text-brand-deepTeal/65">
                            {item.categoryLabel ?? "Category unavailable"} · {item.expectedAmountCents === null ? "Amount not set" : formatAudFromCents(item.expectedAmountCents)} · {cadenceLabels[item.cadence]}
                          </p>
                          {item.nextExpectedDate && <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-brand-teal"><CalendarClock aria-hidden="true" className="h-4 w-4" /> Next expected {item.nextExpectedDate}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" disabled={busy} onClick={() => {
                            setDrafts((current) => ({ ...current, [item.id]: itemDraft(item) }));
                            setEditingId(editing ? null : item.id);
                          }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
                            <Pencil aria-hidden="true" className="h-4 w-4" /> Edit
                          </button>
                          <button type="button" disabled={busy} onClick={() => archiveItem(item)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
                            <Trash2 aria-hidden="true" className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      </div>
                      {editing && (
                        <>
                          <DraftFields draftKey={item.id} draft={draft} disabled={busy} />
                          <div className="mt-4 flex justify-end">
                            <button type="button" disabled={busy} onClick={() => saveItem(item)} className="min-h-11 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green">
                              {busy ? "Saving…" : "Save changes"}
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {archivedItems.length > 0 && (
          <details className="mt-6 border-t border-border pt-5">
            <summary className="cursor-pointer text-base font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">Deleted regular payments ({archivedItems.length})</summary>
            {archivedItems.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-brand-deepTeal/65">Deleted regular payments will appear here and can be restored.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {archivedItems.map((item) => (
                  <article key={item.id} className="rounded-3xl border border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-bold text-brand-deepTeal">{item.label}</p>
                        <p className="mt-1 text-sm text-brand-deepTeal/65">{item.categoryLabel ?? "Category unavailable"} · {item.expectedAmountCents === null ? "Amount not set" : formatAudFromCents(item.expectedAmountCents)} · {cadenceLabels[item.cadence]}</p>
                        <p className="mt-2 text-xs leading-5 text-brand-deepTeal/60">Restore first if you want to edit this planning record.</p>
                      </div>
                      <button type="button" disabled={busyKey === item.id} onClick={() => restoreItem(item)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
                        <RotateCcw aria-hidden="true" className="h-4 w-4" /> Restore regular payment
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </details>
          )}
        </>
      )}

      <p className="mt-5 rounded-2xl bg-surface-mint p-4 text-xs leading-5 text-brand-deepTeal/65">
        Regular payments are for planning only. They do not contact a merchant or schedule a payment.
      </p>
    </section>
  );
}

export function RecurringSuggestions({ accountPersistenceAvailable }: Readonly<{ accountPersistenceAvailable: boolean }>) {
  const { isLoaded, isSignedIn } = useUser();
  if (!accountPersistenceAvailable) return null;
  if (!isLoaded) return <section className="mt-5 rounded-[2rem] border border-border bg-surface-base p-6 text-center shadow-soft" aria-busy="true"><p className="font-semibold text-brand-deepTeal/70">Checking your account session…</p></section>;
  if (!isSignedIn) return null;
  return <RecurringExperience />;
}
