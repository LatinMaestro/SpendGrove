# Phase C1 Transaction Saved Views and Audit Preparation Summary

Date: 26 July 2026  
Status: contract and schema assessment complete; no implementation, schema or migration authorised  
Master-plan alignment: Phase C1.1  
Stacked dependency: PR #244 → PR #243 → PR #242 → unresolved activation stack #231–#241

## Objective

Prepare the exact product, privacy, ownership, lifecycle, schema and QA boundaries for:

- cross-device saved transaction views; and
- privacy-safe user-facing activity history.

This slice advances independent repository work while authenticated Preview QA and GitHub Actions execution remain unavailable.

## Documents delivered

- `PHASE_C1_TRANSACTION_SAVED_VIEWS_AND_AUDIT_CONTRACT.md`;
- `PHASE_C1_SAVED_VIEW_SCHEMA_ASSESSMENT.md`;
- this summary.

## Current-state findings

The current signed-in Transactions ledger already includes:

- month navigation;
- search;
- desktop direction and category filters;
- desktop table and mobile list;
- owner-scoped server queries;
- transaction details and lifecycle controls;
- Preview-only bulk operations in the activation stack.

Those filters are transient. They do not persist across browser recreation and are not available to a future native client.

The current browser-local settings layer and `UserSettings.featureFlags` JSON are not suitable for cross-device saved views.

The current `AuditEvent` model and indexes are sufficient for a bounded activity-history presentation when raw metadata is never returned to a client.

## Contract decisions

### Saved views

The initial saved-view definition is restricted to safe enum/reference choices:

- dynamic current month or one fixed `YYYY-MM` month;
- direction;
- one Category;
- all/no/specific Property;
- manual/imported source;
- current/active/needs-review/deleted state;
- safe review status;
- bounded sort and page size.

It explicitly excludes:

- search text;
- merchant/payee text;
- narration and notes;
- amount ranges and balances;
- account/Loan/bank/import identifiers;
- selected transaction IDs;
- arbitrary JSON predicates;
- cached results and totals.

Additional safeguards:

- maximum 12 views per user;
- normalized unique names;
- zero or one explicit default view;
- no silent persistence of temporary changes;
- invalid Category/Property references fail closed and require repair;
- personal views remain private from household members and accountants;
- safe export and dependency-ordered account deletion.

### Activity history

The future UI will use **Activity history** and will show only allowlisted plain-English events.

It will not expose:

- raw metadata;
- descriptions or merchant narration;
- notes;
- amounts or balances;
- filenames or bank identifiers;
- before/after financial snapshots;
- exact Property addresses;
- provider internals, tokens, hashes or errors.

Unknown event metadata is omitted or mapped to a generic safe event. It is never stringified into a client response.

## Schema conclusion

A new owner-scoped `TransactionSavedView` model is recommended for true web/native cross-device behaviour.

The proposed model uses:

- direct `userId` ownership;
- normalized-name uniqueness;
- bounded enum fields;
- optional owned Category and Property relations;
- restrictive reference deletion to prevent silent filter broadening;
- default flag and optimistic `updatedAt`;
- no transaction-result relation or cache.

No backfill is required. Existing users continue with the immutable built-in current-month view until they explicitly create a saved view.

Activity history requires no new model or migration. It reuses `AuditEvent` through a server-only mapper and bounded owner-scoped reads.

## Rejected approaches

- browser-local saved views as the final implementation;
- arbitrary saved query JSON;
- storing views inside `UserSettings.featureFlags`;
- storing search or narration;
- using AuditEvent as preference storage or undo history;
- storing transaction snapshots or cached results;
- automatically sharing views;
- silently removing an invalid Category/Property filter.

## Privacy and financial integrity

No financial rule changes.

The preparation preserves:

- integer cents;
- Australian dates and financial years;
- transfer/split and Loan no-double-count rules;
- review-before-commit;
- owner isolation;
- no raw CSV retention;
- privacy-safe logs and audit;
- export/deletion coverage.

## Repository impact

Documentation only.

No change to:

- application source;
- Prisma schema or migration files;
- database state;
- packages or lockfile;
- providers, secrets or environment variables;
- Vercel/Neon/Clerk configuration;
- Production;
- Apple, TestFlight or real users.

## Proposed delivery sequence

1. contract and schema assessment — complete in this slice;
2. exact additive schema/migration and verifier profile — explicit material schema gate required;
3. owner-scoped service, export and deletion behind fail-closed runtime;
4. saved-view web workflow;
5. safe audit mapper/API/UI;
6. integrated automated, Preview and accessibility QA;
7. native parity through the same API.

## Remaining blockers

- the material saved-view schema/migration is not yet authorised;
- PRs #242–#244 and this stacked work cannot merge ahead of their dependencies;
- PRs #231–#241 still require authenticated synthetic QA and executable GitHub Actions;
- no Production migration or activation is authorised.

## Next safe action

Continue repository-only preparation with either:

- the Phase C1 privacy-safe activity-history mapper/API design and synthetic response fixtures, which can remain no-schema and hard-disabled; or
- another independent Phase C2 exact-format evidence slice where current wholly synthetic structures are available.

Do not begin the saved-view schema PR until its explicit schema/migration gate is satisfied.
