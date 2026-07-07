# Phase 3C Milestone 3 Import-Review Property-Linking Contract

Status: approved implementation contract for PR 3C.10

Date: 8 July 2026

## Purpose

Phase 3C Milestone 3 makes the accepted Property reporting workflow easier by letting users link relevant everyday transactions to a Property earlier, especially during CSV import review.

The target workflow is:

1. Upload a bank CSV.
2. Review transactions.
3. Categorise transactions.
4. Link relevant transactions to a Property during review where appropriate.
5. Commit reviewed rows.
6. Property records/reports automatically include linked records later.
7. Loan CSV repayments continue to reconcile to everyday transactions and appear in Property records where the Loan Account belongs to that Property.

This milestone preserves the Phase 3C Milestone 2 rule that Property reports and exports use current eligible linked records automatically without a separate report-only classification step.

## Boundary

This milestone is neutral record keeping only. It does not provide tax advice, automatic deductibility, claimable/deductible percentages, ATO-ready output, accountant certification, tax lodgement workflows, Property profit/loss, Home dashboard statistics, automatic Property matching, allocation/splitting, Basiq, AI, payments, household mode, documents or Phase 4 work.

The original everyday transaction remains the only cashflow record. A Property link is supporting metadata only.

## Eligible import-review rows

An import-review row may carry a pre-commit Property-link intention only when all of these are true:

- the row is in the everyday bank CSV import flow, not a loan CSV flow;
- the row has passed the existing privacy scan and mapping review;
- the row has enough safe reviewed fields to become one committed everyday transaction;
- the row's current action is `Import`;
- the row is not invalid;
- the row is not skipped;
- the row is not a Merge row;
- the row is not a split parent;
- the row would commit as a normal transaction or eligible split child;
- the user explicitly chooses one active owned Property by safe nickname;
- no exact address, raw narration, filename, account reference, balance or private source field is required.

Rows are not linked automatically. The user must choose to include the row in Property records.

## Import, Skip and Merge row behaviour

### Import rows

`Import` rows are eligible for pre-commit Property-link selection when they satisfy the eligibility rules above. On successful commit, SpendGrove creates the transaction first through the existing reviewed import commit path, then creates one active `PropertyTransactionLink` for the newly committed owned transaction.

If transaction creation fails, no Property link is created.

### Skip rows

`Skip` rows do not create a transaction and must never create a Property link. If a user changes a row from `Import` to `Skip`, any transient Property-link selection for that row must be cleared or ignored before commit.

### Merge rows

Merge rows do not create one new future committed transaction. They point at an existing transaction target, so they do not satisfy the Milestone 3 pre-commit rule that one import-review row maps to one future committed transaction.

For this milestone, Merge rows are not eligible for pre-commit Property-link selection. Users can link the existing transaction after the merge through the existing manual Property link flow. A later milestone may propose a deliberate merge-target Property-link flow if needed.

This conservative rule avoids silent relinking, cross-Property conflicts and hidden changes to an existing transaction's supporting metadata.

## One row to one future transaction

For eligible `Import` rows, the transient Property-link selection is tied to the reviewed row's future committed transaction only. The selection is not a durable staging record and must not be persisted as an import-row Property choice.

The durable `PropertyTransactionLink` is created only after:

- the user commits the reviewed import;
- the transaction exists in durable storage;
- the transaction belongs to the authenticated user;
- the transaction remains active, non-deleted and eligible;
- the chosen Property belongs to the authenticated user and is active/non-deleted;
- no active Property link already conflicts with the transaction.

## Split behaviour

- Split parents are display containers and cannot be linked.
- Eligible split children may be linked because they carry the actual category/property meaning and cashflow amount.
- This milestone does not create, rebalance, allocate or split transactions.
- Property linking must not change the split parent or sibling transactions.

If import-review split-child timing cannot be represented safely in the existing commit path, implementation must stop and ask before continuing.

## Manual transaction create/edit support

PR 3C.14 may add the same neutral Property-link control to manual transaction create/edit only if it fits this contract without schema changes or migration.

Allowed behaviour:

- show `Include in property records`;
- let the user choose one active owned Property by safe nickname;
- create or update the `PropertyTransactionLink` only after the manual transaction is saved;
- preserve the existing unlink-before-relink rule;
- preserve the transaction date, amount, merchant/source, category and cashflow treatment;
- use neutral record-keeping wording only.

If manual transaction linking requires schema changes, a migration, new durable staging state or a new conflict model, stop and ask before implementing it.

## User confirmation and copy

Approved neutral wording:

- `Include in property records`
- `Link to property`
- `Property record`
- `This will help this transaction appear in property records later`
- `Record keeping only - not tax advice`

Forbidden wording:

- `tax deductible`
- `deductible`
- `claimable`
- `taxable`
- `ATO-ready`
- `tax-ready`
- `accountant approved`
- `automatically classified for tax`

The UI must make it clear that choosing a Property does not change the transaction's category, amount, date, merchant/source or cashflow treatment.

## Server-side validation

Every durable write must revalidate:

- authenticated user;
- active user context;
- current ownership of the chosen Property;
- active/non-deleted Property state;
- current ownership of the committed transaction;
- active/non-deleted transaction state;
- split-parent exclusion;
- split-child eligibility;
- one active Property link per eligible transaction;
- unlink-before-relink rule;
- no cross-user records;
- no deleted/inactive records;
- no private source data in payloads, logs or audit metadata.

Client-supplied Property IDs, transaction IDs or row identifiers are never trusted without server validation.

## Safe audit and metadata

Audit metadata may contain only safe state/reason/action codes and generated IDs where operationally necessary.

Allowed examples:

- `PROPERTY_LINK_CREATED_FROM_IMPORT_REVIEW`
- `PROPERTY_LINK_SKIPPED_ROW_NOT_IMPORTED`
- `PROPERTY_LINK_SKIPPED_INVALID_ROW`
- `PROPERTY_LINK_SKIPPED_MERGE_ROW`
- `PROPERTY_LINK_CREATED_FROM_MANUAL_TRANSACTION`
- `PROPERTY_LINK_REPLACED_AFTER_USER_CONFIRMATION`

Audit metadata must not contain amounts, balances, dates, merchant descriptions, narration, raw CSV values, filenames, account references, exact addresses, Property nicknames, user emails or private identifiers.

## Rollback and failure behaviour

- If transaction commit fails, no Property link is created.
- If Property link creation fails after the transaction is committed, the transaction remains committed and the user receives a safe aggregate warning that the Property link could not be created.
- The system must not roll back, delete or alter a committed everyday transaction solely because the supporting Property link failed.
- Retrying the same import commit must not duplicate transactions or create duplicate active Property links.
- If a row becomes invalid, skipped, stale, cross-user or ineligible before commit, its Property-link intention is ignored and reported safely.

## No-double-count behaviour

- The everyday transaction remains the only cashflow/spending/income record.
- Creating a Property link does not create another transaction.
- Property reports and exports read current eligible linked everyday transactions.
- Loan repayment breakdowns remain analytical/reconciliation records only.
- A linked imported transaction must appear at most once in a Property report/export.
- Manual and loan-derived paths to the same Property remain provenance, not duplicate rows.

## Privacy boundaries

The import-review Property-linking flow must not persist, log, display beyond the existing safe review UI, or copy into Property-link metadata:

- raw CSV files;
- raw rows;
- original filenames;
- raw narration or source text;
- account identifiers;
- BSBs;
- card fragments;
- customer IDs;
- loan/lender references;
- masked references;
- exact property addresses;
- balances;
- secrets or connection strings.

Transient browser-local selections may use only reviewed row identity, safe action state and the chosen owned Property ID. Durable storage is limited to the existing `PropertyTransactionLink` fields if PR 3C.11 confirms no schema change is needed.

## Schema and migration boundary

Preferred outcome for PR 3C.11:

- no schema change;
- no migration;
- no new staging table;
- no durable import-row Property-choice table;
- no package, provider, secret or environment change;
- create Property links only after transactions are committed and owned by the authenticated user.

Stop and ask before continuing if any schema amendment, Preview migration, Production migration, durable staging state, data rewrite, backfill, table drop, package, provider, secret or environment change is required.

## Required implementation sequence

Approved sequence:

1. PR 3C.10 - this documentation-only contract.
2. PR 3C.11 - schema and migration assessment.
3. PR 3C.12 - import-review Property link UI.
4. PR 3C.13 - commit integration and safety checks.
5. PR 3C.14 - manual transaction and workflow polish.
6. PR 3C.15 - QA and client review package.

Stop after PR 3C.15 for client retesting. Do not formally close the milestone until the client confirms retesting is complete.

## Stop conditions

Stop and ask before proceeding if:

- import-review Property linking requires schema changes;
- a migration is required;
- durable staging state is required;
- Merge rows need pre-commit Property linking;
- private source fields would be needed;
- automatic Property matching is proposed;
- tax/deductibility wording is needed;
- exact addresses are needed;
- allocation or split logic is required;
- export/report calculations need to change;
- a new package, provider, secret or environment change is needed;
- Production migration is proposed;
- navigation changes are required;
- Home dashboard statistics enter scope;
- Phase 4 or later modules enter scope.

## Accepted limitations for this milestone

- Merge rows are not eligible for pre-commit Property-link selection.
- Property links are created only after successful transaction commit.
- There is no automatic Property matching.
- There is no report-only classification step.
- There is no tax/deductibility treatment.
- The workflow uses safe Property nicknames only, not exact addresses.
- The milestone does not add new reporting calculations or dashboard statistics.
