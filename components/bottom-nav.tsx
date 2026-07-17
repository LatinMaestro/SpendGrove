"use client";

import Link from "next/link";
import { BarChart3, FileUp, Home, Landmark, Settings, WalletCards } from "lucide-react";
import { usePathname } from "next/navigation";

export const navItems = [
  { href: "/", label: "Home", icon: Home, activePaths: ["/budgets", "/regular-payments"], mobile: true },
  { href: "/transactions", label: "Transactions", icon: WalletCards, activePaths: [], mobile: true },
  { href: "/reports", label: "Reports", icon: BarChart3, activePaths: [], mobile: false },
  { href: "/loans", label: "Loans", icon: Landmark, activePaths: [], mobile: true },
  { href: "/import", label: "Import", icon: FileUp, activePaths: [], mobile: true },
  { href: "/settings", label: "Settings", icon: Settings, activePaths: [], mobile: true },
] as const;

function isCurrentPath(pathname: string, item: (typeof navItems)[number]) {
  if (item.activePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return true;
  return item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const mobileNavItems = navItems.filter((item) => item.mobile);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-base/96 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isCurrentPath(pathname, item);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-14 flex-col items-center justify-center rounded-xl px-1 text-[0.68rem] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                active ? "text-brand-evergreen" : "text-muted hover:bg-surface-subtle hover:text-foreground"
              }`}
            >
              <Icon aria-hidden="true" className="mb-1 h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
              <span>{item.label}</span>
              {active ? <span aria-hidden="true" className="absolute bottom-0 h-0.5 w-5 rounded-full bg-brand-green" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="mt-6 flex flex-1 flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isCurrentPath(pathname, item);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
              active
                ? "bg-brand-evergreen text-white"
                : "text-muted hover:bg-surface-subtle hover:text-foreground"
            }`}
          >
            <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={active ? 2.3 : 1.8} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
