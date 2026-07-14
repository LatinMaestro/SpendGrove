import Image from "next/image";
import Link from "next/link";
import { AuthControls } from "@/components/auth/auth-controls";
import { BottomNav, DesktopNav } from "@/components/bottom-nav";
import { getBuildSafeClerkEnvStatus } from "@/src/server/env";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const clerkStatus = getBuildSafeClerkEnvStatus();

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-50 -translate-y-24 rounded-lg bg-brand-evergreen px-4 py-3 text-sm font-bold text-white transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      <aside className="hidden min-h-screen border-r border-border bg-surface-base px-4 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Link href="/" aria-label="SpendGrove home" className="inline-flex w-fit rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          <Image
            src="/brand/spendgrove-logo.png"
            alt="SpendGrove"
            width={264}
            height={204}
            priority
            className="h-auto w-36 object-contain"
          />
        </Link>
        <DesktopNav />
        <div className="border-t border-border pt-4">
          <AuthControls clerkConfigured={clerkStatus.clerkConfigured} />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-surface-base/96 px-4 py-2 backdrop-blur sm:px-6 lg:hidden">
          <Link
            href="/"
            aria-label="SpendGrove home"
            className="flex min-w-0 items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <Image src="/icon.svg" alt="" width={40} height={40} priority className="h-9 w-9 shrink-0" />
            <span className="truncate text-base font-bold text-brand-evergreen">SpendGrove</span>
          </Link>
          <AuthControls clerkConfigured={clerkStatus.clerkConfigured} />
        </header>

        <main
          id="main-content"
          className="mx-auto min-h-screen w-full max-w-[76rem] overflow-x-hidden px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-8"
        >
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
