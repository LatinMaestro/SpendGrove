# Phase C1 Transaction Saved Views and Activity History Summary

Date: 26 July 2026  
Status: saved-view contract complete; privacy-safe activity history implemented and technically verified; saved-view schema remains unapproved  
Master-plan alignment: Phase C1.1 and no-schema portion of C1.5  
Stacked dependency: PR #246 → PR #244 → PR #243 → PR #242 → unresolved activation stack #231–#241

## Objective

Advance the Transactions completion programme without bypassing the saved-view schema gate by:

- freezing the cross-device saved-view contract and schema assessment; and
- delivering the independently safe, no-schema activity-history mapper, APIs and responsive web surfaces.

## Saved-view contract status

The current ledger filters remain transient. True web/native cross-device saved views require a future owner-scoped additive `TransactionSavedView` model.

The approved proposed definition is restricted to:

- dynamic current month or one fixed `YYYY-MM` month;
- direction;
- one Category;
- all/no/specific Property;
- manual/imported source;
- current/active/needs-review/deleted state;
- safe review status;
- bounded sorting and page size.

It excludes search text, merchant/payee text, narration, notes, amount ranges, balances, account/Loan/bank/import identifiers, selected transaction IDs, arbitrary query JSON and cached results.

Additional safeguards remain:

- maximum 12 views per user;
- normalized unique names;
- zero or one explicit default;
- invalid Category/Property references fail closed and require repair;
- personal views are not automatically shared with household members or accountants;
- safe account export and dependency-ordered deletion;
- no backfill of browser-local filters.

No saved-view schema, migration or runtime implementation is authorised by this summary.

## Activity-history implementation

### Server-only mapper

`src/server/activity-history.ts` now provides a purpose-limited view model containing only:

- event ID;
- Australian-compatible ISO timestamp;
- safe event family;
- safe action label;
- entity type;
- entity ID only for an already ownership-proven transaction route;
- allowlisted plain-English summary.

Raw `AuditEvent.metadata` is never returned. The mapper recognizes only a small set of safe states and bounded aggregate counts, including:

- Property link linked/relinked/unlinked state;
- transfer-link confirmation/removal;
- reviewed import row import/skip/merge;
- import undo/restore aggregate counts;
- bulk-operation apply, skip, failure, undo and blocked-undo aggregate counts;
- Loan reconciliation link/removal.

Unknown metadata falls back to a generic entity/action summary. It is never stringified or copied into the response.

### Ownership and query boundaries

Account recent activity:

- requires authenticated user context before Prisma store construction or persistence access;
- queries by `userId` only;
- returns at most 100 events;
- orders newest first by timestamp and ID;
- does not return entity IDs.

Transaction activity:

- requires authenticated user context before Prisma store construction;
- proves the Transaction belongs to the user before reading audit rows;
- permits recoverable owned records without treating audit rows as ownership proof;
- queries only `TRANSACTION` audit rows for the owned ID;
- returns at most 50 events;
- returns the transaction entity ID only for that already-owned detail route.

No household or accountant access was added.

### API surfaces

Two GET-only authenticated routes were added:

- `/api/account/activity-history`;
- `/api/account/manual-transactions/[transactionId]/activity`.

They expose neutral authentication/ownership errors and define no POST, PATCH or DELETE activity endpoint.

### Responsive UI

The account-level activity list is available under the existing Settings **Advanced account tools** section. It does not add a primary navigation destination.

Transaction-specific history is shown in the existing transaction-detail workflow through the Property-record panel integration.

Both surfaces include:

- loading, empty, retry and error states;
- screen-reader-friendly event summaries and `<time>` values;
- Australian Brisbane date/time presentation;
- keyboard-operable refresh controls and visible focus treatment;
- read-only wording that directs corrections, links, undo and recovery to their approved feature-specific controls;
- no colour-only meaning or financial values.

## Prohibited response content

Automated tests prove that the activity response does not include:

- raw metadata;
- transaction descriptions or merchant narration;
- notes;
- amounts, balances, budget values or Loan values;
- CSV rows or filenames;
- BSBs, account/card/customer/member identifiers;
- before/after snapshots;
- exact Property addresses;
- invitation/access tokens or hashes;
- storage keys, provider responses or internal errors;
- arbitrary unknown metadata values.

## Financial and lifecycle boundaries

This implementation changes no Transaction, import, budget, recurring, Property, Loan or reporting calculation.

It preserves:

- integer cents;
- Australian dates and financial-year boundaries;
- signed direction and transfer precedence;
- split-parent exclusion and child inclusion;
- review-before-commit;
- Loan repayment no-double-count treatment;
- owner isolation;
- existing audit export, deletion and retention behaviour.

The UI creates no second durable audit copy and provides no inferred undo or restoration action.

## Schema and provider impact

No change to:

- Prisma schema or migration files;
- database state;
- packages or lockfile;
- providers, secrets or environment variables;
- Vercel, Neon or Clerk configuration;
- Production;
- Apple, TestFlight or real users.

The existing `AuditEvent` model and indexes are reused.

## Automated and deployment evidence

Exact implementation head: `bd1c5db5e4f2f2455bac37e3ef6012d83adb672d`  
Vercel deployment: `dpl_5NqvHFbKNbDqgen2Y2yBP6UYSp6U` — Ready

Verified evidence:

- 146 test files / 903 tests passed;
- new server ownership, authentication-before-store, bounded-query, allowlist, bulk-undo, unknown-metadata and privacy tests passed;
- new UI/route boundary tests passed;
- framework dependency verification passed;
- optimized Next.js compilation passed;
- TypeScript and lint validity passed with only pre-existing hook warnings in unrelated files;
- both new dynamic API routes were generated;
- serverless output deployment completed;
- signed-out account activity access returned HTTP 401 with no financial or audit content and retained the existing security/no-index headers.

## Known limitations

- The activity list can display only audit events already written by existing workflows; it does not invent history for actions that were never audited.
- Some generic events intentionally omit detail rather than risk exposing private metadata.
- Transaction-specific history currently covers audit rows directly recorded against the Transaction; related-object events remain visible in account history unless a future approved ownership-safe relationship resolver is added.
- Cursor pagination is not yet needed because account and transaction reads are bounded to 100 and 50 events respectively.
- Saved views remain contract/schema-assessment only.
- Authenticated browser QA remains part of the consolidated client/Preview review gate.

## Remaining blockers

- the material saved-view schema/migration is not authorised;
- this stacked work cannot merge ahead of PRs #242–#246 and their dependencies;
- PRs #231–#241 still require authenticated synthetic QA and executable GitHub Actions;
- no Production migration or activation is authorised.

## Next safe action

Continue Phase C with one of the following independently safe tasks:

1. complete no-schema ledger interaction polish and accessibility regression that does not depend on saved-view persistence; or
2. advance another exact bank/Loan format using only verified public structure and synthetic fixtures.

Do not begin the saved-view schema PR until explicit material schema and migration approval is recorded.
