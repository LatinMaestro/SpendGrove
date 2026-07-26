# Phase C3 Category Management and Accessibility Audit

Date: 26 July 2026  
Status: current-state audit complete; no implementation, schema or migration authorised  
Master-plan alignment: Phase C3 — merchant and category completion  
Feature register: CAT-01, CAT-02; supports MER-04 and future native parity  
Stacked dependency: PR #254 and the earlier Phase C/master-plan stack

## 1. Purpose

This audit reviews the existing account-backed custom Category lifecycle and Settings administration workflow to identify the next independently safe, existing-schema delivery slice.

The intended outcome is a clear implementation boundary that improves:

- Category administration clarity;
- archive and restore understanding;
- rename recovery and keyboard flow;
- saving and failure-state accuracy;
- responsive behaviour at iPhone-sized widths;
- accessibility semantics;
- reuse by the future Expo client through the existing authenticated API contract.

This audit does not approve new Category fields, hierarchy changes, deletion, merge, reclassification, tax defaults, Property defaults, schema changes or financial-rule changes.

## 2. Sources reviewed

The audit is based on the exact stacked head of PR #254 and reviews:

- `components/custom-category-controls.tsx`;
- `components/account-data-management.tsx`;
- `lib/account-custom-categories.ts`;
- `src/server/custom-categories.ts`;
- `tests/server/durable-custom-categories.test.ts`;
- the Settings shell and current Category feature-register entries;
- `AGENTS.md`;
- `APP_STORE_SUBMISSION_MASTER_BUILD_PLAN.md`;
- Review Gates and Definition of Done;
- current privacy, financial-integrity and ownership rules.

## 3. Existing capability

The current implementation already provides a substantial and safe foundation.

### 3.1 Durable ownership and validation

The server service:

- requires authenticated user context before durable actions;
- lists only owned, non-seeded, non-deleted custom Categories;
- blocks cross-user access;
- keeps seeded Categories immutable;
- validates names through the established Category domain rules;
- rejects case-insensitive duplicates across seeded and custom Categories;
- rejects reserved group names;
- rejects private bank identifier patterns before persistence;
- creates or reuses owned seeded group records;
- supports rename, archive and restore using the existing Category schema;
- returns only safe Category fields.

### 3.2 Current account API boundary

The client uses existing authenticated routes through:

- `GET /api/account/categories`;
- `POST /api/account/categories`;
- `PATCH /api/account/categories/[categoryId]`;
- the separately retained local-category migration route.

No new route is required for the quality slice identified by this audit.

### 3.3 Current user workflow

The Settings account-data workspace already includes:

- a collapsed `Manage categories, merchants and mappings` area;
- current custom Categories grouped in a `Manage saved categories` disclosure;
- Category name, group and available/archived state;
- Rename;
- Archive;
- Restore;
- optimistic account updates with rollback on failure;
- status wording after operations;
- empty and account-unavailable states.

Import Review also reuses the same Category catalogue and allows a user to create a Category during review.

### 3.4 Financial boundary already preserved

Custom Category administration does not change:

- Transaction amounts;
- signed direction or type;
- Transaction dates;
- split structure;
- transfer treatment;
- duplicate scoring;
- import decisions;
- Loan reconciliation;
- Property links;
- budget or report calculations;
- tax meaning.

A Category rename changes the user-facing Category name only. Archive/restore changes future selection availability, not existing Transaction financial eligibility or totals.

## 4. Findings

## Finding C3-CAT-01 — duplicate account-status request

`useCustomCategoryCatalogue()` already performs the authoritative account Category load and records whether account storage is loading, available or unavailable.

`CustomCategoryManager` then independently calls `listAccountCustomCategories()` again only to decide whether to display `Saved to your account` or `Account unavailable`.

Risks:

- duplicated network work;
- transient disagreement between the parent catalogue and child status;
- a later response can present account availability differently from the data already rendered;
- unnecessary request and failure surface;
- harder native/client parity because presentation derives its own persistence check.

Recommended correction:

- pass the authoritative `storageMode` from the catalogue into the manager;
- remove the manager's duplicate account-status request;
- derive loading/account/unavailable presentation from one source of truth.

## Finding C3-CAT-02 — stale browser-storage states in an account-backed workspace

The catalogue returns `recoveredFromCorruption` and `unsupportedVersion`, but both are permanently false in the current account-backed hook. The manager still includes browser-storage messages such as:

- `Browser storage is unavailable. New categories last only while this page is open.`;
- unreadable browser Categories were reset;
- newer browser versions were ignored.

Those messages reflect an earlier browser-local model and can be misleading within the current signed-in account workspace.

Recommended correction:

- remove inactive browser-local Category messages from the account-backed manager;
- retain browser-local preservation wording only in the dedicated legacy-data boundary;
- use truthful account loading/unavailable messaging;
- do not imply temporary in-memory persistence when the current operation is deliberately blocked.

## Finding C3-CAT-03 — optimistic writes have no operation lock

Create, rename and archive/restore use optimistic state and rollback, which is acceptable, but no explicit pending-operation state prevents repeated or overlapping actions.

Potential outcomes:

- repeated Save clicks while a rename is still pending;
- archive then restore requests crossing in flight;
- a second Category action using stale `previous` state;
- ambiguous success/error notice when multiple operations overlap;
- focus moving while the operation is unresolved.

Recommended correction:

- introduce one bounded Category-operation state in the catalogue;
- disable conflicting Category controls during the request;
- show action-specific saving wording;
- clear pending state in success and failure paths;
- retain rollback to the exact previous catalogue;
- do not add a queue, retry loop or background synchronization.

## Finding C3-CAT-04 — rename lacks explicit Cancel

The Category rename editor provides only `Save name`.

There is no explicit way to exit without saving other than leaving the disclosure or taking another action.

Recommended correction:

- add `Cancel`;
- make Cancel perform no network call and no Category mutation;
- restore the original display row;
- clear transient validation errors;
- return focus to the initiating Rename button where practical;
- support Escape only if implemented without creating a new modal interaction pattern.

## Finding C3-CAT-05 — rename focus and labeling can be stronger

Current rename controls use a generic `Saved category name` label. When several Categories are listed, that label gives limited context.

Recommended correction:

- use a Category-specific accessible label such as `New name for Work parking`;
- focus the input when editing begins;
- connect any rename validation error to the input with `aria-describedby`;
- retain visible text labels or helper wording where space allows;
- ensure Save and Cancel use consistent visible focus treatment.

## Finding C3-CAT-06 — archive impact is not explained

The current Archive control changes the active state immediately, but the user is not told what happens to existing Transactions.

The accepted boundary is:

- archived Categories remain on existing Transactions and historical records;
- existing Transaction totals and reports do not change;
- archived Categories are removed from ordinary future selection lists;
- restoring makes them selectable again;
- archive is reversible;
- no Transaction is automatically reassigned.

Recommended correction:

- present this plain-English boundary near the management list;
- use action-specific confirmation wording without a heavy modal;
- optionally use a lightweight inline confirmation for Archive only;
- Restore may remain direct because it broadens future availability without removing a choice;
- do not introduce hard deletion.

## Finding C3-CAT-07 — available and archived counts are combined

The disclosure currently shows only total custom Categories.

Recommended correction:

- show total plus plain-language available/archived context;
- avoid adding charts or dashboard statistics;
- keep counts derived from the already loaded catalogue;
- do not persist aggregate values.

## Finding C3-CAT-08 — current status and error semantics are conflated

The catalogue exposes a single `notice` string. The manager renders it as `role="status"`, including persistence failures.

Recommended correction:

- separate normal status from actionable error state;
- success/loading completion uses polite status;
- failed account load or write uses `role="alert"`;
- errors remain neutral and privacy-safe;
- do not expose request internals, Category IDs, database errors or private source data.

## Finding C3-CAT-09 — manager can be clearer while loading

The manager may render an empty Category state while the account catalogue is still loading.

Recommended correction:

- render a stable loading state while `storageMode === "loading"`;
- do not show `No saved categories yet` until the authoritative load succeeds;
- use `aria-busy` on the bounded manager region;
- preserve the rest of Settings usability.

## Finding C3-CAT-10 — focus-visible treatment is inconsistent

Several Category controls use `focus:` styling or no explicit focus class, while current design-system patterns use `focus-visible`.

Recommended correction:

- apply visible keyboard focus to disclosure, input, Save, Cancel, Rename, Archive and Restore controls;
- preserve minimum 44-point-equivalent touch targets;
- do not remove native select/input focus behavior;
- do not rely on colour alone for current state.

## Finding C3-CAT-11 — mobile wrapping is serviceable but should be verified

The list uses a column-first layout and wraps action buttons, but long names and saving labels require explicit 390 px verification.

Recommended correction:

- preserve single-column layout below `sm`;
- use `min-w-0` and safe wrapping for long Category names;
- keep action buttons visible without horizontal scrolling;
- verify Dynamic Type-style browser text enlargement where practical;
- do not introduce dense table presentation on mobile.

## Finding C3-CAT-12 — create-during-import should remain aligned

Import Review's inline Category creation reuses the same catalogue, but the manager quality changes must not alter the import-review financial or review-before-commit workflow.

Required boundary:

- new Category creation remains user initiated;
- new Category is persisted to the account before being relied upon as a durable choice;
- failure returns the review to a safe state;
- no import row commits automatically;
- no merchant rule changes transaction direction;
- no raw CSV/private source data enters Category persistence.

The next implementation should verify this reuse, not redesign the inline creation flow.

## 5. Approved no-schema implementation boundary

A focused implementation may:

1. pass `storageMode` and operation state from the catalogue to the manager;
2. remove the duplicate account-status request;
3. remove inactive browser-storage Category messages from the account workspace;
4. add bounded pending state for create, rename and archive/restore;
5. disable conflicting controls while a Category operation is active;
6. separate status and alert messages;
7. add explicit Rename Cancel and focus return;
8. add Category-specific rename labeling;
9. add plain-English archive/restore impact wording;
10. add available/archived counts;
11. add loading and `aria-busy` semantics;
12. standardise focus-visible and mobile wrapping treatment;
13. add focused synthetic source/UI tests;
14. update the permanent Category preparation summary and feature evidence.

## 6. Explicit exclusions

This audit does not authorise:

- Category hard deletion;
- Category merge;
- moving an existing Category between groups;
- changing an existing Category financial type;
- automatic Transaction recategorisation;
- bulk historical Category application beyond the existing separately guarded merchant operation;
- default Property or tax settings;
- Category icons, colours or custom ordering;
- new Category hierarchy depth;
- saved-view fields;
- new API routes;
- Prisma schema or migration changes;
- database backfill or rewrite;
- new packages;
- providers, secrets or environment changes;
- Production migration or activation;
- Expo/native implementation;
- Apple, TestFlight or public release action.

## 7. Financial safeguards

The implementation must preserve:

- integer cents;
- Australian dates and financial years;
- signed direction and transfer precedence;
- Category direction compatibility;
- split-parent exclusion and split-child inclusion;
- review-before-commit;
- duplicate thresholds;
- Loan repayment no-double-count treatment;
- existing report and budget formulas;
- no automatic tax/deductibility conclusion.

Archive, restore and rename must not change the Category ID on any Transaction.

## 8. Privacy and security safeguards

The implementation must preserve:

- authenticated account ownership;
- seeded Category immutability;
- private-identifier validation;
- no raw CSV, filename, narration, amount, balance, bank identifier or provider payload;
- no Category criteria in analytics or external providers;
- neutral safe error messages;
- account export and deletion coverage already provided by the Category model;
- no browser-local migration or deletion.

## 9. Required tests

The focused implementation should add synthetic guards for:

1. one authoritative account Category load rather than a second manager request;
2. loading, ready and unavailable presentation;
3. available and archived counts;
4. rename Cancel creates no write and restores focus;
5. Category-specific rename accessible label;
6. pending Save disables conflicting actions;
7. failure rollback and alert semantics;
8. archive wording states existing Transactions remain unchanged;
9. Restore wording states future selection returns;
10. no hard-delete control;
11. no schema, API, provider or financial-rule expansion;
12. import-review Category creation continues to use the same durable catalogue safely;
13. 390 px wrapping and focus-visible source boundaries;
14. existing durable server ownership/duplicate/private-identifier regressions remain green.

## 10. Visual review checklist

On a synthetic account, verify:

- account Categories load without briefly claiming none exist;
- available and archived counts are understandable;
- Rename opens with contextual focus;
- Cancel exits without saving;
- Save and archive actions cannot be double-submitted;
- archive impact is clear before the action;
- an archived Category remains visible in management but is marked Archived;
- Restore returns it to available state;
- long Category names wrap safely at 390 px;
- all controls are keyboard reachable with visible focus;
- failure states do not expose technical or private detail.

## 11. Conclusion

The current Category domain and server service are sufficient for the next quality slice. No schema, migration, financial-rule or provider change is required.

The next safe action is one focused existing-schema PR implementing the approved presentation, pending-state, Cancel/focus, archive explanation and accessibility improvements with synthetic tests and exact-head verification.
