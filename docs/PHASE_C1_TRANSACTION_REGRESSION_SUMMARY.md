# Phase C1 Consolidated Transaction Regression Summary

Date: 26 July 2026  
Status: consolidated automated guard and review matrix prepared; exact-head verification pending  
Master-plan alignment: C1.5  
Stacked dependency: PR #250 → PR #249 → PR #247 → PR #246 → PR #244 → PR #243 → PR #242 → unresolved activation stack #231–#241

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

## Verification plan

The exact head must pass:

- framework dependency verification;
- full Vitest suite including the new consolidated guard;
- TypeScript and lint validation;
- optimized Next.js build;
- Vercel Preview deployment;
- GitHub Application Verification after retargeting to `main`.

Authenticated synthetic browser review remains required against the committed matrix before Phase C1 can be recommended for closure.

## Known limitations

- The package is a regression and evidence layer; it does not replace behavioural service tests.
- Bulk and durable transfer user-interface review remains dependent on the activation stack.
- Durable saved views remain behind the separate explicit material schema gate.
- Connected tools still cannot establish an authenticated synthetic Clerk session for visual interaction QA.

## Next safe action

After exact-head verification, continue independent Phase C2/C3 implementation where verified synthetic format evidence exists, or begin the no-schema merchant merge/history contract if no parser structure is sufficiently proven.

Do not merge this package ahead of PR #250 or claim Phase C1 closure before the authenticated and ordered-merge gates pass.
