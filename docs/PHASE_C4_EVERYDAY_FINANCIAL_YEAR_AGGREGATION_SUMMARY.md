# Phase C4 Everyday Financial-Year Aggregation Summary

Date: 26 July 2026  
Status: pure server aggregation and focused tests prepared; exact-head verification pending  
Master-plan alignment: C4.2 — no-schema everyday financial-year reporting implementation  
Governing contract: PR #261  
Stacked dependency: PR #261, PR #259 and all earlier activation/master-plan dependencies

## Objective

Implement the first runtime boundary authorised by the exact-green C4.1 formula contract: a pure server-side aggregation helper and safe versioned response types.

This slice does not access a database, authenticate a session, expose a route, serialize a CSV, render a page or modify the accountant preparation pack.

## Files delivered

- `src/server/everyday-financial-year-report.ts`;
- `tests/server/everyday-financial-year-report.test.ts`;
- this summary.

The controlling synthetic fixture and formula contract remain in PR #261.

## Public module contract

The module exports:

- `EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT`;
- `EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION`;
- safe candidate-record, direction, Category-row and report response types;
- `EverydayFinancialYearReportError` with bounded reason codes;
- `buildEverydayFinancialYearReport()`.

The response is versioned and declares:

- Australian financial-year boundaries;
- AUD currency;
- integer-cent money representation;
- Money in totals/counts;
- Money out totals/counts;
- incoming/outgoing transfer context;
- counted Transaction and split-child counts;
- direction-separated Category rows;
- truthful reconciliation diagnostics;
- a neutral no-tax/no-advice disclaimer.

It does not include profit, surplus, taxable income, deductible total, net return or provider-derived data.

## Eligibility implementation

The helper evaluates candidate records in the frozen order:

1. owner match;
2. valid date-only value and selected financial year;
3. active/non-deleted state;
4. split-parent exclusion;
5. safe non-zero integer-cent amount;
6. supported Transaction type;
7. type/sign compatibility;
8. transfer precedence or Money in/Money out aggregation;
9. direction-plus-Category grouping;
10. checked reconciliation.

No record is mutated or repaired.

## Diagnostic source modes

### FULL_DIAGNOSTIC

Used for the controlling synthetic fixture or a future bounded server candidate set.

It returns actually derived counts for:

- input candidates;
- outside-period exclusions;
- deleted/inactive exclusions;
- split-parent exclusions;
- cross-user exclusions.

The helper verifies:

```text
input candidates = counted records + all exclusion counts
```

### ELIGIBLE_ONLY

Intended for a future owner-scoped database query that already filters by period, status and split role.

It:

- returns `null` rather than inventing unavailable exclusion counts;
- states that only eligible records were supplied;
- fails closed if a cross-user, outside-period, inactive/deleted or split-parent record appears unexpectedly.

This makes the future store/query boundary independently testable.

## Financial implementation

### Money in

- positive `INCOME` only;
- signed positive integer cents summed with overflow checks.

### Money out

- negative `EXPENSE` only;
- absolute integer-cent magnitudes summed with overflow checks.

### Transfers

- `TRANSFER` type takes reporting precedence;
- separate incoming/outgoing counts;
- excluded from Money in, Money out and Category totals.

### Refunds

A positive reviewed refund remains Money in under the existing direction rule. The helper does not inspect narration or net the amount against an expense Category.

### Splits

- split parents excluded;
- split children counted independently;
- no split repair or recalculation.

### Loans

The helper accepts only everyday Transaction candidates. It has no LoanRepayment input and therefore cannot add analytical principal, interest or fees to cashflow.

The response explicitly states that Loan repayment components remain analytical and are not added to everyday cashflow.

## Category implementation

Category identity uses:

```text
direction + categoryId
```

This prevents same-named Money in and Money out Categories from being combined.

When Category ID or safe label is unavailable, the row becomes:

- `categoryId: null`;
- `categoryName: "Uncategorised"`;
- unchanged financial direction and amount.

Rows are deterministic:

1. Money in before Money out;
2. descending amount within direction;
3. Australian-locale label;
4. Category ID tie-breaker.

Category counts and totals are reconciled back to the Money in and Money out summaries before a response is returned.

## Safety and error handling

Bounded reason codes cover:

- missing authenticated owner ID;
- invalid generation date;
- invalid source date;
- zero/unsafe amount;
- unsupported type;
- sign/type mismatch;
- eligible-source contract violation;
- integer overflow;
- Category reconciliation mismatch;
- count reconciliation mismatch.

Messages contain no source value, record ID, amount, Category, filename or banking information.

The helper reuses the existing Australian financial-year schema and boundary function.

## Automated tests

Nine focused behavioural tests prove:

1. exact reproduction of the controlling 16-record synthetic fixture;
2. positive-refund and transfer separation;
3. split-child and Loan no-double-count behaviour;
4. truthful `ELIGIBLE_ONLY` unavailable diagnostics;
5. fail-closed eligible-source violations;
6. invalid date, amount, type and sign handling;
7. safe-integer overflow protection;
8. direction-specific Category identity and uncategorised treatment;
9. bounded neutral response and prohibited-field exclusion.

The expected exact branch baseline is:

- **154 test files / 966 tests**;
- framework dependency verification;
- TypeScript and lint;
- optimized Next.js build;
- route generation and serverless deployment.

Only the separately existing Import Review memoization warnings are expected.

## Privacy boundary

The helper input deliberately excludes:

- descriptions and bank narration;
- merchant names;
- notes;
- raw CSV rows and filenames;
- account, BSB, card, customer or Loan identifiers;
- Property addresses;
- provider payloads;
- tax classifications;
- private audit metadata.

The response contains only the minimum safe report totals, Category display values, counts, period metadata and neutral notices.

No logging, analytics or provider call was added.

## Schema and environment impact

No change to:

- Prisma schema or migrations;
- database state or queries;
- API routes;
- application pages;
- CSV serializers;
- accountant-pack version or files;
- packages or lockfile;
- workflows;
- providers, secrets or environments;
- Production;
- Expo, Apple, TestFlight, pricing or real users.

## Remaining implementation sequence

After this pure helper is exact-head green:

1. create an authenticated owner-scoped store/service boundary;
2. prove query/helper reconciliation and negative ownership tests;
3. create formula-safe cashflow and Category serializers;
4. create a reconciliation serializer;
5. add authenticated routes;
6. add the existing-navigation report page and accessibility evidence;
7. update the accountant pack through a separate versioned contract;
8. complete consolidated C4 QA and professional terminology review.

Store, serializers, routes and UI must remain separate focused review boundaries rather than being hidden in this PR.

## Remaining gates

- exact-head tests, TypeScript, lint, optimized build and Vercel Preview;
- no unresolved review threads;
- authenticated synthetic browser QA for later UI work;
- executable GitHub Actions after eventual retargeting to `main`;
- ordered integration of sibling PR #260 and contract PR #261;
- qualified Australian tax/accounting terminology review;
- explicit approval before schema, provider, Production or Apple actions.

## Next action

After green verification, implement the authenticated owner-scoped C4.3 report store and service using `ELIGIBLE_ONLY` input. Do not add serializers, routes, UI or accountant-pack fields in that store-focused PR.

No stop condition is triggered by this pure existing-schema helper.
