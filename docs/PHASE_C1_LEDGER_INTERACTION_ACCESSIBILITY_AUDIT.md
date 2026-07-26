# Phase C1 Transaction Ledger Interaction and Accessibility Audit

Date: 26 July 2026  
Status: current-state audit complete; implementation contract follows  
Master-plan alignment: Phase C1.4 and preparation for C1.5  
Base: PR #247 exact head `54e18f397429fb81d9d2b016f097126034ecd360`

## Purpose

Audit the current signed-in Transactions experience before the no-schema desktop/mobile ledger-polish implementation.

This audit is limited to interaction clarity, responsive behaviour, keyboard/focus behaviour, result-state recovery and accessibility regression. It does not authorise saved-view persistence, schema changes, new financial filters, new calculations or a new navigation destination.

## Sources reviewed

- `AGENTS.md`;
- `docs/APP_STORE_SUBMISSION_MASTER_BUILD_PLAN.md`;
- `docs/REVIEW_GATES.md`;
- `docs/DEFINITION_OF_DONE.md`;
- `docs/DESIGN_SYSTEM.md`;
- `app/transactions/page.tsx`;
- `components/durable-manual-transactions.tsx`;
- current transaction, direction, category, Property-link and monthly-category tests;
- PR #246 saved-view contract;
- PR #247 privacy-safe Activity history implementation.

## Existing strengths to preserve

The current ledger already provides:

- authenticated account storage and owner-scoped server reads;
- month-by-month browsing with Australian month labels;
- browser-session search within the selected month;
- desktop direction and Category filters;
- Category-chart drilldown into ledger rows;
- responsive mobile cards and desktop table presentation;
- separate loading, account-unavailable, empty-month and no-match states;
- manual create, edit, duplicate and recoverable delete workflows;
- imported/manual source detail;
- direction-correction warnings;
- reviewed Property record linking;
- Preview-only bulk operations through the existing activation stack;
- minimum-height touch targets and visible focus treatment on most primary controls;
- integer-cent and Australian-currency display;
- no change to review-before-commit, transfer, split or Loan no-double-count rules.

These foundations are not to be rebuilt.

# Findings

## F-01 — Direction and Category filters are desktop-only

Current behaviour:

- the Direction and Category selects are inside a container hidden below the `lg` breakpoint;
- mobile and tablet users can search and use Category-chart drilldown, but they cannot apply the same direct Direction and Category filters available on desktop.

Impact:

- responsive feature parity is incomplete;
- the future native client cannot use the web interaction as a complete reference pattern;
- users on iPhone-sized screens may need more month navigation or search effort to isolate transfers, Money in or Money out.

Required correction:

- expose the existing filter choices on mobile without adding new filter semantics;
- use progressive disclosure so everyday mobile scanning remains calm;
- retain the existing always-visible desktop controls.

## F-02 — No-match recovery clears only search text

Current behaviour:

- when `filteredTransactions.length === 0`, the empty result action says `Clear search`;
- the result may actually be empty because of Direction, Category or Category-chart filters, or a combination of criteria;
- clearing only the search term may leave the ledger empty.

Impact:

- the recovery action can be inaccurate;
- users can remain in an unexplained empty state;
- screen-reader users receive no reliable indication of which criteria still apply.

Required correction:

- determine whether any search or filter criterion is active;
- provide one accurate `Clear search and filters` action when multiple criteria may be responsible;
- clear search, Direction, ledger Category and chart Category together;
- preserve the selected month.

## F-03 — Active criteria are not consolidated

Current behaviour:

- Category-chart filtering displays a visible banner;
- search displays a small note;
- desktop Direction and Category filters are visible only in their selects;
- there is no unified statement of how many criteria are active.

Impact:

- users may overlook a filter after scrolling;
- desktop and mobile recovery patterns differ;
- changing month while filters remain selected can create an apparently empty month without an obvious explanation.

Required correction:

- derive a single safe, non-persistent active-criteria count;
- show a plain-English summary near the result count;
- provide one clear-all action whenever at least one criterion is active;
- do not store the criteria or expose them in URLs, logs or audit.

## F-04 — Result updates are not explicitly announced

Current behaviour:

- the month label uses `aria-live="polite"`;
- the transaction count heading updates visually after search or filter changes but is not itself a dedicated polite status;
- loading state uses `aria-busy`, but the results region does not expose a stable busy/status relationship.

Impact:

- screen-reader users may not hear the new result count after changing a filter;
- a no-match transition may be discovered only through navigation.

Required correction:

- add a stable polite status for result count and active-criteria state;
- apply `aria-busy` to the ledger results region while the selected month is loading;
- avoid repeated or overly verbose announcements.

## F-05 — Search clear control lacks the standard focus treatment

Current behaviour:

- the inline `Clear` search button is keyboard-operable;
- it does not use the same explicit focus-visible ring treatment as the surrounding ledger controls.

Impact:

- keyboard focus may be less visible than on adjacent controls;
- the inconsistency is avoidable within the existing design system.

Required correction:

- add the standard focus-visible treatment;
- retain a minimum usable target and plain-English accessible name.

## F-06 — Search input can better declare its purpose

Current behaviour:

- the input is visually and programmatically labelled with an `sr-only` label;
- it does not declare `type="search"`;
- it has no stable results-summary description.

Impact:

- mobile keyboards and assistive technology receive less semantic guidance than available;
- result feedback is not explicitly connected.

Required correction:

- use `type="search"`;
- connect the input to the result-summary status with `aria-describedby`;
- preserve local-only, selected-month search and do not add search persistence.

## F-07 — Selected Category can become unavailable after month navigation

Current behaviour:

- desktop Category options are derived from active Transactions in the loaded month;
- a selected ledger Category can remain in state after changing to a month where that Category does not exist;
- the select may no longer contain the selected option while the filter still excludes all rows.

Impact:

- the UI can display a blank or confusing selection;
- the result list can be empty for a stale transient criterion.

Required correction:

- after a successful month load, reset the ledger Category filter to `ALL` when its selected Category is not present in that month;
- do not silently broaden a durable saved view—this rule applies only to the current transient controls;
- leave future durable saved-view invalid-reference behaviour governed by PR #246, which requires explicit repair rather than silent broadening.

## F-08 — Filter changes and Category-chart drilldown should close the breakdown consistently

Current behaviour:

- month navigation closes Category breakdown and clears chart Category filtering;
- direct Direction/Category changes do not need the chart breakdown open, but current interaction ownership is spread across handlers.

Impact:

- implementation can drift as mobile filters are added;
- duplicated handlers can create inconsistent state transitions.

Required correction:

- centralise transient filter update and clear-all helpers;
- close Category breakdown when a ledger criterion is deliberately changed;
- preserve selected month and loaded Transactions.

## F-09 — Mobile filter presentation must not become a second saved-view system

Risk:

- adding controls can accidentally introduce browser persistence, query-string storage, local settings or a `Save view` affordance before the schema gate.

Required boundary:

- all C1.4 criteria remain React component state only;
- no localStorage/sessionStorage persistence;
- no URL query persistence;
- no `UserSettings.featureFlags` use;
- no arbitrary filter JSON;
- no saved-view label, default, create, edit or delete control;
- no cross-device claim.

## F-10 — Existing status labels must remain financially neutral

Risk:

- interaction polish may be used to introduce new direction, review, transfer or reconciliation semantics.

Required boundary:

- Direction remains only `ALL`, `EXPENSE`, `INCOME`, `TRANSFER` using current labels;
- Category remains current active ledger Categories;
- Category-chart filter continues to use its existing transaction IDs;
- no amount, date-range, Property, Loan, source, deleted-state or audit filter is added in this slice;
- no change to Transaction eligibility or calculations.

# Proposed interaction model

## Mobile and tablet

Add one collapsed `Filter transactions` disclosure below search.

Collapsed summary contains:

- label `Filter transactions`;
- active-criteria badge/count only when Direction, ledger Category or chart Category is active;
- no financial values.

Expanded content contains:

- Direction select using existing values;
- Category select using existing month-derived choices;
- `Clear filters` when a non-search filter is active;
- explanatory text that filters apply only to the selected month and are not saved.

Search remains outside the disclosure because it is an everyday control.

## Desktop

Retain the existing visible Direction and Category selects.

Enhance with:

- consistent clear-all helper;
- active-criteria count in the result summary;
- stale Category reset after month load;
- focus-visible improvements.

## Result summary

Use one stable result summary containing:

- visible count, for example `12 transactions`;
- selected-month context where useful;
- plain-English active-criteria statement when applicable;
- polite live announcement without reading individual transaction content.

Do not announce amounts, merchant descriptions or Category names unnecessarily through live regions.

## No-match state

When active criteria exist:

- heading: `No matching transactions`;
- explanation: criteria apply only to the selected month;
- action: `Clear search and filters`.

When no criteria exist, the existing empty-month state remains separate and unchanged.

# Accessibility acceptance matrix

## Keyboard

- every search/filter/clear control is reachable in logical order;
- visible focus ring is present;
- mobile disclosure uses native `details/summary` or an equivalent correctly announced control;
- clearing criteria returns focus to the invoking control or keeps it in a predictable location;
- no row action becomes keyboard-inaccessible.

## Screen reader

- search has an accessible label and search semantics;
- filter disclosure announces expanded/collapsed state;
- select labels are explicit;
- result count updates are polite;
- loading region reports busy state;
- no-match recovery is accurate;
- icons remain decorative where adjacent text carries meaning.

## Touch and responsive layout

- controls remain at least the existing 44 px/11 Tailwind minimum height pattern;
- no horizontal overflow at 390 px;
- mobile controls use one column;
- desktop filter row remains aligned;
- long Category names wrap or truncate without obscuring the selected value;
- transaction cards/table remain unchanged except for result-state relationships.

## Motion and visual treatment

- no animation is required;
- no colour-only filter state;
- green/teal design direction and surface hierarchy remain unchanged;
- filter count is text-readable and not an icon-only indicator.

# Required automated tests

## Source/interaction tests

- mobile filter disclosure exists and is not hidden at small widths;
- desktop filter row remains available at `lg`;
- Direction and Category options remain the existing approved values;
- no localStorage, sessionStorage, URL persistence or saved-view copy is introduced;
- clear-all resets `searchQuery`, `ledgerDirectionFilter`, `ledgerCategoryFilter` and `categoryFilter`;
- month change preserves Direction/search unless the selected Category is stale, then only stale Category resets;
- Category-chart selection and direct filters can combine predictably;
- stale Category reset is covered;
- result summary uses a polite status;
- search is `type="search"` and references the summary;
- focus-visible treatment exists on inline clear controls;
- no-match state uses accurate clear-all wording.

## Regression tests

- active transaction source remains unchanged;
- no financial calculation or formatter changes;
- positive/negative amount presentation remains unchanged;
- transfer and Needs correction labels remain unchanged;
- mobile cards and desktop table both remain present;
- manual create/edit/duplicate/delete actions remain present;
- Category breakdown and chart remain present;
- Property linking and Activity history remain present;
- Preview bulk actions remain untouched.

## Build and review

- all tests;
- TypeScript;
- lint;
- optimized build;
- exact-head Vercel Preview;
- 390 px and desktop browser review where authenticated tooling is available;
- keyboard/focus and no-overflow notes;
- no private data or screenshots.

# Rejected scope

This slice must not add:

- durable saved views;
- schema or migrations;
- browser-persisted filters;
- amount/date-range/Property/Loan/source/deleted-state filters;
- sorting changes;
- pagination;
- new APIs;
- new audit records;
- bulk-operation changes;
- financial calculations;
- provider, secret or environment changes;
- Production activation;
- native implementation.

# Audit conclusion

A focused no-schema polish PR is justified and can proceed autonomously within Phase C1 after this contract is reviewed. The implementation should modify only the existing transaction component and focused tests/documentation.

The saved-view schema remains a separate material gate and must not be inferred from this audit.