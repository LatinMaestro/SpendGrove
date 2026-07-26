# Phase C1 Consolidated Transaction Regression Summary

Date: 26 July 2026  
Status: consolidated automated guard and review matrix technically verified; authenticated browser review and ordered dependency merge remain outstanding  
Master-plan alignment: C1.5  
Stacked dependency: PR #251 → PR #250 → PR #249 → PR #247 → PR #246 → PR #244 → PR #243 → PR #242 → unresolved activation stack #231–#241

## Objective

Create one durable regression package connecting the accepted transaction financial rules, responsive ledger behaviour, privacy boundaries and existing automated suites.

## Delivered

- `PHASE_C1_TRANSACTION_REGRESSION_MATRIX.md`:
  - controlling transaction rules;
  - implementation-to-test traceability;
  - automated release checks;
  - authenticated synthetic interaction matrix;
  - financial reconciliation dataset and expected totals;
  - privacy-safe evidence rules;
  - Phase C1 exit criteria.
- `tests/phase-c1-transaction-regression-package.test.ts`:
  - seven consolidated source-boundary guards covering durable reads, everyday eligibility, import commit, transfer linking, bulk operations, Activity history and responsive ledger behaviour.

## Boundaries preserved

No application feature or financial calculation is changed by this package.

No change to:

- transaction queries or ordering;
- signed direction, split, transfer, import, duplicate or Loan reconciliation rules;
- API routes or ownership;
- account export or deletion;
- Prisma schema or migration files;
- packages or lockfile;
- provider, secret or environment configuration;
- Production;
- Apple, Expo, TestFlight or real users.

## Regression focus

The package makes the following cross-feature rules explicit:

- active durable reads are owner-scoped and exclude deleted records and split parents;
- everyday spending includes negative active expenses and excludes transfers and split parents;
- import commit retains reviewed Import, Skip and Merge paths, privacy sanitization and direction compatibility;
- transfer pairs require exact opposite amounts, one unique candidate and a two-day Australian calendar boundary;
- bulk operations remain fail-closed at baseline, bounded, direction-aware, partial-failure safe and time-limited for undo;
- Activity history returns allowlisted summaries rather than raw metadata;
- ledger filters remain transient, responsive and presentation-only;
- Loan reconciliation retains the everyday Transaction as the sole cashflow record.

## Automated verification

Verified source head: `ad1c5feea633fb7a565833ac74e8cb197ee40b9a`  
Vercel deployment: `dpl_8VEo4Ljd6d7hWR8Dg4Zuqnk1LoFM` — READY

Evidence:

- framework dependency verification passed;
- **148 test files / 917 tests** passed;
- all seven new consolidated C1.5 guards passed;
- existing manual/imported transaction, split, transfer, bulk, Activity-history, Loan-reconciliation, chart, ledger, ownership, export/deletion and privacy suites passed;
- optimized Next.js compilation passed;
- TypeScript and lint validity completed with only the pre-existing hook warnings in unrelated files;
- route generation, serverless output and deployment completed.

The initial guard used a whitespace-sensitive assertion for an already owner-scoped bulk Category lookup. It was corrected to verify the semantic `id` and `userId` fields independently. No application or financial behaviour changed.

GitHub Application Verification did not run because this pull request targets a stacked non-`main` base. It remains required after dependency merge and retargeting.

Authenticated synthetic browser review remains required against the committed matrix before Phase C1 can be recommended for closure.

## Known limitations

- The package is a regression and evidence layer; it does not replace behavioural service tests.
- Bulk and durable transfer user-interface review remains dependent on the activation stack.
- Durable saved views remain behind the separate explicit material schema gate.
- Connected tools still cannot establish an authenticated synthetic Clerk session for visual interaction QA.
- Phase C1 cannot close until the activation stack and stacked dependencies are merged in order and merged-main checks pass.

## Next safe action

Continue independent Phase C2/C3 implementation where verified synthetic format evidence exists, or begin the no-schema merchant merge/history contract if no parser structure is sufficiently proven.

Do not merge this package ahead of PR #250 or claim Phase C1 closure before the authenticated and ordered-merge gates pass.
