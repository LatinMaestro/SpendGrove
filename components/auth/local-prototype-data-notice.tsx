"use client";

import { useEffect, useState } from "react";
import { hasBrowserLocalPrototypeData } from "@/lib/browser-local-data";

export function LocalPrototypeDataNotice({
  context,
}: Readonly<{ context: "sign-in" | "account" }>) {
  const [hasLocalData, setHasLocalData] = useState(false);

  useEffect(() => {
    try {
      setHasLocalData(hasBrowserLocalPrototypeData(window.localStorage));
    } catch {
      setHasLocalData(false);
    }
  }, []);

  if (!hasLocalData) return null;

  return (
    <aside
      className={context === "sign-in"
        ? "mb-4 rounded-2xl border border-brand-teal/30 bg-surface-mint p-4"
        : "mb-5 rounded-2xl border border-border bg-surface-subtle p-4"}
      aria-label="Browser-only prototype data"
    >
      <p className="text-sm font-bold text-brand-deepTeal">Earlier browser-only data is still on this device</p>
      <p className="mt-1 text-xs leading-5 text-brand-deepTeal/70">
        It stays separate from your SpendGrove account. Signing in will not delete, upload or merge it.
      </p>
    </aside>
  );
}
