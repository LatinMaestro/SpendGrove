export const BROWSER_LOCAL_PROTOTYPE_STORAGE_KEYS = [
  "spendgrove.phase1.settings",
  "spendgrove.phase1.transactions.v1",
  "spendgrove.phase1.import-history.v1",
  "spendgrove.phase1.merchant-rules.v1",
  "spendgrove.phase2.custom-categories.v2",
  "spendgrove.phase2.import-profiles.v1",
  "spendgrove.phase2.merchant-rules.v2",
] as const;

export type ReadOnlyBrowserStorage = Pick<Storage, "getItem">;

export function hasBrowserLocalPrototypeData(storage: ReadOnlyBrowserStorage) {
  return BROWSER_LOCAL_PROTOTYPE_STORAGE_KEYS.some((key) => storage.getItem(key) !== null);
}
