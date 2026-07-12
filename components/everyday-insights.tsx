"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChartNoAxesColumnIncreasing, Repeat2, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { formatAudFromCents } from "@/lib/money";

type InsightSnapshot = {
  currentMonth: {
    key: string;
    label: string;
    spendCents: number;
    transactionCount: number;
  };
  previousMonth: {
    key: string;
    label: string;
    spendCents: number;
    transactionCount: number;
  };
  trend: {
    direction: "UP" | "DOWN" | "SAME" | "NO_PREVIOUS";
    differenceCents: number;
  };
  categories: Array<{
    id: string | null;
    label: string;
    spendCents: number;
  }>;
  budgets: Array<{
    id: string;
    categoryLabel: string;
    amountCents: number;
    spentCents: number;
    remainingCents: number;
    progressPercent: number;
  }>;
  recurring: Array<{
    id: string;
    label: string;
    categoryLabel: string | null;
    expectedAmountCents: number | null;
    cadence: string;
  }>;
};

type InsightResult =
  | { ok: true; insights: InsightSnapshot }
  | { ok: false; error: string };

const cadenceLabels: Record<string, string> = {
  WEEKLY: "Weekly",
  FORTNIGHTLY: "Every 2 weeks",
  MONTHLY: "Monthly",
  OTHER: "Other",
};

async function loadInsights(): Promise<InsightResult> {
  try {
    const response = await fetch("/api/account/insights", { cache: "no-store" });
    const payload = await response.json() as InsightResult;
    if (response.ok && payload.ok) return payload;
    return { ok: false, error: payload.ok === false ? payload.error : "Everyday insights could not be loaded safely." };
  } catch {
    return { ok: false, error: "Everyday insights could not be loaded safely. Check your connection and try again." };
  }
}

function TrendSummary({ snapshot }: Readonly<{ snapshot: InsightSnapshot }>) {
  const direction = snapshot.trend.direction;
  const Icon = direction === "UP" ? ArrowUpRight : direction === "DOWN" ? ArrowDownRight : ArrowRight;
  const copy = direction === "NO_PREVIOUS"
    ? "Add another month of transactions to see a comparison"
    : direction === "UP"
      ? "You spent more than last month"
      : direction === "DOWN"
        ? "You spent less than last month"
        : "Spending is about the same as last month";
  const difference = direction === "NO_PREVIOUS"
    ? null
    : formatAudFromCents(Math.abs(snapshot.trend.differenceCents));

  return (
    <div className="rounded-3xl border border-border bg-white p-4">
      <div className="flex items-center gap-2 text-brand-teal">
        <Icon aria-hidden="true" className="h-5 w-5" />
        <p className="text-xs font-bold uppercase tracking-[0.12em]">Compared with last month</p>
      </div>
      <p className="mt-3 text-base font-bold text-brand-deepTeal">{copy}</p>
      {difference && <p className="mt-1 text-sm text-brand-deepTeal/65">Difference: {difference}</p>}
      
    </div>
  );
}

function InsightExperience() {
  const [snapshot, setSnapshot] = useState<InsightSnapshot | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await loadInsights();
      if (cancelled) return;
      if (result.ok) setSnapshot(result.insights);
      else setError(result.error);
      setIsReady(true);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="mt-5 rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="everyday-insights-heading">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-surface-mint p-3 text-brand-green">
          <ChartNoAxesColumnIncreasing aria-hidden="true" className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-teal">Everyday overview</p>
          <h2 id="everyday-insights-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">This month at a glance</h2>
          <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">
            Your reviewed everyday transactions, kept simple.
          </p>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
      {!isReady ? (
        <p className="mt-5 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal/70" aria-busy="true">Loading everyday insights…</p>
      ) : snapshot ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-brand-deepTeal p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/65">Spending this month · {snapshot.currentMonth.label}</p>
              <p className="mt-3 text-3xl font-bold">{formatAudFromCents(snapshot.currentMonth.spendCents)}</p>
              <p className="mt-2 text-sm text-white/70">{snapshot.currentMonth.transactionCount} active expense transaction{snapshot.currentMonth.transactionCount === 1 ? "" : "s"}</p>
            </div>
            <TrendSummary snapshot={snapshot} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-border p-4">
              <p className="text-sm font-semibold text-brand-teal">Top categories</p>
              <h3 className="mt-1 text-lg font-bold text-brand-deepTeal">Spending this month</h3>
              {snapshot.categories.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-brand-deepTeal/65">No active expense transactions this month.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {snapshot.categories.slice(0, 5).map((category) => (
                    <li key={category.id ?? "uncategorised"} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-brand-deepTeal">{category.label}</span>
                      <span className="text-brand-deepTeal/65">{formatAudFromCents(category.spendCents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={snapshot.budgets.length === 0 ? "hidden" : "rounded-3xl border border-border p-4"}>
              <div className="flex items-center gap-2 text-brand-teal">
                <Target aria-hidden="true" className="h-5 w-5" />
                <p className="text-sm font-semibold">Budget progress</p>
              </div>
              <h3 className="mt-1 text-lg font-bold text-brand-deepTeal">{snapshot.budgets.length} active</h3>
              {snapshot.budgets.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-brand-deepTeal/65">Create a monthly category budget to see progress here.</p>
              ) : (
                <ul className="mt-3 space-y-4">
                  {snapshot.budgets.slice(0, 5).map((budget) => (
                    <li key={budget.id}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="font-semibold text-brand-deepTeal">{budget.categoryLabel}</span>
                        <span className="text-brand-deepTeal/65">{formatAudFromCents(budget.spentCents)} of {formatAudFromCents(budget.amountCents)}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-mint" aria-label={String(budget.progressPercent) + "% used"}>
                        <div className="h-full rounded-full bg-brand-green" style={{ width: String(Math.min(budget.progressPercent, 100)) + "%" }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={snapshot.recurring.length === 0 ? "hidden" : "rounded-3xl border border-border p-4"}>
              <div className="flex items-center gap-2 text-brand-teal">
                <Repeat2 aria-hidden="true" className="h-5 w-5" />
                <p className="text-sm font-semibold">Regular payments</p>
              </div>
              <h3 className="mt-1 text-lg font-bold text-brand-deepTeal">{snapshot.recurring.length} active</h3>
              {snapshot.recurring.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-brand-deepTeal/65">Confirmed recurring items will appear here.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {snapshot.recurring.slice(0, 5).map((item) => (
                    <li key={item.id} className="text-sm">
                      <p className="font-semibold text-brand-deepTeal">{item.label}</p>
                      <p className="mt-1 text-brand-deepTeal/60">{cadenceLabels[item.cadence] ?? item.cadence}{item.expectedAmountCents === null ? "" : " · " + formatAudFromCents(Math.abs(item.expectedAmountCents))}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <details className="mt-5 rounded-2xl bg-surface-mint p-4 text-xs leading-5 text-brand-deepTeal/65">
            <summary className="cursor-pointer font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">How these totals work</summary>
            <p className="mt-2">Everyday transactions count once. Split containers and loan repayment breakdowns are not added again.</p>
          </details>
        </>
      ) : null}
    </section>
  );
}

function SignedOutInsightCard() {
  return (
    <section className="mt-5 rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6">
      <p className="text-sm font-semibold text-brand-teal">Everyday overview</p>
      <h2 className="mt-1 text-2xl font-bold text-brand-deepTeal">Sign in to view your monthly overview</h2>
      <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Your account transactions, confirmed recurring items and user-entered budgets stay private to your account.</p>
      <SignInButton mode="modal">
        <button type="button" className="mt-4 min-h-12 rounded-full bg-brand-green px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal">Sign in to view overview</button>
      </SignInButton>
    </section>
  );
}

export function EverydayInsights({ accountPersistenceAvailable }: Readonly<{ accountPersistenceAvailable: boolean }>) {
  const { isLoaded, isSignedIn } = useUser();
  if (!accountPersistenceAvailable) return null;
  if (!isLoaded) return <section className="mt-5 rounded-[2rem] border border-border bg-surface-base p-6 text-center shadow-soft" aria-busy="true"><p className="font-semibold text-brand-deepTeal/70">Checking your account session…</p></section>;
  if (!isSignedIn) return <SignedOutInsightCard />;
  return <InsightExperience />;
}
