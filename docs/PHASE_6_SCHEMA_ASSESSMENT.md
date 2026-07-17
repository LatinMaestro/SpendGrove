# Phase 6 Schema and Migration Assessment

Prepared: 17 July 2026  
Status: Milestone 6.0 assessment  
Result: no schema or migration is needed for PR 6.1 or the initial no-schema PR 6.2; durable bulk-operation undo and cross-device saved views require a later exact schema gate.

## Current models reused

Phase 6 presentation work can reuse:

- User and UserSettings;
- Category;
- Transaction;
- ImportBatch and ImportRow;
- BankImportProfile;
- MerchantProfile, MerchantAlias and MerchantRule;
- AuditEvent;
- Property and PropertyTransactionLink;
- LoanAccount, LoanRepayment and LoanReconciliationLink;
- existing report/budget/recurring models where links are consolidated.

## PR 6.1 — Desktop shell and Import Centre

Schema: no change.

Reason:

- upload, parse, privacy scan, mapping and review state remain transient;
- committed import records already use ImportBatch/ImportRow;
- saved profiles already use BankImportProfile;
- past imports already have owner-scoped history;
- merchant/category/Property choices already use accepted actions and models;
- no raw CSV or filename needs to be stored.

Migration: none.

## PR 6.2 — Desktop ledger and transient filters

Schema: no change for the initial implementation.

Reason:

- current Transaction fields and relations support date, safe merchant, category, direction, amount, Property link and correction state;
- filters can be bounded server query parameters;
- selected rows remain transient UI state;
- sorting and pagination do not require durable state.

Deferred:

- cross-device saved views;
- user-defined column layouts;
- durable last-view preference.

Those require a client preference and schema decision rather than unreviewed browser-local persistence.

Migration: none.

## PR 6.3 — Bulk operations and undo

Current schema sufficiency: insufficient for a durable, safely reversible multi-record operation.

AuditEvent alone is not an appropriate undo journal because:

- it is intentionally aggregate and privacy-minimized;
- it does not store per-record structured before/after state;
- overloading audit metadata could expose private financial values;
- it cannot reliably detect subsequent conflicting edits;
- account export/deletion and retention semantics are not defined for undo payloads.

## Candidate later model responsibilities

A later PR 6.3A must decide whether to add owner-scoped models equivalent to:

### BulkOperation

Minimum responsibilities:

- id;
- userId;
- action type;
- status;
- createdAt/completedAt;
- undo eligibility/expiry;
- safe aggregate succeeded/skipped/failed counts;
- optional safe reason code.

### BulkOperationItem

Minimum responsibilities:

- id;
- operationId;
- transactionId;
- result state;
- expected pre-change version/timestamp;
- minimum structured before/after references required for the action;
- safe failure reason;
- revertedAt/version.

The exact fields, enums, relations and names are not approved by this assessment.

## Data minimization constraints

A future journal must not store:

- raw CSV row or narration;
- filenames;
- account numbers, BSBs, card/customer IDs;
- balances unrelated to the action;
- merchant source text;
- exact Property address;
- broad transaction snapshots;
- secrets.

Category change may need old/new category IDs. Property-link change may need old/new Property IDs only under an approved action. Amount/date/type changes are outside initial bulk scope and should not be copied into the journal.

## Ownership and authorization

Any future operation models must:

- include direct user ownership on the operation;
- reach items only through the owned operation;
- revalidate each target Transaction under the same user;
- use indexes for user/status/createdAt and operation/result;
- prevent cross-user relation references;
- enter two-user isolation tests.

## Concurrency

The existing Transaction model has updatedAt but no explicit numeric version. PR 6.3A must decide whether updatedAt is sufficient for optimistic revalidation or whether an additive version field is justified.

No version field is approved here.

## Undo eligibility

A future undo contract must invalidate reversal when:

- target is deleted/restored after the operation;
- category/Property state no longer matches the recorded post-state;
- split structure changed;
- another operation changed the same field;
- reconciliation/report-sensitive relation changed where relevant;
- ownership/account lifecycle changed.

Undo must never restore an unrelated stale snapshot.

## Export, deletion and retention

Future operation history must be addressed in:

- account export: include a safe operation summary or explicitly exclude ephemeral undo internals;
- account deletion: cascade/delete all operation and item records;
- retention: define expiry and cleanup;
- audit: preserve safe high-level action evidence without retaining sensitive undo payload indefinitely;
- household future: do not assume user-only ownership remains sufficient.

## Migration safety requirements for PR 6.3A

Before any Preview migration:

1. exact Prisma diff;
2. exact generated SQL;
3. additive-only confirmation;
4. indexes, unique constraints and foreign keys;
5. row-lock/table-lock assessment;
6. ownership/export/deletion/privacy review;
7. pre/post migration checks using safe counts only;
8. rollback or forward-fix plan;
9. Preview workflow checker profile;
10. client/operator gate required by current migration governance.

No Production migration is authorised.

## Saved views

If cross-device saved transaction views are approved, prefer a separate owner-scoped model rather than adding unbounded JSON to UserSettings without a contract.

The decision must define:

- safe filter fields;
- maximum views/user;
- names and duplicate handling;
- default view;
- invalid category/Property cleanup;
- export/deletion;
- future household visibility.

No saved-view model is approved here.

## Other Phase 6 work

Merchant/category/profile administration can reuse current models. Richer MerchantProfile defaults, merge history and tax/Property behaviour belong to Phase 7/8 contracts and are not part of Phase 6 schema work.

Report/account administration consolidation is presentation-only and must not add report snapshots or calculated-value storage.

## Environment and package assessment

PR 6.1/6.2 require:

- no new provider;
- no new package;
- no lockfile change;
- no secret/environment variable;
- no database migration;
- no Production data access.

A semantic HTML/CSS ledger is preferred over adding a grid dependency.

## Assessment decision

Approved to proceed without schema:

- PR 6.1 desktop shell and Import Centre;
- PR 6.2 initial desktop transaction ledger and transient filters;
- PR 6.4 existing merchant/category/profile management presentation;
- PR 6.5 links/consolidation over existing reports/account tools.

Mandatory later gate:

- PR 6.3A before durable bulk mutation/undo;
- separate decision before cross-device saved views.

## Confirmation

This assessment changes no Prisma schema or migration file. No Preview or Production migration, SQL, data rewrite, backfill, provider/package/secret/environment change or Production database access occurred.
