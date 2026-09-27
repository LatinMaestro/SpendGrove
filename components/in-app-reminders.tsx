"use client";

import { Bell, CalendarPlus, Check, Settings2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Family =
  | "RECURRING_EXPECTED_DATE"
  | "BUDGET_EIGHTY_PERCENT"
  | "BUDGET_FULL"
  | "IMPORT"
  | "SAVINGS_GOAL"
  | "UNMATCHED_LOAN"
  | "EOFY_PREPARATION";
type Preference = {
  family: Family;
  isEnabled: boolean;
  leadDays: number;
  thresholdPercent: number | null;
};
type Reminder = {
  id: string;
  family: Family;
  dueDate: string;
  status: "ACTIVE" | "ACKNOWLEDGED" | "DISMISSED";
  timing: "UPCOMING" | "DUE" | "OVERDUE";
};
type Response = {
  ok: true;
  preferences: Preference[];
  reminders: Reminder[];
} | { ok: false; error: string };

const FAMILY_DETAILS: Record<Family, { title: string; description: string }> = {
  RECURRING_EXPECTED_DATE: {
    title: "Regular payments",
    description: "Remind me before a confirmed regular payment is expected.",
  },
  BUDGET_EIGHTY_PERCENT: {
    title: "Budget at 80%",
    description: "Tell me when a monthly budget reaches 80%.",
  },
  BUDGET_FULL: {
    title: "Budget reached",
    description: "Tell me when a monthly budget reaches 100%.",
  },
  IMPORT: {
    title: "Import reminder",
    description: "Let me choose a date to remember my next import.",
  },
  SAVINGS_GOAL: {
    title: "Savings goals",
    description: "Remind me about goal dates and progress milestones.",
  },
  UNMATCHED_LOAN: {
    title: "Loan repayments",
    description: "Tell me when a repayment still needs matching.",
  },
  EOFY_PREPARATION: {
    title: "End of financial year",
    description: "Let me choose a date to prepare my records.",
  },
};

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Brisbane",
  }).format(new Date(`${value}T00:00:00+10:00`));
}

function timingLabel(reminder: Reminder) {
  if (reminder.timing === "OVERDUE") return `Due ${displayDate(reminder.dueDate)}`;
  if (reminder.timing === "DUE") return "Due today";
  return `Upcoming ${displayDate(reminder.dueDate)}`;
}

async function readResponse(response: globalThis.Response): Promise<Response> {
  try {
    const value = await response.json() as Response;
    if (response.ok && value.ok) return value;
    return { ok: false, error: value.ok ? "Reminders could not be loaded." : value.error };
  } catch {
    return { ok: false, error: "Reminders could not be loaded." };
  }
}

export function InAppReminders({ available = false }: { available?: boolean }) {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dateByFamily, setDateByFamily] = useState<Partial<Record<Family, string>>>({});
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function apply(value: Extract<Response, { ok: true }>) {
    setPreferences(value.preferences);
    setReminders(value.reminders);
  }

  async function load() {
    const refreshed = await readResponse(await fetch("/api/account/reminders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "REFRESH_DERIVED" }),
    }));
    if (refreshed.ok) apply(refreshed);
    else setError(refreshed.error);
    setReady(true);
  }

  useEffect(() => {
    if (available) void load();
  }, [available]);

  async function mutate(input: Record<string, unknown>, key: string, success: string) {
    if (busy) return;
    setBusy(key);
    setError("");
    setMessage("");
    const result = await readResponse(await fetch("/api/account/reminders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }));
    setBusy("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    apply(result);
    setMessage(success);
  }

  const active = useMemo(
    () => reminders.filter((reminder) => reminder.status === "ACTIVE"),
    [reminders],
  );
  const history = useMemo(
    () => reminders.filter((reminder) => reminder.status !== "ACTIVE"),
    [reminders],
  );

  if (!available) return null;

  return (
    <section className="mt-7 rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="reminders-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="reminders-heading" className="flex items-center gap-2 text-lg font-bold text-brand-deepTeal">
            <Bell aria-hidden="true" className="h-5 w-5 text-brand-teal" />
            Reminders
          </h2>
          <p className="mt-1 text-sm leading-6 text-brand-deepTeal/70">Private in-app reminders only. No email, text message or push notification is sent.</p>
        </div>
        {active.length > 0 && <span className="rounded-full bg-surface-mint px-3 py-1 text-xs font-bold text-brand-deepTeal">{active.length} to review</span>}
      </div>

      {message && <p role="status" className="mt-4 rounded-2xl bg-surface-mint p-3 text-sm font-semibold text-brand-deepTeal">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-2xl bg-danger-red/10 p-3 text-sm font-semibold text-danger-red">{error}</p>}

      {!ready ? (
        <p aria-busy="true" className="mt-4 text-sm text-brand-deepTeal/65">Checking reminders…</p>
      ) : active.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm text-brand-deepTeal/70">Nothing needs your attention right now.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {active.map((reminder) => (
            <li key={reminder.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-brand-deepTeal">{FAMILY_DETAILS[reminder.family].title}</p>
                <p className="mt-1 text-sm text-brand-deepTeal/65">{timingLabel(reminder)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy === reminder.id} onClick={() => void mutate({ action: "SET_STATUS", reminderId: reminder.id, status: "ACKNOWLEDGED" }, reminder.id, "Reminder marked done.")} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-brand-evergreen px-3 text-xs font-bold text-white disabled:opacity-50">
                  <Check aria-hidden="true" className="h-3.5 w-3.5" />Done
                </button>
                <button type="button" disabled={busy === reminder.id} onClick={() => void mutate({ action: "SET_STATUS", reminderId: reminder.id, status: "DISMISSED" }, reminder.id, "Reminder dismissed.")} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal disabled:opacity-50">
                  <X aria-hidden="true" className="h-3.5 w-3.5" />Dismiss
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <details className="mt-4 border-t border-border pt-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-bold text-brand-deepTeal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          <Settings2 aria-hidden="true" className="h-4 w-4" />
          Reminder preferences
        </summary>
        <div className="mt-3 space-y-3">
          {preferences.map((preference) => {
            const details = FAMILY_DETAILS[preference.family];
            return (
              <div key={preference.family} className="rounded-2xl border border-border p-4">
                <label className="flex min-h-11 cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={preference.isEnabled}
                    disabled={Boolean(busy)}
                    onChange={(event) => void mutate({
                      action: "SET_PREFERENCE",
                      family: preference.family,
                      isEnabled: event.target.checked,
                      leadDays: preference.leadDays,
                      thresholdPercent: preference.thresholdPercent,
                    }, preference.family, event.target.checked ? `${details.title} reminders enabled.` : `${details.title} reminders disabled.`)}
                    className="mt-1 h-5 w-5 rounded border-border text-brand-evergreen focus:ring-focus"
                  />
                  <span><span className="block font-bold text-brand-deepTeal">{details.title}</span><span className="mt-1 block text-sm leading-5 text-brand-deepTeal/65">{details.description}</span></span>
                </label>
                {preference.isEnabled && !preference.family.startsWith("BUDGET_") && (
                  <label className="mt-3 block text-xs font-bold text-brand-deepTeal">
                    Remind me this many days early
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={preference.leadDays}
                      onChange={(event) => {
                        const leadDays = Number(event.target.value);
                        setPreferences((current) => current.map((entry) => entry.family === preference.family ? { ...entry, leadDays } : entry));
                      }}
                      onBlur={() => void mutate({
                        action: "SET_PREFERENCE",
                        family: preference.family,
                        isEnabled: true,
                        leadDays: preference.leadDays,
                        thresholdPercent: preference.thresholdPercent,
                      }, preference.family, "Reminder timing saved.")}
                      className="mt-2 min-h-11 w-28 rounded-xl border border-border bg-white px-3 text-sm font-normal"
                    />
                  </label>
                )}
                {preference.isEnabled && (preference.family === "IMPORT" || preference.family === "EOFY_PREPARATION") && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="text-xs font-bold text-brand-deepTeal">
                      Reminder date
                      <input type="date" value={dateByFamily[preference.family] ?? ""} onChange={(event) => setDateByFamily((current) => ({ ...current, [preference.family]: event.target.value }))} className="mt-2 min-h-11 rounded-xl border border-border bg-white px-3 text-sm font-normal" />
                    </label>
                    <button type="button" disabled={!dateByFamily[preference.family] || Boolean(busy)} onClick={() => void mutate({ action: "CREATE_DATE_REMINDER", family: preference.family, dueDate: dateByFamily[preference.family] }, preference.family, "Reminder added.")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal disabled:opacity-50">
                      <CalendarPlus aria-hidden="true" className="h-4 w-4" />Add reminder
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </details>

      {history.length > 0 && (
        <details className="mt-4 border-t border-border pt-4">
          <summary className="min-h-11 cursor-pointer text-sm font-bold text-brand-deepTeal">Past reminders ({history.length})</summary>
          <ul className="mt-2 space-y-2">
            {history.map((reminder) => <li key={reminder.id} className="rounded-xl bg-surface-mint p-3 text-sm text-brand-deepTeal"><span className="font-semibold">{FAMILY_DETAILS[reminder.family].title}</span> · {reminder.status === "ACKNOWLEDGED" ? "Done" : "Dismissed"} · {displayDate(reminder.dueDate)}</li>)}
          </ul>
        </details>
      )}
    </section>
  );
}
