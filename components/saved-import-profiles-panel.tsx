"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, CheckCircle2, Cloud, Pencil, RotateCcw, Save, Trash2 } from "lucide-react";
import {
  createAccountSavedImportProfile,
  deleteAccountSavedImportProfile,
  listAccountSavedImportProfiles,
  migrateAccountSavedImportProfiles,
  resetAccountSavedImportProfiles,
  updateAccountSavedImportProfile,
} from "@/lib/account-saved-import-profiles";
import type { CsvScanResult, TransientCsvDocument } from "@/lib/csv-import";
import {
  createSafeImportProfileContract,
  type ImportProfileAccountType,
} from "@/lib/import-profile-contract";
import {
  addSavedImportProfile,
  applySavedImportProfile,
  createSavedImportProfile,
  deleteSavedImportProfile,
  loadSavedImportProfilesFromStorage,
  markSavedImportProfileUsed,
  matchSavedImportProfiles,
  renameSavedImportProfile,
  resetSavedImportProfilesInStorage,
  saveSavedImportProfilesToStorage,
  setSavedImportProfileEnabled,
  type SavedImportProfile,
} from "@/lib/saved-import-profiles";

const accountTypeOptions: Array<{ value: ImportProfileAccountType; label: string }> = [
  { value: "EVERYDAY_TRANSACTION", label: "Everyday account" },
  { value: "SAVINGS", label: "Savings account" },
  { value: "CREDIT_CARD", label: "Credit card" },
  { value: "OFFSET", label: "Offset account" },
  { value: "UNKNOWN", label: "Other / not sure" },
];

function inferredBankName(scan: CsvScanResult) {
  const bankName = scan.profile.bankName;
  if (/unknown|generic|headerless|custom/i.test(bankName)) return "";
  return bankName;
}

export function SavedImportProfilesPanel({
  document,
  scan,
  mappingConfirmed,
  onApplyScan,
}: {
  document: TransientCsvDocument;
  scan: CsvScanResult;
  mappingConfirmed: boolean;
  onApplyScan: (scan: CsvScanResult) => void;
}) {
  const [profiles, setProfiles] = useState<SavedImportProfile[]>([]);
  const [storageMode, setStorageMode] = useState<"loading" | "account" | "device">("loading");
  const [profileName, setProfileName] = useState("");
  const [bankName, setBankName] = useState(() => inferredBankName(scan));
  const [accountType, setAccountType] = useState<ImportProfileAccountType>("UNKNOWN");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loaded = loadSavedImportProfilesFromStorage(window.localStorage);
    setProfiles(loaded.profiles);
    setStorageAvailable(loaded.storageAvailable);
    if (!loaded.storageAvailable) setNotice("Browser storage is unavailable. You can still continue without saving this mapping.");
    else if (loaded.unsupportedVersion) setNotice("Saved mappings from a newer app version were ignored for safety.");
    else if (loaded.recoveredFromCorruption) setNotice("An unreadable saved mapping was ignored safely.");
    else if (loaded.migrated) saveSavedImportProfilesToStorage(window.localStorage, loaded.profiles);

    async function loadAccountProfiles() {
      try {
        const result = await listAccountSavedImportProfiles();
        if (cancelled) return;
        if (!result.ok) {
          setStorageMode("device");
          return;
        }

        let accountProfiles = result.profiles;
        if (loaded.profiles.length > 0 && window.confirm(
          `Move ${loaded.profiles.length} saved mapping${loaded.profiles.length === 1 ? "" : "s"} from this device to your SpendGrove account? The device copy will be removed only after the move succeeds.`,
        )) {
          const migration = await migrateAccountSavedImportProfiles(loaded.profiles);
          if (cancelled) return;
          if (migration.ok) {
            accountProfiles = migration.profiles;
            const cleared = resetSavedImportProfilesInStorage(window.localStorage);
            setStorageAvailable(cleared);
            setNotice(`Moved ${migration.importedCount ?? 0} saved mapping${migration.importedCount === 1 ? "" : "s"} to your account${migration.skippedCount ? `; ${migration.skippedCount} already existed` : ""}.`);
          } else {
            setNotice(`${migration.error} Your device copy was kept.`);
          }
        }

        setProfiles(accountProfiles);
        setStorageMode("account");
      } catch {
        if (!cancelled) setStorageMode("device");
      }
    }

    void loadAccountProfiles();
    return () => { cancelled = true; };
  }, []);

  const matches = useMemo(() => matchSavedImportProfiles(profiles, scan), [profiles, scan]);

  function persistDevice(nextProfiles: SavedImportProfile[], successNotice: string) {
    setProfiles(nextProfiles);
    if (!saveSavedImportProfilesToStorage(window.localStorage, nextProfiles)) {
      setStorageAvailable(false);
      setNotice("Browser storage is unavailable. You can still continue without saving this mapping.");
      return false;
    }
    setStorageAvailable(true);
    setNotice(successNotice);
    return true;
  }

  function useProfile(profile: SavedImportProfile) {
    setError("");
    try {
      const appliedScan = applySavedImportProfile(document, profile);
      const nextProfiles = markSavedImportProfileUsed(profiles, profile.id);
      if (storageMode === "account") {
        const previous = profiles;
        setProfiles(nextProfiles);
        void updateAccountSavedImportProfile(profile.id, { markUsed: true }).then((result) => {
          if (result.ok) setProfiles(result.profiles);
          else { setProfiles(previous); setNotice(result.error); }
        }).catch(() => { setProfiles(previous); setNotice("The last-used time could not be saved to your account."); });
      } else {
        persistDevice(nextProfiles, "Saved mapping updated.");
      }
      onApplyScan(appliedScan);
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "This saved mapping could not be used.");
    }
  }

  function saveCurrentMapping() {
    setError("");
    try {
      const contract = createSafeImportProfileContract({
        displayName: profileName,
        bankName: bankName.trim() || undefined,
        accountType,
        scan,
      });
      const savedProfile = createSavedImportProfile({ contract });
      const nextProfiles = addSavedImportProfile(profiles, savedProfile);
      if (storageMode !== "account") {
        if (persistDevice(nextProfiles, "Mapping saved on this device.")) setProfileName("");
        return;
      }

      const previous = profiles;
      setProfiles(nextProfiles);
      setProfileName("");
      setNotice("Saving mapping to your account…");
      void createAccountSavedImportProfile(savedProfile).then((result) => {
        if (result.ok) {
          setProfiles(result.profiles);
          setNotice("Mapping saved to your account.");
        } else {
          setProfiles(previous);
          setNotice(result.error);
        }
      }).catch(() => { setProfiles(previous); setNotice("The mapping could not be saved to your account."); });
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "This mapping could not be saved.");
    }
  }

  function startRename(profile: SavedImportProfile) {
    setEditingId(profile.id);
    setEditingName(profile.contract.displayName);
    setError("");
  }

  function finishRename(profileId: string) {
    setError("");
    try {
      const nextProfiles = renameSavedImportProfile(profiles, profileId, editingName);
      if (storageMode !== "account") {
        if (persistDevice(nextProfiles, "Saved mapping updated.")) {
          setEditingId(null);
          setEditingName("");
        }
        return;
      }

      const previous = profiles;
      setProfiles(nextProfiles);
      setEditingId(null);
      setEditingName("");
      void updateAccountSavedImportProfile(profileId, { displayName: editingName }).then((result) => {
        if (result.ok) { setProfiles(result.profiles); setNotice("Saved mapping renamed in your account."); }
        else { setProfiles(previous); setNotice(result.error); }
      }).catch(() => { setProfiles(previous); setNotice("The saved mapping could not be renamed in your account."); });
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "The saved mapping could not be renamed.");
    }
  }

  function toggleProfile(profile: SavedImportProfile) {
    const nextProfiles = setSavedImportProfileEnabled(profiles, profile.id, !profile.isEnabled);
    if (storageMode !== "account") {
      persistDevice(nextProfiles, "Saved mapping updated.");
      return;
    }
    const previous = profiles;
    setProfiles(nextProfiles);
    void updateAccountSavedImportProfile(profile.id, { isEnabled: !profile.isEnabled }).then((result) => {
      if (result.ok) { setProfiles(result.profiles); setNotice("Saved mapping updated in your account."); }
      else { setProfiles(previous); setNotice(result.error); }
    }).catch(() => { setProfiles(previous); setNotice("The saved mapping could not be updated in your account."); });
  }

  function removeProfile(profile: SavedImportProfile) {
    const nextProfiles = deleteSavedImportProfile(profiles, profile.id);
    if (storageMode !== "account") {
      persistDevice(nextProfiles, "Saved mapping deleted.");
      return;
    }
    const previous = profiles;
    setProfiles(nextProfiles);
    void deleteAccountSavedImportProfile(profile.id).then((result) => {
      if (result.ok) { setProfiles(result.profiles); setNotice("Saved mapping deleted from your account."); }
      else { setProfiles(previous); setNotice(result.error); }
    }).catch(() => { setProfiles(previous); setNotice("The saved mapping could not be deleted from your account."); });
  }

  function resetProfiles() {
    setError("");
    if (storageMode !== "account") {
      if (!resetSavedImportProfilesInStorage(window.localStorage)) {
        setNotice("Browser storage is unavailable.");
        return;
      }
      setProfiles([]);
      setNotice("Saved mappings deleted from this device.");
      return;
    }
    const previous = profiles;
    setProfiles([]);
    void resetAccountSavedImportProfiles().then((result) => {
      if (result.ok) { setProfiles([]); setNotice("Saved mappings deleted from your account."); }
      else { setProfiles(previous); setNotice(result.error); }
    }).catch(() => { setProfiles(previous); setNotice("Saved mappings could not be reset in your account."); });
  }

  const accountBacked = storageMode === "account";

  return (
    <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="saved-mapping-heading">
      <div className="flex items-start gap-3">
        {accountBacked ? <Cloud aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" /> : <Bookmark aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">{accountBacked ? "Saved to your account" : "Saved on this device"}</p>
          <h2 id="saved-mapping-heading" className="mt-1 text-xl font-bold text-brand-deepTeal">Reuse a column mapping</h2>
          <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">
            Saved mappings can skip repetitive setup next time. You can always review or change the columns before continuing.
          </p>
        </div>
      </div>

      {matches.length > 0 && (
        <div className="mt-5 rounded-2xl bg-surface-mint p-4">
          <p className="font-bold text-brand-deepTeal">Use saved mapping</p>
          <p className="mt-1 text-sm text-brand-deepTeal/70">These mappings fit the selected file structure. Apply one, then check the preview below.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {matches.map(({ profile, reason }) => (
              <button key={profile.id} type="button" onClick={() => useProfile(profile)} className="min-h-12 rounded-2xl border border-brand-teal bg-white px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-brand-green">
                <span className="block font-bold text-brand-deepTeal">{profile.contract.displayName}</span>
                <span className="mt-1 block text-xs leading-5 text-brand-deepTeal/65">{reason}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mappingConfirmed && (
        <div className="mt-5 rounded-2xl border border-brand-green/30 bg-surface-mint p-4">
          <p className="flex items-center gap-2 font-bold text-brand-deepTeal"><CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-green" /> Columns confirmed</p>
          <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Save this mapping if you expect to import this type of CSV again.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-brand-deepTeal">Mapping name<input value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Example: Everyday account" className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm font-semibold outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" /></label>
            <label className="text-sm font-bold text-brand-deepTeal">Account type<select value={accountType} onChange={(event) => setAccountType(event.target.value as ImportProfileAccountType)} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm font-semibold outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20">{accountTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="text-sm font-bold text-brand-deepTeal sm:col-span-2">Bank name <span className="font-normal text-brand-deepTeal/60">(optional)</span><input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Example: Australian bank" className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm font-semibold outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" /></label>
          </div>
          <button type="button" onClick={saveCurrentMapping} disabled={!profileName.trim() || (storageMode === "device" && !storageAvailable)} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green disabled:cursor-not-allowed disabled:opacity-45"><Save aria-hidden="true" className="h-4 w-4" /> Save this mapping</button>
          <p className="mt-3 text-xs leading-5 text-brand-deepTeal/60">Only column positions and safe setup details are saved. File names, transaction examples, balances and account details are never included.</p>
        </div>
      )}

      {profiles.length > 0 && (
        <details className="mt-5 rounded-2xl border border-border p-4">
          <summary className="cursor-pointer font-bold text-brand-deepTeal">Manage saved mappings ({profiles.length})</summary>
          <div className="mt-4 space-y-3">
            {profiles.map((profile) => (
              <article key={profile.id} className="rounded-2xl bg-surface-mint p-4">
                {editingId === profile.id ? (
                  <div className="flex flex-col gap-3 sm:flex-row"><input value={editingName} onChange={(event) => setEditingName(event.target.value)} aria-label="Saved mapping name" className="min-h-12 flex-1 rounded-2xl border border-border bg-white px-4 text-sm font-semibold outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" /><button type="button" onClick={() => finishRename(profile.id)} className="min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white">Save name</button></div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-brand-deepTeal">{profile.contract.displayName}</p><p className="mt-1 text-xs text-brand-deepTeal/60">{profile.isEnabled ? "Available for matching" : "Disabled"} · {profile.contract.columnCount} columns</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => startRename(profile)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal"><Pencil aria-hidden="true" className="h-3.5 w-3.5" /> Rename</button><button type="button" onClick={() => toggleProfile(profile)} className="min-h-10 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal">{profile.isEnabled ? "Disable" : "Enable"}</button><button type="button" onClick={() => removeProfile(profile)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-danger-red/40 px-3 text-xs font-bold text-danger-red"><Trash2 aria-hidden="true" className="h-3.5 w-3.5" /> Delete</button></div></div>
                )}
              </article>
            ))}
          </div>
          <button type="button" onClick={resetProfiles} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal"><RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> Reset all saved mappings</button>
        </details>
      )}

      {notice && <p role="status" className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{notice}</p>}
      {error && <p role="alert" className="mt-4 rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
    </section>
  );
}
