import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FeatureCard({
  title,
  body,
  children,
  className,
}: Readonly<{
  title: string;
  body: string;
  children?: ReactNode;
  className?: string;
}>) {
  return (
    <section className={cn("rounded-3xl border border-border bg-surface-base p-5 shadow-soft", className)}>
      <h2 className="text-lg font-bold text-brand-deepTeal">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-brand-deepTeal/75">{body}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
