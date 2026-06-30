# Phase 3B Milestone 3 Correction and Duplicate-Safety Contract

Status: approved by the client on 30 June 2026

## Purpose

This contract controls repayment correction, duplicate re-import assessment and cleanup in Phase 3B Milestone 3. It extends the accepted financial contract without changing repayment component rules, reconciliation tolerances, no-double-count treatment or privacy boundaries.

## Correction fields and invariants

Only these structured `LoanRepayment` fields may be corrected:

- repayment date;
- total payment in integer cents;
- principal in integer cents or missing;
- interest in integer cents or missing;
- fees in integer cents or missing;
- balance after in integer cents or missing.

The following cannot be changed through repayment correction:

- authenticated owner;
- Loan Account;
- source;
- import batch lineage;
- reconciliation link or reconciliation method;
- archive/deletion state.

Existing rules remain unchanged:

- amounts use integer cents;
- repayment total is positive;
- components are non-negative;
- missing remains distinct from zero;
- known components cannot exceed total by more than two cents;
- when principal, interest and fees are all supplied, their total must reconcile to the repayment total within two cents;
- correction does not update the Loan Account balance automatically.

## Correction state and concurrency

- Only owned, active, unmatched and non-deleted repayments may be edited.
- An archived repayment must be restored before editing.
- An actively linked repayment must be unlinked before editing. No link is silently retained, removed or rewritten.
- The owning Loan Account must remain active and owned by the same user.
- The client sends the repayment's existing `updatedAt` value as a stale-edit token.
- The server re-checks ownership, repayment state, Loan Account state, reconciliation state and `updatedAt` inside the write boundary.
- A stale or newly linked repayment is rejected for refresh; it is not overwritten.
- Successful correction leaves the repayment unmatched and preserves source/import lineage.

## Correction audit boundary

Correction writes one `LOAN_REPAYMENT` / `UPDATED` audit event.

Audit metadata may contain only:

- `changedFieldCodes`, selected from `REPAYMENT_DATE`, `TOTAL_PAYMENT`, `PRINCIPAL`, `INTEREST`, `FEES`, `BALANCE_AFTER`;
- a safe state code such as `CORRECTED` if needed.

Audit metadata must not contain old/new dates, amounts, balances, nicknames, Loan Account labels, source values, filenames, narration, row data or private identifiers.

## Duplicate classifications

Duplicate assessment is scoped to one authenticated user and one owning Loan Account.

The structured comparison tuple is:

- repayment date;
- total payment;
- principal;
- interest;
- fees;
- balance after.

`null` is a value in the tuple and must match `null` for an exact tuple match.

Classifications:

- **Likely duplicate:** same Loan Account and exact structured tuple. This includes an existing active or archived, non-deleted repayment, or an earlier reviewed row in the current browser-local review set.
- **Possible overlap:** same Loan Account, repayment date and total payment, but a different or incomplete principal/interest/fee/balance tuple.
- **No duplicate signal:** date or total differs.

No fuzzy text, narration, filename, lender name, account reference, private identifier or date/amount tolerance is used.

## Duplicate review and commit rules

- Likely duplicates are warnings, never automatic merges or deletions.
- Likely duplicates are default-excluded from save.
- The user may choose `Save anyway` only through a visible per-row confirmation.
- Possible overlaps remain visible for review and are not default-excluded as likely duplicates.
- Deleted repayments do not participate; archived non-deleted repayments do participate.
- The browser keeps current-file candidate detail transient.
- The server may return only safe row identifiers/indexes, classification and structured reason codes needed for review.
- The server re-checks selected rows against current durable repayments at commit time.
- If a selected row becomes a likely duplicate and lacks explicit override confirmation, the atomic commit is rejected for refreshed review; the server does not silently alter the requested saved/excluded counts.
- A retry of an already completed frozen request returns its original result before duplicate assessment, preserving accepted idempotency.
- Explicit duplicate override is request-only and is not stored as a fingerprint or candidate snapshot.
- Audit metadata may contain aggregate warning/override counts only, never structured financial values.

## Cleanup rules

- Cleanup remains archive/restore only; no hard delete is added.
- Individual archive/restore remains supported.
- A confirmed bulk archive/restore request is capped at 100 owned repayment IDs.
- Cross-user or deleted selections reject the request without revealing record details.
- Newly linked or stale archive selections are skipped safely and included only in aggregate changed/skipped counts.
- Archive never unlinks automatically and never edits or deletes an everyday transaction.
- Restore preserves source, import lineage and any historical unlinked reconciliation evidence.
- Archived repayments remain analytical records and do not enter spending/income totals.

## Privacy and logging boundary

Do not persist or log:

- raw CSV files or bytes;
- raw rows or source headers;
- original filenames;
- narration or raw loan event text;
- duplicate fingerprints or private candidate snapshots;
- account identifiers, BSBs, card fragments, customer IDs, loan references, masked references or exact addresses;
- old/new financial values, balances or dates in audit metadata;
- secrets or connection strings.

Every correction, duplicate and cleanup operation must be authenticated, owner-scoped and covered by synthetic tests.

## No-double-count boundary

- Everyday transactions remain the only cashflow/spending records.
- Loan repayments remain analytical breakdowns.
- Correction, duplicate assessment, archive and restore never create, update, delete or duplicate an everyday transaction.
- Reconciliation confidence bands, manual tolerance, split-loan allocation and user-confirmed link/unlink rules remain unchanged.

## Schema and migration boundary

The existing schema is sufficient and no migration is authorised. Stop before implementation if any new field, table, enum, relation, index, constraint, fingerprint, version table, revision history or Preview/Production migration is required.
