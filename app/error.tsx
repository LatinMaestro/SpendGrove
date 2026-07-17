"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12">
      <section className="w-full rounded-2xl border border-border bg-surface-base p-6 text-center">
        <p className="text-sm font-semibold text-brand-teal">SpendGrove</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Your request could not be completed safely. Try again, or return to Home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-xl bg-brand-teal px-4 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            Return to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
