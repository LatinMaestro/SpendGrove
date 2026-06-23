"use client";

import { useEffect, useMemo, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import {
  AlertTriangle,
  Archive,
  Building2,
  Car,
  CheckCircle2,
  Home,
  Landmark,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";

type LoanKind = "OWNER_OCCUPIER_HOME" | "INVESTMENT_PROPERTY" | "CAR" | "PERSONAL" | "OTHER";
type PropertyUsage = "OWNER_OCCUPIED" | "INVESTMENT" | "OTHER";

type PropertyRecord = {
  id: string;
  nickname: string;
  usage: PropertyUsage;
  isArchived: boolean;
};

type LoanRecord = {
  id: string;
  nickname: string;
  type: "HOME_LOAN" | "CAR_LOAN" | "PERSONAL_LOAN" | "OTHER";
  purpose: "OWNER_OCCUPIER" | "INVESTMENT" | "PERSONAL" | "OTHER";
  isArchived: boolean;
  propertyId?: string | null;
  property?: PropertyRecord | null;
};

type LoanResult =
  | { ok: true; loans: LoanRecord[]; properties: PropertyRecord[] }
  | { ok: false; error: string };

const choices: Array<{
  kind: LoanKind;
  label: string;
  tag: string;
  type: LoanRecord["type"];
  purpose: LoanRecord["purpose"];
  propertyRelevant: boolean;
}> = [
  { kind: "OWNER_OCCUPIER_HOME", label: "Owner-occupier home loan", tag: "Owner-occupier", type: "HOME_LOAN", purpose: "OWNER_OCCUPIER", propertyRelevant: true },
  { kind: "INVESTMENT_PROPERTY", label: "Investment property loan", tag: "Investment", type: "HOME_LOAN", purpose: "INVESTMENT", propertyRelevant: true },
  { kind: "CAR", label: "Car loan", tag: "Car loan", type: "CAR_LOAN", purpose: "PERSONAL", propertyRelevant: false },
  { kind: "PERSONAL", label: "Personal loan", tag: "Personal loan", type: "PERSONAL_LOAN", purpose: "PERSONAL", propertyRelevant: false },
  { kind: "OTHER", label: "Other loan", tag: "Other", type: "OTHER", purpose: "OTHER", propertyRelevant: false },
];

const propertyUsageLabels: Record<PropertyUsage, string> = {
  OWNER_OCCUPIED: "Owner-occupied",
  INVESTMENT: "Investment",
  OTHER: "Other",
};

function choiceForLoan(loan: LoanRecord) {
  return choices.find((choice) => choice.type === loan.type && choice.purpose === loan.purpose) ?? choices[4];
}

async function readResult(response: Response): Promise<LoanResult> {
  try {
    const payload = await response.json() as LoanResult;
    return payload.ok ? payload : { ok: false, error: payload.error || "We could not read the account response safely." };
  } catch {
    return { ok: false, error: "We could not read the account response safely." };
  }
}

function Modal({ title, description, onClose, children }: Readonly<{
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}>) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-deepTeal/55 backdrop-blur-sm sm:items-center sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="loan-modal-title" className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-surface-base p-5 shadow-2xl sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="loan-modal-title" className="text-2xl font-bold text-brand-deepTeal">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">{description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-border p-3 text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

type LoanDraft = {
  nickname: string;
  kind: LoanKind;
  propertyMode: "none" | "existing" | "new";
  propertyId: string;
  propertyNickname: string;
  propertyUsage: PropertyUsage;
};

function emptyLoanDraft(): LoanDraft {
  return {
    nickname: "",
    kind: "OWNER_OCCUPIER_HOME",
    propertyMode: "none",
    propertyId: "",
    propertyNickname: "",
    propertyUsage: "OWNER_OCCUPIED",
  };
}

function loanDraft(loan: LoanRecord): LoanDraft {
  return {
    nickname: loan.nickname,
    kind: choiceForLoan(loan).kind,
    propertyMode: loan.propertyId ? "existing" : "none",
    propertyId: loan.propertyId ?? "",
    propertyNickname: "",
    propertyUsage: loan.property?.usage ?? "OTHER",
  };
}

function LoanEditor({ draft, properties, isEditing, error, isSaving, onChange, onClose, onSave }: Readonly<{
  draft: LoanDraft;
  properties: PropertyRecord[];
  isEditing: boolean;
  error: string;
  isSaving: boolean;
  onChange: (draft: LoanDraft) => void;
  onClose: () => void;
  onSave: () => void;
}>) {
  const choice = choices.find((candidate) => candidate.kind === draft.kind) ?? choices[4];
  const activeProperties = properties.filter((property) => !property.isArchived);
  const propertyModes = isEditing ? (["none", "existing"] as const) : (["none", "existing", "new"] as const);

  function setKind(kind: LoanKind) {
    const nextChoice = choices.find((candidate) => candidate.kind === kind) ?? choices[4];
    onChange({
      ...draft,
      kind,
      propertyMode: nextChoice.propertyRelevant ? draft.propertyMode : "none",
      propertyId: nextChoice.propertyRelevant ? draft.propertyId : "",
    });
  }

  return (
    <Modal
      title={isEditing ? "Edit Loan Account" : "Add Loan Account"}
      description="Use a nickname you recognise. Do not enter an account number, reference, customer ID or exact address."
      onClose={onClose}
    >
      <form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
        <label className="block text-sm font-bold text-brand-deepTeal">
          Loan nickname
          <input
            autoFocus
            disabled={isSaving}
            value={draft.nickname}
            onChange={(event) => onChange({ ...draft, nickname: event.target.value })}
            maxLength={80}
            placeholder="For example: Family home loan"
            className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
            required
          />
        </label>

        <label className="block text-sm font-bold text-brand-deepTeal">
          Loan type
          <select
            disabled={isSaving}
            value={draft.kind}
            onChange={(event) => setKind(event.target.value as LoanKind)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          >
            {choices.map((option) => <option key={option.kind} value={option.kind}>{option.label}</option>)}
          </select>
        </label>

        {choice.propertyRelevant && (
          <fieldset className="rounded-3xl bg-surface-mint p-4">
            <legend className="px-1 text-sm font-bold text-brand-deepTeal">Optional property link</legend>
            <p className="mt-1 text-xs leading-5 text-brand-deepTeal/65">Supporting metadata only. No exact address is requested.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {propertyModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  disabled={isSaving || (mode === "existing" && activeProperties.length === 0)}
                  aria-pressed={draft.propertyMode === mode}
                  onClick={() => onChange({ ...draft, propertyMode: mode })}
                  className={`min-h-11 rounded-2xl px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-45 ${draft.propertyMode === mode ? "bg-brand-deepTeal text-white" : "border border-border bg-white text-brand-deepTeal"}`}
                >
                  {mode === "none" ? "No property" : mode === "existing" ? "Link existing" : "Create property"}
                </button>
              ))}
            </div>
            {draft.propertyMode === "existing" && (
              <label className="mt-4 block text-sm font-bold text-brand-deepTeal">
                Property
                <select
                  value={draft.propertyId}
                  onChange={(event) => onChange({ ...draft, propertyId: event.target.value })}
                  className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal"
                  required
                >
                  <option value="">Choose a property</option>
                  {activeProperties.map((property) => <option key={property.id} value={property.id}>{property.nickname} · {propertyUsageLabels[property.usage]}</option>)}
                </select>
              </label>
            )}
            {!isEditing && draft.propertyMode === "new" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold text-brand-deepTeal">
                  Property nickname
                  <input value={draft.propertyNickname} onChange={(event) => onChange({ ...draft, propertyNickname: event.target.value })} maxLength={80} placeholder="For example: Family home" className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal" required />
                </label>
                <label className="text-sm font-bold text-brand-deepTeal">
                  Property usage
                  <select value={draft.propertyUsage} onChange={(event) => onChange({ ...draft, propertyUsage: event.target.value as PropertyUsage })} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal">
                    {Object.entries(propertyUsageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
              </div>
            )}
          </fieldset>
        )}

        <div className="rounded-2xl border border-brand-green/30 bg-brand-green/5 p-4 text-sm leading-6 text-brand-deepTeal">
          <strong>Neutral record keeping:</strong> Loan purpose and optional property usage are descriptive only. SpendGrove does not decide whether interest or fees are deductible.
        </div>
        {error && <p role="alert" className="rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" disabled={isSaving} onClick={onClose} className="min-h-12 rounded-full border border-border px-5 text-sm font-bold text-brand-deepTeal">Cancel</button>
          <button type="submit" disabled={isSaving} className="min-h-12 rounded-full bg-brand-green px-6 text-sm font-bold text-white disabled:opacity-50">{isSaving ? "Saving…" : "Save Loan Account"}</button>
        </div>
      </form>
    </Modal>
  );
}

function LoansUnavailable() {
  return (
    <section className="rounded-[2rem] border border-border bg-surface-base p-6 shadow-soft">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-surface-mint p-3 text-brand-green"><Landmark aria-hidden="true" className="h-6 w-6" /></div>
        <div>
          <p className="text-sm font-semibold text-brand-teal">Loans</p>
          <h2 className="mt-1 text-2xl font-bold text-brand-deepTeal">Account storage is not configured here</h2>
          <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Loan and optional property metadata is account-only. SpendGrove does not keep a browser-local copy of private loan details.</p>
        </div>
      </div>
    </section>
  );
}

export function LoansManager({ accountPersistenceAvailable }: Readonly<{ accountPersistenceAvailable: boolean }>) {
  if (!accountPersistenceAvailable) return <LoansUnavailable />;
  return <AuthenticatedLoansManager />;
}

function AuthenticatedLoansManager() {
  const { isLoaded, isSignedIn } = useUser();
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<{ loanId?: string; draft: LoanDraft } | null>(null);
  const [propertyEditor, setPropertyEditor] = useState<PropertyRecord | null>(null);
  const [propertyNickname, setPropertyNickname] = useState("");
  const [propertyUsage, setPropertyUsage] = useState<PropertyUsage>("OTHER");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    async function loadLoans() {
      setIsReady(false);
      setError("");
      const result = await readResult(await fetch("/api/account/loans", { cache: "no-store" }));
      if (cancelled) return;
      if (result.ok) {
        setLoans(result.loans);
        setProperties(result.properties);
      } else {
        setError(result.error);
      }
      setIsReady(true);
    }
    void loadLoans();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  const activeLoans = useMemo(() => loans.filter((loan) => !loan.isArchived), [loans]);
  const archivedLoans = useMemo(() => loans.filter((loan) => loan.isArchived), [loans]);

  function applyResult(result: LoanResult) {
    if (result.ok) {
      setLoans(result.loans);
      setProperties(result.properties);
      setError("");
      return true;
    }
    setError(result.error);
    return false;
  }

  async function saveLoan() {
    if (!editor || isSaving) return;
    setIsSaving(true);
    setError("");
    const choice = choices.find((candidate) => candidate.kind === editor.draft.kind) ?? choices[4];
    const isEditing = Boolean(editor.loanId);
    const body = isEditing
      ? {
          nickname: editor.draft.nickname,
          choice: { kind: choice.kind, type: choice.type, purpose: choice.purpose },
          propertyId: choice.propertyRelevant && editor.draft.propertyMode === "existing" ? editor.draft.propertyId : null,
        }
      : {
          nickname: editor.draft.nickname,
          choice: { kind: choice.kind, type: choice.type, purpose: choice.purpose },
          propertyId: choice.propertyRelevant && editor.draft.propertyMode === "existing" ? editor.draft.propertyId : undefined,
          newProperty: choice.propertyRelevant && editor.draft.propertyMode === "new"
            ? { nickname: editor.draft.propertyNickname, usage: editor.draft.propertyUsage }
            : undefined,
        };
    const response = await fetch(isEditing ? `/api/account/loans/${editor.loanId}` : "/api/account/loans", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await readResult(response);
    setIsSaving(false);
    if (applyResult(result)) setEditor(null);
  }

  async function setLoanArchived(loan: LoanRecord, isArchived: boolean) {
    setIsSaving(true);
    const result = await readResult(await fetch(`/api/account/loans/${loan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived }),
    }));
    setIsSaving(false);
    applyResult(result);
  }

  function openProperty(property: PropertyRecord) {
    setPropertyEditor(property);
    setPropertyNickname(property.nickname);
    setPropertyUsage(property.usage);
    setError("");
  }

  async function saveProperty(isArchived = propertyEditor?.isArchived ?? false) {
    if (!propertyEditor || isSaving) return;
    setIsSaving(true);
    const result = await readResult(await fetch(`/api/account/properties/${propertyEditor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: propertyNickname, usage: propertyUsage, isArchived }),
    }));
    setIsSaving(false);
    if (applyResult(result)) setPropertyEditor(null);
  }

  if (!isLoaded) return <section aria-busy="true" className="rounded-[2rem] border border-border bg-surface-base p-8 text-center shadow-soft"><p className="font-semibold text-brand-deepTeal/70">Checking your account session…</p></section>;

  if (!isSignedIn) {
    return (
      <section className="rounded-[2rem] border border-border bg-surface-base p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-surface-mint p-3 text-brand-green"><Landmark aria-hidden="true" className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-semibold text-brand-teal">Loans</p>
            <h2 className="mt-1 text-2xl font-bold text-brand-deepTeal">Sign in to manage Loan Accounts</h2>
            <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Loan and optional property metadata is account-only. No browser-local fallback stores private loan details.</p>
            {!isSignedIn && <SignInButton mode="modal"><button type="button" className="mt-4 min-h-12 rounded-full bg-brand-green px-5 text-sm font-bold text-white">Sign in</button></SignInButton>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-brand-deepTeal p-6 text-white shadow-soft">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white/70">Loans</p>
            <h2 className="mt-2 text-3xl font-bold">Your Loan Accounts first.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">Track home, investment, car, personal and other loans. Add optional property context only when it is useful.</p>
          </div>
          <button type="button" onClick={() => { setError(""); setEditor({ draft: emptyLoanDraft() }); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-green px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-white">
            <Plus aria-hidden="true" className="h-5 w-5" /> Add Loan Account
          </button>
        </div>
      </section>

      {error && <div role="alert" className="flex gap-3 rounded-2xl border border-warning-amber bg-warning-amber/10 p-4 text-sm text-brand-deepTeal"><AlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0 text-warning-amber" /><p>{error}</p></div>}

      {!isReady ? (
        <section aria-busy="true" className="rounded-[2rem] border border-border bg-surface-base p-8 text-center shadow-soft"><p className="font-semibold text-brand-deepTeal/70">Loading your Loan Accounts…</p></section>
      ) : activeLoans.length === 0 ? (
        <section className="rounded-[2rem] border border-border bg-surface-base p-8 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-mint text-brand-green"><Landmark aria-hidden="true" className="h-7 w-7" /></div>
          <h2 className="mt-5 text-2xl font-bold text-brand-deepTeal">No Loan Accounts yet.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-deepTeal/70">Start with a safe nickname and broad loan type. Property details are always optional.</p>
        </section>
      ) : (
        <section aria-labelledby="loan-list-heading">
          <div className="px-1"><p className="text-sm font-semibold text-brand-teal">Active loans</p><h2 id="loan-list-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">{activeLoans.length} Loan Account{activeLoans.length === 1 ? "" : "s"}</h2></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {activeLoans.map((loan) => {
              const choice = choiceForLoan(loan);
              const Icon = choice.kind === "CAR" ? Car : choice.propertyRelevant ? Home : Landmark;
              return (
                <article key={loan.id} className="rounded-3xl border border-border bg-surface-base p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-2xl bg-surface-mint p-3 text-brand-green"><Icon aria-hidden="true" className="h-5 w-5" /></div>
                      <div className="min-w-0"><h3 className="truncate text-lg font-bold text-brand-deepTeal">{loan.nickname}</h3><span className="mt-2 inline-flex rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green">{choice.tag}</span></div>
                    </div>
                  </div>
                  {loan.property && <div className="mt-4 flex items-center gap-2 rounded-2xl bg-surface-mint p-3 text-sm text-brand-deepTeal"><Building2 aria-hidden="true" className="h-4 w-4 text-brand-teal" /><span><strong>{loan.property.nickname}</strong> · {propertyUsageLabels[loan.property.usage]}</span></div>}
                  <div className="mt-4 flex gap-2 border-t border-border pt-4">
                    <button type="button" onClick={() => { setError(""); setEditor({ loanId: loan.id, draft: loanDraft(loan) }); }} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal"><Pencil aria-hidden="true" className="h-4 w-4" /> Edit</button>
                    <button type="button" disabled={isSaving} onClick={() => void setLoanArchived(loan, true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-bold text-brand-deepTeal"><Archive aria-hidden="true" className="h-4 w-4" /> Archive</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {properties.length > 0 && (
        <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft">
          <p className="text-sm font-semibold text-brand-teal">Optional supporting records</p>
          <h2 className="mt-1 text-xl font-bold text-brand-deepTeal">Linked properties</h2>
          <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Properties support relevant loans. They are not the main entry point and contain no exact address.</p>
          <div className="mt-4 space-y-3">
            {properties.map((property) => (
              <button key={property.id} type="button" onClick={() => openProperty(property)} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-surface-mint px-4 text-left focus:outline-none focus:ring-2 focus:ring-brand-green">
                <span><strong className="block text-brand-deepTeal">{property.nickname}</strong><span className="text-xs text-brand-deepTeal/65">{propertyUsageLabels[property.usage]}{property.isArchived ? " · Archived" : ""}</span></span>
                <Pencil aria-hidden="true" className="h-4 w-4 text-brand-teal" />
              </button>
            ))}
          </div>
        </section>
      )}

      {archivedLoans.length > 0 && (
        <section className="rounded-3xl border border-border bg-surface-base p-5 shadow-soft">
          <h2 className="font-bold text-brand-deepTeal">Archived Loan Accounts</h2>
          <div className="mt-3 space-y-2">{archivedLoans.map((loan) => <div key={loan.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-mint p-3"><span className="text-sm font-semibold text-brand-deepTeal">{loan.nickname}</span><button type="button" disabled={isSaving} onClick={() => void setLoanArchived(loan, false)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal"><RotateCcw aria-hidden="true" className="h-4 w-4" /> Restore</button></div>)}</div>
        </section>
      )}

      <section className="rounded-3xl bg-surface-mint p-5 text-sm leading-6 text-brand-deepTeal/75">
        <p className="flex items-center gap-2 font-bold text-brand-deepTeal"><ShieldCheck aria-hidden="true" className="h-5 w-5 text-brand-green" /> Privacy boundary</p>
        <p className="mt-2">SpendGrove stores safe nicknames and broad metadata only. No address, account number, masked reference, customer ID or source narration is requested.</p>
        <p className="mt-2 flex items-center gap-2 font-semibold text-brand-teal"><CheckCircle2 aria-hidden="true" className="h-4 w-4" /> No tax conclusion is created.</p>
      </section>

      {editor && <LoanEditor draft={editor.draft} properties={properties} isEditing={Boolean(editor.loanId)} error={error} isSaving={isSaving} onChange={(draft) => { setEditor({ ...editor, draft }); setError(""); }} onClose={() => setEditor(null)} onSave={() => void saveLoan()} />}

      {propertyEditor && (
        <Modal title="Edit supporting property" description="Use a nickname and broad usage only. Do not enter an exact address." onClose={() => setPropertyEditor(null)}>
          <form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); void saveProperty(); }}>
            <label className="block text-sm font-bold text-brand-deepTeal">Property nickname<input value={propertyNickname} onChange={(event) => setPropertyNickname(event.target.value)} maxLength={80} required className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal" /></label>
            <label className="block text-sm font-bold text-brand-deepTeal">Property usage<select value={propertyUsage} onChange={(event) => setPropertyUsage(event.target.value as PropertyUsage)} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal">{Object.entries(propertyUsageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {error && <p role="alert" className="rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button type="button" disabled={isSaving} onClick={() => void saveProperty(!propertyEditor.isArchived)} className="min-h-12 rounded-full border border-border px-5 text-sm font-bold text-brand-deepTeal">{propertyEditor.isArchived ? "Restore property" : "Archive property"}</button>
              <button type="submit" disabled={isSaving} className="min-h-12 rounded-full bg-brand-green px-6 text-sm font-bold text-white">{isSaving ? "Saving…" : "Save property"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
