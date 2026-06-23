import Link from "next/link";
import { FileUp, Home, Landmark, Settings, WalletCards } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/transactions", label: "Transactions", icon: WalletCards },
  { href: "/loans", label: "Loans", icon: Landmark },
  { href: "/import", label: "Import", icon: FileUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 mx-auto w-[min(34rem,calc(100%-2rem))] rounded-full border border-border bg-surface-base/95 p-2 shadow-soft backdrop-blur">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} className="flex min-h-14 flex-col items-center justify-center rounded-full px-2 text-[0.68rem] font-semibold text-brand-deepTeal transition hover:bg-surface-mint focus:bg-surface-mint focus:outline-none focus:ring-2 focus:ring-brand-green"><Icon aria-hidden="true" className="mb-1 h-5 w-5" />{item.label}</Link>;
        })}
      </div>
    </nav>
  );
}
