# Phase C3 Merchant and Category Regression Matrix

Date: 26 July 2026  
Status: repository-safe consolidated regression package  
Master-plan alignment: Phase C3 — merchant and Category completion  
Feature-register coverage: MER-01, MER-02, MER-03, MER-04, MER-05, MER-06, MER-07, CAT-01, CAT-02, IMP-04  
Stacked dependency: PR #256 and all preceding Phase C, master-plan and activation dependencies

## Purpose

This matrix consolidates the existing merchant and custom-Category guarantees into one review surface. It does not add or change product behaviour. It protects the existing implementation while later work advances merchant history, Category administration, Import Review and native parity.

A feature is not considered protected merely because one component renders or one service method exists. The matrix requires alignment across:

- domain validation;
- durable account ownership;
- service lifecycle behaviour;
- Settings administration;
- Import Review reuse;
- privacy and financial boundaries;
- account export/deletion expectations;
- accessibility and responsive behaviour;
- material-schema hard stops.

## Permanent cross-cutting rules

Every merchant and Category change must preserve:

- authenticated owner-scoped reads and writes;
- seeded Category immutability;
- custom Category case-insensitive uniqueness;
- direction-compatible Category use;
- user-reviewed merchant suggestions;
- explicit merchant conflict resolution;
- no silent edits to existing Transactions;
- no raw CSV, narration, filename or banking identifier persistence expansion;
- review-before-commit for imported Transactions;
- integer cents and Australian dates/financial years;
- transfer and split precedence;
- Loan repayment no-double-count treatment;
- reversible archive/restore and disable/restore where currently supported;
- account export and dependency-ordered deletion coverage;
- no merchant identity merge until its separate material schema gate is approved.

# 1. Durable custom Category matrix

| Area | Required behaviour | Existing evidence | Regression guard | Failure meaning |
|---|---|---|---|---|
| Authentication | reject missing user context before store access | `durable-custom-categories.test.ts` | consolidated source and behavioural-suite guard | unauthenticated Category access may reach persistence |
| Ownership | list, find and update by authenticated `userId` | `src/server/custom-categories.ts`; cross-user test | source guard for owner filters and ownership assertion | cross-user Category leakage or mutation risk |
| Seeded Categories | seeded Categories remain immutable | durable Category behavioural test | behavioural-suite retention guard | built-in classification contract can be altered |
| Custom lifecycle | create, rename, archive and restore | durable Category behavioural test | lifecycle title and source guards | user cannot safely correct or recover a Category |
| Name uniqueness | prevent case-insensitive duplicates across seeded/custom Categories | durable Category behavioural test | behavioural-suite retention guard | ambiguous duplicate choices can be created |
| Private identifiers | reject Category names containing private bank identifiers | durable Category behavioural test | private-field test retention guard | sensitive identifiers may enter Category storage |
| Active list | omit deleted records and distinguish archive state | server store filters; UI counts | source filters and UI guard | archived/deleted records may be misrepresented |
| Hard deletion | no custom Category hard-delete control | Category manager source | no-delete guard | existing Transaction references could be orphaned |
| Export/deletion | existing account lifecycle remains authoritative | account export/deletion regressions in full suite | full exact-head suite | new Category state may be omitted from lifecycle |

## 1.1 Category administration interaction matrix

| State | Expected presentation | Permitted action | Prohibited action |
|---|---|---|---|
| Loading | explicit account Category loading state | wait | show empty catalogue or allow write |
| Ready / no custom Categories | truthful empty state | create | claim data is browser-only |
| Ready / available | available count and Category rows | rename, begin archive confirmation | hard delete or change financial type/group |
| Ready / archived | archived count and archived rows | restore | silently reuse for new choices |
| Saving | action-specific pending text and disabled overlapping actions | wait | second concurrent write |
| Persistence failure | alert and exact optimistic rollback | retry | leave optimistic state presented as saved |
| Rename open | Category-specific label, Save and Cancel | save or cancel | mutation on Cancel |
| Archive confirmation | explain future-choice effect and unchanged existing totals | confirm archive or keep available | imply historical recategorisation |

## 1.2 Category accessibility matrix

Required evidence:

- 390 px layout does not require horizontal scrolling;
- action groups wrap vertically before becoming cramped;
- minimum practical touch targets are retained;
- keyboard focus is visible;
- Rename Cancel restores focus to the initiating control;
- loading uses `aria-busy`;
- normal completion uses polite status semantics;
- actionable failures use alert semantics;
- archive state is expressed in text, not colour alone;
- available and archived counts are separately understandable.

# 2. Durable merchant matrix

| Area | Required behaviour | Existing evidence | Regression guard | Failure meaning |
|---|---|---|---|---|
| Authentication | reject missing user context before merchant store access | `durable-merchant-rules.test.ts` | behavioural-suite retention guard | unauthenticated merchant data access |
| Ownership | account snapshot operations remain scoped by `userId` | server store and cross-user tests | source owner-filter and behavioural guard | cross-user merchant leakage or mutation |
| Rule types | only EXACT, STARTS_WITH and CONTAINS | server allowlist; UI labels | exact supported-type guard | unsupported matching semantics can enter runtime |
| Confirmed suggestions | rules arise from user-reviewed choices | merchant domain/service tests | future-review-only UI guard | automatic or misleading learning claim |
| Conflicts | no overwrite without explicit KEEP_EXISTING or REPLACE choice | durable merchant behavioural test | conflict-suite and UI-choice guard | existing rule can be silently replaced |
| Alias lifecycle | rename, disable, restore and remove remain explicit | durable merchant behavioural test | lifecycle-suite retention guard | correction/recovery becomes ambiguous |
| Profile lifecycle | update only owned profile and available Category | durable merchant behavioural test | behavioural-suite retention guard | invalid Category or cross-user profile mutation |
| Category availability | custom owned active Category before seeded fallback | merchant service/UI tests | account Category-resolution guard | active custom Category appears unavailable |
| Private fields | reject private identifiers and raw narration | durable merchant behavioural test | private-field test retention guard | private bank/source text enters durable merchant data |
| Clear account snapshot | clear only authenticated account | durable merchant behavioural test | account-isolation guard | one user may clear another account |
| Pattern privacy | normalized matching patterns stay hidden from UI | merchant presentation test | hidden-pattern guard | internal matching material is exposed |
| Exact provenance | do not invent an unrecorded source | merchant presentation test | Australian saved-date/context guard | misleading provenance claim |
| Existing Transactions | suggestions affect future reviews only | merchant Settings copy/tests | future-only wording guard | user may believe history was silently changed |

## 2.1 Merchant Settings interaction matrix

| Workflow | Required state/choice | Existing Transaction impact | Required recovery |
|---|---|---|---|
| Rule display | plain-English matching breadth and safe saved date | none | disable/restore or remove through existing controls |
| Suggested Category edit | active owned or seeded compatible Category | none until a future reviewed import choice | choose another available Category |
| Alias rename | explicit Save and Cancel | none | Cancel without write and restore focus |
| Alias conflict | Use new merchant, Keep current merchant or Cancel | none | preserve current choice unless replacement confirmed |
| Rule conflict | explicit replacement or keep-existing choice | none | no implicit overwrite |
| Disable profile/alias/rule | future suggestions stop using disabled entity | existing Transactions remain unchanged | restore where supported |
| Clear saved suggestions | account-scoped snapshot reset | existing Transactions remain unchanged | rebuild only through future reviewed choices |

## 2.2 Merchant accessibility matrix

Required evidence:

- exact/starts-with/contains breadth is visible in text;
- disabled state is visible in text;
- disclosures have adequate touch targets;
- edit controls wrap at mobile width;
- keyboard focus is visible;
- Alias Cancel restores focus;
- conflicts are alerts;
- ordinary load/save completion is a polite status;
- Category labels resolve without exposing IDs;
- raw and normalized patterns do not appear in client presentation.

# 3. Settings integration matrix

The Settings administration workspace must retain one shared account Category catalogue.

| Integration | Requirement | Guard |
|---|---|---|
| Category source | `useCustomCategoryCatalogue()` is authoritative | account administration source guard |
| Category status | pass storage mode, notice, error and pending operation | component-wiring guard |
| Category actions | pass rename and archive/restore handlers | component-wiring guard |
| Merchant Category options | combine seeded plus non-archived owned custom Categories | source and merchant-resolution tests |
| Merchant state | merchant snapshot remains account-backed | full merchant service tests |
| Saved mappings | remain a separate workflow | unchanged full-suite regression |
| Navigation | no new primary destination | existing Settings disclosure retained |

# 4. Import Review integration matrix

Import Review remains the point where users review imported transaction choices.

| Requirement | Existing behaviour | Guard |
|---|---|---|
| Shared Categories | same custom Category catalogue is reused | Import Review source guard |
| Category creation | Category may be created through catalogue helper | `onCreateCategory` guard |
| Merchant rules | same Merchant manager and merchant data are reused | component integration guard |
| Review choices | Import, Skip and Merge remain explicit | copy/source guard and existing tests |
| Durable commit | nothing creates Transactions before explicit confirmation | copy and `ImportCommitPanel` guard |
| Financial mutation | Category/merchant UI does not directly update durable Transaction values | prohibited-source guard |
| Raw file privacy | CSV remains transient under existing import contract | full import regression suite |
| Duplicate checks | remain separate from merchant/Category presentation | full import duplicate suite |
| Direction compatibility | Category rules cannot reverse signed direction | existing import/transaction regressions |
| Property/Loan | no change to Property links or Loan reconciliation | existing full suite |

# 5. Financial integrity matrix

This Phase C3 regression package changes no financial logic. Every future merchant/Category PR must prove:

| Rule | Required outcome |
|---|---|
| Money storage | integer cents unchanged |
| Direction | signed amount and transaction type remain compatible |
| Transfers | transfer precedence remains separate from merchant suggestions |
| Splits | split parent remains a display container; children retain Category meaning |
| Import | every imported row remains review-before-commit |
| Existing Transactions | merchant suggestions and Category archive do not silently recategorise history |
| Bulk history | apply-to-history remains a separate guarded bulk operation |
| Loan repayment | reconciled everyday Transaction remains the sole cashflow record |
| Reports/budgets | Category/merchant administration does not rewrite totals |
| Tax | no automatic deductibility, tax grouping conclusion or advice |

# 6. Privacy and security matrix

The following are prohibited from merchant/Category UI, test evidence, audit summaries, logs and provider payloads unless a later explicit contract authorises a minimum-data use:

- raw CSV rows or files;
- original filenames;
- raw bank descriptions or narration;
- amounts and balances;
- BSBs and account/card/customer identifiers;
- Loan references;
- exact Property details;
- normalized alias or merchant rule patterns;
- internal database identifiers in user-facing errors;
- provider responses or secrets.

Permitted client presentation is limited to:

- user-approved clean merchant names;
- plain-English rule breadth;
- safe Category display names;
- active/disabled/archive state;
- Australian saved-date context;
- neutral success/error messages;
- safe aggregate counts.

# 7. Reversibility and history boundaries

## Existing-schema actions

The current schema safely supports:

- custom Category rename;
- custom Category archive and restore;
- merchant profile update and lifecycle state;
- alias rename, disable, restore and removal;
- rule disable, restore and removal;
- explicit merchant conflict resolution;
- separate guarded apply-Category-to-history bulk workflow.

## Material-schema hard stop

Merchant identity merging remains blocked because exact reversible history requires dedicated typed operation journals. This package must fail if current implementation code begins importing or invoking proposed merchant-merge operation models before approval.

No current `AuditEvent` record, snapshot JSON or Transaction bulk-operation row may be repurposed as an unapproved merchant-merge undo journal.

# 8. Automated evidence map

## Existing behavioural suites

- `tests/server/durable-custom-categories.test.ts`
  - create/list/rename/archive/restore;
  - duplicate prevention;
  - seeded immutability;
  - cross-user denial;
  - authentication-before-store;
  - safe migration;
  - private-identifier rejection.

- `tests/server/durable-merchant-rules.test.ts`
  - account-owned profiles, aliases and rules;
  - conflict resolution;
  - lifecycle correction and recovery;
  - Category availability;
  - cross-user denial;
  - safe migration;
  - private-identifier/raw-narration rejection;
  - account-scoped clearing.

- `tests/merchant-provenance-accessibility.test.ts`
  - safe labels and hidden patterns;
  - custom Category resolution;
  - Australian saved date;
  - future-review-only wording;
  - conflict choices;
  - no-write Cancel;
  - callback dependency safety;
  - mobile and keyboard semantics.

- `tests/category-management-accessibility.test.ts`
  - one authoritative catalogue;
  - serialized optimistic operations;
  - status/error separation;
  - Rename Cancel/focus;
  - reversible archive;
  - separate counts;
  - 390 px and focus treatment;
  - Import Review reuse.

## New consolidated guard

`tests/phase-c3-merchant-category-regression.test.ts` fails if future edits weaken the cross-layer contracts above while individual tests still happen to pass.

# 9. Exact-head verification requirements

Before this package or any child implementation can be considered technically complete:

1. all tests must pass on the exact head;
2. TypeScript validation must pass;
3. lint must pass, with any pre-existing warning recorded truthfully;
4. optimized Next.js build must pass;
5. Vercel Preview must complete successfully;
6. changed-file diff must match the declared scope;
7. no unresolved review thread may remain;
8. authenticated visual review remains a separate gate where connected tooling cannot establish a synthetic Clerk session;
9. GitHub Application Verification remains required after eventual retargeting to `main`.

# 10. Remaining limitations and gates

- PRs #231–#241 still require authenticated synthetic Preview QA and executable GitHub Actions before ordered merge.
- The Phase C/master-plan PR chain remains stacked and cannot merge ahead of dependencies.
- Merchant identity merge remains behind explicit material schema, Preview migration and separate Production approval.
- Historical Category application remains a separate guarded bulk workflow.
- Tax/Property default fields remain behind their separate financial, privacy and professional-review contracts.
- The behaviour-neutral Import Review empty-array memoization warning remains a separate focused source patch.
- No Production migration, provider activation, Apple action, TestFlight upload or real-user activity is authorised.

# 11. Exit criteria for the existing-schema Phase C3 quality slice

The independently safe existing-schema portion is ready for dependency-ordered review when:

- merchant and Category behavioural suites are green;
- consolidated cross-layer guards are green;
- Settings and Import Review use the same account Category catalogue;
- all Category writes are serialized and reversible where supported;
- merchant conflicts are explicit;
- merchant patterns and private values remain hidden;
- mobile and keyboard accessibility guards pass;
- no financial calculation or existing Transaction is silently changed;
- exact-head Vercel evidence is recorded;
- remaining material-schema and operator gates are stated without ambiguity.
