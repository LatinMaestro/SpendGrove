# Phase C3 Merchant and Category Regression Summary

Date: 26 July 2026  
Status: consolidated repository-safe regression package technically verified; dependency and authenticated-review gates remain  
Master-plan alignment: Phase C3 — merchant and Category completion  
Stacked dependency: PR #256 and all earlier Phase C, master-plan and activation dependencies

## Objective

Create one permanent cross-layer regression package for the existing-schema merchant and custom-Category capabilities completed through PR #256.

This package protects the implemented service, Settings and Import Review boundaries without adding a new feature, schema, provider or financial behaviour.

## Files delivered

- `docs/PHASE_C3_MERCHANT_CATEGORY_REGRESSION_MATRIX.md`;
- `tests/phase-c3-merchant-category-regression.test.ts`;
- this summary.

## Protected Category behaviour

The package binds the current Category UI to the durable service guarantees for:

- authentication before store access;
- owner-scoped list, create and update;
- seeded Category immutability;
- case-insensitive duplicate prevention;
- private bank-identifier rejection;
- create, rename, archive and restore;
- serialized optimistic writes;
- exact rollback after persistence failure;
- Rename Cancel without a write and focus return;
- explicit Archive confirmation;
- no hard-delete control;
- separate available and archived counts;
- loading, status, alert and mobile accessibility states;
- reuse of the same account catalogue in Settings and Import Review.

## Protected merchant behaviour

The package binds merchant presentation to the durable service guarantees for:

- authenticated account-scoped snapshots;
- EXACT, STARTS_WITH and CONTAINS rules only;
- user-confirmed suggestions;
- explicit KEEP_EXISTING and REPLACE conflict treatment;
- profile, alias and rule lifecycle correction;
- active owned custom Category support;
- cross-user denial;
- private-identifier and raw-narration rejection;
- account-scoped clearing;
- plain-English rule labels;
- Australian saved-date context without invented provenance;
- hidden normalized matching patterns;
- future-review-only wording;
- explicit conflict and alias-Cancel choices;
- visible focus and mobile wrapping.

## Import Review integration

The regression guard confirms that Import Review:

- creates one `useCustomCategoryCatalogue()` instance;
- reuses that catalogue for row Category creation and administration;
- reuses the Merchant manager;
- retains Import, Skip and Merge;
- states that no Transaction is created until explicit confirmation;
- uses the existing `ImportCommitPanel` for durable commit;
- does not directly mutate Transaction values through merchant or Category presentation code.

## Financial boundary

No financial logic changed.

The package preserves:

- integer cents;
- Australian date and financial-year defaults;
- signed direction and transfer precedence;
- split-parent exclusion and split-child inclusion;
- review-before-commit;
- duplicate thresholds;
- Property and Loan relationships;
- Loan repayment cashflow no-double-count treatment;
- budget and report totals;
- no automatic tax conclusion or advice.

Merchant suggestions affect future reviewed choices only. Category archive affects future choices only. Neither operation silently changes existing Transactions or totals.

## Privacy and security boundary

The package reinforces the prohibition on exposing or expanding storage of:

- raw CSV files or rows;
- filenames;
- raw narration;
- amounts or balances;
- bank/account/card/customer identifiers;
- Loan references;
- exact Property details;
- normalized merchant or alias patterns;
- provider responses, credentials or secrets.

No analytics, monitoring payload, provider call or new audit payload was added.

## Schema and environment impact

No change to:

- Prisma schema;
- migration files or database state;
- APIs or server runtime behaviour;
- package or lockfile;
- workflow configuration;
- Vercel, Neon or Clerk environments;
- providers, secrets or paid services;
- Production;
- Expo, Apple, TestFlight or real users.

Merchant identity merge remains behind PR #252's explicit material-schema gate. This package does not implement or authorise any proposed merge operation model.

## Automated evidence

The new consolidated test contains seven guards covering:

1. durable Category authentication, ownership, archive state and no hard deletion;
2. durable merchant account scoping, supported rule types and private-field exclusion;
3. continued presence of actual behavioural tests for lifecycle, isolation, conflicts and private-field rejection;
4. serialized and reversible Category administration;
5. deterministic, future-review-only and correction-safe merchant presentation;
6. shared reviewed integration through Import Review;
7. continued exclusion of merchant-merge schema, providers, persistence shortcuts and tax/advice expansion.

The existing in-memory service tests remain the authoritative behavioural evidence. The new package is a cross-layer drift detector, not a replacement for those tests.

## Exact-head verification

Verified implementation head: `18a4d508d9788e8b432ed2731be24e86c8cc5fba`  
Vercel deployment: `dpl_DCup65UTMzeReioj2eGawrTupxGh` — Ready

The exact source head passed:

- framework dependency verification;
- **151 test files / 941 tests**;
- all seven new consolidated merchant and Category guards;
- existing durable Category and merchant behavioural suites;
- existing merchant provenance and Category accessibility suites;
- Import Review, transaction, ownership, account export/deletion, Loan and reporting regressions;
- optimized Next.js compilation;
- TypeScript and lint validation;
- static-page generation, route tracing and serverless deployment.

The only lint output remains the already documented `reviewRows ?? []` memoization warnings in `components/import-review-foundation.tsx`.

An initial run failed one source-text assertion because it prohibited the generic identifier word `accountNumber` anywhere in the merchant server module. The application behaviour was not defective: the durable behavioural suite already proves private banking identifiers are rejected before writes and absent from stored snapshots. The source guard was narrowed to raw-payload field names without reducing the behavioural privacy evidence. The corrected exact source head then passed completely.

## Known limitation

`components/import-review-foundation.tsx` still contains the behaviour-neutral `reviewRows ?? []` derivation that produces `react-hooks/exhaustive-deps` warnings during lint. The safe correction is to memoise the derived empty array against `reviewRows`. That isolated source patch remains separate from this test-and-documentation package and must not be combined with unrelated import changes.

## Remaining gates

- final documentation-head Vercel confirmation;
- no unresolved review threads;
- authenticated synthetic Preview/browser review for the broader stacked UI work;
- GitHub Application Verification after eventual dependency merge and retargeting to `main`;
- ordered merge of PRs #231–#257 and their dependencies;
- explicit material-schema approval before merchant identity merge;
- explicit approval before Production migration, provider, Apple or real-user action.

## Next action

Confirm the final documentation head against the unchanged application pipeline. After this package is green, continue with another independently safe Phase C3/C4 contract or implementation whose financial, privacy, schema and professional-review dependencies are satisfied.
