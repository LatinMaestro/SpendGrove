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
    <section className="mb-5 rounded-[2rem] border border-brand-teal/30 bg-surface-mint p-5 shadow-soft" aria-labelledby="welcome-title">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-brand-green p-3 text-white">
          <ShieldCheck aria-hidden="true" className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-teal">Welcome to SpendGrove</p>
          <h2 id="welcome-title" className="mt-1 text-xl font-bold text-brand-deepTeal">
            Start with privacy, not a bank login.
          </h2>
          <p className="mt-2 text-sm leading-6 text-brand-deepTeal/75">
            See what SpendGrove stores, confirm your Australian defaults and choose how simple the app should feel.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-green px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal"
          >
            Set up SpendGrove
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
