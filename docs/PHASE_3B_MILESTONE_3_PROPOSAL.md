# Phase 3B Milestone 3 Proposal - Repayment Corrections and Duplicate Re-import Safety

Status: proposed only; awaiting explicit client approval

Date prepared: 30 June 2026

## Approval boundary

This document proposes the next small Phase 3B milestone after formal closure of Milestone 2. It does not authorise implementation. No code, schema change or migration may begin until the client explicitly approves this objective, task sequence and stop conditions.

## Proposed objective

Let users safely correct structured repayment breakdowns after commit, deliberately handle likely duplicate loan CSV rows on re-import or overlapping files, and clean up repayment history without changing the accepted reconciliation, privacy or no-double-count rules.

The milestone should improve correction and recovery before any reports or dashboard work. Everyday transactions remain the only cashflow/spending records; repayment records remain analytical breakdowns.

## Recommended PR-sized task breakdown

### PR 3B.9 - Correction and duplicate-safety contract

Goal: freeze the user-visible and server-side rules before implementation.

Proposed rules:

- Only structured fields may be corrected: repayment date, total, principal, interest, fees and optional balance after.
- Existing integer-cent, missing-versus-zero and two-cent component reconciliation rules remain unchanged.
- Loan Account ownership, source and import lineage cannot be moved or rewritten through correction.
- An actively linked repayment must be unlinked before any financial or date field can be edited. Correction must never silently retain or remove a reconciliation link.
- Correction updates the current repayment record and writes an audit event containing changed-field codes only; old/new amounts, balances and dates are not copied into audit metadata.
- Duplicate assessment uses only the owning Loan Account and reviewed structured repayment values. It stores no fingerprint, source row, narration or filename.
- A likely duplicate requires the same Loan Account, repayment date, total and exact principal/interest/fee/balance tuple, including matching missing values. It is warning-only and default-excluded. Saving it anyway requires a deliberate per-row confirmation.
- A same-date/same-total row with a different or incomplete component tuple is shown as a possible overlap for review, but it is not default-excluded as a likely duplicate.
- Cleanup uses archive/restore only. No hard delete is introduced.

Stop condition: stop if the client wants automatic unlinking, immutable financial revision history, different component rules, automatic duplicate merging/deletion or any change to accepted reconciliation tolerances.

### PR 3B.10 - Safe repayment correction

Goal: let a signed-in user correct one owned repayment breakdown safely.

Scope:

- Add an edit action from repayment detail for unmatched, non-deleted records.
- Pre-fill only the approved structured fields.
- Validate ownership, active Loan Account, integer cents, date and component consistency on the server.
- Use the existing `updatedAt` value as a stale-edit check so a changed record is not overwritten silently.
- Require unlink-before-edit for actively linked repayments.
- Preserve source and import lineage.
- Write only safe changed-field codes to audit metadata.
- Refresh history and reconciliation suggestions after a successful correction.
- Add authentication, ownership, stale-write, linked-record, validation, audit-privacy and no-double-count regression tests.

Stop condition: stop if safe correction requires a new version table, revision payload, durable old values, schema field or migration.

### PR 3B.11 - Deliberate duplicate loan re-import safeguards

Goal: warn before saving structured repayments that likely already exist for the selected Loan Account.

Scope:

- Compare reviewed browser-local rows with existing owned, non-deleted repayments using structured date/amount/component context only.
- Classify exact structured tuples as likely duplicates and same-date/same-total but non-exact tuples as possible overlaps; do not introduce fuzzy scoring.
- Include archived existing repayments in duplicate assessment so archiving does not make an accidental re-import look new.
- Detect likely duplicates within the current reviewed file or overlapping browser-local files before commit.
- Show the matching reason in safe terms such as same date and reviewed amounts, without narration, filename or account reference.
- Default likely duplicates to excluded.
- Allow deliberate `Save anyway` only after per-row confirmation.
- Re-check likely duplicates atomically at commit time to protect against stale review state.
- Keep retry idempotency for the frozen request unchanged.
- Persist only the accepted repayment; do not persist a fingerprint, candidate snapshot or raw duplicate evidence.
- Audit aggregate duplicate-warning and override counts only, without financial values.
- Add exact-match, partial-component, archived-record, overlap, override, concurrent-commit, ownership and privacy tests.

Stop condition: stop if a reliable warning needs fuzzy narration matching, a persisted content hash/fingerprint, raw source data, new uniqueness constraints or changed financial tolerances.

### PR 3B.12 - Safer repayment cleanup flows

Goal: make correction and cleanup understandable without destructive deletion.

Scope:

- Improve active/archived repayment filtering and status copy.
- Preserve individual archive/restore.
- Add bounded multi-select archive/restore for at most 100 owned repayments per confirmed action.
- Require explicit confirmation and report changed/skipped counts.
- Reject cross-user or deleted selections; skip newly linked or stale archive selections safely and report aggregate changed/skipped counts.
- Never alter or delete an everyday transaction during correction or cleanup.
- Keep archived repayment context out of spending/income totals.
- Add mobile, accessibility, ownership, partial-failure and no-double-count tests.

Stop condition: stop before hard delete, batch deletion, automatic unlinking or any cleanup that would remove import lineage or reconciliation evidence.

### PR 3B.13 - Milestone 3 QA and client review package

Goal: verify the approved correction and duplicate-safety slice, then stop for client retesting.

Scope:

- Run the full test suite, type-check and production build.
- Verify Vercel Preview and merged-main deployments.
- Verify correction, stale-edit, unlink-before-edit, duplicate warning/default exclusion, deliberate override, archive/restore and no-double-count flows.
- Re-audit schema, migration, privacy, logging and raw-source boundaries.
- Update the permanent handoff and Milestone 3 summary.
- Provide a synthetic-data client testing checklist.
- Stop before reports, dashboard work, another milestone or Phase 4.

## Scope inclusions

- Editing approved structured fields on an owned committed repayment.
- Stale-edit protection using the existing `updatedAt` field.
- Unlink-before-edit protection for linked repayments.
- Privacy-safe duplicate warnings against existing repayments and current browser-local review rows.
- Default exclusion plus explicit per-row duplicate override.
- Commit-time duplicate re-check.
- Archive/restore cleanup and, only if safely bounded, multi-select archive.
- Safe audit field/reason codes and aggregate counts.
- Synthetic fixtures, ownership tests, mobile review and no-double-count regression coverage.

## Scope exclusions

- Production migration or any unapproved Preview migration.
- Hard deletion of repayments or everyday transactions.
- Automatic unlinking, merging, deletion or correction.
- Automatic duplicate suppression without a visible user decision.
- Persisted raw CSVs, rows, filenames, headers, narration or event text.
- Persisted content fingerprints or private source-detail snapshots.
- Changing reconciliation tolerances, confidence bands or split-loan rules.
- Tax, EOFY, property or accountant reports.
- Automated deductibility decisions or tax advice.
- Home dashboard expense, income, property, loan or net-worth statistics.
- Property profiles or everyday-transaction-to-property tax linking.
- Recurring, subscriptions, budgets, insights or reminders.
- Basiq or live bank connection.
- AI.
- Payments, billing or subscriptions.
- Household mode, accountant workspace or document storage.
- Phase 4 or any later module.
- New package, provider or paid service.

## Expected schema and migration needs

No schema change or migration is expected or recommended.

The existing foundation appears sufficient:

- `LoanRepayment` already stores every correctable structured field and has `updatedAt` for stale-edit protection.
- `isArchived`, `archivedAt` and `deletedAt` already support non-destructive cleanup boundaries.
- `importBatchId` preserves existing safe import lineage.
- `LoanReconciliationLink` already exposes whether unlink-before-edit is required.
- `AuditEntityType.LOAN_REPAYMENT` already supports privacy-safe correction and archive events.
- Existing user/Loan Account/date indexes support scoped duplicate comparison.

Duplicate candidates should be computed from existing structured values and not persisted. No unique constraint is recommended because legitimate same-day same-amount repayments can exist and require a user decision rather than database rejection.

Mandatory schema gate: if implementation requires any new field, table, enum, relation, constraint, index, fingerprint or immutable revision history, stop before editing Prisma or migration SQL and present the exact minimal amendment for approval. Do not run Preview or Production migration without separate approval.

## Privacy and data risks

Key risks:

- leaking old/new financial values through audit metadata or application logs;
- accidentally persisting raw CSV rows, filenames, narration or source headers while explaining a duplicate;
- using account, lender or masked-reference text in duplicate matching;
- exposing another user's repayment as a duplicate candidate;
- storing a durable fingerprint that could become hidden source lineage;
- leaving a stale reconciliation link attached after financial correction;
- allowing a correction or cleanup action to alter the everyday transaction;
- presenting archive as deletion or duplicate warning as certainty.

Controls:

- strict authenticated ownership checks on every read and write;
- structured integer-cent/date/component values only;
- no narration or private identifier matching;
- unlink-before-edit and server-side revalidation;
- stale-write conflict handling;
- warning-only duplicate language with explicit override;
- no persisted candidate evidence or fingerprint;
- safe audit field/reason codes and aggregate counts only;
- synthetic fixtures and privacy-source scans;
- everyday transactions remain unchanged and counted once.

## Reconciliation and no-double-count approach

- Editing is blocked while a repayment has an active reconciliation link.
- The user unlinks first, preserving both the repayment and everyday transaction.
- After correction, the repayment returns to unmatched and existing candidate rules may be run again.
- Link eligibility, confidence bands, manual tolerance and split-loan allocation rules do not change.
- Correction, duplicate assessment, archive and restore never create, edit, delete or duplicate an everyday transaction.
- Repayment breakdowns remain excluded from spending, income and cashflow totals.

## Vercel and client review points

Each user-facing PR should have a green Vercel Preview and synthetic-data review notes. Client review after PR 3B.13 should confirm:

1. An unmatched repayment can be edited with clear structured validation.
2. A stale edit is rejected safely rather than overwriting newer data.
3. A linked repayment explains that it must be unlinked before editing.
4. Unlink, edit and later relink preserve the everyday transaction unchanged.
5. Re-importing the same synthetic loan CSV warns and defaults likely duplicates to excluded.
6. An overlapping CSV warns only on the overlapping structured repayments.
7. `Save anyway` is deliberate, per-row and clearly distinguished from normal save.
8. Archived repayments still protect against accidental duplicate re-import.
9. Archive/restore cleanup is understandable and never presented as hard deletion.
10. No narration, filename, account reference or private identifier appears.
11. No extra everyday transaction or spending total is created.
12. Phone-sized correction, warning and cleanup flows remain usable.

The Vercel Preview may use synthetic data only. Signed-in mutation testing remains in the client's protected account session.

## Stop conditions requiring client approval

Stop and request approval if:

- any Prisma schema or migration amendment is needed;
- any Preview migration becomes necessary;
- any Production migration is proposed;
- linked-repayment correction cannot safely use unlink-before-edit;
- correction would need durable old values or immutable revision history;
- duplicate matching needs narration, filenames, private identifiers, fuzzy text or a persisted fingerprint;
- duplicate thresholds or reconciliation tolerances need to change;
- same-day/same-amount legitimate repayments cannot remain user-resolvable;
- cleanup would require hard delete, automatic unlink or loss of lineage;
- idempotent commit or no-double-count behaviour would weaken;
- cross-user data could enter correction or duplicate results;
- raw source data or financial values would enter logs/audit metadata;
- tax/EOFY/property/accountant reports, deductibility conclusions or tax advice appear;
- Home dashboard statistics, recurring, budgets, Basiq, AI, payments, Phase 4 or later modules appear;
- a new package, provider, paid service, secret or environment change is proposed.

## Client approval required

Approve, revise or decline this Milestone 3 proposal. Do not begin PR 3B.9 or any implementation until explicit approval is recorded.
