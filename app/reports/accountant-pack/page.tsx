import Link from "next/link";
import type { ReactNode } from "react";
import { Download, FileArchive, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/app-primitives";
import {
  createAccountantPackManifest,
  type AccountantPackManifest,
} from "@/src/server/accountant-pack";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { currentAustralianFinancialYearEndingYear } from "@/src/server/loan-reporting";
import { propertyFinancialYearSchema } from "@/src/server/property-report-review";

export const dynamic = "force-dynamic";

type PageProps = { searchParams?: Promise<{ financialYear?: string | string[] }> };

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function financialYearOptions(selected: number) {
  const current = currentAustralianFinancialYearEndingYear();
  return [...new Set([selected, current, current - 1, current - 2, current - 3, current - 4])]
    .sort((left, right) => right - left);
}

function DownloadLink({ href, children }: Readonly<{ href: string; children: ReactNode }>) {
  return (
    <a href={href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-base px-4 text-sm font-semibold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
      <Download aria-hidden="true" className="h-4 w-4" />
      {children}
    </a>
  );
}

export default async function AccountantPackPage({ searchParams }: Readonly<PageProps>) {
  const resolved = await searchParams;
  const fallback = currentAustralianFinancialYearEndingYear();
  const parsed = propertyFinancialYearSchema.safeParse(single(resolved?.financialYear) ?? fallback);
  const endingYear = parsed.success ? parsed.data : fallback;
  let manifest: AccountantPackManifest | null = null;
  let error = "";

  try {
    manifest = await createAccountantPackManifest(await getCurrentUserContext(), endingYear);
  } catch {
    error = "The preparation pack could not be assembled safely. Your account records have not changed.";
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Reports"
        title="Accountant preparation pack"
        description="Download a set of files you can review and share securely with your accountant."
        action={<Link href="/reports" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold text-brand-evergreen">Back to reports</Link>}
      />

      <form method="get" className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-surface-base p-4 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm font-semibold text-foreground">
          Financial year
          <select name="financialYear" defaultValue={endingYear} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface-base px-3 font-normal">
            {financialYearOptions(endingYear).map((year) => <option key={year} value={year}>{year - 1}-{String(year).slice(-2)}</option>)}
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white">Prepare files</button>
      </form>

      {error ? (
        <section role="alert" className="rounded-2xl border border-warning-amber bg-warning-amber/10 p-5">
          <h2 className="font-semibold text-foreground">Pack unavailable</h2>
          <p className="mt-1 text-sm text-muted">{error}</p>
        </section>
      ) : null}

      {manifest ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface-base p-5" aria-labelledby="pack-files-heading">
            <div className="flex items-start gap-3">
              <FileArchive aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" />
              <div>
                <h2 id="pack-files-heading" className="text-lg font-semibold text-foreground">Preparation files · {manifest.financialYear.label}</h2>
                <p className="mt-1 text-sm leading-5 text-muted">Download the files individually and keep them together in a secure folder. No ZIP tool or document upload is required.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <DownloadLink href={`/api/account/reports/accountant-pack/manifest?financialYear=${endingYear}`}>Manifest JSON</DownloadLink>
              <DownloadLink href={`/api/account/reports/accountant-pack/readme?financialYear=${endingYear}`}>Read me</DownloadLink>
              <DownloadLink href={`/api/account/reports/loans/export?financialYear=${endingYear}`}>Loan report CSV</DownloadLink>
              <DownloadLink href="/api/account/export">Full account export</DownloadLink>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-base p-5" aria-labelledby="property-files-heading">
            <h2 id="property-files-heading" className="text-lg font-semibold text-foreground">Property linked-record files</h2>
            {manifest.propertySummaries.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No active Properties are available for this pack.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {manifest.propertySummaries.map((property) => (
                  <div key={property.propertyId} className="flex flex-col gap-2 rounded-xl bg-surface-subtle p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{property.nickname}</p>
                      <p className="mt-1 text-xs text-muted">{property.linkedRecordCount} linked record{property.linkedRecordCount === 1 ? "" : "s"} · {property.needsReviewRecordIds.length} needs review</p>
                    </div>
                    <DownloadLink href={`/api/account/properties/${encodeURIComponent(property.propertyId)}/report-export?financialYear=${endingYear}`}>Download CSV</DownloadLink>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-3 md:grid-cols-3" aria-label="Pack summary">
            {[
              ["Loan Accounts", manifest.loanSummary.length],
              ["Active budgets", manifest.currentPlanningSnapshot.budgets.length],
              ["Regular payments", manifest.currentPlanningSnapshot.recurring.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-surface-base p-4">
                <p className="text-xs font-semibold text-muted">{label}</p>
                <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-border bg-surface-base p-5" aria-labelledby="evidence-heading">
            <div className="flex items-start gap-3">
              <FileText aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" />
              <div>
                <h2 id="evidence-heading" className="text-lg font-semibold text-foreground">Evidence checklist</h2>
                <p className="mt-1 text-sm text-muted">Document upload is not active. These are review prompts only.</p>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {manifest.evidenceIndex.map((item) => (
                <li key={item.group} className="rounded-xl bg-surface-subtle p-3">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{item.recordIds.length} record{item.recordIds.length === 1 ? "" : "s"} · {item.note}</p>
                </li>
              ))}
            </ul>
          </section>

          <p className="rounded-2xl border border-border bg-surface-base p-4 text-sm leading-6 text-muted">{manifest.disclaimer}</p>
        </div>
      ) : null}
    </AppShell>
  );
}
