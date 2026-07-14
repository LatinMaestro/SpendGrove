"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useUserSettings } from "@/components/settings-provider";

export function OnboardingPrompt() {
  const { settings, isReady } = useUserSettings();

  if (!isReady || settings.onboardingComplete) {
    return null;
  }

  return (
    <section className="mb-5 flex flex-col gap-4 rounded-2xl border border-border bg-surface-base p-4 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="welcome-title">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-mint text-brand-evergreen">
          <ShieldCheck aria-hidden="true" className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 id="welcome-title" className="text-base font-semibold text-foreground">Finish setting up SpendGrove</h2>
          <p className="mt-1 text-sm leading-5 text-muted">Confirm your privacy choices and Australian defaults.</p>
        </div>
      </div>
      <Link
        href="/onboarding"
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white transition-colors hover:bg-brand-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        Continue setup
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </section>
  );
}
