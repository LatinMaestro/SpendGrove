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
  type MerchantConflict,
  type MerchantConflictResolution,
} from "@/lib/merchant-rules";

function merchantItemCount(data: LocalMerchantData) {
  return data.profiles.length + data.aliases.length + data.rules.length;
}

export function MerchantConflictPrompt({
  conflict,
  onChoose,
}: {
  conflict: MerchantConflict;
  onChoose(resolution: MerchantConflictResolution): void;
}) {
  const existingCategory = getManualCategory(conflict.existingCategoryId)?.name ?? "its current category";
  const requestedCategory = getManualCategory(conflict.requestedCategoryId)?.name ?? "the new category";
  return (
    <div role="alert" className="rounded-2xl border border-warning-amber bg-warning-amber/10 p-4">
      <p className="font-bold text-brand-deepTeal">This saved match already belongs somewhere else</p>
      <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">
        It currently uses {conflict.existingMerchantName} with {existingCategory}. Replace it with {conflict.requestedMerchantName} and {requestedCategory}, or keep the existing choice.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onChoose("REPLACE")} className="min-h-10 rounded-full bg-brand-deepTeal px-4 text-xs font-bold text-white">Replace</button>
        <button type="button" onClick={() => onChoose("KEEP_EXISTING")} className="min-h-10 rounded-full border border-brand-teal bg-white px-4 text-xs font-bold text-brand-deepTeal">Keep existing</button>
        <button type="button" onClick={() => onChoose("CANCEL")} className="min-h-10 rounded-full px-4 text-xs font-bold text-brand-teal">Cancel</button>
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
  categoryOptions: Array<{ id: string; name: string; group: string }>;
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
  const [accountBacked, setAccountBacked] = useState(false);
  const accountReadyRef = useRef(false);
  const lastSyncedRef = useRef("");
  const syncInFlightRef = useRef(false);
  const onDataChangeRef = useRef(onDataChange);

  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    let cancelled = false;

    void listAccountMerchantData().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setAccountBacked(false);
        setMessage("Account merchant suggestions are unavailable. Browser-only suggestions were not changed.");
        return;
      }

      const serialized = JSON.stringify(result.data);
      onDataChangeRef.current(result.data);
      accountReadyRef.current = true;
      lastSyncedRef.current = serialized;
      setAccountBacked(true);
      if (merchantItemCount(result.data) > 0) {
        setMessage("Account merchant suggestions loaded.");
      }
    }).catch(() => {
      if (cancelled) return;
      setAccountBacked(false);
      setMessage("Account merchant suggestions are unavailable. Browser-only suggestions were not changed.");
    });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!accountReadyRef.current || syncInFlightRef.current) return;
    const serialized = JSON.stringify(data);
    if (serialized === lastSyncedRef.current) return;

    syncInFlightRef.current = true;
    setMessage("Saving merchant suggestions to your account…");
    void replaceAccountMerchantData(data).then((result) => {
      if (!result.ok) {
        accountReadyRef.current = false;
        setAccountBacked(false);
        setMessage(`${result.error} Your current review was kept; browser-only suggestions were not changed.`);
        return;
      }
      const accountSerialized = JSON.stringify(result.data);
      lastSyncedRef.current = accountSerialized;
      if (accountSerialized !== serialized) onDataChangeRef.current(result.data);
      setAccountBacked(true);
      setMessage("Merchant suggestions saved to your account. Your active import review was kept open.");
    }).catch(() => {
      accountReadyRef.current = false;
      setAccountBacked(false);
      setMessage("Account storage is unavailable right now. Your current review was kept; browser-only suggestions were not changed.");
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
      setMessage(accountBacked ? "Saving merchant details to your account…" : "Merchant details updated for this review only.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The merchant details could not be updated.");
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
      setMessage(resolution === "KEEP_EXISTING"
        ? "The existing saved match was kept."
        : accountBacked ? "Saving matching name to your account…" : "Matching name updated for this review only.");
    } catch (error) {
      if (error instanceof MerchantConflictError) setAliasConflict(error.conflict);
      else setMessage(error instanceof Error ? error.message : "The matching name could not be updated.");
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
            {data.rules.length} saved rule{data.rules.length === 1 ? "" : "s"} and {data.aliases.length} matching name{data.aliases.length === 1 ? "" : "s"}. They remain suggestions you can change during review.
          </p>
        </div>
        {(data.rules.length > 0 || data.aliases.length > 0) && (
          <button type="button" onClick={onClear} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal">
            <Trash2 aria-hidden="true" className="h-4 w-4" /> Clear saved suggestions
          </button>
        )}
      </div>

      <details className="mt-4 rounded-2xl border border-border p-4">
        <summary className="cursor-pointer font-bold text-brand-deepTeal">Manage aliases and merchant names</summary>
        <div className="mt-4 space-y-4">
          {activeProfiles.length === 0 ? (
            <p className="rounded-2xl bg-surface-mint p-4 text-sm text-brand-deepTeal/70">No saved merchant names yet.</p>
          ) : activeProfiles.map((profile) => {
            const categoryName = categoryOptions.find((category) => category.id === profile.defaultCategoryId)?.name
              ?? getManualCategory(profile.defaultCategoryId)?.name
              ?? "Category unavailable";
            const aliases = data.aliases.filter((alias) => alias.merchantProfileId === profile.id);
            const rules = data.rules.filter((rule) => rule.merchantProfileId === profile.id);
            return (
              <article key={profile.id} className="rounded-2xl bg-surface-mint p-4">
                {profileEdit?.id === profile.id ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-bold text-brand-deepTeal">
                        Merchant name
                        <input value={profileEdit.name} onChange={(event) => setProfileEdit({ ...profileEdit, name: event.target.value })} className="mt-2 min-h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm" />
                      </label>
                      <label className="text-sm font-bold text-brand-deepTeal">
                        Suggested category
                        <select value={profileEdit.categoryId} onChange={(event) => setProfileEdit({ ...profileEdit, categoryId: event.target.value })} className="mt-2 min-h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm">
                          {categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.group} · {category.name}</option>)}
                        </select>
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={finishProfileUpdate} className="min-h-11 rounded-full bg-brand-deepTeal px-4 text-xs font-bold text-white">Save changes</button>
                      <button type="button" onClick={() => setProfileEdit(null)} className="min-h-11 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div><p className="font-bold text-brand-deepTeal">{profile.name}</p><p className="mt-1 text-xs text-brand-deepTeal/60">Suggested category: {categoryName}</p></div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => { setProfileEdit({ id: profile.id, name: profile.name, categoryId: profile.defaultCategoryId }); setMessage(""); }} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal bg-white px-3 text-xs font-bold text-brand-deepTeal"><Pencil aria-hidden="true" className="h-3.5 w-3.5" /> Edit merchant</button>
                      <button type="button" onClick={() => onUpdateProfile(profile.id, { isActive: false })} className="min-h-10 rounded-full px-3 text-xs font-bold text-danger-red">Remove merchant</button>
                    </div>
                  </div>
                )}

                {aliases.length > 0 && <div className="mt-4 space-y-2"><p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">Matching names</p>{aliases.map((alias) => (
                  <div key={alias.id} className="rounded-2xl bg-white p-3">
                    {aliasEdit?.id === alias.id ? (
                      <div className="flex flex-col gap-2 sm:flex-row"><input value={aliasEdit.name} onChange={(event) => setAliasEdit({ ...aliasEdit, name: event.target.value })} aria-label="Matching merchant name" className="min-h-10 flex-1 rounded-xl border border-border px-3 text-sm" /><button type="button" onClick={() => finishAliasRename()} className="min-h-10 rounded-full bg-brand-deepTeal px-3 text-xs font-bold text-white">Save</button></div>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span className={`text-sm font-semibold ${alias.isActive ? "text-brand-deepTeal" : "text-brand-deepTeal/45"}`}>{alias.name}{alias.isActive ? "" : " · disabled"}</span><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setAliasEdit({ id: alias.id, name: alias.name }); setAliasConflict(null); setMessage(""); }} className="min-h-9 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal">Rename</button><button type="button" onClick={() => onAliasActiveChange(alias.id, !alias.isActive)} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal">{!alias.isActive && <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />}{alias.isActive ? "Disable" : "Restore"}</button><button type="button" onClick={() => onDeleteAlias(alias.id)} className="min-h-9 rounded-full px-3 text-xs font-bold text-danger-red">Delete</button></div></div>
                    )}
                  </div>
                ))}</div>}

                {rules.length > 0 && <div className="mt-4 space-y-2"><p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">Saved rules</p>{rules.map((rule) => (
                  <div key={rule.id} className="flex flex-col gap-2 rounded-2xl bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><span className={`text-sm font-semibold ${rule.isActive ? "text-brand-deepTeal" : "text-brand-deepTeal/45"}`}>{getManualCategory(rule.categoryId)?.name ?? "Category unavailable"}{rule.isActive ? "" : " · disabled"}</span><div className="flex flex-wrap gap-2"><button type="button" onClick={() => onRuleActiveChange(rule.id, !rule.isActive)} className="min-h-9 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal">{rule.isActive ? "Disable" : "Restore"}</button><button type="button" onClick={() => onDeleteRule(rule.id)} className="min-h-9 rounded-full px-3 text-xs font-bold text-danger-red">Delete</button></div></div>
                ))}</div>}
              </article>
            );
          })}
        </div>
        {removedProfiles.length > 0 && (
          <details className="mt-4 rounded-2xl border border-border bg-surface-mint/50 p-3">
            <summary className="cursor-pointer text-sm font-bold text-brand-deepTeal">Removed merchants ({removedProfiles.length})</summary>
            <div className="mt-3 space-y-2">
              {removedProfiles.map((profile) => (
                <div key={profile.id} className="flex flex-col gap-2 rounded-xl bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-brand-deepTeal">{profile.name}</p>
                    <p className="mt-1 text-xs text-brand-deepTeal/60">Not used for new suggestions</p>
                  </div>
                  <button type="button" onClick={() => onUpdateProfile(profile.id, { isActive: true })} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal"><RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> Restore merchant</button>
                </div>
              ))}
            </div>
          </details>
        )}
        {aliasConflict && aliasEdit && <div className="mt-4"><MerchantConflictPrompt conflict={aliasConflict} onChoose={finishAliasRename} /></div>}
      </details>

      {!accountBacked && !storageAvailable && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Browser storage is unavailable. Suggestions work only while this review stays open.</p>}
      {recoveredFromCorruption && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Unreadable saved merchant choices were ignored and safely reset.</p>}
      {migrated && <p className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">Saved merchant choices were safely updated to the current format.</p>}
      {staleReferenceCount > 0 && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">{staleReferenceCount} saved merchant item{staleReferenceCount === 1 ? " was" : "s were"} removed because its category is no longer available.</p>}
      {message && <p role="status" className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{message}</p>}
    </section>
  );
}
