# Phase C1 Transaction Ledger Polish Implementation Contract

Date: 26 July 2026  
Status: approved-scope contract for a later focused implementation PR  
Master-plan item: C1.4 with preparation for C1.5  
Depends on: PR #247 and its stacked dependencies

## Objective

Complete responsive transaction-ledger interaction parity and accessibility recovery without creating durable saved views or changing any financial, import, ownership or persistence rule.

## Authorised implementation scope

The focused implementation PR may change:

- `components/durable-manual-transactions.tsx`;
- one focused transaction-ledger interaction test file;
- existing directly relevant UI tests where assertions must be updated;
- the Phase C1 summary and PR review evidence.

A small platform-neutral helper may be extracted only when it contains no React, Prisma, server, environment or financial logic and reduces duplicated transient-filter state handling. A new package is not authorised.

## Required behaviour

### 1. Shared transient criteria state

Define the currently active criteria from:

- non-empty `searchQuery`;
- non-`ALL` `ledgerDirectionFilter`;
- non-`ALL` `ledgerCategoryFilter`;
- non-null Category-chart `categoryFilter`.

The state remains in-memory for the current component lifecycle only.

### 2. One clear-all operation

A single helper must reset:

- `searchQuery` to empty;
- `ledgerDirectionFilter` to `ALL`;
- `ledgerCategoryFilter` to `ALL`;
- `categoryFilter` to null;
- `showBreakdown` to false.

It must not change:

- selected month;
- loaded transaction records;
- account data;
- monthly spending calculations;
- any durable preference.

### 3. Responsive filter access

Desktop:

- preserve the existing visible Direction and Category row at `lg` and above;
- continue using the existing select values and labels.

Mobile/tablet:

- add a native disclosure labelled `Filter transactions` below search;
- show Direction and Category controls in one column;
- show a text active-count indicator when a non-search filter is active;
- show `Clear filters` only when a Direction, ledger Category or chart Category filter is active;
- state that filters apply only to the selected month and are not saved.

The disclosure must not contain a `Save`, `Save view`, `Default view` or similar affordance.

### 4. Search semantics

The search input must:

- use `type="search"`;
- retain its current accessible label and selected-month placeholder;
- reference the result summary through `aria-describedby`;
- keep search local to already loaded safe transaction fields;
- retain the current description and Category matching only.

The inline clear button must use the standard visible focus ring.

### 5. Results status

Add one stable result summary ID and polite live status.

The summary must report:

- result count;
- singular/plural correctly;
- whether criteria are active using a bounded count or short generic statement;
- selected-month-only context without reading transaction descriptions or financial values.

The ledger results section must expose `aria-busy={!isReady}` or an equivalent stable relationship.

### 6. Accurate no-match recovery

When the selected month contains active transactions but the combined criteria return zero rows:

- show `No matching transactions`;
- explain that search and filters apply only to the selected month;
- show `Clear search and filters`;
- invoke the shared clear-all helper.

Do not reuse this state for a genuinely empty month.

### 7. Stale transient Category handling

After a successful month load:

- derive Categories available in that loaded month;
- when `ledgerCategoryFilter` is not `ALL` and no loaded active Transaction uses it, reset it to `ALL`;
- do not clear search or Direction;
- do not apply this rule to future durable saved views;
- do not change the saved-view contract’s fail-closed invalid-reference requirement.

The implementation should avoid a render loop and should not modify data returned by the server.

### 8. Consistent breakdown ownership

Changing a direct ledger Direction or Category filter must close Category breakdown.

Clearing all criteria must also close breakdown.

Selecting a Category from the chart may continue to set `categoryFilter` and return to the ledger as currently implemented.

## Financial invariants

The implementation must not change:

- integer-cent storage or formatting;
- signed amount/direction invariant;
- transfer precedence or exclusion;
- split-parent exclusion and split-child inclusion;
- refund treatment;
- duplicate thresholds;
- review-before-commit;
- import/skip/merge behaviour;
- Property link meaning;
- Loan repayment reconciliation or no-double-count rules;
- monthly Category-spending calculations;
- transaction eligibility or ordering.

## Privacy and data boundaries

The implementation must not:

- add persistence for criteria;
- include search/filter criteria in audit logs;
- write criteria to account settings;
- place criteria in the URL;
- expose raw transaction narration beyond the already displayed owned ledger;
- add analytics or monitoring events;
- include private data in tests, docs, PR comments or screenshots.

Tests use synthetic labels and values only.

## Ownership and security boundaries

No API, ownership or authentication change is required.

Existing server queries remain authoritative. Client-side criteria filter only the already returned, authenticated month response.

No collaboration, household or accountant visibility changes are authorised.

## Accessibility requirements

- native disclosure or equivalent valid expanded/collapsed semantics;
- labelled Direction and Category selects;
- at least existing minimum touch-target dimensions;
- logical keyboard order;
- focus-visible ring on every actionable control;
- result status announced politely;
- loading state announced without duplicate noise;
- no colour-only active-filter indication;
- no horizontal overflow at 390 px;
- desktop table headers and mobile transaction buttons unchanged.

## Test contract

Focused tests must prove:

1. mobile filter disclosure and desktop row both exist;
2. approved Direction values remain exact;
3. Category options still derive from loaded active Transactions;
4. search uses `type="search"` and `aria-describedby`;
5. result summary is a polite live status;
6. clear-all resets every transient criterion and breakdown;
7. no-match recovery calls clear-all and uses accurate wording;
8. stale Category handling resets only the transient ledger Category;
9. direct filter changes close breakdown;
10. no persistence or saved-view terminology exists;
11. existing mobile list and desktop table remain;
12. manual lifecycle, Property links, Activity history and category chart remain;
13. no financial/source modules are changed.

The exact-head PR must pass all repository tests, TypeScript, lint, optimized build and Vercel Preview.

## UI review notes required

The PR review package must identify:

- Transactions at approximately 390 px;
- Transactions at desktop width;
- mobile filter disclosure collapsed and expanded;
- one active filter and multiple active criteria;
- no-match recovery;
- empty month;
- loading/account-unavailable state;
- keyboard focus notes;
- any existing warnings unrelated to the diff.

Synthetic data only.

## Explicit exclusions

- durable saved views;
- saved-view schema or migrations;
- account/native sync;
- new filter types;
- filter persistence;
- sorting or pagination changes;
- changes to Activity history;
- changes to bulk operations;
- restored/deleted transaction browsing;
- Production migration or activation;
- package, provider, secret or environment changes;
- Apple, Expo or native work.

## Stop conditions

Stop rather than expanding scope when:

- the current component cannot be changed without a financial-query change;
- a new schema or API becomes necessary;
- Vercel/build/test failure has an unclear root cause;
- responsive review reveals a major new interaction pattern needing client input;
- any private-data handling changes.

## Exit criteria

C1.4 is technically complete only when:

- direct Direction and Category filters are usable on mobile and desktop;
- all active criteria are visible and recoverable;
- screen-reader users receive accurate result changes;
- stale transient criteria cannot trap a user in an unexplained empty state;
- the existing transaction lifecycle and financial behaviour are unchanged;
- focused and full regression checks are green;
- exact-head Vercel evidence and known limitations are recorded.

This contract does not close C1 because saved views remain behind their explicit schema gate and C1.5 consolidated financial/accessibility regression remains outstanding.