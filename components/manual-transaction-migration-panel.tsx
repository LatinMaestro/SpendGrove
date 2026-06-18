"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { CloudUpload, ShieldCheck } from "lucide-react";
import {
  clearDeviceManualTransactionsAfterMigration,
  migrateAccountManualTransactions,
} from "@/lib/account-manual-transaction-migration";
import { loadManualTransactionsFromStorage } from "@/lib/manual-transaction-storage";
import { listActiveManualTransactions, type ManualTransaction } from "@/lib/manual-transactions";

export function ManualTransactionMigrationPanel() {
  const { isLoaded, isSignedIn } = useUser();
  const [localTransactions, setLocalTransactions] = useState<ManualTransaction[]>([]);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [recoveredFromCorruption, setRecoveredFromCorruption] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [message, setMessage] = useState("");
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    const loaded = loadManualTransactionsFromStorage(window.localStorage);
    setLocalTransactions(listActiveManualTransactions(loaded.transactions));
    setStorageAvailable(loaded.storageAvailable);
    setRecoveredFromCorruption(loaded.recoveredFromCorruption);
  }, []);

  async function migrateTransactions() {
    if (isMigrating || localTransactions.length === 0) return;
    const confirmed = window.confirm(
      `Move ${localTransactions.length} manual transaction${localTransactions.length === 1 ? "" : "s"} saved on this device to your SpendGrove account? Only your manually entered fields will be sent. No CSV content or bank identifiers are included.`,
    );
    if (!confirmed) return;

    setIsMigrating(true);
    setMessage("");
    const result = await migrateAccountManualTransactions(localTransactions);
    setIsMigrating(false);
    if (!result.ok) {
      setMessage(`${result.error} Your device copy was kept.`);
      return;
    }

    const cleared = clearDeviceManualTransactionsAfterMigration(window.localStorage, result);
    setStorageAvailable(cleared);
    setLocalTransactions([]);
    setMigrationComplete(true);
    setMessage(
      `Moved ${result.importedCount} manual transaction${result.importedCount === 1 ? "" : "s"} to your account${result.skippedCount ? `; ${result.skippedCount} already existed or was inactive` : ""}.${cleared ? " The device copy was cleared." : " The account move succeeded, but the device copy could not be cleared."}`,
    );
  }

  if (!isLoaded || !isSignedIn) return null;
  if (localTransactions.length === 0 && !recoveredFromCorruption && !migrationComplete) return null;

  const expenseCount = localTransactions.filter((transaction) => transaction.type === "EXPENSE").length;
  const incomeCount = localTransactions.filter((transaction) => transaction.type === "INCOME").length;
  const transferCount = localTransactions.filter((transaction) => transaction.type === "TRANSFER").length;

  return (
    <section className="rounded-[2rem] border border-brand-green bg-surface-mint p-5 sm:p-6" aria-labelledby="manual-migration-heading">
      <div className="flex items-start gap-3"><CloudUpload aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" /><div><p className="text-sm font-semibold text-brand-teal">Device-to-account migration</p><h2 id="manual-migration-heading" className="mt-1 text-xl font-bold text-brand-deepTeal">Move saved manual transactions</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">This is optional and requires confirmation. SpendGrove sends only validated manual entries; CSV files, filenames, raw bank descriptions and private banking identifiers are excluded.</p></div></div>
      {localTransactions.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Total", localTransactions.length], ["Expenses", expenseCount], ["Income", incomeCount], ["Transfers", transferCount]].map(([label, value]) => <div key={label} className="rounded-2xl bg-white p-3"><p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-teal">{label}</p><p className="mt-1 text-xl font-bold text-brand-deepTeal">{value}</p></div>)}</div>}
      {recoveredFromCorruption && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Unreadable device transactions were ignored. No unsafe content will be sent.</p>}
      {!storageAvailable && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Browser storage is unavailable, so the device copy may need to be cleared later.</p>}
      {localTransactions.length > 0 && <button type="button" disabled={isMigrating} onClick={migrateTransactions} className="mt-4 min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{isMigrating ? "Moving manual transactions…" : `Review and move ${localTransactions.length} transaction${localTransactions.length === 1 ? "" : "s"}`}</button>}
      {message && <div role="status" className="mt-4 flex items-start gap-2 rounded-2xl bg-white p-4"><ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" /><div><p className="text-sm font-semibold text-brand-deepTeal">{message}</p>{migrationComplete && <button type="button" onClick={() => window.location.reload()} className="mt-3 min-h-10 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal">Reload account transactions</button>}</div></div>}
    </section>
  );
}
