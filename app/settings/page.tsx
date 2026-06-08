import { AppShell } from "@/components/app-shell";
import { FeatureCard } from "@/components/feature-card";

const settings = [
  { label: "Simple Mode", value: "On by default" },
  { label: "Currency", value: "AUD" },
  { label: "Dates", value: "Australian format" },
  { label: "Financial year", value: "1 July to 30 June" },
];

const disabledFeatures = ["Loans", "Property reports", "Recurring detection", "Enhanced merchant lookup", "Payments"];

export default function SettingsPage() {
  return (
    <AppShell>
      <FeatureCard title="Privacy-first setup" body="Phase 1 keeps SpendGrove simple: one development account, Australian defaults and no production authentication or third-party provider calls." />

      <section className="mt-5 rounded-3xl border border-border bg-surface-base p-5 shadow-soft">
        <h2 className="text-lg font-bold text-brand-deepTeal">Defaults</h2>
        <div className="mt-4 space-y-3">
          {settings.map((setting) => (
            <div key={setting.label} className="flex items-center justify-between gap-4 rounded-2xl bg-surface-mint px-4 py-3">
              <p className="text-sm font-semibold text-brand-deepTeal">{setting.label}</p>
              <p className="text-right text-sm text-brand-deepTeal/70">{setting.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-border bg-surface-base p-5 shadow-soft">
        <h2 className="text-lg font-bold text-brand-deepTeal">Future features</h2>
        <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">
          These remain disabled unless explicitly approved in a later phase.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {disabledFeatures.map((feature) => (
            <span key={feature} className="rounded-full bg-surface-mint px-3 py-2 text-xs font-semibold text-brand-deepTeal">
              {feature}: off
            </span>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
