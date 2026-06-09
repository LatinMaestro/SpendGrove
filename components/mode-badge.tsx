"use client";

import { useUserSettings } from "@/components/settings-provider";

export function ModeBadge() {
  const { settings, isReady } = useUserSettings();
  const label = !isReady || settings.simpleMode ? "Simple Mode" : "Advanced preference";

  return (
    <span className="rounded-full bg-surface-mint px-3 py-2 text-xs font-semibold text-brand-deepTeal" aria-live="polite">
      {label}
    </span>
  );
}
