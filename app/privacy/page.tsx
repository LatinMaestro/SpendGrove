import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PublicInformationShell } from "@/components/public-information-shell";
import {
  GROVEWARE_DEVELOPER_NAME,
  RELEASE_CONTACT_PLACEHOLDER,
} from "@/lib/release-contact";

export const metadata: Metadata = {
  title: "Privacy | SpendGrove",
  description: "How SpendGrove handles account, transaction and CSV import information.",
};

function PrivacySection({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="rounded-2xl border border-border bg-surface-base p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-muted">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <PublicInformationShell
      title="Privacy at SpendGrove"
      description="A plain-English pre-release summary of what SpendGrove keeps, what it deliberately avoids and the controls available to you."
    >
      <div className="rounded-2xl border border-warning-amber/35 bg-warning-amber/10 p-4 text-sm leading-6 text-foreground">
        <strong>Pre-release notice.</strong> This information reflects the current private-beta build and still requires final factual and legal review before external users are invited.
      </div>

      <PrivacySection title="Information you choose to keep in SpendGrove">
        <p>Your account can store reviewed transactions, categories, budgets, regular payments, import history, merchant rules and settings.</p>
        <p>If you use the advanced Loans area, it can also store Property nicknames, Loan Accounts, repayment breakdowns and the links you confirm between records.</p>
        <p>Money is stored in integer cents. Australian calendar dates and account ownership are preserved.</p>
      </PrivacySection>

      <PrivacySection title="CSV files and bank information">
        <p>SpendGrove does not ask for your internet-banking username, password or verification code. Live bank linking is not enabled.</p>
        <p>You choose a CSV file in your browser. SpendGrove checks it for private bank fields and asks you to review rows before committing transactions.</p>
        <p>Raw CSV files are not retained. Private fields such as account numbers, BSBs, card references and customer identifiers are excluded from committed transaction records.</p>
        <p>Safe import status and mapping information may be kept so you can understand and repeat an import. Do not upload a file that you are not authorised to use.</p>
      </PrivacySection>

      <PrivacySection title="Account and local prototype data">
        <p>Clerk provides sign-in, session and account identity services. SpendGrove links that identity to an owner-scoped account in its database.</p>
        <p>Older prototype information that remains in this browser stays separate. It is not automatically uploaded, merged, backed up to your account or included in account totals.</p>
        <p>Signing in or out does not silently delete that browser-local prototype information.</p>
      </PrivacySection>

      <PrivacySection title="Service providers and processing">
        <p>Vercel hosts the web application and its server functions. Neon provides the PostgreSQL database. Clerk provides authentication.</p>
        <p>These providers may process operational data in locations outside Australia. The exact production regions, contractual terms, subprocessors and cross-border disclosures require final factual and legal review.</p>
        <p>Essential cookies or browser storage may be used for authentication, security and user-controlled settings. Product analytics is currently off.</p>
      </PrivacySection>

      <PrivacySection title="Export and delete">
        <p>Signed-in users can download a versioned JSON copy of their durable SpendGrove account data from Settings after recent identity verification.</p>
        <p>Account deletion is also initiated in Settings. It permanently removes account-owned application records and coordinates removal of the Clerk identity. It has no recovery grace period.</p>
        <p>Provider backups may retain encrypted historical copies for a limited operational period. Exact retention and deletion-propagation facts remain an operator and legal-review item before private beta.</p>
      </PrivacySection>

      <PrivacySection title="Logs, analytics and support">
        <p>SpendGrove is designed not to put raw CSV rows, transaction descriptions, merchant history, amounts, balances, bank identifiers or secrets into operational logs.</p>
        <p>No behavioural analytics, advertising tracker, crash-reporting provider or support-ticket provider is enabled.</p>
        <p>If support is needed later, do not send real CSV files, bank statements, transaction screenshots, account numbers or authentication codes.</p>
      </PrivacySection>

      <PrivacySection title="Financial and tax boundary">
        <p>SpendGrove is a record-keeping and personal-budgeting tool. It does not provide tax, legal, investment, debt or credit advice.</p>
        <p>Property records and exports are not ATO-ready, accountant-certified or a deductible/claimable calculation.</p>
      </PrivacySection>

      <PrivacySection title={"Contact " + GROVEWARE_DEVELOPER_NAME}>
        <p>{RELEASE_CONTACT_PLACEHOLDER}</p>
        <p>A final support contact, privacy contact and business identity disclosure must be approved before private beta invitations are sent.</p>
      </PrivacySection>

      <div className="flex flex-wrap gap-3">
        <Link href="/onboarding" className="inline-flex min-h-11 items-center rounded-xl border border-brand-teal px-4 text-sm font-semibold text-brand-teal">Back to SpendGrove introduction</Link>
        <Link href="/sign-in" className="inline-flex min-h-11 items-center rounded-xl bg-brand-green px-4 text-sm font-semibold text-white">Sign in</Link>
      </div>
    </PublicInformationShell>
  );
}
