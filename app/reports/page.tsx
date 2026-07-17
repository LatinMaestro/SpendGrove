import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ChevronRight,
  FileDown,
  FileText,
  History,
  Landmark,
  PieChart,
  ReceiptText,
  Repeat2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, SectionHeader } from "@/components/ui/app-primitives";

type ReportDestination = {
  title: string;
  description: string;
  href: string;
  action: string;
  icon: LucideIcon;
};

function ReportLink({ report }: Readonly<{ report: ReportDestination }>) {
  const Icon = report.icon;
  return (
    <Link
      href={report.href}
      className="group flex min-h-28 items-start gap-4 rounded-2xl border border-border bg-surface-base p-4 transition-colors hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:p-5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-mint text-brand-teal">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-base text-foreground">{report.title}</strong>
        <span className="mt-1 block text-sm leading-5 text-muted">{report.description}</span>
        <span className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-teal">
          {report.action}
          <ChevronRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}

const everydayReports: ReportDestination[] = [
  {
    title: "Monthly income and spending",
    description: "Choose a month, review money in and money out, and open the transactions behind the totals.",
    href: "/transactions",
    action: "Open monthly records",
    icon: WalletCards,
  },
  {
    title: "Category totals",
    description: "Use the monthly category chart and full breakdown without changing the transaction list total.",
    href: "/transactions",
    action: "View category spending",
    icon: PieChart,
  },
  {
    title: "Regular payments",
    description: "Review confirmed recurring payments and suggestions using the existing safe detection rules.",
    href: "/regular-payments",
    action: "Open regular payments",
    icon: Repeat2,
  },
  {
    title: "Budget performance",
    description: "Compare active monthly category budgets with eligible everyday spending.",
    href: "/budgets",
    action: "Open budgets",
    icon: BarChart3,
  },
];

const recordReports: ReportDestination[] = [
  {
    title: "Loan repayment records",
    description: "Open an owned Loan Account to review repayment components, matching status and source cashflow.",
    href: "/reports/loans",
    action: "Open Loan report",
    icon: Landmark,
  },
  {
    title: "Property records",
    description: "Choose a linked Property and Australian financial year, then review or export its accepted record set.",
    href: "/reports/properties",
    action: "Open Property report",
    icon: FileText,
  },
  {
    title: "Import audit history",
    description: "Review safe import totals and row outcomes. Source CSV content and filenames are never shown.",
    href: "/import",
    action: "Open Import Centre",
    icon: History,
  },
  {
    title: "Full account export",
    description: "Download the existing versioned JSON export for your owned SpendGrove account records.",
    href: "/settings#data-and-privacy-heading",
    action: "Open data controls",
    icon: FileDown,
  },
];

export default function ReportsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Reports"
        description="Start with a clear summary, then open the records behind it."
      />

      <section aria-labelledby="everyday-reports-heading">
        <SectionHeader
          title="Everyday money"
          description="Monthly views use Australian calendar months and the same approved spending rules as Transactions."
        />
        <div className="grid gap-3 md:grid-cols-2">
          {everydayReports.map((report) => <ReportLink key={report.title} report={report} />)}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="records-and-exports-heading">
        <SectionHeader
          title="Records and exports"
          description="Financial-year reports use 1 July to 30 June and remain organisational tools, not tax advice."
        />
        <div className="grid gap-3 md:grid-cols-2">
          {recordReports.map((report) => <ReportLink key={report.title} report={report} />)}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-surface-base p-5" aria-labelledby="accountant-pack-heading">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-mint text-brand-teal">
            <ReceiptText aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id="accountant-pack-heading" className="text-base font-semibold text-foreground">Accountant pack preparation</h2>
            <p className="mt-1 text-sm leading-5 text-muted">
              Download a structured set of existing reports and exports. No tax conclusion, document upload or accountant access is active here.
            </p>
            <Link href="/reports/accountant-pack" className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-brand-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              Prepare files
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
