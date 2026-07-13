"use client";

import Link from "next/link";
import { ChevronRight, LockKeyhole } from "lucide-react";
import { useUserSettings } from "@/components/settings-provider";

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
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className={`relative h-8 w-14 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand-green ${checked ? "bg-brand-green" : "bg-brand-deepTeal/25"}`}>
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
          <div className="rounded-2xl bg-surface-mint p-3 text-brand-green"><LockKeyhole aria-hidden="true" className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-semibold text-brand-teal">Privacy</p>
            <h2 className="mt-1 text-xl font-bold text-brand-deepTeal">Your files stay under your control.</h2>
            <p className="mt-2 text-sm leading-6 text-brand-deepTeal/75">SpendGrove does not ask for your bank login or store raw CSV files.</p>
            <Link href="/onboarding" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
              Review privacy introduction <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface-base p-5 shadow-soft" aria-labelledby="preferences-heading">
        <h2 id="preferences-heading" className="text-lg font-bold text-brand-deepTeal">Everyday preferences</h2>
        <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Simple Mode keeps everyday tasks prominent.</p>
        <div className="mt-4 space-y-3" aria-busy={!isReady}>
          <PreferenceSwitch checked={settings.simpleMode} label="Simple Mode" description="Show the essentials first." onChange={() => updateSettings({ simpleMode: !settings.simpleMode })} />
          <PreferenceSwitch checked={settings.analyticsOptOut} label="Limit non-essential analytics" description="This remains on by default." onChange={() => updateSettings({ analyticsOptOut: !settings.analyticsOptOut })} />
        </div>
      </section>

      <details className="rounded-3xl border border-border bg-surface-base p-5 shadow-soft">
        <summary className="cursor-pointer text-lg font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">Australian defaults</summary>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-surface-mint p-4"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-teal">Currency</dt><dd className="mt-2 font-bold text-brand-deepTeal">AUD</dd></div>
          <div className="rounded-2xl bg-surface-mint p-4"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-teal">Dates</dt><dd className="mt-2 font-bold text-brand-deepTeal">Australian format</dd></div>
          <div className="rounded-2xl bg-surface-mint p-4"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-teal">Financial year</dt><dd className="mt-2 font-bold text-brand-deepTeal">1 July to 30 June</dd></div>
        </dl>
      </details>
    </div>
  );
}
