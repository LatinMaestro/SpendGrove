import { createHash } from "node:crypto";

export const CONTROLLED_PREVIEW_MIGRATIONS = [
  "20260717090000_phase_6_bulk_operation_foundation",
  "20260717100000_phase_7_transfer_link_foundation",
  "20260717110000_phase_7_import_undo_foundation",
  "20260717120000_phase_9_advanced_personal_finance_foundation",
  "20260717130000_phase_10_household_accountant_foundation",
  "20260717140000_phase_11_document_metadata_foundation",
];

export const CONTROLLED_MIGRATION_BLOB_SHAS = {
  "20260717090000_phase_6_bulk_operation_foundation": "77ef69afd2ca6985cd65e29edf418ba53d6067ab",
  "20260717100000_phase_7_transfer_link_foundation": "e0611a65d7aa05d20afa1961a1c44169f73fa928",
  "20260717110000_phase_7_import_undo_foundation": "3ee4f3b51b0e83d50befae509f7d5d95e11832fb",
  "20260717120000_phase_9_advanced_personal_finance_foundation": "8fe7204f087fd216c9c46b9900b3cdfa46e27182",
  "20260717130000_phase_10_household_accountant_foundation": "8ab54a9e468e3265856fa7dbbdbd06248d263dec",
  "20260717140000_phase_11_document_metadata_foundation": "4c67c8e965fc1c953f788c3563797c2bfbee9998",
};

export function gitBlobSha(content) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return createHash("sha1")
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest("hex");
}

export function exactStringSetMatches(actual, expected) {
  const sortedActual = [...actual].sort();
  const sortedExpected = [...expected].sort();
  return sortedActual.length === sortedExpected.length
    && sortedActual.every((value, index) => value === sortedExpected[index]);
}

export function repositoryMigrationPlan(repositoryMigrationNames) {
  const sorted = [...repositoryMigrationNames].sort();
  if (sorted.length < CONTROLLED_PREVIEW_MIGRATIONS.length) return null;

  const tail = sorted.slice(-CONTROLLED_PREVIEW_MIGRATIONS.length);
  if (tail.some((name, index) => name !== CONTROLLED_PREVIEW_MIGRATIONS[index])) return null;

  return {
    repositoryMigrations: sorted,
    earlierMigrations: sorted.slice(0, -CONTROLLED_PREVIEW_MIGRATIONS.length),
    controlledMigrations: [...CONTROLLED_PREVIEW_MIGRATIONS],
  };
}

export function classifyPreMigrationBaseline({
  migrationTableExists,
  publicTableCount,
  publicEnumCount,
  appliedMigrationNames,
  earlierMigrationNames,
}) {
  if (!migrationTableExists) {
    if (publicTableCount !== 0 || publicEnumCount !== 0 || appliedMigrationNames.length !== 0) {
      return { ok: false, code: "UNEXPECTED_EMPTY_DATABASE_OBJECTS" };
    }
    return { ok: true, mode: "empty", earlierMigrationCount: 0 };
  }

  if (!exactStringSetMatches(appliedMigrationNames, earlierMigrationNames)) {
    return { ok: false, code: "UNEXPECTED_MIGRATION_HISTORY" };
  }

  return {
    ok: true,
    mode: "existing",
    earlierMigrationCount: earlierMigrationNames.length,
  };
}
