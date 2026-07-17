"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, ChevronRight, LockKeyhole, SlidersHorizontal } from "lucide-react";
import { AccountDataExport } from "@/components/account-data-export";
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
    <div className="flex min-h-16 items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-sm leading-5 text-muted">{description}</p>
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

function SettingsGroup({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description?: string;
  children: ReactNode;
}>) {
  return (
    <section aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-heading`}>
      <div className="mb-2 px-1">
        <h2 id={`${title.toLowerCase().replaceAll(" ", "-")}-heading`} className="text-base font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface-base">{children}</div>
    </section>
  );
}

export function SettingsPanel() {
  const { settings, isReady, updateSettings } = useUserSettings();

  return (
    <div className="space-y-6">
      <SettingsGroup title="Preferences" description="Keep everyday tasks simple and control optional analytics.">
        <div aria-busy={!isReady}>
          <PreferenceSwitch
            checked={settings.simpleMode}
            label="Simple Mode"
            description="Show the essentials first."
            onChange={() => updateSettings({ simpleMode: !settings.simpleMode })}
          />
          <PreferenceSwitch
            checked={settings.analyticsOptOut}
            label="Limit non-essential analytics"
            description="This remains on by default."
            onChange={() => updateSettings({ analyticsOptOut: !settings.analyticsOptOut })}
          />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Australian defaults">
        <details className="group">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green">
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-mint text-brand-teal">
                <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              </span>
              <span>
                <strong className="block text-sm text-foreground">Currency, dates and financial year</strong>
                <span className="mt-0.5 block text-xs text-muted">AUD · Australian dates · 1 July to 30 June</span>
              </span>
            </span>
            <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-muted transition group-open:rotate-180" />
          </summary>
          <dl className="grid gap-px border-t border-border bg-border sm:grid-cols-3">
            <div className="bg-surface-base p-4"><dt className="text-xs text-muted">Currency</dt><dd className="mt-1 font-semibold text-foreground">AUD</dd></div>
            <div className="bg-surface-base p-4"><dt className="text-xs text-muted">Dates</dt><dd className="mt-1 font-semibold text-foreground">Australian format</dd></div>
            <div className="bg-surface-base p-4"><dt className="text-xs text-muted">Financial year</dt><dd className="mt-1 font-semibold text-foreground">1 July to 30 June</dd></div>
          </dl>
        </details>
      </SettingsGroup>

      <SettingsGroup title="Data and privacy" description="Your files and account data remain under your control.">
        <div className="flex min-h-16 items-start gap-3 px-4 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-mint text-brand-teal">
            <LockKeyhole aria-hidden="true" className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">How SpendGrove protects your data</p>
            <p className="mt-1 text-sm leading-5 text-muted">No bank login is required and raw CSV files are not stored.</p>
          </div>
          <Link
            href="/onboarding"
            aria-label="Review privacy introduction"
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            Privacy <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <AccountDataExport />
      </SettingsGroup>
    </div>
  );
}
