"use client";

import { useEffect, useState } from "react";
import { Bookmark, Cloud, Settings2, Trash2 } from "lucide-react";
import {
  deleteAccountSavedImportProfile,
  listAccountSavedImportProfiles,
  resetAccountSavedImportProfiles,
  updateAccountSavedImportProfile,
} from "@/lib/account-saved-import-profiles";
import type { SavedImportProfile } from "@/lib/saved-import-profiles";
import { manualCategories } from "@/lib/manual-categories";
import {
  CustomCategoryManager,
  useCustomCategoryCatalogue,
} from "@/components/custom-category-controls";
import { MerchantRuleManager } from "@/components/merchant-rule-manager";
import {
  deleteMerchantAlias,
  deleteMerchantRule,
  emptyLocalMerchantData,
  renameMerchantAlias,
  setMerchantAliasActive,
  updateMerchantProfile,
  setMerchantRuleActive,
  type LocalMerchantData,
  type MerchantConflictResolution,
} from "@/lib/merchant-rules";

function SavedMappingAdministration() {
  const [profiles, setProfiles] = useState<SavedImportProfile[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listAccountSavedImportProfiles().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setStatus("error");
        setNotice(result.error);
        return;
      }
      setProfiles(result.profiles);
      setStatus("ready");
    }).catch(() => {
      if (!cancelled) {
        setStatus("error");
        setNotice("Saved mappings could not be loaded safely.");
      }
    });
    return () => { cancelled = true; };
  }, []);

  function rename(profileId: string) {
    if (!editing || editing.id !== profileId || !editing.name.trim()) return;
    const previous = profiles;
    setProfiles((current) => current.map((profile) => profile.id === profileId
      ? { ...profile, contract: { ...profile.contract, displayName: editing.name.trim() } }
      : profile));
    setEditing(null);
    setNotice("Saving mapping name…");
    void updateAccountSavedImportProfile(profileId, { displayName: editing.name }).then((result) => {
      if (result.ok) {
        setProfiles(result.profiles);
        setNotice("Saved mapping renamed.");
      } else {
        setProfiles(previous);
        setNotice(result.error);
      }
    }).catch(() => {
      setProfiles(previous);
      setNotice("The saved mapping could not be renamed.");
    });
  }

  function toggle(profile: SavedImportProfile) {
    const previous = profiles;
    setProfiles((current) => current.map((candidate) => candidate.id === profile.id
      ? { ...candidate, isEnabled: !profile.isEnabled }
      : candidate));
    void updateAccountSavedImportProfile(profile.id, { isEnabled: !profile.isEnabled }).then((result) => {
      if (result.ok) {
        setProfiles(result.profiles);
        setNotice(profile.isEnabled ? "Saved mapping disabled." : "Saved mapping restored.");
      } else {
        setProfiles(previous);
        setNotice(result.error);
      }
    }).catch(() => {
      setProfiles(previous);
      setNotice("The saved mapping could not be updated.");
    });
  }

  function remove(profileId: string) {
    const previous = profiles;
    setProfiles((current) => current.filter((profile) => profile.id !== profileId));
    void deleteAccountSavedImportProfile(profileId).then((result) => {
      if (result.ok) {
        setProfiles(result.profiles);
        setNotice("Saved mapping deleted.");
      } else {
        setProfiles(previous);
        setNotice(result.error);
      }
    }).catch(() => {
      setProfiles(previous);
      setNotice("The saved mapping could not be deleted.");
    });
  }

  function clearAll() {
    const previous = profiles;
    setProfiles([]);
    void resetAccountSavedImportProfiles().then((result) => {
      if (result.ok) {
        setNotice("Saved mappings deleted.");
      } else {
        setProfiles(previous);
        setNotice(result.error);
      }
    }).catch(() => {
      setProfiles(previous);
      setNotice("Saved mappings could not be deleted.");
    });
  }

  return (
    <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="saved-mapping-admin-heading">
      <div className="flex items-start gap-3">
        <Bookmark aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" />
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-teal"><Cloud aria-hidden="true" className="h-4 w-4" /> Saved to your account</p>
          <h2 id="saved-mapping-admin-heading" className="mt-1 text-xl font-bold text-brand-deepTeal">Saved import mappings</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Rename, disable or delete reusable column setups. No CSV content or filenames are stored here.</p>
        </div>
      </div>
      {status === "loading" && <p className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-muted">Loading saved mappings…</p>}
      {status === "error" && <p role="alert" className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-foreground">{notice}</p>}
      {status === "ready" && profiles.length === 0 && <p className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-muted">No saved mappings yet.</p>}
      {status === "ready" && profiles.length > 0 && (
        <details className="mt-4 rounded-2xl border border-border p-4">
          <summary className="min-h-11 cursor-pointer rounded-lg py-2 font-bold text-brand-deepTeal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Manage saved mappings ({profiles.length})</summary>
          <div className="mt-4 space-y-3">
            {profiles.map((profile) => (
              <article key={profile.id} className="rounded-2xl bg-surface-mint p-4">
                {editing?.id === profile.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} aria-label="Saved mapping name" className="min-h-11 flex-1 rounded-xl border border-border bg-white px-3 text-sm" />
                    <button type="button" onClick={() => rename(profile.id)} className="min-h-11 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white">Save name</button>
                    <button type="button" onClick={() => setEditing(null)} className="min-h-11 rounded-xl px-4 text-sm font-bold text-brand-evergreen">Cancel</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-foreground">{profile.contract.displayName}</p>
                      <p className="mt-1 text-xs text-muted">{profile.isEnabled ? "Available during import" : "Disabled"} · {profile.contract.columnCount} columns</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setEditing({ id: profile.id, name: profile.contract.displayName })} className="min-h-10 rounded-xl border border-border px-3 text-xs font-bold text-foreground">Rename</button>
                      <button type="button" onClick={() => toggle(profile)} className="min-h-10 rounded-xl border border-border px-3 text-xs font-bold text-foreground">{profile.isEnabled ? "Disable" : "Restore"}</button>
                      <button type="button" onClick={() => remove(profile.id)} className="min-h-10 rounded-xl px-3 text-xs font-bold text-danger-red">Delete</button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
          <button type="button" onClick={clearAll} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-danger-red"><Trash2 aria-hidden="true" className="h-4 w-4" /> Delete all saved mappings</button>
        </details>
      )}
      {status === "ready" && notice && <p role="status" className="mt-4 rounded-xl bg-surface-mint p-3 text-sm font-semibold text-foreground">{notice}</p>}
    </section>
  );
}

export function AccountDataManagement() {
  const categories = useCustomCategoryCatalogue();
  const [merchantData, setMerchantData] = useState<LocalMerchantData>(emptyLocalMerchantData());
  const categoryOptions = [
    ...manualCategories,
    ...categories.categories.filter((category) => !category.isArchived),
  ].filter((category, index, catalogue) =>
    catalogue.findIndex((candidate) => candidate.id === category.id) === index,
  ).map(({ id, name, group }) => ({ id, name, group }));

  return (
    <section className="mt-6" aria-labelledby="account-data-management-heading">
      <div className="mb-2 px-1">
        <h2 id="account-data-management-heading" className="flex items-center gap-2 text-base font-semibold text-foreground"><Settings2 aria-hidden="true" className="h-4 w-4 text-brand-teal" /> Categories and import helpers</h2>
        <p className="mt-0.5 text-sm text-muted">Manage saved choices without opening a transaction or uploading a file.</p>
      </div>
      <details className="rounded-2xl border border-border bg-surface-base">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green">
          Manage categories, merchants and mappings
          <span aria-hidden="true" className="text-muted">›</span>
        </summary>
        <div className="space-y-5 border-t border-border p-4">
          <CustomCategoryManager
            categories={categories.categories}
            storageAvailable={categories.storageAvailable}
            recoveredFromCorruption={categories.recoveredFromCorruption}
            unsupportedVersion={categories.unsupportedVersion}
            notice={categories.notice}
            onRename={categories.rename}
            onArchiveChange={categories.setArchived}
          />
          <MerchantRuleManager
            data={merchantData}
            storageAvailable
            recoveredFromCorruption={false}
            migrated={false}
            staleReferenceCount={0}
            onDataChange={setMerchantData}
            categoryOptions={categoryOptions}
            onUpdateProfile={(id, input) => setMerchantData((current) => updateMerchantProfile(current, id, input))}
            onRenameAlias={(id, name, resolution?: MerchantConflictResolution) => setMerchantData((current) => renameMerchantAlias(current, id, name, resolution))}
            onAliasActiveChange={(id, active) => setMerchantData((current) => setMerchantAliasActive(current, id, active))}
            onDeleteAlias={(id) => setMerchantData((current) => deleteMerchantAlias(current, id))}
            onRuleActiveChange={(id, active) => setMerchantData((current) => setMerchantRuleActive(current, id, active))}
            onDeleteRule={(id) => setMerchantData((current) => deleteMerchantRule(current, id))}
            onClear={() => setMerchantData(emptyLocalMerchantData())}
          />
          <SavedMappingAdministration />
        </div>
      </details>
    </section>
  );
}
