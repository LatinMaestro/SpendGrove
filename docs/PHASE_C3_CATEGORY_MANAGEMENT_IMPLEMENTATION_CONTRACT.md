# Phase C3 Category Management Implementation Contract

Date: 26 July 2026  
Status: approved repository implementation boundary; implementation not yet delivered  
Master-plan alignment: Phase C3 — merchant and category completion  
Feature register: CAT-01, CAT-02

## 1. Objective

Improve the existing account-backed custom Category administration workflow without changing Category data meaning, transaction classification, financial calculations, persistence models or API contracts.

The implementation must make Category administration:

- accurate about account state;
- resistant to repeated or overlapping writes;
- reversible and understandable;
- keyboard and screen-reader friendly;
- usable at 390 px;
- aligned with the future native API boundary;
- truthful about archive and restore effects.

## 2. Files expected to change

A focused implementation should normally be limited to:

- `components/custom-category-controls.tsx`;
- `components/account-data-management.tsx` where prop wiring is required;
- one new focused UI/source regression test file;
- existing Category UI tests only where wording assertions need alignment;
- `docs/PHASE_C3_CATEGORY_MANAGEMENT_PREPARATION_SUMMARY.md` for final evidence.

The implementation must not alter:

- Prisma schema;
- migration files;
- Category API routes;
- `src/server/custom-categories.ts` unless a clearly identified correctness defect is found and separately reviewed;
- money/date/import/Loan/report logic;
- packages or lockfile;
- provider or environment configuration.

## 3. Authoritative state model

`useCustomCategoryCatalogue()` remains the single client owner of:

- loaded custom Categories;
- account loading/available/unavailable state;
- optimistic Category updates;
- pending Category operation;
- user-facing success status;
- safe user-facing error state.

`CustomCategoryManager` must not independently request the Category list merely to infer account availability.

### 3.1 Storage mode

Retain the existing bounded values:

- `loading`;
- `account`;
- `unavailable`.

Presentation rules:

- `loading`: show `Loading account categories…`, use `aria-busy="true"`, and do not show an empty-state claim;
- `account`: show `Saved to your account` and permit actions subject to pending state;
- `unavailable`: show a neutral alert explaining that account Categories cannot be changed right now and existing browser-only data was not changed.

Do not claim that new Categories will persist only for the page. The account workflow blocks writes when account storage is unavailable.

### 3.2 Pending operation

Use one bounded state such as:

- `null`;
- `{ kind: "CREATE" }`;
- `{ kind: "RENAME"; categoryId: string }`;
- `{ kind: "ARCHIVE"; categoryId: string }`;
- `{ kind: "RESTORE"; categoryId: string }`.

A pending state is transient client state only. It must not be logged, persisted, exported or added to audit metadata.

While an operation is pending:

- disable create, rename, archive and restore controls that could overlap;
- keep Settings navigation usable;
- use action-specific wording such as `Saving name…`, `Archiving…` or `Restoring…`;
- do not start a second request;
- preserve the exact optimistic rollback snapshot;
- clear pending state on success and failure.

No queue, automatic retry or background reconciliation is permitted.

## 4. Message model

Separate normal status and error state.

Recommended catalogue return fields:

- `notice: string` for loading/success/completion context;
- `error: string` for failed account load, validation or persistence;
- `clearMessages()` or equivalent bounded helper where useful.

Presentation:

- normal messages: `role="status"`, polite announcement;
- errors: `role="alert"`;
- no repeated announcement when unchanged;
- no raw error object, Category ID, SQL/provider text or private source value.

## 5. Rename workflow

### 5.1 Enter rename

When Rename is activated:

- set the editing Category ID;
- populate the current name;
- clear transient rename error;
- focus the rename input;
- retain a ref to the initiating Rename button.

### 5.2 Accessible label

The input must identify the Category context, for example:

- `New name for Work parking`.

If validation fails:

- show a bounded error near the editor;
- connect it with `aria-describedby`;
- retain input focus;
- do not send an unsafe request if client validation already rejects the name.

### 5.3 Save

Save must:

- ignore repeated activation while pending;
- call the existing account update helper once;
- preserve optimistic rollback;
- close the editor only after the request has been accepted or according to a deliberately tested optimistic pattern that restores the editor on failure;
- announce success;
- return focus to the renamed Category row or Rename control where practical.

### 5.4 Cancel

Cancel must:

- make no network call;
- make no Category mutation;
- clear editing name and error;
- close the editor;
- return focus to the initiating Rename button;
- remain available before a Save begins;
- be disabled only while the rename request is actively pending.

## 6. Archive workflow

Archive remains a reversible lifecycle action, not deletion.

### 6.1 Required explanation

The manager must state plainly:

> Archiving removes a Category from new choices. Existing Transactions keep the Category and their totals do not change. You can restore it later.

Equivalent plain-English wording is acceptable if all three meanings remain:

- future selection is removed;
- existing records/totals remain unchanged;
- restore is available.

### 6.2 Confirmation

A lightweight inline confirmation is preferred for Archive because it removes a future choice.

The confirmation must:

- name the Category;
- explain existing Transactions remain unchanged;
- provide `Keep available` and `Archive Category` choices;
- create no new modal/navigation pattern;
- be keyboard accessible;
- return focus safely after cancel or completion.

Restore may remain a direct action with pending-state protection and clear wording.

### 6.3 No hard deletion

No `Delete Category`, trash icon or permanent deletion API may be introduced.

## 7. Counts and ordering

Derive from the already loaded custom Category array:

- total count;
- available count;
- archived count.

Display concise context such as:

- `4 available · 2 archived`.

Rules:

- do not add a dashboard card or chart;
- do not persist counts;
- do not change current alphabetical ordering;
- archived Categories remain visible in management;
- do not mix seeded Categories into custom counts.

## 8. Responsive and accessibility requirements

### 8.1 390 px layout

At 390 px:

- Category names wrap rather than overflow;
- status text wraps safely;
- Rename/Archive/Restore buttons remain visible;
- edit input, Save and Cancel stack vertically where required;
- no horizontal scrolling is introduced;
- touch targets remain at least the existing minimum height.

### 8.2 Keyboard

Required keyboard order:

1. Category disclosure summary;
2. Rename;
3. Archive or Restore;
4. rename input when opened;
5. Save;
6. Cancel;
7. archive confirmation choices when opened.

All interactive controls use visible `focus-visible` treatment.

### 8.3 Screen reader

- manager uses a stable heading;
- loading region exposes `aria-busy`;
- Category status is available in text;
- pending action wording is visible or announced;
- rename input is Category-specific;
- archive confirmation is associated with the relevant Category;
- status and errors use appropriate live semantics;
- no state is communicated by icon or colour alone.

## 9. Import Review reuse

The same catalogue hook is used by Import Review.

The implementation must preserve:

- user-initiated inline creation;
- existing group and type rules;
- safe private-identifier validation;
- existing account persistence helper;
- review-before-commit;
- no automatic import-row commit;
- no raw source fields entering Category persistence;
- the same runtime Category catalogue update after success;
- rollback/error behavior after failure.

The Settings manager changes must not require Import Review to render administration-only controls.

## 10. Financial invariants

The implementation changes presentation and client request coordination only.

It must not change:

- Category ID assignments on Transactions;
- Category direction compatibility;
- amounts or integer-cent handling;
- income/expense/transfer types;
- split treatment;
- duplicate detection;
- import mapping or commit;
- merchant rule matching;
- Property or Loan links;
- recurring, budget, insight or report calculations;
- Australian date/FY behavior;
- tax-preparation meaning.

Archive/restore must not trigger Transaction writes.

## 11. Privacy and security invariants

- use authenticated existing APIs only;
- no Category IDs in human-facing error text unless already safe and necessary, which is not expected;
- no raw CSV, narration, merchant history, amount, balance or banking identifier;
- no browser-local migration/deletion;
- no external provider call;
- no analytics or monitoring event;
- no new retention behavior;
- no cross-user or household/accountant expansion;
- existing account export and deletion remain unchanged.

## 12. Automated acceptance

Add focused tests that inspect or execute the approved behavior.

Minimum guards:

1. manager does not call `listAccountCustomCategories` independently;
2. authoritative `storageMode` is passed from AccountDataManagement;
3. loading state does not render `No saved categories yet`;
4. available and archived counts derive from custom Categories;
5. rename input has Category-specific accessible naming;
6. Cancel closes rename without calling `onRename`;
7. Cancel returns focus through an initiating-control ref or equivalent tested mechanism;
8. pending state disables conflicting controls;
9. persistence failure restores the previous catalogue and exposes an alert;
10. archive explanation preserves existing Transactions/totals and restore meaning;
11. no hard-delete control or API is added;
12. focus-visible and 390 px wrapping classes are present;
13. browser-storage corruption/version messages are absent from the account manager;
14. existing durable Category ownership, duplicate-name and private-identifier tests pass;
15. existing import-review Category creation and merchant/category regression tests pass.

## 13. Exact-head verification

Before recommending merge:

- review exact diff against this contract;
- run all test files;
- run TypeScript;
- run lint and confirm no new warnings;
- run optimized Next.js build;
- inspect Vercel build logs;
- verify no schema/migration/package/environment diff;
- verify no unresolved review threads;
- perform signed-in synthetic 390 px and desktop review when credentials/tooling are available;
- record known limitations and remaining dependency gates.

## 14. Merge boundary

The implementation PR must remain stacked behind this audit and PR #254. It must not merge ahead of the activation/master-plan dependencies.

A green Vercel build does not authorise:

- Production migration or activation;
- material Category schema work;
- merchant merge;
- real-user invitation;
- provider activation;
- Expo/Apple/TestFlight work;
- public release.

## 15. Exit criteria

This slice is technically complete when:

- Category account state has one source of truth;
- duplicate account-status loading is removed;
- pending actions cannot overlap;
- rename has safe Save/Cancel/focus behavior;
- archive impact is accurate and reversible;
- loading/status/error semantics are accessible;
- 390 px and desktop source/visual checks pass;
- all existing financial, ownership, import and privacy regressions remain green;
- exact-head build and deployment evidence are recorded.
