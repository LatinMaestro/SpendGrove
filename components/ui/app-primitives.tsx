import type { ReactNode } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
};

export function PageHeader({ title, description, action, eyebrow }: Readonly<PageHeaderProps>) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1 text-sm font-semibold text-brand-teal">{eyebrow}</p> : null}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeader({ title, description, action }: Readonly<SectionHeaderProps>) {
  return (
    <div className="mb-3 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 text-sm leading-5 text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type CompactRowProps = {
  title: ReactNode;
  meta?: ReactNode;
  amount?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function CompactRow({
  title,
  meta,
  amount,
  leading,
  trailing,
  children,
  className = "",
}: Readonly<CompactRowProps>) {
  return (
    <div className={`flex min-h-16 items-center gap-3 border-b border-border px-1 py-3 last:border-b-0 ${className}`}>
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline justify-between gap-3">
          <div className="min-w-0 truncate text-sm font-semibold text-foreground">{title}</div>
          {amount ? <div className="money-value shrink-0 text-sm font-bold text-foreground">{amount}</div> : null}
        </div>
        {meta ? <div className="mt-0.5 truncate text-xs text-muted">{meta}</div> : null}
        {children}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export function EmptyState({ title, description, action, icon }: Readonly<EmptyStateProps>) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-base px-5 py-7 text-center">
      {icon ? <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center text-brand-teal">{icon}</div> : null}
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading" }: Readonly<{ label?: string }>) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-surface-base px-4 py-3 text-sm text-muted" role="status" aria-live="polite">
      <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-brand-teal" />
      <span>{label}</span>
    </div>
  );
}

type AttentionNoticeProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function AttentionNotice({ title, description, action }: Readonly<AttentionNoticeProps>) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning-amber/30 bg-warning-amber/5 px-4 py-3" role="status">
      <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warning-amber" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? <p className="mt-0.5 text-sm leading-5 text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type ProgressRowProps = {
  label: string;
  value: number;
  max: number;
  supportingText?: ReactNode;
};

export function ProgressRow({ label, value, max, supportingText }: Readonly<ProgressRowProps>) {
  const safeMax = max > 0 ? max : 1;
  const percentage = Math.min(100, Math.max(0, Math.round((value / safeMax) * 100)));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-foreground">{label}</span>
        {supportingText ? <span className="money-value text-muted">{supportingText}</span> : null}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-subtle" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
        <div className="h-full rounded-full bg-brand-green" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
