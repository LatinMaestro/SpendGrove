import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { FeatureCard } from "@/components/feature-card";

const reviewSteps = ["Upload CSV", "Privacy scan", "Map columns", "Review rows", "Import, skip or merge"];

export default function ImportPage() {
  return (
    <AppShell>
      <section className="rounded-[2rem] border border-border bg-surface-mint p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-brand-green p-3 text-white">
            <ShieldCheck aria-hidden="true" className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-teal">CSV import foundation</p>
            <h2 className="mt-2 text-2xl font-bold text-brand-deepTeal">Review everything before it becomes a transaction.</h2>
            <p className="mt-3 text-sm leading-6 text-brand-deepTeal/75">
              SpendGrove will detect private bank fields and avoid storing raw CSV files by default. Parser implementation comes later in Phase 1.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-dashed border-brand-teal bg-surface-base p-6 text-center shadow-soft">
        <p className="text-sm font-semibold text-brand-deepTeal">CSV upload area placeholder</p>
        <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">
          The upload control, privacy scanner and manual mapping flow will be added without committing real CSV data.
        </p>
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <FeatureCard title="Review flow" body="Every imported row must support Import, Skip and Merge before commit.">
          <ol className="space-y-2">
            {reviewSteps.map((step, index) => (
              <li key={step} className="flex items-center gap-3 text-sm font-semibold text-brand-deepTeal">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-mint text-xs text-brand-teal">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </FeatureCard>
        <FeatureCard title="Privacy rules" body="BSB, account number, account name, card number, customer ID and other private identifiers must be detected and excluded." />
      </div>
    </AppShell>
  );
}
