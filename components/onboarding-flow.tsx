"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, FileUp, LockKeyhole, ShieldCheck, SlidersHorizontal, WalletCards } from "lucide-react";
import { useUserSettings } from "@/components/settings-provider";

const steps = ["Privacy", "Defaults", "Start"] as const;

const privacyPromises = [
  "No internet banking username, password or MFA code is requested.",
  "Raw CSV files are not stored by default.",
  "Private bank fields are excluded and every import row is reviewed before commit.",
];

export function OnboardingFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const { settings, updateSettings } = useUserSettings();

  function finishOnboarding() {
    updateSettings({ onboardingComplete: true });
    setCompleted(true);
  }

  if (completed) {
    return (
      <section className="rounded-[2rem] border border-border bg-surface-base p-6 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-mint text-brand-green">
          <Check aria-hidden="true" className="h-7 w-7" />
        </div>
        <p className="mt-4 text-sm font-semibold text-brand-teal">Setup complete</p>
        <h2 className="mt-2 text-2xl font-bold text-brand-deepTeal">You are ready to start simply.</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-brand-deepTeal/75">
          Your Phase 1 preferences are saved in this browser only. No production account or live database is connected yet.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/transactions" className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-brand-green px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal">
            <WalletCards aria-hidden="true" className="h-5 w-5" />
            Add a transaction
          </Link>
          <Link href="/import" className="flex min-h-14 items-center justify-center gap-2 rounded-full border border-brand-teal bg-surface-base px-5 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
            <FileUp aria-hidden="true" className="h-5 w-5" />
            Explore CSV import
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="onboarding-title">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-brand-teal">Step {stepIndex + 1} of {steps.length}</p>
        <ol className="flex gap-2" aria-label="Onboarding progress">
          {steps.map((step, index) => (
            <li key={step}>
              <span className={`block h-2.5 w-8 rounded-full ${index <= stepIndex ? "bg-brand-green" : "bg-border"}`} aria-label={`${step}${index === stepIndex ? ", current step" : ""}`} />
            </li>
          ))}
        </ol>
      </div>

      {stepIndex === 0 ? (
        <div className="mt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-mint text-brand-green">
            <ShieldCheck aria-hidden="true" className="h-6 w-6" />
          </div>
          <h2 id="onboarding-title" className="mt-4 text-2xl font-bold text-brand-deepTeal">Your money stays under your control.</h2>
          <p className="mt-3 text-sm leading-6 text-brand-deepTeal/75">
            SpendGrove is designed around files you choose to import—not ongoing access to your bank account.
          </p>
          <ul className="mt-5 space-y-3">
            {privacyPromises.map((promise) => (
              <li key={promise} className="flex gap-3 rounded-2xl bg-surface-mint p-4 text-sm leading-6 text-brand-deepTeal">
                <LockKeyhole aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" />
                {promise}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {stepIndex === 1 ? (
        <div className="mt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-mint text-brand-green">
            <SlidersHorizontal aria-hidden="true" className="h-6 w-6" />
          </div>
          <h2 id="onboarding-title" className="mt-4 text-2xl font-bold text-brand-deepTeal">Australian defaults, simple by design.</h2>
          <p className="mt-3 text-sm leading-6 text-brand-deepTeal/75">AUD, Australian dates and the 1 July financial year are ready from the start.</p>
          <div className="mt-5 rounded-3xl border border-border bg-surface-mint p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-brand-deepTeal">Simple Mode</p>
                <p className="mt-1 text-sm leading-5 text-brand-deepTeal/70">Keeps advanced modules hidden. It is on by default.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.simpleMode}
                onClick={() => updateSettings({ simpleMode: !settings.simpleMode })}
                className={`relative h-8 w-14 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand-green ${settings.simpleMode ? "bg-brand-green" : "bg-brand-deepTeal/25"}`}
              >
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${settings.simpleMode ? "left-7" : "left-1"}`} />
                <span className="sr-only">Toggle Simple Mode</span>
              </button>
            </div>
          </div>
          {!settings.simpleMode ? (
            <p className="mt-3 rounded-2xl border border-warning-amber/40 bg-warning-amber/10 p-3 text-sm leading-5 text-brand-deepTeal">
              Advanced preference is recorded, but loans, property, tax, recurring, Basiq, payments and AI remain unavailable.
            </p>
          ) : null}
        </div>
      ) : null}

      {stepIndex === 2 ? (
        <div className="mt-6">
          <h2 id="onboarding-title" className="text-2xl font-bold text-brand-deepTeal">Choose your first step.</h2>
          <p className="mt-3 text-sm leading-6 text-brand-deepTeal/75">You can enter something manually or explore the privacy-first CSV workflow. Neither option connects to your bank.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-surface-mint p-5">
              <WalletCards aria-hidden="true" className="h-6 w-6 text-brand-teal" />
              <p className="mt-3 font-bold text-brand-deepTeal">Manual transaction</p>
              <p className="mt-1 text-sm leading-5 text-brand-deepTeal/70">The simplest way to begin tracking.</p>
            </div>
            <div className="rounded-3xl bg-surface-mint p-5">
              <FileUp aria-hidden="true" className="h-6 w-6 text-brand-teal" />
              <p className="mt-3 font-bold text-brand-deepTeal">CSV import</p>
              <p className="mt-1 text-sm leading-5 text-brand-deepTeal/70">A guided, review-before-commit flow.</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-5">
        <button
          type="button"
          onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
          disabled={stepIndex === 0}
          className="min-h-12 rounded-full px-5 text-sm font-bold text-brand-deepTeal disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          Back
        </button>
        {stepIndex < steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
            className="min-h-12 rounded-full bg-brand-green px-6 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={finishOnboarding}
            className="min-h-12 rounded-full bg-brand-green px-6 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal"
          >
            Finish setup
          </button>
        )}
      </div>
    </section>
  );
}
