import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12">
      <section className="w-full rounded-2xl border border-border bg-surface-base p-6 text-center">
        <p className="text-sm font-semibold text-brand-teal">SpendGrove</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          This page is not available. Return to SpendGrove and choose another task.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-brand-teal px-4 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          Return to Home
        </Link>
      </section>
    </main>
  );
}
