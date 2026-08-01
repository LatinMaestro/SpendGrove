"use client";

import { BriefcaseBusiness, Copy, Eye, Link2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ScopeType =
  | "REPORT" | "TRANSACTION" | "PROPERTY" | "LOAN_ACCOUNT"
  | "CATEGORY_BUDGET" | "RECURRING_ITEM" | "SAVINGS_GOAL" | "NET_WORTH_SNAPSHOT";
type Scope = { id: string; scopeType: ScopeType; scopeKey: string };
type Grant = {
  id: string;
  perspective: "OWNER" | "ACCOUNTANT";
  status: "PENDING" | "ACTIVE" | "REVOKED" | "EXPIRED";
  expiresAt: string;
  accepted: boolean;
  scopes: Scope[];
};
type Candidate = { entityType: ScopeType; entityId: string; title: string; detail: string };
type ReadableRecord = Candidate & { grantId: string; scopeId: string };
type Response = {
  ok: true;
  owned: Grant[];
  accepted: Grant[];
  candidates: Candidate[];
  readableRecords: ReadableRecord[];
  result?: { type: string; token?: string; grantId?: string };
} | { ok: false; error: string };

const TYPE_LABEL: Record<ScopeType, string> = {
  REPORT: "Report",
  TRANSACTION: "Transaction",
  PROPERTY: "Property",
  LOAN_ACCOUNT: "Loan",
  CATEGORY_BUDGET: "Budget",
  RECURRING_ITEM: "Regular payment",
  SAVINGS_GOAL: "Savings goal",
  NET_WORTH_SNAPSHOT: "Net worth snapshot",
};

async function readResponse(response: globalThis.Response): Promise<Response> {
  try {
    const value = await response.json() as Response;
    if (response.ok && value.ok) return value;
    return { ok: false, error: value.ok ? "Accountant access could not be loaded." : value.error };
  } catch {
    return { ok: false, error: "Accountant access could not be loaded." };
  }
}

function accessExpiry() {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + 14);
  return value.toISOString();
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Brisbane",
  }).format(new Date(value));
}

export function AccountantAccess({ available = false }: { available?: boolean }) {
  const [owned, setOwned] = useState<Grant[]>([]);
  const [accepted, setAccepted] = useState<Grant[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [readableRecords, setReadableRecords] = useState<ReadableRecord[]>([]);
  const [acceptToken, setAcceptToken] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [selectedGrantId, setSelectedGrantId] = useState("");
  const [candidateKey, setCandidateKey] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const availableGrants = useMemo(
    () => owned.filter((grant) => grant.status === "PENDING" || grant.status === "ACTIVE"),
    [owned],
  );

  function apply(value: Extract<Response, { ok: true }>) {
    setOwned(value.owned);
    setAccepted(value.accepted);
    setCandidates(value.candidates);
    setReadableRecords(value.readableRecords);
    setSelectedGrantId((current) => current && value.owned.some((grant) => grant.id === current)
      ? current
      : value.owned.find((grant) => grant.status === "PENDING" || grant.status === "ACTIVE")?.id ?? "");
    if (value.result?.type === "INVITATION" && value.result.token) setInviteToken(value.result.token);
  }

  async function load() {
    const result = await readResponse(await fetch("/api/account/accountant-access", { cache: "no-store" }));
    if (result.ok) apply(result);
    else setError(result.error);
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
    const result = await readResponse(await fetch("/api/account/accountant-access", {
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

  async function copyInvite() {
    if (!inviteToken) return;
    await navigator.clipboard.writeText(inviteToken);
    setMessage("Accountant access code copied.");
  }

  if (!available) return null;

  return (
    <section className="mt-6" aria-labelledby="accountant-access-heading">
      <details className="rounded-2xl border border-border bg-surface-base">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green">
          <span className="flex items-center gap-2"><BriefcaseBusiness aria-hidden="true" className="h-4 w-4 text-brand-teal" />Accountant access</span>
          <span aria-hidden="true" className="text-muted">›</span>
        </summary>
        <div className="space-y-5 border-t border-border p-4 sm:p-5">
          <div>
            <h2 id="accountant-access-heading" className="text-lg font-bold text-brand-deepTeal">Read-only accountant access</h2>
            <p className="mt-1 text-sm leading-6 text-brand-deepTeal/70">Share only the records or reports you select. Access is read-only, time-limited and can be removed at any time.</p>
            <p className="mt-1 text-xs text-brand-deepTeal/55">Preview testing only. SpendGrove does not send invitation emails, and this role does not verify professional registration.</p>
          </div>

          {message && <p role="status" className="rounded-2xl bg-surface-mint p-3 text-sm font-semibold text-brand-deepTeal">{message}</p>}
          {error && <p role="alert" className="rounded-2xl bg-danger-red/10 p-3 text-sm font-semibold text-danger-red">{error}</p>}
          {!ready && <p aria-busy="true" className="text-sm text-brand-deepTeal/65">Loading accountant access…</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-surface-mint p-4">
              <h3 className="font-bold text-brand-deepTeal">Give read-only access</h3>
              <p className="mt-1 text-sm text-brand-deepTeal/65">Create a one-time code that expires in 14 days.</p>
              <button type="button" disabled={Boolean(busy)} onClick={() => void mutate({ action: "CREATE_GRANT", intendedIdentityHash: null, expiresAt: accessExpiry() }, "create", "One-time accountant access code created.")} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white disabled:opacity-50"><UserPlus aria-hidden="true" className="h-4 w-4" />Create access code</button>
              {inviteToken && <div className="mt-3 rounded-xl bg-white p-3"><p className="text-xs font-bold text-brand-deepTeal">One-time access code</p><code className="mt-1 block break-all text-xs text-brand-deepTeal">{inviteToken}</code><button type="button" onClick={() => void copyInvite()} className="mt-2 inline-flex min-h-10 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal"><Copy aria-hidden="true" className="h-3.5 w-3.5" />Copy code</button></div>}
            </div>
            <div className="rounded-2xl bg-surface-mint p-4">
              <h3 className="font-bold text-brand-deepTeal">Accept read-only access</h3>
              <label className="mt-2 block text-xs font-bold text-brand-deepTeal">Access code<input value={acceptToken} autoComplete="off" onChange={(event) => setAcceptToken(event.target.value.trim())} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal" /></label>
              <button type="button" disabled={acceptToken.length < 32 || Boolean(busy)} onClick={() => void mutate({ action: "ACCEPT_GRANT", token: acceptToken, identityHash: null }, "accept", "Read-only access accepted.")} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal disabled:opacity-50"><ShieldCheck aria-hidden="true" className="h-4 w-4" />Accept access</button>
            </div>
          </div>

          {availableGrants.length > 0 && (
            <div>
              <h3 className="font-bold text-brand-deepTeal">Information you share</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-brand-deepTeal">Access grant<select value={selectedGrantId} onChange={(event) => setSelectedGrantId(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal">{availableGrants.map((grant, index) => <option key={grant.id} value={grant.id}>Access {index + 1} · {grant.status === "ACTIVE" ? "Accepted" : "Waiting"} · expires {displayDate(grant.expiresAt)}</option>)}</select></label>
                <label className="text-xs font-bold text-brand-deepTeal">Record or report<select value={candidateKey} onChange={(event) => setCandidateKey(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal"><option value="">Choose information</option>{candidates.map((candidate) => <option key={`${candidate.entityType}:${candidate.entityId}`} value={`${candidate.entityType}:${candidate.entityId}`}>{TYPE_LABEL[candidate.entityType]} · {candidate.title} · {candidate.detail}</option>)}</select></label>
              </div>
              <button type="button" disabled={!selectedGrantId || !candidateKey || Boolean(busy)} onClick={() => {
                const separator = candidateKey.indexOf(":");
                const scopeType = candidateKey.slice(0, separator) as ScopeType;
                const entityId = candidateKey.slice(separator + 1);
                const input = scopeType === "REPORT"
                  ? { action: "ADD_SCOPE", grantId: selectedGrantId, scopeType, reportKey: entityId }
                  : { action: "ADD_SCOPE", grantId: selectedGrantId, scopeType, entityId };
                void mutate(input, "scope", "Selected information shared read-only.");
              }} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white disabled:opacity-50"><Link2 aria-hidden="true" className="h-4 w-4" />Share read-only</button>

              <div className="mt-4 space-y-3">{availableGrants.map((grant, index) => <article key={grant.id} className="rounded-2xl border border-border p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold text-brand-deepTeal">Access {index + 1}</p><p className="mt-1 text-xs text-brand-deepTeal/60">{grant.status === "ACTIVE" ? "Accepted" : "Waiting for acceptance"} · expires {displayDate(grant.expiresAt)}</p></div><button type="button" onClick={() => void mutate({ action: "REVOKE_GRANT", grantId: grant.id }, grant.id, "Accountant access removed.")} className="inline-flex min-h-10 items-center gap-1 self-start rounded-full border border-border px-3 text-xs font-bold text-danger-red"><Trash2 aria-hidden="true" className="h-3.5 w-3.5" />Remove access</button></div>{grant.scopes.length === 0 ? <p className="mt-3 text-sm text-brand-deepTeal/60">No information selected yet.</p> : <ul className="mt-3 space-y-2">{grant.scopes.map((scope) => <li key={scope.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-mint p-3"><span className="text-sm font-semibold text-brand-deepTeal">{TYPE_LABEL[scope.scopeType]}</span><button type="button" onClick={() => void mutate({ action: "REVOKE_SCOPE", grantId: grant.id, scopeId: scope.id }, scope.id, "Selected information removed.")} className="min-h-10 rounded-full border border-border px-3 text-xs font-bold text-danger-red">Stop sharing</button></li>)}</ul>}</article>)}</div>
            </div>
          )}

          {accepted.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 font-bold text-brand-deepTeal"><Eye aria-hidden="true" className="h-4 w-4 text-brand-teal" />Read-only information shared with you</h3>
              {readableRecords.length === 0 ? <p className="mt-3 rounded-xl bg-surface-mint p-3 text-sm text-brand-deepTeal/65">No records or reports are currently shared with you.</p> : <ul className="mt-3 space-y-2">{readableRecords.map((record) => <li key={record.scopeId} className="rounded-xl border border-border p-3"><p className="font-semibold text-brand-deepTeal">{record.title}</p><p className="mt-1 text-xs text-brand-deepTeal/60">{TYPE_LABEL[record.entityType]} · {record.detail} · Read-only</p></li>)}</ul>}
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl bg-surface-mint p-3 text-xs leading-5 text-brand-deepTeal/70"><ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" /><p>Accountant access never allows transaction editing, deletion, onward sharing or access to unrelated account information.</p></div>
        </div>
      </details>
    </section>
  );
}
