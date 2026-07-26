import Link from "next/link";
import { Building2, Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader } from "@/components/ui/app-primitives";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { currentAustralianFinancialYearEndingYear } from "@/src/server/loan-reporting";
import { listLoanMetadata } from "@/src/server/loan-metadata";
import {
  getPropertyFinancialYearReport,
  type PropertyFinancialYearReport,
} from "@/src/server/property-financial-reporting";
import { propertyFinancialYearSchema } from "@/src/server/property-report-review";

export const dynamic = "force-dynamic";

type PropertyReportPageProps = {
  searchParams?: Promise<{
    propertyId?: string | string[];
    financialYear?: string | string[];
  }>;
};

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function aud(cents: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function financialYearOptions(selected: number) {
  const current = currentAustralianFinancialYearEndingYear();
  return [...new Set([selected, current, current - 1, current - 2, current - 3, current - 4])]
    .sort((left, right) => right - left);
}

function connectionLabel(value: PropertyFinancialYearReport["records"][number]["provenance"]) {
  if (value === "MANUAL_PROPERTY_LINK") return "Linked Property transaction";
  if (value === "LOAN_RECONCILIATION") return "Linked Loan repayment cashflow";
  return "Property and Loan context";
}

export default async function PropertyReportsPage({ searchParams }: Readonly<PropertyReportPageProps>) {
  const resolved = await searchParams;
  const fallbackYear = currentAustralianFinancialYearEndingYear();
  const parsedYear = propertyFinancialYearSchema.safeParse(single(resolved?.financialYear) ?? fallbackYear);
  const endingYear = parsedYear.success ? parsedYear.data : fallbackYear;
  let properties: Array<{ id: string; nickname: string }> = [];
  let selectedPropertyId = "";
  let report: PropertyFinancialYearReport | null = null;
  let error = "";

  try {
    const context = await getCurrentUserContext();
    const metadata = await listLoanMetadata(context);
    properties = metadata.properties
      .filter((property) => !property.isArchived)
      .map((property) => ({ id: property.id, nickname: property.nickname }));
    const requestedPropertyId = single(resolved?.propertyId);
    selectedPropertyId = properties.some((property) => property.id === requestedPropertyId)
      ? requestedPropertyId!
      : properties[0]?.id ?? "";
    if (selectedPropertyId) {
      report = await getPropertyFinancialYearReport(context, selectedPropertyId, endingYear, metadata.loans);
    }
  } catch {
    error = "Property reporting could not be loaded safely. Your records have not changed.";
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Reports"
        title="Property preparation report"
        description="Review linked records and recorded Loan components for one Australian financial year."
        action={<Link href="/reports" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Back to reports</Link>}
      />

      <form method="get" className="mb-5 grid gap-3 rounded-2xl border border-border bg-surface-base p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="text-sm font-semibold text-foreground">
          Property
          <select name="propertyId" defaultValue={selectedPropertyId} disabled={properties.length === 0} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface-base px-3 font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            {properties.map((property) => <option key={property.id} value={property.id}>{property.nickname}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-foreground">
          Financial year
          <select name="financialYear" defaultValue={endingYear} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface-base px-3 font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            {financialYearOptions(endingYear).map((year) => <option key={year} value={year}>{year - 1}-{String(year).slice(-2)}</option>)}
          </select>
        </label>
        <button type="submit" disabled={properties.length === 0} className="min-h-11 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-45">Update report</button>
      </form>

      {error ? (
        <section role="alert" className="rounded-2xl border border-warning-amber bg-warning-amber/10 p-5">
          <h2 className="font-semibold text-foreground">Report unavailable</h2>
          <p className="mt-1 text-sm text-muted">{error}</p>
        </section>
      ) : null}

      {!error && properties.length === 0 ? (
        <EmptyState
          icon={<Building2 aria-hidden="true" className="h-6 w-6" />}
          title="No active Properties"
          description="Add or restore a Property from Loans before preparing this report."
          action={<Link href="/loans" className="inline-flex min-h-11 items-center rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Open Loans</Link>}
        />
      ) : null}

      {report ? (
        <div>
          <section aria-labelledby="property-summary-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="property-summary-heading" className="text-xl font-semibold text-foreground">{report.property.nickname}</h2>
                <p className="mt-1 text-sm text-muted">Financial year {report.financialYear.label}</p>
              </div>
              <a
                href={`/api/account/properties/${report.property.id}/report-export?financialYear=${report.financialYear.endingYear}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <Download aria-hidden="true" className="h-4 w-4" />
                Download linked records CSV
              </a>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["Money in", aud(report.cashflow.moneyIn.totalCents)],
                ["Money out", aud(report.cashflow.moneyOut.totalCents)],
                ["Loan interest recorded", aud(report.loanComponents.interestCents)],
                ["Loan fees recorded", aud(report.loanComponents.feeCents)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border bg-surface-base p-4">
                  <dt className="text-xs font-semibold text-muted">{label}</dt>
                  <dd className="money-value mt-2 text-lg font-bold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-surface-subtle p-4">
                <h3 className="text-sm font-semibold text-foreground">Loan repayment components</h3>
                <p className="mt-2 text-sm leading-5 text-muted">
                  {report.loanComponents.repaymentCount} repayment{report.loanComponents.repaymentCount === 1 ? "" : "s"} · {report.loanComponents.matchedCount} matched · {report.loanComponents.needsReviewCount} needs review · {report.loanComponents.unmatchedCount} unmatched.
                </p>
                <p className="mt-2 text-sm leading-5 text-muted">
                  Principal recorded: {aud(report.loanComponents.principalCents)}. Principal is shown for reconciliation and is excluded from Property income and expense totals.
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Unmatched means no accepted everyday cashflow link is recorded. It does not change the component totals or create another cashflow record.
                </p>
              </div>
              <div className="rounded-2xl bg-surface-subtle p-4">
                <h3 className="text-sm font-semibold text-foreground">Professional review</h3>
                <p className="mt-2 text-sm leading-5 text-muted">
                  Interest, fees and linked expenses are record groups only. Ask your registered tax agent or accountant how they apply to your circumstances.
                </p>
                {report.loanComponents.incompleteComponentCount > 0 ? <p className="mt-2 text-sm font-semibold text-foreground">{report.loanComponents.incompleteComponentCount} repayment{report.loanComponents.incompleteComponentCount === 1 ? "" : "s"} has incomplete component information.</p> : null}
              </div>
            </div>
          </section>

          <section className="mt-7" aria-labelledby="linked-records-heading">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 id="linked-records-heading" className="text-lg font-semibold text-foreground">Linked records</h2>
                <p className="mt-1 text-sm text-muted">{report.records.length} source record{report.records.length === 1 ? "" : "s"} in this financial year.</p>
              </div>
              <Link href="/transactions" className="inline-flex min-h-10 items-center text-sm font-semibold text-brand-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Open Transactions</Link>
            </div>

            {report.records.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-border p-5 text-sm text-muted">No linked records for this Property and financial year.</div>
            ) : (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface-base">
                {report.records.map((record) => (
                  <article key={record.transactionId} className="flex min-h-16 items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-foreground">{record.categoryName ?? "Needs review"}</h3>
                      <p className="mt-1 truncate text-xs text-muted">{dateLabel(record.date)} · {connectionLabel(record.provenance)}</p>
                      {record.needsReview ? <p className="mt-1 text-xs font-semibold text-warning-amber">Needs review</p> : null}
                    </div>
                    <div className="money-value shrink-0 text-sm font-bold text-foreground">{aud(record.amountCents)}</div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <p className="mt-6 rounded-2xl border border-border bg-surface-base p-4 text-sm leading-6 text-muted">
            This preparation report organises your linked records. It does not determine deductibility, prepare a tax return or provide tax advice.
          </p>
        </div>
      ) : null}
    </AppShell>
  );
}
