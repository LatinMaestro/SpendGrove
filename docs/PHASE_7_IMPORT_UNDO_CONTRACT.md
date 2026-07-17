# Phase 7 Import Undo and Recovery Contract and Schema Assessment

Status: exact documentation gate; implementation and migration blocked  
Prepared: 17 July 2026  
Proposed migration: `20260717110000_phase_7_import_undo_foundation`

## Objective

Allow a user to undo one completed everyday transaction import safely, while preserving review evidence, later user changes, ownership, links, reconciliation and recoverability.

Import undo is not deletion of the source CSV: raw CSV content is not stored.

## Repository truth

- `ImportBatch` and `ImportRow` preserve safe completed outcomes.
- Imported rows point to created imported transactions; merged rows point to pre-existing manual transactions.
- Skip creates no transaction. Merge does not rewrite the target transaction.
- Imported transactions can later be edited, split, linked to Property, reconciled to a Loan repayment or linked to another transfer.
- Current import history is read-only and safely owner-scoped.
- Current records do not store an immutable committed transaction version suitable for concurrency-safe historical undo.
- Existing imports therefore cannot be made undoable safely without a backfill, which is not authorised.

## Initial eligibility

The first version applies only to completed everyday `TRANSACTION_CSV` batches created after the schema and implementation are active.

A batch is eligible when:

- it is owned, completed and not deleted;
- it has no existing undo operation;
- every imported row has a recorded `committedTransactionUpdatedAt`;
- the request is explicitly confirmed by the user.

Per-row revalidation determines partial outcomes. Skip and Merge rows are recorded as no change. A merged manual transaction is never altered by import undo.

## Imported transaction undo

An imported row may be undone only when its committed transaction:

- is owned by the same user;
- is still `IMPORTED`, active and non-deleted;
- still belongs to the same import batch and import row;
- has the exact recorded `updatedAt`;
- remains unsplit;
- has no active Loan reconciliation link;
- has no active durable transfer link;
- has no later Property report review;
- has no later bulk-operation dependency;
- has no later Property link change.

An unchanged Property link created by the original import may remain attached while the transaction is soft-deleted, so restoring the import restores the accepted Property context. Any later unlink/relink or Property review blocks that item.

Undo sets the transaction to the existing recoverable deleted state and records the exact applied version. It does not hard-delete the transaction, import rows, batch, audit events, merchant records or links.

## Partial results

Items are independent:

- eligible imported rows become `UNDONE`;
- Skip and Merge rows become `NO_CHANGE`;
- changed or linked rows become `BLOCKED`;
- unexpected safe failures become `FAILED`.

The operation becomes `UNDONE`, `PARTIAL` or `FAILED` from item outcomes. A successful item is not rolled back because another item is blocked.

No failed financial mutation is retried automatically.

## Restore import

A completed/partial undo may be restored once.

Restore reauthorizes the user and each item. It restores only transactions that:

- were undone by this exact operation;
- remain in the exact deleted state/version written by undo;
- have not been independently restored or changed;
- remain ownership- and relation-compatible.

Eligible items become `RESTORED`; stale items become `RESTORE_BLOCKED`. The operation becomes `RESTORED` or `PARTIALLY_RESTORED`.

Individual transaction Restore must not bypass this operation. The UI directs an import-undone transaction to `Restore import` so batch state remains truthful.

A second undo cycle is deferred; users may use normal transaction corrections after restore.

## Exact Prisma enum additions

```prisma
enum ImportUndoOperationStatus {
  RUNNING
  UNDONE
  PARTIAL
  FAILED
  RESTORING
  RESTORED
  PARTIALLY_RESTORED
}

enum ImportUndoItemStatus {
  PENDING
  UNDONE
  NO_CHANGE
  BLOCKED
  FAILED
  RESTORED
  RESTORE_BLOCKED
}

enum ImportUndoReason {
  SKIPPED_ROW
  MERGED_ROW_NO_CHANGE
  EXISTING_BATCH_UNSUPPORTED
  TRANSACTION_NOT_ACTIVE
  TRANSACTION_CHANGED
  SPLIT_CHANGED
  ACTIVE_LOAN_RECONCILIATION
  ACTIVE_TRANSFER_LINK
  PROPERTY_STATE_CHANGED
  PROPERTY_REVIEW_EXISTS
  BULK_OPERATION_DEPENDENCY
  OWNERSHIP_OR_LINK_MISMATCH
  RESTORE_STATE_CHANGED
  UNEXPECTED_SAFE_FAILURE
}
```

Add to `AuditEntityType`:

```prisma
IMPORT_UNDO_OPERATION
```

## Exact Prisma field and relation additions

```prisma
model User {
  importUndoOperations ImportUndoOperation[]
  importUndoItems      ImportUndoItem[]
}

model ImportBatch {
  undoOperation ImportUndoOperation?
}

model ImportRow {
  committedTransactionUpdatedAt DateTime?
  undoItems                     ImportUndoItem[]
}

model Transaction {
  importUndoItems ImportUndoItem[]
}
```

## Exact Prisma models

```prisma
model ImportUndoOperation {
  id                 String                    @id @default(cuid())
  userId             String
  importBatchId      String                    @unique
  status             ImportUndoOperationStatus @default(RUNNING)
  requestedCount     Int                       @default(0)
  undoneCount        Int                       @default(0)
  noChangeCount      Int                       @default(0)
  blockedCount       Int                       @default(0)
  failedCount        Int                       @default(0)
  restoredCount      Int                       @default(0)
  restoreBlockedCount Int                      @default(0)
  createdAt          DateTime                  @default(now())
  completedAt        DateTime?
  restoredAt         DateTime?
  updatedAt          DateTime                  @updatedAt

  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  importBatch ImportBatch      @relation(fields: [importBatchId], references: [id], onDelete: Restrict)
  items       ImportUndoItem[]

  @@index([userId, status, createdAt])
  @@index([userId, createdAt])
}

model ImportUndoItem {
  id                         String               @id @default(cuid())
  userId                     String
  operationId                String
  importRowId                String
  transactionId              String?
  status                     ImportUndoItemStatus @default(PENDING)
  reason                     ImportUndoReason?
  beforeTransactionUpdatedAt DateTime?
  appliedTransactionUpdatedAt DateTime?
  undoneAt                   DateTime?
  restoredAt                 DateTime?
  createdAt                  DateTime             @default(now())
  updatedAt                  DateTime             @updatedAt

  user        User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  operation   ImportUndoOperation @relation(fields: [operationId], references: [id], onDelete: Cascade)
  importRow   ImportRow           @relation(fields: [importRowId], references: [id], onDelete: Restrict)
  transaction Transaction?        @relation(fields: [transactionId], references: [id], onDelete: Restrict)

  @@unique([operationId, importRowId])
  @@index([userId, status, createdAt])
  @@index([operationId, status])
  @@index([transactionId])
}
```

## Commit-path addition

For new IMPORT rows only, the import transaction must record the created Transaction `updatedAt` into `ImportRow.committedTransactionUpdatedAt` inside the same database transaction.

Because current bulk `createMany` does not return generated timestamps, implementation must either:

- supply one explicit `now` value to both created records; or
- use bounded creates that return the transaction version.

No raw value or private source field is added. Existing rows remain null and are reported as `Existing import cannot be safely undone`.

No backfill is proposed.

## Migration SQL assessment

The exact future migration must:

1. add `IMPORT_UNDO_OPERATION` to `AuditEntityType`;
2. create the three enums above;
3. add nullable `committedTransactionUpdatedAt TIMESTAMP(3)` to `ImportRow`;
4. create empty `ImportUndoOperation` and `ImportUndoItem` tables;
5. create the unique operation-per-batch and operation/item constraints;
6. create all listed indexes and foreign keys.

The nullable column is additive and requires no default or row rewrite. No existing ImportRow is updated. New tables must contain zero rows after migration.

## Privacy and audit

The operation journal stores IDs, safe statuses/reasons and timestamps only. It must not store amounts, dates, categories, descriptions, merchant text, notes, Property details, filenames, raw rows, account references or bank identifiers.

Audit events use `IMPORT_UNDO_OPERATION` with CREATED/UPDATED and aggregate counts only.

## Financial and relation safety

- No amount, date, type, category, split or calculation formula changes.
- Undo uses the existing soft-delete status, so deleted imported transactions leave spending/budget/report queries.
- Merge targets are untouched.
- Loan repayment links, transfer links, later splits, later Property review and bulk-operation dependencies block the affected item.
- The everyday transaction remains the sole cashflow record.
- Restore returns the same record; it never creates a replacement transaction.

## Export, deletion and retention

Account export includes operation ID, batch ID, status, safe counts and lifecycle timestamps. It excludes item-level internal IDs unless later portability review requires them.

Account deletion must cascade through user ownership and prove no Restrict relation blocks deletion. Import history and undo evidence remain until account deletion or a separately approved retention policy.

## API and UI boundary

Recommended routes:

- `POST /api/account/import-history/[batchId]/undo`
- `POST /api/account/import-history/[batchId]/restore`
- `GET /api/account/import-history/[batchId]/undo-status`

Import history shows `Undo import` only for eligible batches. Confirmation states that imported transactions will leave active views, while Skip and Merge outcomes stay unchanged. Blocked items use safe plain-English reasons.

## Tests required after the schema gate

- owner isolation and direct-ID attacks;
- completed everyday batch requirement;
- new-versus-existing batch eligibility;
- Import, Skip and Merge outcomes;
- exact version concurrency;
- split/edit/delete/restore conflicts;
- Loan reconciliation, transfer, Property review/link and bulk-operation dependencies;
- partial success and idempotency;
- no automatic retry;
- restore exact-state checks;
- no duplicate transaction creation;
- calculations exclude undone rows and recover after restore;
- account export/deletion;
- safe audit and operation metadata.

## Preview and Production gates

No schema or migration file is authorised while the isolated Preview Neon destination remains unresolved. This migration must follow the pending Phase 6 bulk migration and the transfer-link migration in exact order.

After the operator gate is proven:

1. create a focused schema/migration-file PR;
2. update the Preview checker for the exact migration profile;
3. stop before migration;
4. run Preview only with proven Preview-only secrets;
5. verify existing counts unchanged and new tables empty;
6. require a separate Production migration approval and recovery proof.

## Rollback and forward-fix

Before data use in isolated Preview, rollback may drop the two new tables, drop the nullable ImportRow column and drop the three new enum types. Do not remove an AuditEntityType value from a live database; prefer forward-fix. No rollback SQL or Production operation is authorised now.

## Packages and providers

None.

## Stop conditions

Stop before backfilling old imports, hard deletion, changing Merge semantics, cascading through later links, supporting repeated undo cycles, migrating any database, changing financial rules, or accessing private Production data.
