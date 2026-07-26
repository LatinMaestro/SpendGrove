# Phase C4 Everyday Financial-Year Aggregation Summary

Date: 26 July 2026  
Status: pure server aggregation helper and fixture-driven tests implemented; exact-head verification pending  
Master-plan alignment: C4.2 — pure no-schema financial-year aggregation  
Stacked dependency: PR #262 → PR #260 → PR #259 and all earlier activation/master-plan dependencies

## Objective

Implement only the pure, server-side Australian financial-year everyday aggregation helper defined by PR #262.

This slice deliberately excludes:

- database/store construction;
- authentication integration;
- API routes;
- CSV or reconciliation serializers;
- report pages;
- accountant-pack changes;
- schema, migration, package or provider work.

The caller must already have an authenticated user identity and must supply a bounded owner-scoped candidate set.

## Files delivered

- `src/server/everyday-financial-year-report.ts`;
- `tests/server/everyday-financial-year-report.test.ts`;
- this summary.

## Report contract

The helper returns a versioned response:

- contract: `spendgrove.everyday-financial-year-report`;
- version: `1`;
- generated timestamp;
- selected Australian financial year;
- AUD and integer-cent declarations;
- Money in counts and cents;
- Money out counts and positive-magnitude cents;
- incoming/outgoing transfer context counts;
- counted Transaction and split-child counts;
- direction-specific Category rows;
- truthful reconciliation diagnostics;
- analytical Loan record count with zero component cents added to cashflow;
- neutral organisational-preparation disclaimer.

It does not return profit, surplus, taxable income, deductible total, net return or any tax/advice metric.

## Owner-isolation hardening

The abandoned parallel aggregation branch allowed a synthetic full-diagnostic mode to count cross-user candidates.

This dependency-correct implementation deliberately tightens the production boundary:

- every supplied record must match the authenticated user ID;
- any cross-user candidate throws `OWNER_SCOPE_VIOLATION` immediately;
- the response has no `crossUserCount` field;
- a production caller must not query another user's records merely to populate reconciliation diagnostics.

The controlling fixture's fictional cross-user row remains useful in tests: it proves rejection before the safe owner subset is aggregated.

## Source modes

### `OWNER_SCOPED_DIAGNOSTIC`

The helper receives a bounded owner-only candidate set and may derive:

- input candidate count;
- outside-period count;
- deleted/inactive count;
- split-parent count.

Those counts reconcile exactly to counted records.

### `ELIGIBLE_ONLY`

The helper receives only active, in-period, non-parent owner records.

- exclusion diagnostics are `null` rather than invented as zero;
- any excluded record causes `ELIGIBLE_SOURCE_VIOLATION`;
- the response explains that exclusion counts are unavailable.

## Financial rules implemented

- Australian FY ending-year validation uses the accepted shared financial-year helper;
- 1 July and 30 June are included;
- outside-period records are excluded in diagnostic mode;
- inactive/deleted records are excluded in diagnostic mode;
- split parents are excluded;
- split children count independently;
- positive INCOME is Money in;
- negative EXPENSE is Money out;
- TRANSFER is context only;
- positive refunds remain Money in;
- Category rows are keyed by direction plus Category identity;
- missing Category identity becomes `Uncategorised` with `categoryId: null`;
- Loan analytical records contribute a count only and add exactly zero cents to everyday cashflow;
- all amounts and counts use checked safe-integer arithmetic;
- type/sign mismatches, zero amounts and unsupported split roles fail closed.

## Reconciliation identities

The helper proves:

```text
counted Transactions
= Money in count
+ Money out count
+ transfer context count
```

and:

```text
sum Money in Category counts = Money in count
sum Money out Category counts = Money out count
sum Money in Category cents = Money in cents
sum Money out Category cents = Money out cents
```

For owner-scoped diagnostic input:

```text
input owner candidates
= counted Transactions
+ outside-period exclusions
+ deleted/inactive exclusions
+ split-parent exclusions
```

## Error model

The helper returns privacy-safe reason codes for:

- missing authenticated user;
- invalid financial year;
- invalid generation time;
- owner-scope violation;
- invalid date;
- zero/unsafe amount;
- unsupported type;
- type/sign mismatch;
- unsupported split role;
- eligible-only source violation;
- invalid analytical Loan count;
- total overflow;
- Category reconciliation mismatch;
- count reconciliation mismatch.

Error messages contain no record content, amounts, Category names, source IDs or private fields.

## Automated coverage

Ten new tests prove:

1. exact fixture totals and Category rows from the safe owner subset;
2. cross-user rejection and absence of `crossUserCount`;
3. truthful unavailable diagnostics for eligible-only input;
4. fail-closed eligible-only source validation;
5. positive-refund and transfer treatment;
6. split and Loan no-double-count treatment;
7. direction-specific and uncategorised Category handling;
8. financial-year/date/amount/type/sign/split/analytical-count validation;
9. overflow failure;
10. neutral bounded response with no private-source or tax-metric expansion.

The original eight PR #262 formula-contract tests remain independent and continue to validate the complete 16-row fictional fixture and formula contract.

## Privacy boundary

Neither the input shape nor output contains:

- raw CSV rows or filenames;
- narration or descriptions;
- merchant history;
- account, BSB, card, customer or Loan references;
- exact Property addresses;
- provider payloads;
- secrets;
- private audit metadata.

The output contains no source Transaction IDs. Authenticated source drilldown remains a later service/UI review boundary.

## Repository impact

No change to:

- Prisma schema or migrations;
- database state;
- API routes;
- existing report pages or formulas;
- package or lockfile;
- workflow configuration;
- Vercel, Neon or Clerk configuration;
- providers or secrets;
- Production;
- Expo, Apple, TestFlight, pricing or real users.

## Expected verification

The branch should pass the PR #262 baseline plus one new test file and ten new tests:

- **155 test files / 973 tests**;
- framework dependency verification;
- TypeScript and lint;
- optimized Next.js build;
- route generation and serverless deployment.

Only the previously documented Import Review memoization warnings are expected.

## Remaining C4 sequence

After exact-head verification:

1. authenticated owner-scoped store/service using this helper;
2. formula-safe everyday and Category serializers;
3. reconciliation serializer;
4. existing-navigation report page and accessibility;
5. accountant-pack version 2;
6. consolidated C4 QA and professional wording package.

Each remains a separate focused review boundary.

## Hard stops

This PR does not authorise:

- query/store implementation;
- authentication or routes;
- exports or UI;
- accountant-pack contract changes;
- tax grouping or advice;
- schema or migration;
- provider, secret or environment changes;
- Production, document/OCR, Apple or real-user action.