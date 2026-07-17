import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PublicInformationShell } from "@/components/public-information-shell";
import { RELEASE_CONTACT_PLACEHOLDER } from "@/lib/release-contact";

export const metadata: Metadata = {
  title: "Help | SpendGrove",
  description: "Beginner-friendly help for SpendGrove accounts, transactions and CSV imports.",
};

function HelpSection({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="rounded-2xl border border-border bg-surface-base p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-muted">{children}</div>
    </section>
  );
}

export default function HelpPage() {
  return (
    <PublicInformationShell
      title="SpendGrove help"
      description="Simple guidance for using the private-beta build without sharing private bank information."
    >
      <HelpSection title="What SpendGrove does">
        <p>SpendGrove helps you review transactions, organise categories, create monthly budgets and confirm regular payments.</p>
        <p>Loans and Property records are optional advanced tools. SpendGrove does not move money, connect to your bank by default or provide tax or financial advice.</p>
      </HelpSection>

      <HelpSection title="Start with a manual transaction">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Sign in and open Transactions.</li>
          <li>Choose Add transaction.</li>
          <li>Select Money in, Money out or Transfer and enter the amount, date and category.</li>
          <li>Review the details, then save.</li>
        </ol>
      </HelpSection>

      <HelpSection title="Import a CSV">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Export a CSV from your bank and keep it on your own device.</li>
          <li>Choose Upload CSV in SpendGrove.</li>
          <li>Confirm the column mapping only when SpendGrove cannot do so safely.</li>
          <li>Review every row and choose Import, Skip or Merge.</li>
          <li>Check categories and any optional Property links, then commit the reviewed rows.</li>
        </ol>
        <p>Current limits are 5 MB and 5,000 rows per CSV. Larger files must be divided before import.</p>
        <p>PDF, spreadsheet, image, statement and live-bank formats are not accepted by the CSV importer.</p>
      </HelpSection>

      <HelpSection title="Keep bank information private">
        <p>Do not send anyone your real CSV file, bank statement, account number, BSB, card details, customer number, login details or verification codes.</p>
        <p>SpendGrove scans selected files for private fields and excludes them from committed transaction records. You still need to review the mapping and rows before import.</p>
        <p>If a screenshot is ever needed for support, use synthetic data and crop or cover names, amounts, merchants, account details, Property details and browser identifiers.</p>
      </HelpSection>

      <HelpSection title="Supported bank formats">
        <p>SpendGrove supports ordinary transaction CSVs that provide a date, an amount or debit/credit columns, and a transaction description. Some known layouts can be mapped automatically; others need a one-time review.</p>
        <p>Loan repayment CSVs are supported only through the Loans import workflow and must still be reviewed before commit.</p>
        <p>If a format is not recognised, do not submit a real statement. Create a synthetic sample with the same headers and invented rows.</p>
      </HelpSection>

      <HelpSection title="Account data and this browser">
        <p>Signed-in account data is owner-scoped and stored durably. Older prototype data may still exist only in this browser and remains separate.</p>
        <p>SpendGrove does not automatically upload, merge or delete that local prototype information.</p>
        <p>You can download a versioned JSON account export or begin permanent account deletion from Settings after identity verification.</p>
      </HelpSection>

      <HelpSection title="Private-beta limitations">
        <ul className="list-disc space-y-2 pl-5">
          <li>No live bank connection or Basiq.</li>
          <li>No payments, bill cancellation or subscription purchasing.</li>
          <li>No AI advice.</li>
          <li>No tax lodgement, deductible calculation or ATO integration.</li>
          <li>No household mode or document storage.</li>
          <li>No native iOS or App Store release.</li>
        </ul>
      </HelpSection>

      <HelpSection title="Safe bug reports and suggestions">
        <p>{RELEASE_CONTACT_PLACEHOLDER}</p>
        <p>When the contact is published, include only the page name, what you tried, what you expected, a safe error code if one appears, browser/device type and the application version when available.</p>
        <p>Never attach a real CSV, statement, transaction screenshot or financial-history export. Do not include emails, account identifiers, filenames, transaction descriptions, merchant history, amounts, balances, Loan or Property details.</p>
        <p>No support-ticket provider, attachment uploader, chatbot or response-time promise is currently enabled.</p>
      </HelpSection>

      <HelpSection title="Record-keeping boundary">
        <p>SpendGrove is for personal record keeping and budgeting only. It is not tax, legal, investment, debt or credit advice.</p>
        <p>Property records and exports are not ATO-ready, accountant-certified or deductible/claimable calculations.</p>
      </HelpSection>

      <div className="flex flex-wrap gap-3">
        <Link href="/privacy" className="inline-flex min-h-11 items-center rounded-xl border border-brand-teal px-4 text-sm font-semibold text-brand-teal">Read privacy information</Link>
        <Link href="/sign-in" className="inline-flex min-h-11 items-center rounded-xl bg-brand-green px-4 text-sm font-semibold text-white">Sign in to SpendGrove</Link>
      </div>
    </PublicInformationShell>
  );
}
