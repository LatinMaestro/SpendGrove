import Link from "next/link";

export function AuthSetupNotice({ mode }: Readonly<{ mode: "sign-in" | "sign-up" }>) {
  const actionLabel = mode === "sign-in" ? "sign in" : "create an account";

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-[2rem] border border-border bg-surface-base p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-teal">SpendGrove account setup</p>
        <h1 className="mt-3 text-2xl font-bold text-brand-deepTeal">Account sign-in is ready to connect</h1>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">
          Clerk authentication has been added, but this preview still needs the Clerk environment variables before you can {actionLabel}.
        </p>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">
          Your existing browser-local prototype data remains on this device. Cloud account storage is not enabled until later approved persistence tasks.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-full bg-brand-green px-5 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green/40"
        >
          Back to SpendGrove
        </Link>
      </div>
    </section>
  );
}
