"use client";

import { useId } from "react";
import { ArrowLeft, ChevronRight, PieChart } from "lucide-react";
import { formatAudFromCents } from "@/lib/money";
import {
  groupMonthlyCategoryChart,
  NEEDS_REVIEW_CATEGORY_KEY,
  OTHER_CATEGORY_KEY,
  type MonthlyCategorySpending,
  type MonthlyCategorySpendingCategory,
} from "@/lib/monthly-category-spending";

const categoryPalette = [
  "#0F766E",
  "#2563EB",
  "#7C3AED",
  "#C2415B",
  "#4F7C3A",
  "#B45309",
  "#0369A1",
];

const needsReviewColour = "#D97706";
const otherColour = "#64748B";

export function monthlyCategoryColour(categoryKey: string) {
  if (categoryKey === NEEDS_REVIEW_CATEGORY_KEY) return needsReviewColour;
  if (categoryKey === OTHER_CATEGORY_KEY) return otherColour;
  let hash = 0;
  for (const character of categoryKey) {
    hash = ((hash << 5) - hash + character.codePointAt(0)!) | 0;
  }
  return categoryPalette[Math.abs(hash) % categoryPalette.length];
}

export function formatSpendingPercentage(amountCents: number, totalCents: number) {
  if (amountCents <= 0 || totalCents <= 0) return "0%";
  const percentage = (amountCents / totalCents) * 100;
  if (percentage < 0.1) return "<0.1%";
  const rounded = percentage.toFixed(1);
  return `${rounded.endsWith(".0") ? rounded.slice(0, -2) : rounded}%`;
}

type ChartProps = {
  monthLabel: string;
  spending: MonthlyCategorySpending;
  onViewBreakdown: () => void;
};

export function MonthlyCategoryChart({ monthLabel, spending, onViewBreakdown }: Readonly<ChartProps>) {
  const titleId = useId();
  const descriptionId = useId();
  const segments = groupMonthlyCategoryChart(spending.categories);
  const largest = spending.categories[0];

  if (spending.totalCents <= 0 || segments.length === 0) {
    return (
      <section aria-label={`Spending by category — ${monthLabel}`} className="rounded-2xl border border-border bg-surface-base p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-mint text-brand-evergreen">
            <PieChart aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-foreground">No spending to show</h2>
            <p className="mt-0.5 text-sm text-muted">Expense categories will appear here when this month has transactions.</p>
          </div>
        </div>
      </section>
    );
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const description = `${monthLabel} spending was ${formatAudFromCents(spending.totalCents)}. ${largest.name} was the largest category at ${formatAudFromCents(largest.amountCents)}.`;

  return (
    <section className="rounded-2xl border border-border bg-surface-base p-4" aria-labelledby={titleId}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <p id={titleId} className="text-sm font-bold text-foreground">Spending by category — {monthLabel}</p>
          <div className="relative mx-auto mt-3 h-32 w-32 sm:h-36 sm:w-36">
            <svg viewBox="0 0 100 100" role="img" aria-labelledby={`${titleId} ${descriptionId}`} className="h-full w-full">
              <title>Spending by category for {monthLabel}</title>
              <desc id={descriptionId}>{description}</desc>
              <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="14" className="text-surface-subtle" />
              {segments.map((segment, index) => {
                const length = (segment.amountCents / spending.totalCents) * circumference;
                const dashOffset = -offset;
                offset += length;
                return (
                  <circle
                    key={segment.key}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={monthlyCategoryColour(segment.key)}
                    strokeWidth="14"
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 50 50)"
                    aria-hidden="true"
                  />
                );
              })}
            </svg>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="money-value text-sm font-extrabold text-foreground sm:text-base">{formatAudFromCents(spending.totalCents)}</span>
              <span className="mt-0.5 text-xs font-semibold text-muted">Spent</span>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <ul aria-label={`Category spending legend for ${monthLabel}`} className="space-y-1.5">
            {segments.map((segment, index) => (
              <li key={segment.key} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-sm">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: monthlyCategoryColour(segment.key) }} />
                <span title={segment.name} className="truncate text-muted">{segment.name}</span>
                <span className="money-value whitespace-nowrap font-semibold text-foreground">
                  {formatAudFromCents(segment.amountCents)}
                  <span className="ml-1 hidden text-xs font-normal text-muted lg:inline">{formatSpendingPercentage(segment.amountCents, spending.totalCents)}</span>
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onViewBreakdown}
            aria-label={`View spending breakdown for ${monthLabel}`}
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            View breakdown <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

type BreakdownProps = {
  monthLabel: string;
  spending: MonthlyCategorySpending;
  onBack: () => void;
  onSelectCategory: (category: MonthlyCategorySpendingCategory) => void;
};

export function CategoryBreakdownView({ monthLabel, spending, onBack, onSelectCategory }: Readonly<BreakdownProps>) {
  return (
    <section aria-labelledby="category-breakdown-heading" className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to transactions
      </button>
      <header>
        <h2 id="category-breakdown-heading" className="text-xl font-extrabold text-foreground">Spending by category</h2>
        <p className="mt-1 text-sm text-muted">{monthLabel} · {formatAudFromCents(spending.totalCents)} spent</p>
      </header>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-base">
        {spending.categories.map((category) => {
          return (
            <button
              key={category.key}
              type="button"
              onClick={() => onSelectCategory(category)}
              aria-label={`View ${monthLabel} ${category.name} transactions`}
              className="grid min-h-16 w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3 text-left hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
            >
              <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ backgroundColor: monthlyCategoryColour(category.key) }} />
              <span className="min-w-0">
                <span title={category.name} className="block truncate text-sm font-bold text-foreground">{category.name}</span>
                <span className="mt-0.5 block text-xs text-muted">{category.transactionCount} transaction{category.transactionCount === 1 ? "" : "s"} · {formatSpendingPercentage(category.amountCents, spending.totalCents)}</span>
              </span>
              <span className="money-value whitespace-nowrap text-sm font-bold text-foreground">{formatAudFromCents(category.amountCents)}</span>
              <ChevronRight aria-hidden="true" className="h-4 w-4 text-muted" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
