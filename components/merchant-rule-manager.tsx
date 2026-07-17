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
  onRenameProfile,
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
  onRenameProfile(profileId: string, name: string): void;
  onRenameAlias(aliasId: string, name: string, resolution?: MerchantConflictResolution): void;
  onAliasActiveChange(aliasId: string, isActive: boolean): void;
  onDeleteAlias(aliasId: string): void;
  onRuleActiveChange(ruleId: string, isActive: boolean): void;
  onDeleteRule(ruleId: string): void;
  onClear(): void;
}) {
  const [profileEdit, setProfileEdit] = useState<{ id: string; name: string } | null>(null);
  const [aliasEdit, setAliasEdit] = useState<{ id: string; name: string } | null>(null);
  const [aliasConflict, setAliasConflict] = useState<MerchantConflict | null>(null);
  const [message, setMessage] = useState("");
  const [accountBacked, setAccountBacked] = useState(false);
  const accountReadyRef = useRef(false);
  const lastSyncedRef = useRef("");
  const syncInFlightRef = useRef(false);

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
      onDataChange(result.data);
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
        setMessage(`${result.error} Your device copy and active review were kept.`);
        return;
      }
      const accountSerialized = JSON.stringify(result.data);
      lastSyncedRef.current = accountSerialized;
      if (accountSerialized !== serialized) onDataChange(result.data);
      setAccountBacked(true);
      setMessage("Merchant suggestions saved to your account. Your active import review was kept open.");
    }).catch(() => {
      accountReadyRef.current = false;
      setAccountBacked(false);
      setMessage("Account storage is unavailable right now. Your device copy and active review were kept.");
    }).finally(() => {
      syncInFlightRef.current = false;
    });
  }, [data]);

  function finishProfileRename() {
    if (!profileEdit) return;
    try {
      onRenameProfile(profileEdit.id, profileEdit.name);
      setProfileEdit(null);
      setMessage(accountBacked ? "Saving merchant name to your account…" : "Merchant name updated on this device.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The merchant name could not be updated.");
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
        : accountBacked ? "Saving matching name to your account…" : "Matching name updated on this device.");
    } catch (error) {
      if (error instanceof MerchantConflictError) setAliasConflict(error.conflict);
      else setMessage(error instanceof Error ? error.message : "The matching name could not be updated.");
    }
  }

  return (
    <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="merchant-rules-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
            {accountBacked && <Cloud aria-hidden="true" className="h-4 w-4" />}
            {accountBacked ? "Saved to your account" : "Saved on this device"}
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
          {data.profiles.length === 0 ? (
            <p className="rounded-2xl bg-surface-mint p-4 text-sm text-brand-deepTeal/70">No saved merchant names yet.</p>
          ) : data.profiles.map((profile) => {
            const categoryName = getManualCategory(profile.defaultCategoryId)?.name ?? "Category unavailable";
            const aliases = data.aliases.filter((alias) => alias.merchantProfileId === profile.id);
            const rules = data.rules.filter((rule) => rule.merchantProfileId === profile.id);
            return (
              <article key={profile.id} className="rounded-2xl bg-surface-mint p-4">
                {profileEdit?.id === profile.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input value={profileEdit.name} onChange={(event) => setProfileEdit({ ...profileEdit, name: event.target.value })} aria-label="Main merchant name" className="min-h-11 flex-1 rounded-2xl border border-border bg-white px-4 text-sm" />
                    <button type="button" onClick={finishProfileRename} className="min-h-11 rounded-full bg-brand-deepTeal px-4 text-xs font-bold text-white">Save name</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div><p className="font-bold text-brand-deepTeal">{profile.name}</p><p className="mt-1 text-xs text-brand-deepTeal/60">Suggested category: {categoryName}</p></div>
                    <button type="button" onClick={() => { setProfileEdit({ id: profile.id, name: profile.name }); setMessage(""); }} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal bg-white px-3 text-xs font-bold text-brand-deepTeal"><Pencil aria-hidden="true" className="h-3.5 w-3.5" /> Rename merchant</button>
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
