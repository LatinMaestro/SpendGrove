import Link from "next/link";
import { Download, Landmark } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader } from "@/components/ui/app-primitives";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  currentAustralianFinancialYearEndingYear,
  getLoanFinancialYearReport,
  type LoanFinancialYearReport,
} from "@/src/server/loan-reporting";
import { propertyFinancialYearSchema } from "@/src/server/property-report-review";

export const dynamic = "force-dynamic";

type LoanReportPageProps = {
  searchParams?: Promise<{ financialYear?: string | string[] }>;
};

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function aud(cents: number | null) {
  if (cents === null) return "Not recorded";
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);
}

function financialYearOptions(selected: number) {
  const current = currentAustralianFinancialYearEndingYear();
  return [...new Set([selected, current, current - 1, current - 2, current - 3, current - 4])]
    .sort((left, right) => right - left);
}

function Summary({ report }: Readonly<{ report: LoanFinancialYearReport }>) {
  const items = [
    ["Total repayments", aud(report.totals.totalRepaymentCents)],
    ["Principal recorded", aud(report.totals.principalCents)],
    ["Interest recorded", aud(report.totals.interestCents)],
    ["Fees recorded", aud(report.totals.feeCents)],
  ];

  return (
    <>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-surface-base p-4">
            <dt className="text-xs font-semibold text-muted">{label}</dt>
            <dd className="money-value mt-2 text-lg font-bold text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-5 text-muted">
        Repayment components explain Loan records. They are not added to everyday cashflow or spending totals.
      </p>
    </>
  );
}

export default async function LoanReportsPage({ searchParams }: Readonly<LoanReportPageProps>) {
  const resolved = await searchParams;
  const requested = single(resolved?.financialYear);
  const fallback = currentAustralianFinancialYearEndingYear();
  const selected = propertyFinancialYearSchema.safeParse(requested ?? fallback);
  const endingYear = selected.success ? selected.data : fallback;
  let report: LoanFinancialYearReport | null = null;
  let error = "";

  try {
    report = await getLoanFinancialYearReport(await getCurrentUserContext(), endingYear);
  } catch {
    error = "Loan reporting could not be loaded safely. Your Loan records have not changed.";
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Reports"
        title="Loan repayment report"
        description="Review recorded repayment components for one Australian financial year."
        action={<Link href="/reports" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Back to reports</Link>}
      />

      <form method="get" className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-surface-base p-4 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm font-semibold text-foreground">
          Financial year
          <select name="financialYear" defaultValue={endingYear} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface-base px-3 font-normal">
            {financialYearOptions(endingYear).map((year) => (
              <option key={year} value={year}>{year - 1}-{String(year).slice(-2)}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Update report</button>
        {report ? (
          <a
            href={`/api/account/reports/loans/export?financialYear=${endingYear}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download CSV
          </a>
        ) : null}
      </form>

      {error ? (
        <section role="alert" className="rounded-2xl border border-warning-amber bg-warning-amber/10 p-5">
          <h2 className="font-semibold text-foreground">Report unavailable</h2>
          <p className="mt-1 text-sm text-muted">{error}</p>
        </section>
      ) : null}

      {report && report.loans.length === 0 ? (
        <EmptyState
          icon={<Landmark aria-hidden="true" className="h-6 w-6" />}
          title="No active Loan Accounts"
          description="Add a Loan Account or restore one to include it in this report."
          action={<Link href="/loans" className="inline-flex min-h-11 items-center rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white">Open Loans</Link>}
        />
      ) : null}

      {report && report.loans.length > 0 ? (
        <div>
          <Summary report={report} />
          <div className="mt-6 space-y-4">
            {report.loans.map((loan) => (
              <article key={loan.loanId} className="rounded-2xl border border-border bg-surface-base p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{loan.nickname}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {loan.typeLabel} · {loan.purposeLabel}{loan.propertyNickname ? ` · ${loan.propertyNickname}` : ""}
                    </p>
                  </div>
                  <Link href="/loans" className="inline-flex min-h-10 items-center text-sm font-semibold text-brand-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Open source records</Link>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    ["Repayments", String(loan.repaymentCount)],
                    ["Total", aud(loan.totalRepaymentCents)],
                    ["Principal", aud(loan.principalCents)],
                    ["Interest", aud(loan.interestCents)],
                    ["Fees", aud(loan.feeCents)],
                    ["Matched", String(loan.matchedCount)],
                    ["Needs review", String(loan.needsReviewCount + loan.unmatchedCount)],
                    ["Latest balance", loan.latestBalanceCents === null ? "Not recorded" : aud(loan.latestBalanceCents)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-surface-subtle p-3">
                      <dt className="text-xs text-muted">{label}</dt>
                      <dd className="money-value mt-1 text-sm font-semibold text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>

                {loan.incompleteComponentCount > 0 ? (
                  <p className="mt-4 rounded-xl bg-warning-amber/10 p-3 text-sm text-foreground">
                    {loan.incompleteComponentCount} repayment{loan.incompleteComponentCount === 1 ? "" : "s"} has incomplete component information.
                  </p>
                ) : null}
                {loan.latestBalanceDate ? <p className="mt-3 text-xs text-muted">Latest recorded balance date: {loan.latestBalanceDate}</p> : null}
              </article>
            ))}
          </div>

          <p className="mt-6 rounded-2xl border border-border bg-surface-base p-4 text-sm leading-6 text-muted">
            This is a preparation report based on your recorded Loan data. It does not determine deductibility or provide tax or financial advice.
          </p>
        </div>
      ) : null}
    </AppShell>
  );
}
