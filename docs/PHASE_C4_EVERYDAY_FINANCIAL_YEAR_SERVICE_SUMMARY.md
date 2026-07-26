# Phase C4 Everyday Financial-Year Service Summary

Date: 26 July 2026  
Status: authenticated owner-scoped read service and synthetic tests implemented; exact-head execution pending hosting capacity  
Master-plan alignment: C4.3 — owner-scoped report store/service  
Stacked dependency: PR #265 → PR #262 → PR #260 → PR #259 and all earlier activation/master-plan dependencies

## Objective

Connect the exact-green pure C4.2 aggregation helper to an authenticated, owner-scoped and existing-schema read service without adding routes, serializers, UI or accountant-pack changes.

## Files delivered

- `src/server/everyday-financial-year-report-service.ts`;
- `tests/server/everyday-financial-year-report-service.test.ts`;
- this summary.

## Service boundary

`getEverydayFinancialYearReport()`:

1. requires a valid `AuthenticatedUserContext` before store access;
2. validates the requested Australian financial-year ending year before store access;
3. derives the exact half-open UTC range from 1 July to the following 1 July;
4. queries Transactions and linked analytical Loan repayments concurrently through a typed store;
5. maps only safe owner-scoped fields into the pure helper;
6. calls the helper in `ELIGIBLE_ONLY` mode;
7. returns the existing versioned C4.2 report without changing its formulas.

No client-supplied total, Category row, Transaction ID list or Loan amount is financial authority.

## Prisma store

The default store queries Transactions with:

- authenticated `userId`;
- `status: ACTIVE`;
- `deletedAt: null`;
- `splitRole != PARENT`;
- `date >= FY start`;
- `date < following 1 July`;
- deterministic date and ID ordering.

It selects only:

- internal Transaction ID for server processing;
- owner ID;
- date;
- type;
- integer-cent amount;
- lifecycle/split state;
- Category relationship fields needed for safe display.

It does not select descriptions, narration, merchant text, notes, import source data, filenames, account details, Property addresses, Loan references or provider fields.

## Category handling

A Category label is passed to the pure helper only when:

- the related Category ID matches the Transaction Category ID;
- the Category belongs to the authenticated user;
- the Category is not deleted.

Otherwise the report uses the existing `Uncategorised` treatment. Archived Categories may retain their historical relationship because archive does not erase accepted Transaction categorisation.

## Analytical Loan count

The store queries only owner Loan repayments that are:

- non-archived;
- non-deleted;
- dated within the selected financial year.

It counts a repayment only when its reconciliation link:

- is active (`unlinkedAt` is null);
- points to a Transaction owned by the same user;
- points to an active, non-deleted, non-parent Transaction;
- points to a Transaction within the selected financial year.

Only the count is passed into the everyday report. Principal, interest, fees, balances and total-payment amounts are never passed to the everyday aggregation helper and add exactly zero cents to cashflow.

## Owner-isolation defence

Ownership is enforced in layers:

- authentication before persistence access;
- owner ID in every Prisma query;
- defensive owner checks when mapping Category relations;
- defensive owner checks when counting linked analytical repayments;
- final pure-helper rejection if any supplied Transaction is cross-user.

No cross-user diagnostic count is returned.

## Automated tests

Six focused tests prove:

1. authentication fails before either store method;
2. invalid FY input fails before either store method;
3. exact owner and half-open date ranges are supplied to both reads;
4. a malicious cross-user store record fails closed;
5. cross-owner or unavailable Category relations become `Uncategorised`;
6. Prisma query shapes preserve owner, lifecycle, split and period filters, while only an active eligible reconciliation link contributes to the analytical count.

The inherited pure helper and formula-contract tests remain unchanged.

## Financial boundary

No change to:

- integer-cent storage or totals;
- Money in/Money out formulas;
- positive-refund treatment;
- transfer context treatment;
- split parent/child treatment;
- Category grouping;
- Loan cashflow no-double-count;
- Australian financial-year boundaries;
- tax or advice posture.

The service performs no write, correction, categorisation, reconciliation, link or report snapshot operation.

## Privacy and security boundary

No raw CSV, filename, narration, merchant history, account/BSB/card/customer/Loan reference, exact Property address, provider payload, secret or private audit metadata is selected, returned, logged, documented or added to fixtures.

The service has no route and therefore creates no new public response surface in this PR.

## Repository impact

No change to:

- Prisma schema or migrations;
- database state;
- existing routes or pages;
- serializers or exports;
- accountant-pack version;
- packages or lockfiles;
- workflows;
- Vercel, Neon or Clerk configuration;
- providers or secrets;
- Production, Expo, Apple, TestFlight, pricing or real users.

## Expected verification

The branch should pass the PR #265 baseline plus one new test file and six tests:

- **156 test files / 979 tests**;
- framework dependency verification;
- TypeScript and lint;
- optimized Next.js build;
- route generation and serverless deployment.

The current Vercel free-account daily deployment limit is already exhausted. Do not create no-op commits or blind retries. Exact-head execution remains required before this PR can merge or the serializer work can begin.

## Remaining C4 sequence

1. exact-head verification of this service when deployment capacity returns;
2. formula-safe everyday and Category serializers;
3. reconciliation serializer;
4. authenticated routes;
5. existing-navigation report page and accessibility;
6. accountant-pack version 2;
7. consolidated C4 QA and professional wording package.

This slice does not authorise routes, exports, UI, accountant-pack changes, tax grouping, schema, migrations, providers, secrets, Production, document/OCR, Apple or real-user actions.