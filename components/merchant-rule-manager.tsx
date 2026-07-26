"use client";

import { useEffect, useRef, useState } from "react";
import { Cloud, Pencil, RotateCcw, Trash2 } from "lucide-react";
import {
  listAccountMerchantData,
  replaceAccountMerchantData,
} from "@/lib/account-merchant-rules";
import { getManualCategory } from "@/lib/manual-categories";
import {
  MerchantConflictError,
  type LocalMerchantData,
  type LocalMerchantRuleType,
  type MerchantConflict,
  type MerchantConflictResolution,
} from "@/lib/merchant-rules";

type MerchantCategoryOption = { id: string; name: string; group: string };
type MessageKind = "STATUS" | "ERROR";

const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus";

function merchantItemCount(data: LocalMerchantData) {
  return data.profiles.length + data.aliases.length + data.rules.length;
}

export function merchantRuleTypeLabel(type: LocalMerchantRuleType) {
  const labels: Record<LocalMerchantRuleType, string> = {
    EXACT: "Exact merchant match",
    STARTS_WITH: "Name starts with",
    CONTAINS: "Name contains",
  };
  return labels[type];
}

export function merchantCategoryName(categoryId: string, categoryOptions: MerchantCategoryOption[]) {
  return categoryOptions.find((category) => category.id === categoryId)?.name
    ?? getManualCategory(categoryId)?.name
    ?? "Category unavailable";
}

export function formatSavedMerchantDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Brisbane",
  }).format(date);
}

export function MerchantConflictPrompt({
  conflict,
  categoryOptions = [],
  onChoose,
}: {
  conflict: MerchantConflict;
  categoryOptions?: MerchantCategoryOption[];
  onChoose(resolution: MerchantConflictResolution): void;
}) {
  const existingCategory = merchantCategoryName(conflict.existingCategoryId, categoryOptions);
  const requestedCategory = merchantCategoryName(conflict.requestedCategoryId, categoryOptions);
  return (
    <div role="alert" className="rounded-2xl border border-warning-amber bg-warning-amber/10 p-4">
      <p className="font-bold text-brand-deepTeal">This matching name is already saved for another merchant</p>
      <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">
        It currently suggests {existingCategory} for {conflict.existingMerchantName}. Using {conflict.requestedMerchantName} with {requestedCategory} will change this saved suggestion for future reviews only. Existing transactions and Categories will not be changed.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onChoose("REPLACE")} className={`min-h-11 rounded-full bg-brand-deepTeal px-4 text-xs font-bold text-white ${focusRing}`}>Use new merchant for this match</button>
        <button type="button" onClick={() => onChoose("KEEP_EXISTING")} className={`min-h-11 rounded-full border border-brand-teal bg-white px-4 text-xs font-bold text-brand-deepTeal ${focusRing}`}>Keep current merchant</button>
        <button type="button" onClick={() => onChoose("CANCEL")} className={`min-h-11 rounded-full px-4 text-xs font-bold text-brand-teal ${focusRing}`}>Cancel</button>
      </div>
    </div>
  );
}

export function MerchantRuleManager({
  data,
  storageAvailable,
  recoveredFromCorruption,
  migrated,
  staleReferenceCount,
  onDataChange,
  categoryOptions,
  onUpdateProfile,
  onRenameAlias,
  onAliasActiveChange,
  onDeleteAlias,
  onRuleActiveChange,
  onDeleteRule,
  onClear,
}: {
  data: LocalMerchantData;
  storageAvailable: boolean;
  recoveredFromCorruption: boolean;
  migrated: boolean;
  staleReferenceCount: number;
  onDataChange(data: LocalMerchantData): void;
  categoryOptions: MerchantCategoryOption[];
  onUpdateProfile(profileId: string, input: { name?: string; categoryId?: string; isActive?: boolean }): void;
  onRenameAlias(aliasId: string, name: string, resolution?: MerchantConflictResolution): void;
  onAliasActiveChange(aliasId: string, isActive: boolean): void;
  onDeleteAlias(aliasId: string): void;
  onRuleActiveChange(ruleId: string, isActive: boolean): void;
  onDeleteRule(ruleId: string): void;
  onClear(): void;
}) {
  const [profileEdit, setProfileEdit] = useState<{ id: string; name: string; categoryId: string } | null>(null);
  const [aliasEdit, setAliasEdit] = useState<{ id: string; name: string } | null>(null);
  const [aliasConflict, setAliasConflict] = useState<MerchantConflict | null>(null);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<MessageKind>("STATUS");
  const [accountBacked, setAccountBacked] = useState(false);
  const accountReadyRef = useRef(false);
  const lastSyncedRef = useRef("");
  const syncInFlightRef = useRef(false);
  const onDataChangeRef = useRef(onDataChange);
  const aliasRenameButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  function showMessage(text: string, kind: MessageKind = "STATUS") {
    setMessageKind(kind);
    setMessage(text);
  }

  function clearMessage() {
    setMessage("");
    setMessageKind("STATUS");
  }

  useEffect(() => {
    let cancelled = false;

    void listAccountMerchantData().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setAccountBacked(false);
        showMessage("Account merchant suggestions are unavailable. Browser-only suggestions were not changed.");
        return;
      }

      const serialized = JSON.stringify(result.data);
      onDataChangeRef.current(result.data);
      accountReadyRef.current = true;
      lastSyncedRef.current = serialized;
      setAccountBacked(true);
      if (merchantItemCount(result.data) > 0) {
        showMessage("Account merchant suggestions loaded.");
      }
    }).catch(() => {
      if (cancelled) return;
      setAccountBacked(false);
      showMessage("Account merchant suggestions are unavailable. Browser-only suggestions were not changed.");
    });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!accountReadyRef.current || syncInFlightRef.current) return;
    const serialized = JSON.stringify(data);
    if (serialized === lastSyncedRef.current) return;

    syncInFlightRef.current = true;
    showMessage("Saving merchant suggestions to your account…");
    void replaceAccountMerchantData(data).then((result) => {
      if (!result.ok) {
        accountReadyRef.current = false;
        setAccountBacked(false);
        showMessage(`${result.error} Your current review was kept; browser-only suggestions were not changed.`, "ERROR");
        return;
      }
      const accountSerialized = JSON.stringify(result.data);
      lastSyncedRef.current = accountSerialized;
      if (accountSerialized !== serialized) onDataChangeRef.current(result.data);
      setAccountBacked(true);
      showMessage("Merchant suggestions saved to your account. Your active import review was kept open.");
    }).catch(() => {
      accountReadyRef.current = false;
      setAccountBacked(false);
      showMessage("Account storage is unavailable right now. Your current review was kept; browser-only suggestions were not changed.", "ERROR");
    }).finally(() => {
      syncInFlightRef.current = false;
    });
  }, [data]);

  function finishProfileUpdate() {
    if (!profileEdit) return;
    try {
      onUpdateProfile(profileEdit.id, {
        name: profileEdit.name,
        categoryId: profileEdit.categoryId,
      });
      setProfileEdit(null);
      showMessage(accountBacked ? "Saving merchant details to your account…" : "Merchant details updated for this review only.");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "The merchant details could not be updated.", "ERROR");
    }
  }

  function finishAliasRename(resolution?: MerchantConflictResolution) {
    if (!aliasEdit) return;
    if (resolution === "CANCEL") {
      setAliasConflict(null);
      return;
    }
    try {
      onRenameAlias(aliasEdit.id, aliasEdit.name, resolution);
      setAliasConflict(null);
      setAliasEdit(null);
      showMessage(resolution === "KEEP_EXISTING"
        ? "The current merchant remains saved for this matching name."
        : accountBacked ? "Saving matching name to your account…" : "Matching name updated for this review only.");
    } catch (error) {
      if (error instanceof MerchantConflictError) setAliasConflict(error.conflict);
      else showMessage(error instanceof Error ? error.message : "The matching name could not be updated.", "ERROR");
    }
  }

  function cancelAliasEdit() {
    const aliasId = aliasEdit?.id;
    setAliasConflict(null);
    setAliasEdit(null);
    clearMessage();
    if (aliasId) {
      requestAnimationFrame(() => aliasRenameButtonRefs.current[aliasId]?.focus());
    }
  }

  const activeProfiles = data.profiles.filter((profile) => profile.isActive);
  const removedProfiles = data.profiles.filter((profile) => !profile.isActive);

  return (
    <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="merchant-rules-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
            {accountBacked && <Cloud aria-hidden="true" className="h-4 w-4" />}
            {accountBacked ? "Saved to your account" : "Account unavailable"}
          </p>
          <h2 id="merchant-rules-heading" className="mt-1 text-xl font-bold text-brand-deepTeal">Merchant suggestions</h2>
          <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">
            {data.rules.length} saved rule{data.rules.length === 1 ? "" : "s"} and {data.aliases.length} matching name{data.aliases.length === 1 ? "" : "s"}. Saved suggestions come from choices you reviewed. SpendGrove checks them during future reviews; they do not silently edit existing transactions.
          </p>
        </div>
        {(data.rules.length > 0 || data.aliases.length > 0) && (
          <button type="button" onClick={onClear} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal ${focusRing}`}>
            <Trash2 aria-hidden="true" className="h-4 w-4" /> Clear saved suggestions
          </button>
        )}
      </div>

      <details className="mt-4 rounded-2xl border border-border p-4">
        <summary className={`flex min-h-11 cursor-pointer items-center rounded-xl font-bold text-brand-deepTeal ${focusRing}`}>Manage matching names and merchant details</summary>
        <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Review cleaned merchant names, matching names and saved Category suggestions. Changes affect future reviews only.</p>
        <div className="mt-4 space-y-4">
          {activeProfiles.length === 0 ? (
            <p className="rounded-2xl bg-surface-mint p-4 text-sm text-brand-deepTeal/70">No saved merchant names yet.</p>
          ) : activeProfiles.map((profile) => {
            const categoryName = merchantCategoryName(profile.defaultCategoryId, categoryOptions);
            const aliases = data.aliases.filter((alias) => alias.merchantProfileId === profile.id);
            const rules = data.rules.filter((rule) => rule.merchantProfileId === profile.id);
            const categoryHelperId = `merchant-category-helper-${profile.id}`;
            return (
              <article key={profile.id} className="rounded-2xl bg-surface-mint p-4">
                {profileEdit?.id === profile.id ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-bold text-brand-deepTeal">
                        Merchant name
                        <input value={profileEdit.name} onChange={(event) => setProfileEdit({ ...profileEdit, name: event.target.value })} className={`mt-2 min-h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm ${focusRing}`} />
                      </label>
                      <label className="text-sm font-bold text-brand-deepTeal">
                        Suggested Category
                        <select aria-describedby={categoryHelperId} value={profileEdit.categoryId} onChange={(event) => setProfileEdit({ ...profileEdit, categoryId: event.target.value })} className={`mt-2 min-h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm ${focusRing}`}>
                          {categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.group} · {category.name}</option>)}
                        </select>
                        <span id={categoryHelperId} className="mt-2 block text-xs font-normal leading-5 text-brand-deepTeal/65">Used as a suggestion during review when it matches the transaction direction. Existing transactions are not changed.</span>
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={finishProfileUpdate} className={`min-h-11 rounded-full bg-brand-deepTeal px-4 text-xs font-bold text-white ${focusRing}`}>Save changes</button>
                      <button type="button" onClick={() => { setProfileEdit(null); clearMessage(); }} className={`min-h-11 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal ${focusRing}`}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div><p className="font-bold text-brand-deepTeal">{profile.name}</p><p className="mt-1 text-xs text-brand-deepTeal/60">Suggested Category: {categoryName}</p><p className="mt-1 text-xs leading-5 text-brand-deepTeal/60">Used during future reviews when compatible with transaction direction. Existing transactions are unchanged.</p></div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => { setProfileEdit({ id: profile.id, name: profile.name, categoryId: profile.defaultCategoryId }); clearMessage(); }} className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal bg-white px-3 text-xs font-bold text-brand-deepTeal ${focusRing}`}><Pencil aria-hidden="true" className="h-3.5 w-3.5" /> Edit merchant</button>
                      <button type="button" onClick={() => onUpdateProfile(profile.id, { isActive: false })} className={`min-h-10 rounded-full px-3 text-xs font-bold text-danger-red ${focusRing}`}>Remove merchant</button>
                    </div>
                  </div>
                )}

                {aliases.length > 0 && <div className="mt-4 space-y-2"><p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">Matching names</p>{aliases.map((alias) => (
                  <div key={alias.id} className="rounded-2xl bg-white p-3">
                    {aliasEdit?.id === alias.id ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><input value={aliasEdit.name} onChange={(event) => setAliasEdit({ ...aliasEdit, name: event.target.value })} aria-label="Matching merchant name" className={`min-h-11 min-w-0 flex-1 rounded-xl border border-border px-3 text-sm ${focusRing}`} /><div className="flex flex-wrap gap-2"><button type="button" onClick={() => finishAliasRename()} className={`min-h-11 rounded-full bg-brand-deepTeal px-3 text-xs font-bold text-white ${focusRing}`}>Save</button><button type="button" onClick={cancelAliasEdit} className={`min-h-11 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal ${focusRing}`}>Cancel</button></div></div>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span className={`text-sm font-semibold ${alias.isActive ? "text-brand-deepTeal" : "text-muted"}`}>{alias.name}{alias.isActive ? "" : " · Disabled"}</span><div className="flex flex-wrap gap-2"><button ref={(node) => { aliasRenameButtonRefs.current[alias.id] = node; }} type="button" onClick={() => { setAliasEdit({ id: alias.id, name: alias.name }); setAliasConflict(null); clearMessage(); }} className={`min-h-10 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal ${focusRing}`}>Rename</button><button type="button" onClick={() => onAliasActiveChange(alias.id, !alias.isActive)} className={`inline-flex min-h-10 items-center gap-1 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal ${focusRing}`}>{!alias.isActive && <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />}{alias.isActive ? "Disable" : "Restore"}</button><button type="button" onClick={() => onDeleteAlias(alias.id)} className={`min-h-10 rounded-full px-3 text-xs font-bold text-danger-red ${focusRing}`}>Remove matching name</button></div></div>
                    )}
                  </div>
                ))}</div>}

                {rules.length > 0 && <div className="mt-4 space-y-2"><p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">Saved rules</p>{rules.map((rule) => {
                  const savedDate = formatSavedMerchantDate(rule.createdAt);
                  const ruleCategory = merchantCategoryName(rule.categoryId, categoryOptions);
                  return (
                    <div key={rule.id} className="flex flex-col gap-2 rounded-2xl bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><span className={`min-w-0 text-sm font-semibold ${rule.isActive ? "text-brand-deepTeal" : "text-muted"}`}>{merchantRuleTypeLabel(rule.type)} · {ruleCategory}{savedDate ? ` · Saved ${savedDate}` : ""}{rule.isActive ? "" : " · Disabled"}</span><div className="flex flex-wrap gap-2"><button type="button" onClick={() => onRuleActiveChange(rule.id, !rule.isActive)} className={`min-h-10 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal ${focusRing}`}>{rule.isActive ? "Disable" : "Restore"}</button><button type="button" onClick={() => onDeleteRule(rule.id)} className={`min-h-10 rounded-full px-3 text-xs font-bold text-danger-red ${focusRing}`}>Remove saved rule</button></div></div>
                  );
                })}</div>}
              </article>
            );
          })}
        </div>
        {removedProfiles.length > 0 && (
          <details className="mt-4 rounded-2xl border border-border bg-surface-mint/50 p-3">
            <summary className={`flex min-h-11 cursor-pointer items-center rounded-xl text-sm font-bold text-brand-deepTeal ${focusRing}`}>Removed merchants ({removedProfiles.length})</summary>
            <div className="mt-3 space-y-2">
              {removedProfiles.map((profile) => (
                <div key={profile.id} className="flex flex-col gap-2 rounded-xl bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-brand-deepTeal">{profile.name}</p>
                    <p className="mt-1 text-xs text-brand-deepTeal/60">Not used for new suggestions</p>
                  </div>
                  <button type="button" onClick={() => onUpdateProfile(profile.id, { isActive: true })} className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal ${focusRing}`}><RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> Restore merchant</button>
                </div>
              ))}
            </div>
          </details>
        )}
        {aliasConflict && aliasEdit && <div className="mt-4"><MerchantConflictPrompt conflict={aliasConflict} categoryOptions={categoryOptions} onChoose={finishAliasRename} /></div>}
      </details>

      {!accountBacked && !storageAvailable && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Browser storage is unavailable. Suggestions work only while this review stays open.</p>}
      {recoveredFromCorruption && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Unreadable saved merchant choices were ignored and safely reset.</p>}
      {migrated && <p className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">Saved merchant choices were safely updated to the current format.</p>}
      {staleReferenceCount > 0 && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">{staleReferenceCount} saved merchant item{staleReferenceCount === 1 ? " was" : "s were"} removed because its Category is no longer available.</p>}
      {message && <p role={messageKind === "ERROR" ? "alert" : "status"} className={`mt-4 rounded-2xl p-4 text-sm font-semibold ${messageKind === "ERROR" ? "bg-danger-red/10 text-danger-red" : "bg-surface-mint text-brand-deepTeal"}`}>{message}</p>}
    </section>
  );
}
