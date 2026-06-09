"use client";

import Link from "next/link";
import { Check, ChevronRight, LockKeyhole } from "lucide-react";
import { useUserSettings } from "@/components/settings-provider";
import { featureFlagDefinitions } from "@/lib/settings";

function PreferenceSwitch({
  checked,
  label,
  description,
  onChange,
}: Readonly<{
  checked: boolean;
  label: string;
  description: string;
  onChange: () => void;
}>) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface-mint p-4">
      <div>
        <p className="font-bold text-brand-deepTeal">{label}</p>
        <p className="mt-1 text-sm leading-5 text-brand-deepTeal/70">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative h-8 w-14 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand-green ${checked ? "bg-brand-green" : "bg-brand-deepTeal/25"}`}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${checked ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );
}

export function SettingsPanel() {
  const { settings, isReady, updateSettings } = useUserSettings();

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-surface-mint p-3 text-brand-green">
            <LockKeyhole aria-hidden="true" className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-teal">Privacy-first setup</p>
            <h2 className="mt-1 text-xl font-bold text-brand-deepTeal">Your Phase 1 preferences stay in this browser.</h2>
            <p className="mt-2 text-sm leading-6 text-brand-deepTeal/75">
              Production authentication and database-backed settings are not connected yet. No bank login, CSV or financial data is stored by this screen.
            </p>
            <Link href="/onboarding" className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
              Review introduction
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface-base p-5 shadow-soft" aria-labelledby="preferences-heading">
        <h2 id="preferences-heading" className="text-lg font-bold text-brand-deepTeal">App preferences</h2>
        <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Simple Mode is the default. Turning it off does not activate unfinished modules.</p>
        <div className="mt-4 space-y-3" aria-busy={!isReady}>
          <PreferenceSwitch
            checked={settings.simpleMode}
            label="Simple Mode"
            description="Show core transaction and import workflows without advanced modules."
            onChange={() => updateSettings({ simpleMode: !settings.simpleMode })}
          />
          <PreferenceSwitch
            checked={settings.analyticsOptOut}
            label="Opt out of non-essential analytics"
            description="On by default. No analytics provider is connected in Phase 1."
            onChange={() => updateSettings({ analyticsOptOut: !settings.analyticsOptOut })}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface-base p-5 shadow-soft" aria-labelledby="defaults-heading">
        <h2 id="defaults-heading" className="text-lg font-bold text-brand-deepTeal">Australian defaults</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-surface-mint p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-teal">Currency</dt>
            <dd className="mt-2 font-bold text-brand-deepTeal">AUD</dd>
          </div>
          <div className="rounded-2xl bg-surface-mint p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-teal">Dates</dt>
            <dd className="mt-2 font-bold text-brand-deepTeal">Australian format</dd>
          </div>
          <div className="rounded-2xl bg-surface-mint p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-teal">Financial year</dt>
            <dd className="mt-2 font-bold text-brand-deepTeal">1 July to 30 June</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-3xl border border-border bg-surface-base p-5 shadow-soft" aria-labelledby="features-heading">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="features-heading" className="text-lg font-bold text-brand-deepTeal">Future features</h2>
            <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">The settings foundation is visible, but every advanced feature remains disabled until its phase and privacy review are approved.</p>
          </div>
          <span className="rounded-full bg-surface-mint px-3 py-2 text-xs font-semibold text-brand-deepTeal">All off</span>
        </div>
        <div className="mt-4 space-y-3">
          {featureFlagDefinitions.map((feature) => (
            <div key={feature.key} className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-brand-deepTeal">{feature.label}</p>
                  <span className="rounded-full bg-surface-mint px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-brand-teal">Future</span>
                </div>
                <p className="mt-1 text-sm leading-5 text-brand-deepTeal/70">{feature.description}</p>
              </div>
              <button type="button" role="switch" aria-checked="false" aria-label={`${feature.label} is unavailable`} disabled className="relative h-8 w-14 shrink-0 cursor-not-allowed rounded-full bg-brand-deepTeal/15 opacity-70">
                <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow" />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-teal">
          <Check aria-hidden="true" className="h-4 w-4" />
          No provider calls or advanced module routes are activated.
        </p>
      </section>
    </div>
  );
}
