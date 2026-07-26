# Phase C4 Everyday Financial-Year Aggregation Summary

Date: 26 July 2026  
Status: core pure aggregation helper exact-head verified; additional source-mode and Category-identity hardening pending exact-head deployment capacity  
Master-plan alignment: C4.2 — pure no-schema financial-year aggregation  
Stacked dependency: PR #262 → PR #260 → PR #259 and all earlier activation/master-plan dependencies

## Objective

Implement the pure server-side Australian financial-year everyday aggregation boundary defined by PR #262, then keep optional hardening separate from the already-green core implementation.

This work deliberately excludes:

- database/store construction;
- authentication integration;
- API routes;
- CSV or reconciliation serializers;
- report pages;
- accountant-pack changes;
- schema, migration, package or provider work.

The caller must already hold an authenticated user ID and supply a bounded owner-scoped record set.

## Core helper — PR #265

The exact green core head is:

`2f8fd10e34bcaffcfd73cd68b3d8e3684dc8743a`

Files:

- `src/server/everyday-financial-year-report.ts`;
- `tests/server/everyday-financial-year-report.test.ts`.

The helper returns:

- versioned contract metadata;
- generated timestamp;
- selected Australian financial year;
- AUD and integer-cent declarations;
- Money in counts and cents;
- Money out counts and positive-magnitude cents;
- incoming/outgoing transfer context counts;
- counted Transaction and split-child counts;
- direction-specific Category rows;
- truthful reconciliation diagnostics;
- analytical Loan record count with zero analytical component cents added to cashflow;
- neutral organisational-preparation wording.

It does not return profit, surplus, taxable income, deductible total, net return or any tax/advice metric.

### Core financial rules

- accepted Australian financial-year validation;
- 1 July and 30 June inclusion;
- outside-period, inactive/deleted and split-parent exclusion in bounded owner diagnostic mode;
- active split-child inclusion;
- positive INCOME as Money in;
- negative EXPENSE as Money out;
- TRANSFER as context only;
- positive refunds remain Money in;
- Category rows keyed by direction plus Category identity;
- unavailable Category identity becomes `Uncategorised`;
- checked safe-integer arithmetic;
- Loan analytical records contribute a count only and zero cashflow cents;
- invalid date, amount, type, sign and split state fail closed.

### Owner isolation

- every supplied record must match the authenticated user ID;
- any cross-user candidate fails immediately with `OWNER_SCOPE_VIOLATION`;
- the response has no cross-user diagnostic field;
- Production must not query another user's records merely to construct report diagnostics.

### Core verification

Vercel deployment `dpl_F6hWvUS6UBqqn8ujBktJ4TtDEtjL` is READY for the exact core head and passed:

- framework dependency verification;
- **155 test files / 973 tests**;
- all ten core aggregation tests;
- the eight independent PR #262 formula-contract tests;
- the complete inherited application suite;
- optimized Next.js compilation;
- TypeScript and lint validation;
- route generation and serverless deployment.

The only lint output remains the separately documented behaviour-neutral Import Review memoization warnings.

## Additional hardening child

The hardening branch adds only:

- explicit source-mode allowlisting and `SOURCE_MODE_INVALID`;
- fail-closed detection when one direction/Category identity is supplied with conflicting labels;
- two focused tests for those boundaries;
- this permanent evidence summary.

It changes no report formula, source eligibility, monetary result, query, route or persistence behaviour.

The hardening source/test head before this evidence update was:

`b771c75ab158493d4f84a3022b12588bb6efc648`

Expected final baseline:

- **156 test files / 975 tests**;
- framework dependency verification;
- TypeScript and lint;
- optimized Next.js build;
- route generation and serverless deployment.

Vercel could not run that later exact head because the free-account daily deployment limit had been reached. This is an external capacity gate, not an application failure. Do not merge the hardening child until a later exact-head run is green.

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

For bounded owner diagnostic input:

```text
input owner candidates
= counted Transactions
+ outside-period exclusions
+ deleted/inactive exclusions
+ split-parent exclusions
```

## Privacy boundary

Neither the input nor output contains:

- raw CSV rows or filenames;
- narration or descriptions;
- merchant history;
- account, BSB, card, customer or Loan references;
- exact Property addresses;
- provider payloads;
- secrets;
- private audit metadata.

The output contains no source Transaction IDs. Authenticated source drilldown remains a later service/UI review boundary.

## Repository and environment impact

No change to:

- Prisma schema or migrations;
- database state;
- API routes;
- existing report pages or exports;
- package or lockfile;
- workflow configuration;
- Vercel, Neon or Clerk configuration;
- providers or secrets;
- Production;
- Expo, Apple, TestFlight, pricing or real users.

## Remaining C4 sequence

After the hardening child receives exact-head verification:

1. authenticated owner-scoped store/service using the core helper;
2. formula-safe everyday and Category serializers;
3. reconciliation serializer;
4. existing-navigation report page and accessibility;
5. accountant-pack version 2;
6. consolidated C4 QA and professional wording package.

Each remains a separate focused review boundary.