"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { Archive, Pencil, PiggyBank, Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatAudFromCents } from "@/lib/money";

type BudgetCategory = {
  id: string;
  name: string;
};

type CategoryBudget = {
  id: string;
  categoryId: string;
  categoryLabel: string;
  amountCents: number;
  period: "MONTHLY";
  status: "ACTIVE" | "ARCHIVED";
  spentCents: number;
  remainingCents: number;
  progressPercent: number;
  updatedAt: string;
};

type BudgetSnapshotResult =
  | {
      ok: true;
      month: { key: string; label: string };
      categories: BudgetCategory[];
      budgets: CategoryBudget[];
      archivedCount: number;
    }
  | { ok: false; error: string };

function inputToPositiveCents(value: string) {
  const cleaned = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, decimal = ""] = cleaned.split(".");
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

function centsToInput(cents: number) {
  return (cents / 100).toFixed(2);
}

async function readSnapshot(response: Response): Promise<BudgetSnapshotResult> {
  try {
    const payload = await response.json() as BudgetSnapshotResult;
    if (response.ok && payload.ok) return payload;
    return { ok: false, error: payload.ok === false ? payload.error : "Budgets could not be loaded safely." };
  } catch {
    return { ok: false, error: "Budgets could not be loaded safely." };
  }
}

async function requestSnapshot(init?: RequestInit): Promise<BudgetSnapshotResult> {
  try {
    return readSnapshot(await fetch("/api/account/budgets", {
      cache: "no-store",
      ...init,
    }));
  } catch {
    return { ok: false, error: "Budgets could not be loaded safely. Check your connection and try again." };
  }
}

function SignedOutBudgetCard() {
  return (
    <section className="mt-5 rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-surface-mint p-3 text-brand-green">
          <PiggyBank aria-hidden="true" className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-teal">Budgets</p>
          <h2 className="mt-1 text-2xl font-bold text-brand-deepTeal">Sign in to create budgets</h2>
          <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">
            Set your own monthly category amounts and see progress from reviewed everyday transactions.
          </p>
          <SignInButton mode="modal">
            <button type="button" className="mt-4 min-h-12 rounded-full bg-brand-green px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal">
              Sign in to manage budgets
            </button>
          </SignInButton>
        </div>
      </div>
    </section>
  );
}

function BudgetExperience() {
  const [monthLabel, setMonthLabel] = useState("");
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editAmountInput, setEditAmountInput] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function applySnapshot(snapshot: Extract<BudgetSnapshotResult, { ok: true }>) {
    setMonthLabel(snapshot.month.label);
    setCategories(snapshot.categories);
    setBudgets(snapshot.budgets);
    const budgeted = new Set(snapshot.budgets.filter((budget) => budget.status === "ACTIVE").map((budget) => budget.categoryId));
    const available = snapshot.categories.filter((category) => !budgeted.has(category.id));
    setCategoryId((current) => available.some((category) => category.id === current) ? current : available[0]?.id || "");
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await requestSnapshot();
      if (cancelled) return;
      if (result.ok) applySnapshot(result);
      else setError(result.error);
      setIsReady(true);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const activeBudgets = useMemo(
    () => budgets.filter((budget) => budget.status === "ACTIVE"),
    [budgets],
  );
  const archivedBudgets = useMemo(
    () => budgets.filter((budget) => budget.status === "ARCHIVED"),
    [budgets],
  );
  const budgetedCategoryIds = useMemo(
    () => new Set(activeBudgets.map((budget) => budget.categoryId)),
    [activeBudgets],
  );
  const availableCategories = categories.filter((category) => !budgetedCategoryIds.has(category.id));

  async function mutate(payload: Record<string, unknown>, busy: string, successMessage: string) {
    if (busyKey) return;
    setBusyKey(busy);
    setMessage("");
    setError("");
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
    setAmountInput("");
    setMessage(successMessage);
  }

  function createBudget() {
    const amountCents = inputToPositiveCents(amountInput);
    if (!categoryId) {
      setError("Choose an expense category.");
      return;
    }
    if (amountCents === null) {
      setError("Enter a monthly budget greater than zero using dollars and cents.");
      return;
    }
    void mutate({ action: "CREATE", categoryId, amountCents }, "create", "Monthly category budget created.");
  }

  function startEditing(budget: CategoryBudget) {
    setEditingId(budget.id);
    setEditCategoryId(budget.categoryId);
    setEditAmountInput(centsToInput(budget.amountCents));
    setMessage("");
    setError("");
  }

  function updateBudget(budget: CategoryBudget) {
    const amountCents = inputToPositiveCents(editAmountInput);
    if (!editCategoryId || amountCents === null) {
      setError("Choose an active expense category and enter a monthly budget greater than zero.");
      return;
    }
    void mutate({
      action: "UPDATE",
      budgetId: budget.id,
      updatedAt: budget.updatedAt,
      categoryId: editCategoryId,
      amountCents,
    }, budget.id, "Monthly category budget updated.");
  }

  function archiveBudget(budget: CategoryBudget) {
    if (!window.confirm("Archive this monthly budget? Existing transactions will not be changed.")) return;
    void mutate({
      action: "ARCHIVE",
      budgetId: budget.id,
      updatedAt: budget.updatedAt,
    }, budget.id, "Monthly category budget archived.");
  }

  function restoreBudget(budget: CategoryBudget) {
    void mutate({
      action: "RESTORE",
      budgetId: budget.id,
      updatedAt: budget.updatedAt,
    }, budget.id, "Monthly category budget restored. No transaction was changed.");
  }

  return (
    <section className="mt-5 rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="budget-heading">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-surface-mint p-3 text-brand-green">
          <PiggyBank aria-hidden="true" className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-teal">Monthly category budgets</p>
          <h2 id="budget-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">Monthly budgets</h2>
          <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">
            Set a monthly amount for the categories you want to watch.
          </p>
        </div>
      </div>

      {message && <p role="status" className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}

      {!isReady ? (
        <p className="mt-5 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal/70" aria-busy="true">Loading monthly budgets…</p>
      ) : (
        <>
          <div className="mt-5 rounded-3xl bg-surface-mint/50 p-4">
            <p className="text-sm font-bold text-brand-deepTeal">Create a budget</p>
            {availableCategories.length === 0 ? (
              <p className="mt-2 text-sm leading-6 text-brand-deepTeal/65">
                {categories.length === 0
                  ? "Add or use an expense category before creating a budget."
                  : "Every active expense category already has a monthly budget."}
              </p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
                  Expense category
                  <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm font-normal normal-case tracking-normal text-brand-deepTeal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20">
                    {availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
                  Monthly amount (AUD)
                  <input value={amountInput} inputMode="decimal" placeholder="500.00" onChange={(event) => setAmountInput(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm font-normal normal-case tracking-normal text-brand-deepTeal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
                </label>
                <button type="button" disabled={busyKey === "create"} onClick={createBudget} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-green px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal">
                  <Plus aria-hidden="true" className="h-4 w-4" /> {busyKey === "create" ? "Saving…" : "Create budget"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-brand-teal">Current budgets</p>
            <h3 className="mt-1 text-xl font-bold text-brand-deepTeal">{monthLabel}</h3>
            {activeBudgets.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-brand-deepTeal/65">Create your first monthly budget above.</p>
            ) : (
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {activeBudgets.map((budget) => {
                  const editing = editingId === budget.id;
                  const busy = busyKey === budget.id;
                  const overBudget = budget.spentCents > budget.amountCents;
                  return (
                    <article key={budget.id} className="rounded-3xl border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-brand-deepTeal">{budget.categoryLabel}</p>
                          <p className="mt-1 text-sm text-brand-deepTeal/65">{formatAudFromCents(budget.amountCents)} monthly budget</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" disabled={busy} onClick={() => editing ? setEditingId(null) : startEditing(budget)} aria-label={"Edit " + budget.categoryLabel + " budget"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal px-3 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
                            <Pencil aria-hidden="true" className="h-4 w-4" /> Edit
                          </button>
                          <button type="button" disabled={busy} onClick={() => archiveBudget(budget)} aria-label={"Archive " + budget.categoryLabel + " budget"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-3 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
                            <Archive aria-hidden="true" className="h-4 w-4" /> Archive
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-mint" aria-label={String(budget.progressPercent) + "% used"}>
                        <div className={overBudget ? "h-full rounded-full bg-danger-red" : "h-full rounded-full bg-brand-green"} style={{ width: String(Math.min(budget.progressPercent, 100)) + "%" }} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-brand-deepTeal/60">Used this month</p><p className="font-bold text-brand-deepTeal">{formatAudFromCents(budget.spentCents)}</p></div>
                        <div><p className="text-brand-deepTeal/60">{overBudget ? "Over by" : "Budget left"}</p><p className="font-bold text-brand-deepTeal">{overBudget ? formatAudFromCents(budget.spentCents - budget.amountCents) : formatAudFromCents(budget.remainingCents)}</p></div>
                      </div>
                      {editing && (
                        <div className="mt-4 grid gap-3 rounded-2xl bg-surface-mint/50 p-3 sm:grid-cols-2">
                          <label className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
                            Expense category
                            <select value={editCategoryId} onChange={(event) => setEditCategoryId(event.target.value)} className="mt-2 min-h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm font-normal normal-case tracking-normal text-brand-deepTeal">
                              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                            </select>
                          </label>
                          <label className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
                            Monthly amount (AUD)
                            <input value={editAmountInput} inputMode="decimal" onChange={(event) => setEditAmountInput(event.target.value)} className="mt-2 min-h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm font-normal normal-case tracking-normal text-brand-deepTeal" />
                          </label>
                          <button type="button" disabled={busy} onClick={() => updateBudget(budget)} className="min-h-11 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white sm:col-span-2">
                            {busy ? "Saving…" : "Save budget changes"}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {archivedBudgets.length > 0 && (
          <details className="mt-6 border-t border-border pt-5">
            <summary className="cursor-pointer text-base font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">Archived budgets ({archivedBudgets.length})</summary>
            {archivedBudgets.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-brand-deepTeal/65">Archived monthly budgets will appear here and can be restored.</p>
            ) : (
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {archivedBudgets.map((budget) => (
                  <article key={budget.id} className="rounded-3xl border border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-bold text-brand-deepTeal">{budget.categoryLabel}</p>
                        <p className="mt-1 text-sm text-brand-deepTeal/65">{formatAudFromCents(budget.amountCents)} monthly budget</p>
                        <p className="mt-2 text-xs leading-5 text-brand-deepTeal/60">Restore first if you want to edit this planning target.</p>
                      </div>
                      <button type="button" disabled={busyKey === budget.id} onClick={() => restoreBudget(budget)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
                        <RotateCcw aria-hidden="true" className="h-4 w-4" /> Restore budget
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

      <details className="mt-5 rounded-2xl bg-surface-mint p-4 text-xs leading-5 text-brand-deepTeal/65">
        <summary className="cursor-pointer font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">How budget progress works</summary>
        <p className="mt-2">Everyday spending counts once. Transfers, split containers and loan repayment breakdowns are not added.</p>
        <p className="mt-1">Budgets reset each month and do not roll over.</p>
      </details>
    </section>
  );
}

export function CategoryBudgets({ accountPersistenceAvailable }: Readonly<{ accountPersistenceAvailable: boolean }>) {
  const { isLoaded, isSignedIn } = useUser();
  if (!accountPersistenceAvailable) return null;
  if (!isLoaded) return <section className="mt-5 rounded-[2rem] border border-border bg-surface-base p-6 text-center shadow-soft" aria-busy="true"><p className="font-semibold text-brand-deepTeal/70">Checking your account session…</p></section>;
  if (!isSignedIn) return null;
  return <BudgetExperience />;
}
