# Phase C4 Everyday Financial-Year Aggregation Summary

Date: 26 July 2026  
Status: pure server aggregation helper implemented and exact executable head verified  
Master-plan alignment: C4.2 — pure no-schema financial-year aggregation  
Stacked dependency: PR #262 → PR #260 → PR #259 and all earlier activation/master-plan dependencies

## Objective

Implement only the pure server-side Australian financial-year everyday aggregation helper defined by PR #262.

This slice deliberately excludes database/store construction, authentication integration, API routes, serializers, report pages, accountant-pack changes, schema, migrations, packages and providers.

The caller must already possess an authenticated user identity and supply a bounded owner-scoped candidate set.

## Files delivered

- `src/server/everyday-financial-year-report.ts`;
- `tests/server/everyday-financial-year-report.test.ts`;
- this summary.

## Report contract

The helper returns a versioned response containing:

- contract `spendgrove.everyday-financial-year-report`;
- version `1`;
- generated timestamp;
- selected Australian financial year;
- AUD and integer-cent declarations;
- Money in counts and cents;
- Money out counts and positive-magnitude cents;
- incoming/outgoing transfer context counts;
- counted Transaction and split-child counts;
- direction-specific Category rows;
- truthful reconciliation diagnostics;
- analytical Loan record count with zero analytical cents added to cashflow;
- neutral organisational-preparation wording.

It does not return profit, surplus, taxable income, deductible total, net return, forecasts or advice metrics.

## Owner isolation

Every supplied record must match the authenticated user ID.

- a cross-user candidate throws `OWNER_SCOPE_VIOLATION` before aggregation;
- the response contains no `crossUserCount` field;
- Production code must not query another user's records to populate diagnostics;
- the fixture's fictional cross-user row proves rejection before the safe owner subset is aggregated.

Parallel PR #263 was closed because it used the superseded direct formula branch. Parallel PR #264 was closed because its diagnostic boundary permitted a cross-user count. PR #265 is the sole authoritative helper package.

## Source modes

### `OWNER_SCOPED_DIAGNOSTIC`

A bounded owner-only candidate set may include period, lifecycle and split-parent exclusions. The helper derives and reconciles:

- input candidate count;
- outside-period count;
- deleted/inactive count;
- split-parent count.

### `ELIGIBLE_ONLY`

The future owner-scoped store supplies only active, in-period, non-parent records.

- unavailable exclusion diagnostics are `null`, not invented zeroes;
- any excluded record causes `ELIGIBLE_SOURCE_VIOLATION`;
- the response states that exclusion counts are unavailable.

## Financial rules implemented

- ending-year validation uses the accepted Australian financial-year schema and boundary helper;
- 1 July and 30 June are included;
- outside-period and inactive/deleted records are excluded only in diagnostic mode;
- split parents are excluded and split children count independently;
- positive INCOME is Money in;
- negative EXPENSE is Money out magnitude;
- TRANSFER remains context only;
- positive refunds remain Money in;
- Category rows are keyed by direction plus Category identity;
- missing Category identity becomes `Uncategorised` with `categoryId: null`;
- Loan analytical records contribute a count only and add exactly zero cents to everyday cashflow;
- all amounts and counts use checked safe-integer arithmetic;
- invalid dates, amounts, types, signs, split roles and analytical counts fail closed;
- no source record is repaired or mutated.

## Reconciliation identities

```text
counted Transactions
= Money in count
+ Money out count
+ transfer context count
```

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

Privacy-safe reason codes cover:

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

Messages contain no source values, IDs, amounts, Category labels, filenames or banking details.

## Automated coverage

Ten tests prove:

1. exact fixture totals and Category rows from the owner-scoped subset;
2. cross-user rejection and absence of `crossUserCount`;
3. truthful unavailable diagnostics for eligible-only input;
4. fail-closed eligible-only source validation;
5. positive-refund and transfer treatment;
6. split and Loan no-double-count treatment;
7. direction-specific and uncategorised Category handling;
8. bounded year/date/amount/type/sign/split/analytical validation;
9. safe-integer overflow protection;
10. neutral bounded response with no private-source or tax-metric expansion.

The eight PR #262 formula-contract tests remain independent and continue to verify the complete fictional fixture and frozen formulas.

## Privacy boundary

Neither the input shape nor output contains raw CSV rows, filenames, narration, merchant names, notes, banking identifiers, Loan references, exact Property addresses, provider payloads, secrets, tax classifications or private audit metadata.

The response contains no source Transaction IDs. Authenticated drilldown remains a later service and UI boundary.

## Exact verification

Exact executable/test head:

`2f8fd10e34bcaffcfd73cd68b3d8e3684dc8743a`

Vercel deployment `dpl_F6hWvUS6UBqqn8ujBktJ4TtDEtjL` is READY and passed:

- framework dependency verification;
- **155 test files / 973 tests**;
- all ten C4.2 tests;
- all eight inherited C4.1 formula-contract tests;
- all inherited application tests;
- optimized Next.js compilation;
- TypeScript and lint validation;
- route generation and serverless deployment.

The final branch commit only records this evidence summary. It does not change executable code or tests. Vercel's free daily deployment limit prevented a redundant documentation-only build; this is an external capacity condition rather than an application failure.

The only lint output on the green executable head remains the separately documented behaviour-neutral Import Review memoisation warning.

## Repository impact

Relative to PR #262, the package adds one pure server helper, one server test file and this summary.

No change to Prisma schema, migrations, database state or queries, API routes, pages, serializers, accountant-pack files, packages, lockfiles, workflows, Vercel/Neon/Clerk settings, providers, secrets, Production, Expo, Apple, TestFlight, pricing or real users.

## Remaining C4 sequence

1. authenticated owner-scoped store/service using `ELIGIBLE_ONLY`;
2. formula-safe everyday and Category serializers;
3. reconciliation serializer;
4. authenticated routes;
5. existing-navigation report page and accessibility;
6. accountant-pack version 2;
7. consolidated C4 QA and professional wording package.

Each remains a separate focused review boundary.

This slice does not authorise query/store implementation, authentication or routes, exports, UI, accountant-pack contract changes, tax grouping, schema, migrations, providers, secrets, Production, document/OCR, Apple or real-user actions.