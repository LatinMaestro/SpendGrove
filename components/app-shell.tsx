import { BottomNav } from "@/components/bottom-nav";
import { ModeBadge } from "@/components/mode-badge";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5 sm:max-w-2xl sm:px-6 lg:max-w-5xl">
      <header className="mb-5 flex items-center justify-between rounded-3xl border border-border bg-surface-base/90 p-4 shadow-soft backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-teal">SpendGrove</p>
          <h1 className="mt-1 text-xl font-bold text-brand-deepTeal">Your money, your files</h1>
        </div>
        <ModeBadge />
      </header>
      <div className="flex-1">{children}</div>
      <BottomNav />
    </main>
  );
}
