import { AuthControls } from "@/components/auth/auth-controls";
import { BottomNav } from "@/components/bottom-nav";
import { ModeBadge } from "@/components/mode-badge";
import { getBuildSafeClerkEnvStatus } from "@/src/server/env";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const clerkStatus = getBuildSafeClerkEnvStatus();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] pt-5 sm:max-w-2xl sm:px-6 lg:max-w-5xl">
      <header className="mb-5 flex items-center justify-between gap-3 rounded-3xl border border-border bg-surface-base/90 p-4 shadow-soft backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-teal">SpendGrove</p>
          <h1 className="mt-1 text-xl font-bold text-brand-deepTeal">Your money, your files</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ModeBadge />
          <AuthControls clerkConfigured={clerkStatus.clerkConfigured} />
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <BottomNav />
    </main>
  );
}
