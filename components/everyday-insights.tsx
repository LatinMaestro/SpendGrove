"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight, Target } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingState, ProgressRow, SectionHeader } from "@/components/ui/app-primitives";
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
    previousSpendCents: number;
    differenceCents: number;
    direction: "UP" | "DOWN" | "SAME" | "NEW";
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
    return { ok: false, error: payload.ok === false ? payload.error : "Your monthly overview could not be loaded." };
  } catch {
    return { ok: false, error: "Your monthly overview could not be loaded. Check your connection and try again." };
  }
}

function trendSummary(snapshot: InsightSnapshot) {
  const direction = snapshot.trend.direction;
  if (direction === "NO_PREVIOUS") {
    return {
      Icon: ArrowRight,
      copy: "Add another month of transactions to see a comparison",
    };
  }

  if (direction === "SAME") {
    return { Icon: ArrowRight, copy: "About the same as last month" };
  }

  const difference = formatAudFromCents(Math.abs(snapshot.trend.differenceCents));
  return direction === "UP"
    ? { Icon: ArrowUpRight, copy: `${difference} more than last month` }
    : { Icon: ArrowDownRight, copy: `${difference} less than last month` };
}

function categoryTrendCopy(category: InsightSnapshot["categories"][number]) {
  if (category.direction === "NEW") return "New this month";
  if (category.direction === "SAME") return "About the same";
  const difference = formatAudFromCents(Math.abs(category.differenceCents));
  return category.direction === "UP"
    ? `${difference} more than last month`
    : `${difference} less than last month`;
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
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isReady) {
    return <LoadingState label="Loading this month" />;
  }

  if (error) {
    return (
      <p role="alert" className="rounded-xl border border-danger-red/25 bg-danger-red/5 px-4 py-3 text-sm font-semibold text-danger-red">
        {error}
      </p>
    );
  }

  if (!snapshot) return null;

  const trend = trendSummary(snapshot);
  const TrendIcon = trend.Icon;

  return (
    <div className="space-y-7">
      <section className="rounded-2xl border border-border bg-surface-base p-5 sm:p-6" aria-labelledby="everyday-insights-heading">
        <p className="text-sm font-semibold text-muted">{snapshot.currentMonth.label}</p>
        <h2 id="everyday-insights-heading" className="mt-1 text-base font-semibold text-foreground">Spent this month</h2>
        <p className="money-value mt-2 text-4xl font-bold tracking-tight text-brand-evergreen">
          {formatAudFromCents(snapshot.currentMonth.spendCents)}
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <TrendIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-teal" />
          {trend.copy}
        </p>
        <Link href="/transactions" className="mt-5 inline-flex min-h-11 items-center gap-1 rounded-xl text-sm font-bold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          View transactions <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>

      <div className="grid gap-7 lg:grid-cols-2">
        <section aria-labelledby="home-budgets-heading">
          <SectionHeader
            title="Budgets"
            action={
              <Link href="/budgets" className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-bold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                {snapshot.budgets.length === 0 ? "Create budget" : "View budgets"}
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            }
          />
          <div id="home-budgets-heading" className="rounded-2xl border border-border bg-surface-base px-4 py-2">
            {snapshot.budgets.length === 0 ? (
              <p className="py-4 text-sm leading-6 text-muted">Set a monthly limit for a category you want to watch.</p>
            ) : (
              <ul className="divide-y divide-border">
                {snapshot.budgets.slice(0, 3).map((budget) => (
                  <li key={budget.id} className="py-4">
                    <ProgressRow
                      label={budget.categoryLabel}
                      value={budget.spentCents}
                      max={budget.amountCents}
                      supportingText={`${formatAudFromCents(budget.remainingCents)} left`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {snapshot.recurring.length > 0 ? (
          <section aria-labelledby="home-regular-heading">
            <SectionHeader
              title="Regular payments"
              action={
                <Link href="/regular-payments" className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-bold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                  View regular payments <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              }
            />
            <div id="home-regular-heading" className="rounded-2xl border border-border bg-surface-base px-4">
              <ul className="divide-y divide-border">
                {snapshot.recurring.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex min-h-16 items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="mt-0.5 text-xs text-muted">{cadenceLabels[item.cadence] ?? "Other"}</p>
                    </div>
                    {item.expectedAmountCents === null ? null : (
                      <p className="money-value shrink-0 text-sm font-bold text-foreground">
                        {formatAudFromCents(Math.abs(item.expectedAmountCents))}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </div>

      {snapshot.categories.length > 0 ? (
        <details className="border-t border-border pt-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg text-sm font-bold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            Category comparisons
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </summary>
          <ul className="mt-2 divide-y divide-border rounded-2xl border border-border bg-surface-base px-4">
            {snapshot.categories.slice(0, 5).map((category) => (
              <li key={category.id ?? "uncategorised"} className="flex min-h-16 items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{category.label}</p>
                  <p className="mt-0.5 text-xs text-muted">{categoryTrendCopy(category)}</p>
                </div>
                <p className="money-value shrink-0 text-sm font-bold text-foreground">{formatAudFromCents(category.spendCents)}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function SignedOutInsightCard() {
  return (
    <section className="rounded-2xl border border-border bg-surface-base p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-mint text-brand-evergreen">
          <Target aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">See your monthly overview</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Sign in to view your spending, budgets and confirmed regular payments.</p>
          <SignInButton mode="modal">
            <button type="button" className="mt-4 min-h-11 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
              Sign in
            </button>
          </SignInButton>
        </div>
      </div>
    </section>
  );
}

export function EverydayInsights({ accountPersistenceAvailable }: Readonly<{ accountPersistenceAvailable: boolean }>) {
  const { isLoaded, isSignedIn } = useUser();

  if (!accountPersistenceAvailable) return null;
  if (!isLoaded) return <LoadingState label="Checking your account" />;
  if (!isSignedIn) return <SignedOutInsightCard />;
  return <InsightExperience />;
}
