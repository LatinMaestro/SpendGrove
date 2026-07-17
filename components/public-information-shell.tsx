import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function PublicInformationShell({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description: string;
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-50 -translate-y-24 rounded-lg bg-brand-evergreen px-4 py-3 text-sm font-bold text-white transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-surface-base">
        <div className="mx-auto flex min-h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <Link href="/onboarding" className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <Image src="/icon.svg" alt="" width={40} height={40} className="h-9 w-9" />
            <span className="font-bold text-brand-evergreen">SpendGrove</span>
          </Link>
          <nav aria-label="Public information" className="flex items-center gap-2 text-sm font-semibold">
            <Link href="/privacy" className="min-h-11 rounded-xl px-3 py-3 text-brand-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Privacy</Link>
            <Link href="/sign-in" className="min-h-11 rounded-xl border border-brand-teal px-3 py-3 text-brand-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Sign in</Link>
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <header>
          <p className="text-sm font-semibold text-brand-teal">Groveware · Australian private beta preparation</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">{description}</p>
        </header>
        <div className="mt-8 space-y-6">{children}</div>
      </main>
      <footer className="border-t border-border bg-surface-base">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-muted sm:px-6">
          <span>SpendGrove by Groveware</span>
          <div className="flex gap-4">
            <Link href="/onboarding" className="font-semibold text-brand-teal">About SpendGrove</Link>
            <Link href="/privacy" className="font-semibold text-brand-teal">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
