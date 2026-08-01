"use client";

import { Copy, Home, Link2, LogOut, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Role = "ADMIN" | "MEMBER";
type ShareType =
  | "TRANSACTION" | "PROPERTY" | "LOAN_ACCOUNT" | "CATEGORY_BUDGET"
  | "RECURRING_ITEM" | "SAVINGS_GOAL" | "NET_WORTH_SNAPSHOT" | "REPORT";
type Household = {
  id: string;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  currentRole: Role | null;
  members: Array<{ id: string; role: Role; isYou: boolean }>;
  sharedRecords: Array<{ id: string; entityType: ShareType; isOwnedByYou: boolean }>;
};
type Candidate = { entityType: ShareType; entityId: string; title: string; detail: string };
type SharedRecord = Candidate & { shareId: string; isOwnedByYou: boolean };
type HouseholdResponse = {
  ok: true;
  households: Household[];
  result?: { type: string; token?: string; invitationId?: string };
} | { ok: false; error: string };
type WorkspaceResponse = {
  ok: true;
  candidates: Candidate[];
  sharedRecords: SharedRecord[];
} | { ok: false; error: string };

const TYPE_LABEL: Record<ShareType, string> = {
  TRANSACTION: "Transaction",
  PROPERTY: "Property",
  LOAN_ACCOUNT: "Loan",
  CATEGORY_BUDGET: "Budget",
  RECURRING_ITEM: "Regular payment",
  SAVINGS_GOAL: "Savings goal",
  NET_WORTH_SNAPSHOT: "Net worth snapshot",
  REPORT: "Report",
};

async function readHouseholds(response: globalThis.Response): Promise<HouseholdResponse> {
  try {
    const value = await response.json() as HouseholdResponse;
    if (response.ok && value.ok) return value;
    return { ok: false, error: value.ok ? "Households could not be loaded." : value.error };
  } catch {
    return { ok: false, error: "Households could not be loaded." };
  }
}

async function readWorkspace(response: globalThis.Response): Promise<WorkspaceResponse> {
  try {
    const value = await response.json() as WorkspaceResponse;
    if (response.ok && value.ok) return value;
    return { ok: false, error: value.ok ? "Shared records could not be loaded." : value.error };
  } catch {
    return { ok: false, error: "Shared records could not be loaded." };
  }
}

function invitationExpiry() {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + 7);
  return value.toISOString();
}

export function HouseholdAccess({ available = false }: { available?: boolean }) {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [sharedRecords, setSharedRecords] = useState<SharedRecord[]>([]);
  const [householdName, setHouseholdName] = useState("");
  const [acceptToken, setAcceptToken] = useState("");
  const [candidateKey, setCandidateKey] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selected = useMemo(
    () => households.find((household) => household.id === selectedId) ?? null,
    [households, selectedId],
  );

  async function loadHouseholds() {
    const result = await readHouseholds(await fetch("/api/account/households", { cache: "no-store" }));
    if (!result.ok) {
      setError(result.error);
      setReady(true);
      return;
    }
    setHouseholds(result.households);
    setSelectedId((current) => current && result.households.some((entry) => entry.id === current)
      ? current
      : result.households[0]?.id ?? "");
    setReady(true);
  }

  async function loadWorkspace(householdId: string) {
    if (!householdId) {
      setCandidates([]);
      setSharedRecords([]);
      return;
    }
    const result = await readWorkspace(await fetch(
      `/api/account/household-records?householdId=${encodeURIComponent(householdId)}`,
      { cache: "no-store" },
    ));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCandidates(result.candidates);
    setSharedRecords(result.sharedRecords);
  }

  useEffect(() => {
    if (available) void loadHouseholds();
  }, [available]);

  useEffect(() => {
    if (available && selectedId) void loadWorkspace(selectedId);
  }, [available, selectedId]);

  async function mutate(input: Record<string, unknown>, key: string, success: string) {
    if (busy) return;
    setBusy(key);
    setError("");
    setMessage("");
    const result = await readHouseholds(await fetch("/api/account/households", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }));
    setBusy("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setHouseholds(result.households);
    if (result.result?.type === "INVITATION" && result.result.token) {
      setInviteToken(result.result.token);
    }
    setMessage(success);
    if (selectedId) await loadWorkspace(selectedId);
  }

  async function copyInvite() {
    if (!inviteToken) return;
    await navigator.clipboard.writeText(inviteToken);
    setMessage("Invitation code copied.");
  }

  if (!available) return null;

  return (
    <section className="mt-6" aria-labelledby="household-access-heading">
      <details className="rounded-2xl border border-border bg-surface-base">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green">
          <span className="flex items-center gap-2"><Users aria-hidden="true" className="h-4 w-4 text-brand-teal" />Household sharing</span>
          <span aria-hidden="true" className="text-muted">›</span>
        </summary>
        <div className="space-y-5 border-t border-border p-4 sm:p-5">
          <div>
            <h2 id="household-access-heading" className="text-lg font-bold text-brand-deepTeal">Household sharing</h2>
            <p className="mt-1 text-sm leading-6 text-brand-deepTeal/70">Your records stay private unless you select an individual record or report to share. Existing records are never shared automatically.</p>
            <p className="mt-1 text-xs text-brand-deepTeal/55">Preview testing only. SpendGrove does not send invitation emails.</p>
          </div>

          {message && <p role="status" className="rounded-2xl bg-surface-mint p-3 text-sm font-semibold text-brand-deepTeal">{message}</p>}
          {error && <p role="alert" className="rounded-2xl bg-danger-red/10 p-3 text-sm font-semibold text-danger-red">{error}</p>}
          {!ready && <p aria-busy="true" className="text-sm text-brand-deepTeal/65">Loading household access…</p>}

          <details className="rounded-2xl bg-surface-mint p-4">
            <summary className="min-h-11 cursor-pointer font-bold text-brand-deepTeal">Create or join a household</summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-brand-deepTeal">Household name<input value={householdName} maxLength={80} onChange={(event) => setHouseholdName(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal" /></label>
                <button type="button" disabled={!householdName.trim() || Boolean(busy)} onClick={() => void mutate({ action: "CREATE", name: householdName }, "create", "Household created. Nothing has been shared.")} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white disabled:opacity-50"><Home aria-hidden="true" className="h-4 w-4" />Create household</button>
              </div>
              <div>
                <label className="text-xs font-bold text-brand-deepTeal">Invitation code<input value={acceptToken} onChange={(event) => setAcceptToken(event.target.value.trim())} autoComplete="off" className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal" /></label>
                <button type="button" disabled={acceptToken.length < 32 || Boolean(busy)} onClick={() => void mutate({ action: "ACCEPT_INVITATION", token: acceptToken, identityHash: null }, "accept", "Invitation accepted. Only records explicitly shared with the household are visible.")} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal disabled:opacity-50"><UserPlus aria-hidden="true" className="h-4 w-4" />Join household</button>
              </div>
            </div>
          </details>

          {households.length > 0 && (
            <>
              <label className="block text-xs font-bold text-brand-deepTeal">Household<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal">{households.map((household) => <option key={household.id} value={household.id}>{household.name}</option>)}</select></label>

              {selected && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="font-bold text-brand-deepTeal">{selected.name}</p><p className="mt-1 text-sm text-brand-deepTeal/65">{selected.currentRole === "ADMIN" ? "Household administrator" : "Household member"} · personal records stay private by default</p></div>
                    <button type="button" disabled={Boolean(busy)} onClick={() => {
                      const current = selected.members.find((member) => member.isYou);
                      if (current) void mutate({ action: "END_MEMBERSHIP", householdId: selected.id, membershipId: current.id, status: "LEFT" }, current.id, "You left the household.");
                    }} className="inline-flex min-h-10 items-center gap-1 self-start rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal disabled:opacity-50"><LogOut aria-hidden="true" className="h-3.5 w-3.5" />Leave</button>
                  </div>

                  <div>
                    <h3 className="font-bold text-brand-deepTeal">Members</h3>
                    <ul className="mt-2 space-y-2">{selected.members.map((member, index) => <li key={member.id} className="flex flex-col gap-2 rounded-xl bg-surface-mint p-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm font-semibold text-brand-deepTeal">{member.isYou ? "You" : `Member ${index + 1}`} · {member.role === "ADMIN" ? "Administrator" : "Member"}</span>{selected.currentRole === "ADMIN" && !member.isYou && <div className="flex gap-2"><button type="button" onClick={() => void mutate({ action: "SET_ROLE", householdId: selected.id, membershipId: member.id, role: member.role === "ADMIN" ? "MEMBER" : "ADMIN" }, member.id, "Member role updated.")} className="min-h-10 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal">{member.role === "ADMIN" ? "Make member" : "Make administrator"}</button><button type="button" onClick={() => void mutate({ action: "END_MEMBERSHIP", householdId: selected.id, membershipId: member.id, status: "REMOVED" }, member.id, "Member removed.")} className="min-h-10 rounded-full border border-border px-3 text-xs font-bold text-danger-red">Remove</button></div>}</li>)}</ul>
                  </div>

                  {selected.currentRole === "ADMIN" && (
                    <div className="rounded-2xl border border-border p-4">
                      <h3 className="font-bold text-brand-deepTeal">Invite a member</h3>
                      <p className="mt-1 text-sm text-brand-deepTeal/65">Create a one-time code that expires in seven days. Share it only with your intended test account.</p>
                      <button type="button" disabled={Boolean(busy)} onClick={() => void mutate({ action: "INVITE", householdId: selected.id, role: "MEMBER", intendedIdentityHash: null, expiresAt: invitationExpiry() }, "invite", "One-time invitation code created.")} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal disabled:opacity-50"><UserPlus aria-hidden="true" className="h-4 w-4" />Create invitation code</button>
                      {inviteToken && <div className="mt-3 rounded-xl bg-surface-mint p-3"><p className="text-xs font-bold text-brand-deepTeal">One-time invitation code</p><code className="mt-1 block break-all text-xs text-brand-deepTeal">{inviteToken}</code><button type="button" onClick={() => void copyInvite()} className="mt-2 inline-flex min-h-10 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal"><Copy aria-hidden="true" className="h-3.5 w-3.5" />Copy code</button></div>}
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-brand-deepTeal">Shared records</h3>
                    <p className="mt-1 text-sm text-brand-deepTeal/65">Choose one of your records. Related records are not included automatically.</p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                      <label className="flex-1 text-xs font-bold text-brand-deepTeal">Record<select value={candidateKey} onChange={(event) => setCandidateKey(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal"><option value="">Choose a record</option>{candidates.map((candidate) => <option key={`${candidate.entityType}:${candidate.entityId}`} value={`${candidate.entityType}:${candidate.entityId}`}>{TYPE_LABEL[candidate.entityType]} · {candidate.title} · {candidate.detail}</option>)}</select></label>
                      <button type="button" disabled={!candidateKey || Boolean(busy)} onClick={() => {
                        const separator = candidateKey.indexOf(":");
                        const entityType = candidateKey.slice(0, separator);
                        const entityId = candidateKey.slice(separator + 1);
                        void mutate({ action: "SHARE", householdId: selected.id, entityType, entityId }, "share", "Record shared with this household.");
                      }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white disabled:opacity-50"><Link2 aria-hidden="true" className="h-4 w-4" />Share record</button>
                    </div>
                    {sharedRecords.length === 0 ? <p className="mt-3 rounded-xl bg-surface-mint p-3 text-sm text-brand-deepTeal/65">No records have been shared with this household.</p> : <ul className="mt-3 space-y-2">{sharedRecords.map((record) => <li key={record.shareId} className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-brand-deepTeal">{record.title}</p><p className="mt-1 text-xs text-brand-deepTeal/60">{TYPE_LABEL[record.entityType]} · {record.detail} · {record.isOwnedByYou ? "Shared by you" : "Shared with this household"}</p></div>{record.isOwnedByYou && <button type="button" onClick={() => void mutate({ action: "REVOKE_SHARE", householdId: selected.id, shareId: record.shareId }, record.shareId, "Sharing removed.")} className="inline-flex min-h-10 items-center gap-1 self-start rounded-full border border-border px-3 text-xs font-bold text-danger-red"><Trash2 aria-hidden="true" className="h-3.5 w-3.5" />Stop sharing</button>}</li>)}</ul>}
                  </div>

                  <div className="flex items-start gap-2 rounded-xl bg-surface-mint p-3 text-xs leading-5 text-brand-deepTeal/70"><ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" /><p>Members can only read records that their owners explicitly share. They cannot edit another person’s transactions or account.</p></div>
                </div>
              )}
            </>
          )}
        </div>
      </details>
    </section>
  );
}
