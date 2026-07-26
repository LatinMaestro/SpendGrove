# Phase C1 Consolidated Transaction Financial and Accessibility Regression Matrix

Date: 26 July 2026  
Status: repository regression package prepared; exact-head verification pending  
Master-plan alignment: C1.5  
Stacked dependency: PR #250 → PR #249 → PR #247 → PR #246 → PR #244 → PR #243 → PR #242 → unresolved activation stack #231–#241

## 1. Purpose

This matrix consolidates the transaction-domain rules that must remain green before Phase C1 can be recommended for closure or reused by the future Expo client.

It covers:

- manual and imported durable Transactions;
- signed direction and Category compatibility;
- split-parent and split-child treatment;
- transfer classification and durable transfer linking;
- import review, commit, Skip and Merge;
- recoverable transaction deletion;
- Preview bulk operations and undo;
- privacy-safe Activity history;
- Category-spending chart and drilldown;
- responsive search and transient filters;
- ownership, privacy, export and deletion boundaries;
- accessibility and selected-month interaction behaviour.

This package does not activate a runtime, add a schema, migrate a database or claim authenticated Preview acceptance.

## 2. Controlling rules

### 2.1 Money and direction

- Durable monetary values remain integer cents.
- Expense cashflow must retain a negative amount.
- Income cashflow must retain a positive amount.
- Transfer classification is explicit and takes precedence over Category-derived assumptions.
- A Category cannot reverse or conceal the transaction's signed direction.
- Direction-correction UI must remain visible for historical anomalies rather than silently rewriting them.

### 2.2 Active transaction source of truth

An active user-facing transaction read must remain:

- scoped by authenticated `userId`;
- `ACTIVE` and not soft-deleted;
- excluding split parents;
- ordered by date then latest update;
- limited to the selected Australian month where a month query is used.

Manual and imported Transactions share the durable source of truth. The UI must not construct a second financial ledger.

### 2.3 Splits

- Split parents are containers and do not count as everyday spending or report cashflow.
- Eligible split children count according to their own signed amount and Category.
- A future change must never count both a split parent and its children.
- Bulk and transfer workflows must reject split parents where their semantics are not approved.

### 2.4 Transfers

- Transfers remain excluded from everyday spending.
- Durable transfer pairing requires two different active, unlinked, non-split-parent transfer records.
- The outgoing amount must be negative.
- The incoming amount must be positive.
- Amounts must be exact opposites.
- Dates must be within two Australian calendar days.
- Exactly one eligible incoming candidate must exist.
- The user must confirm the link.
- Unlink must not change either transaction's amount, date, direction or Category.

### 2.5 Loan reconciliation no-double-count

Where a Loan repayment is reconciled to an everyday Transaction:

- the everyday Transaction remains the sole cashflow record;
- the Loan repayment remains an analytical breakdown;
- principal, interest and fees must not create a second cashflow total;
- transaction filters, chart drilldown and bulk operations must not alter this rule.

### 2.6 Import review and commit

- Raw CSVs are not durably retained by the normal import workflow.
- Private fields and bank identifiers are excluded from committed transaction narration.
- Every row remains reviewable before commit.
- Import, Skip and Merge remain explicit actions.
- Skip creates no Transaction.
- Merge targets only an owned, active, non-split-parent manual Transaction.
- Imported Category and direction must be compatible with the signed amount.
- Property links are explicit and owner-scoped.
- Duplicate scoring remains separate from transfer pairing.

### 2.7 Recoverable deletion

- Deleting a transaction remains a soft-delete lifecycle action.
- Deleted Transactions remain outside active lists and calculations.
- Recovery semantics must remain separate from Activity-history presentation.
- Activity history must not imply that any generic event can be undone.

### 2.8 Bulk operations

The prepared and Preview activation bulk workflow must remain:

- unavailable outside its verified activation boundary;
- limited to 250 unique transaction IDs;
- owner-scoped at operation and item level;
- direction- and Category-compatible;
- split-parent safe;
- Property ownership safe;
- concurrency/version aware;
- partial-failure tolerant;
- explicit about applied, skipped and failed counts;
- undoable only within the approved 30-minute window and while each item remains eligible.

Bulk operation summaries and Activity history may expose bounded aggregate counts only. They must not expose private transaction narration or values.

### 2.9 Activity history

The user-facing Activity-history model may contain only:

- event ID;
- timestamp;
- safe family and action labels;
- entity type;
- a server-generated allowlisted summary;
- a transaction ID only after that Transaction has passed ownership validation.

It must not return raw audit metadata, financial values, narration, filenames, bank identifiers, exact addresses, tokens, hashes, storage keys or provider responses.

### 2.10 Responsive interaction

- Search and transient filters apply only to the selected month.
- Mobile/tablet and desktop expose the same existing Direction and Category semantics.
- Search and filters are not persisted as saved views.
- Result-count changes use a stable polite status.
- Complete no-match recovery clears search and all transient criteria without changing the selected month.
- A stale ledger Category is reset only when absent from a completed month load.
- The mobile card list and desktop semantic table remain available at their established breakpoints.

## 3. Automated traceability matrix

| Boundary | Primary implementation | Primary automated evidence | C1.5 guard |
|---|---|---|---|
| Manual durable create/list/update/delete | `src/server/manual-transactions.ts` | `tests/server/durable-manual-transactions.test.ts`, `tests/manual-transactions.test.ts`, `tests/transactions.test.ts` | owner, active, deleted and split-role source assertions |
| Imported durable transactions | `src/server/import-commit.ts` | `tests/server/import-commit.test.ts`, `tests/server/imported-account-transactions.test.ts`, `tests/imported-account-transactions-ui.test.ts` | Import/Skip/Merge, ownership, privacy and direction assertions |
| Signed direction | `lib/transaction-direction.ts` | `tests/transaction-direction.test.ts`, `tests/transaction-direction-ui.test.ts` | import and UI traceability |
| Everyday expense eligibility | `lib/everyday-spending-eligibility.ts` | `tests/everyday-spending-eligibility.test.ts` | negative owned active expense and split-parent assertions |
| Splits | split fields and reporting predicates | `tests/splits.test.ts`, reporting tests | active-read and eligibility split-parent assertions |
| Transfer linking | `src/server/transfer-links.ts` | `tests/server/transfer-links.test.ts` and activation-stack UI tests | exact opposite, two-day, uniqueness and ownership assertions |
| Bulk operations | `src/server/bulk-operations.ts` | `tests/server/bulk-operations.test.ts` and activation-stack UI tests | gate, 250-item cap, direction, split, stale and undo assertions |
| Activity history | `src/server/activity-history.ts` | `tests/server/activity-history.test.ts`, `tests/activity-history-ui.test.ts` | allowlisted response and ownership assertions |
| Selected-month ledger | `components/durable-manual-transactions.tsx` | `tests/phase-6-transaction-ledger.test.ts`, `tests/transaction-ledger-polish.test.ts` | responsive/transient criteria and lifecycle assertions |
| Category chart and drilldown | `components/monthly-category-spending.tsx` | `tests/monthly-category-spending.test.ts`, `tests/monthly-category-spending-ui.test.ts` | preserved chart/drilldown references |
| Export and deletion | account lifecycle services | `tests/server/account-export.test.ts`, `tests/server/account-deletion.test.ts` | full suite dependency; manual review required per new model |
| Property links | Property transaction-link service and panel | `tests/server/property-transaction-links.test.ts`, UI tests | preserved transaction detail integration |
| Loan no-double-count | reconciliation and reporting services | Loan reconciliation and report suites | full-suite financial gate |

## 4. Consolidated automated guard

`tests/phase-c1-transaction-regression-package.test.ts` reads the authoritative source boundaries and fails when a future change removes or weakens the following protections:

1. durable transaction reads remain owner-scoped, active, non-deleted and split-parent safe;
2. everyday spending requires a negative owned active expense and excludes split parents;
3. import commit retains Import/Skip/Merge, owner-scoped targets, privacy sanitization and direction compatibility;
4. transfer links retain exact opposite amounts, Australian two-day boundary, uniqueness and owner scope;
5. bulk operations retain their fail-closed baseline, item cap, direction/split/stale reasons and undo window;
6. Activity history retains an allowlisted response without raw metadata;
7. the responsive ledger retains transient criteria, result announcements, lifecycle controls and no saved-view persistence.

This consolidated guard supplements, rather than replaces, behavioural unit and service tests.

## 5. Required automated release checks

For the final Phase C1 exact head:

- framework dependency verification;
- complete Vitest suite;
- TypeScript validation;
- lint validation;
- optimized Next.js build;
- route generation;
- Vercel Preview deployment;
- GitHub Application Verification after retargeting to `main`;
- dependency/security checks required by the current release contract.

A Vercel build on a stacked branch is supporting evidence. It does not bypass the ordered merge or exact-head GitHub gate.

## 6. Synthetic interaction matrix

Authenticated synthetic browser review must cover at minimum:

### 6.1 Month and loading

1. Open Transactions with a synthetic account containing multiple months.
2. Confirm the initial fallback chooses the latest populated month only where intended.
3. Move to previous and next months.
4. Confirm the next-month control disables where no later active record exists.
5. Confirm loading text and result status reference the displayed month.
6. Confirm no stale Category remains selected when absent from the new month.

### 6.2 Search and filters

1. Search by synthetic description.
2. Search by synthetic Category name.
3. Apply each Direction option.
4. Apply a loaded Category.
5. Combine search, Direction and Category.
6. Use a chart-selected Category and combine it with ledger criteria.
7. Confirm the active count is textual and correct.
8. Confirm mobile and desktop produce the same result set.
9. Confirm `Clear filters` preserves search.
10. Confirm `Clear search and filters` clears all criteria but preserves the month.
11. Confirm no criteria return after reload or on another device.

### 6.3 Responsive and keyboard

1. Review at 390 px-equivalent width.
2. Confirm no horizontal page or ledger scroll.
3. Open and close the mobile filter disclosure with keyboard and touch.
4. Navigate search, disclosure, selects, clear actions and transaction rows in logical order.
5. Confirm visible focus on every new control.
6. Confirm desktop retains the semantic table and mobile retains transaction buttons.
7. Confirm the result status is announced without moving focus.

### 6.4 Transaction lifecycle

1. Create a positive income and negative expense through the approved UI semantics.
2. Create an outgoing transfer using the explicit transfer rule.
3. Edit a Transaction without changing its ownership or source meaning.
4. Duplicate a Transaction and verify it remains an unsaved reviewed draft until submitted.
5. Soft-delete and verify removal from active list and calculations.
6. Confirm direction-correction warning for the synthetic historical anomaly fixture.
7. Confirm Property linking does not alter financial values.
8. Confirm privacy-safe Activity history appears without amounts or narration.

### 6.5 Import and Merge

1. Use a wholly synthetic CSV.
2. Confirm private-field scanning and review-before-commit.
3. Exercise Import, Skip and Merge.
4. Confirm Skip creates no Transaction.
5. Confirm Merge does not target imported, deleted, cross-user or split-parent records.
6. Confirm signed direction and Category compatibility.
7. Confirm imported records appear in the selected-month ledger with source wording.
8. Confirm no raw filename or row appears in Activity history or safe logs.

### 6.6 Transfers and bulk operations

After the activation stack becomes eligible for authenticated QA:

1. Confirm one unique exact transfer pair.
2. Reject ambiguous and non-opposite candidates.
3. Confirm unlink leaves both Transactions unchanged.
4. Exercise each approved bulk action with synthetic records.
5. Include ineligible split parent, stale, cross-user and direction-anomaly cases.
6. Confirm partial success counts.
7. Confirm eligible undo within the window.
8. Confirm blocked undo after dependent change or expiry.
9. Confirm summaries contain counts only, not private values.

## 7. Financial reconciliation matrix

The final synthetic dataset must include:

- normal expense;
- normal income;
- outgoing and incoming transfer pair;
- ambiguous transfer candidate;
- split parent and at least two children;
- manual Transaction later matched by import Merge;
- skipped import row;
- imported Transaction;
- soft-deleted Transaction;
- Loan repayment with reconciled everyday Transaction;
- Property-linked Transaction;
- direction-anomaly record requiring review;
- bulk-eligible and bulk-ineligible records.

Expected reconciliation:

- everyday spending includes eligible negative expenses and split children only;
- transfer pair contributes zero everyday spending;
- split parent contributes zero when children count;
- skipped import contributes zero;
- Merge does not create duplicate cashflow;
- deleted Transaction contributes zero to active totals;
- reconciled Loan repayment contributes cashflow once through the everyday Transaction;
- Property linking does not alter total cashflow;
- filters and chart drilldown alter presentation only, not source totals.

## 8. Privacy review matrix

Review evidence must contain synthetic labels and aggregate counts only.

Prohibited evidence includes:

- real CSV files or statements;
- filenames copied from private exports;
- raw transaction rows or narration;
- real amounts or balances;
- account, BSB, card, customer or Loan identifiers;
- exact Property addresses;
- invitation/access tokens;
- provider secrets or connection strings;
- screenshots showing real financial history.

Safe evidence may include:

- synthetic fixture names;
- test counts;
- aggregate pass/fail outcomes;
- neutral error messages;
- screenshots populated exclusively with invented records.

## 9. Known limitations

- Authenticated synthetic Preview interaction remains unavailable through the currently connected verification tooling.
- The activation stack's bulk and durable transfer UI still requires its consolidated authenticated QA before merge.
- GitHub Application Verification does not currently run for stacked non-`main` PR bases.
- Durable cross-device saved views remain unimplemented and unapproved at the schema gate.
- The matrix does not replace real-device native parity testing later in the Expo programme.

## 10. Exit criteria

Phase C1 may be recommended for milestone review only when:

- the consolidated automated guard and full suite are green on the final exact head;
- authenticated synthetic web review passes the interaction matrix;
- the activation stack is merged and its relevant transaction workflows are included;
- the stacked Phase C1 PRs are merged in dependency order;
- merged-main verification is green;
- Production remains correctly fail-closed until its approved migration and activation gate;
- durable saved views are either completed through their explicit schema gate or formally recorded as an approved release exception;
- client phase-level review is complete.

## 11. Next action

Use this matrix as the permanent C1.5 test and review register. Continue independent Phase C2/C3 parser and merchant work while authenticated activation QA and Actions execution remain blocked.

Do not claim Phase C1 closed from automated source evidence alone.
