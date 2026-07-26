# Phase C4 Everyday Financial-Year Service Summary

Date: 26 July 2026  
Status: authenticated owner-scoped read service and synthetic tests implemented; corrected exact head awaiting execution  
Master-plan alignment: C4.3 — owner-scoped report store/service  
Stacked dependency: PR #265 → PR #262 → PR #260 → PR #259 and earlier gates

## Delivered

- `src/server/everyday-financial-year-report-service.ts`;
- `tests/server/everyday-financial-year-report-service.test.ts`;
- this summary.

## Service boundary

`getEverydayFinancialYearReport()`:

1. requires `AuthenticatedUserContext`;
2. validates the Australian financial year;
3. validates generation time;
4. completes all three checks before constructing/accessing the default store;
5. uses the half-open UTC range from 1 July to the following 1 July;
6. runs two owner-scoped reads concurrently;
7. calls the C4.2 helper in `ELIGIBLE_ONLY` mode.

No client total, Category row, Transaction list or Loan amount is financial authority.

## Transaction query

Required filters:

- authenticated `userId`;
- `status: ACTIVE`;
- `deletedAt: null`;
- `splitRole != PARENT`;
- `date >= FY start`;
- `date < following 1 July`;
- deterministic date/ID ordering.

Selected fields are limited to internal ID, owner, date, type, integer cents, lifecycle/split state and Category relationship fields.

Descriptions, narration, merchant text, notes, import details, filenames, banking identifiers, Property details and Loan references are not selected.

## Category defence

A Category label is retained only when:

- relation ID matches `categoryId`;
- Category belongs to the authenticated user;
- Category is not deleted.

Otherwise it becomes `Uncategorised`. Archived Categories may retain historical labels because archive does not erase accepted categorisation.

## Analytical Loan count

The query requires:

- repayment owner matches authenticated user;
- `reconciliationStatus: LINKED`;
- repayment is non-archived/non-deleted;
- repayment date is within the FY;
- Loan Account belongs to the authenticated user;
- reconciliation link belongs to the authenticated user and is active;
- linked Transaction belongs to the authenticated user;
- linked Transaction is active, non-deleted, non-parent and within the same FY.

The selected repayment shape excludes payment, principal, interest, fee, balance and Loan-reference values. Only the accepted count enters the report and adds zero cashflow cents.

The store defensively rechecks repayment, Loan Account, link and linked-Transaction ownership/lifecycle before counting returned rows.

## Owner isolation

Enforced by:

- authentication before persistence access;
- FY/timestamp validation before persistence access;
- owner filters in every query/relation;
- Category relation checks;
- Loan Account/link/Transaction checks;
- final helper rejection of any cross-user Transaction.

No cross-user diagnostic count is returned.

## Tests

Seven tests prove:

1. authentication blocks both reads;
2. default-store construction follows authentication/FY/timestamp preflight;
3. invalid FY or timestamp blocks both reads;
4. exact owner and half-open period reach both reads;
5. malicious cross-user Transaction results fail closed;
6. cross-owner/deleted/unavailable Categories become `Uncategorised` without label leakage;
7. Prisma queries preserve owner, lifecycle, `LINKED`, Loan Account, link, linked-Transaction, split and date filters; private Transaction and Loan-component fields remain unselected; only one valid analytical link is counted.

Inherited C4.1/C4.2 tests remain unchanged.

## Boundaries

No change to financial formulas, Transactions, Categories, Loan reconciliation, links, writes, schema, migrations, routes, serializers, CSVs, UI, accountant-pack version, packages, providers, environments, Production, Expo or Apple.

No raw CSV, filename, narration, merchant history, banking identifier, Loan reference, Property address, provider payload, secret or private audit metadata is selected, returned or logged.

## Verification history

Vercel deployment `dpl_3mPREQzRBC8tWxpYY33QTGHYEdAx` executed commit `f4b926a851459c3c2f462025fe55229ec38b5b06` and failed one synthetic test because its accepted linked-repayment fixture omitted newly required owner/link fields. The failure was test-fixture drift, not a report formula or service-query defect.

The current branch fixes that fixture and adds:

- generation-time preflight before store construction;
- Loan Account ownership checks;
- reconciliation-link ownership checks;
- linked-Transaction ownership/lifecycle checks;
- explicit private-field-minimisation assertions.

Expected corrected baseline:

- **156 test files / 980 tests**;
- framework verification;
- TypeScript/lint;
- optimized Next.js build;
- route/serverless generation.

One exact execution of the corrected head is required before merge or serializer work. Inspect build logs; do not classify a failed deployment as capacity-only without evidence.

## Next

After one exact-head green run:

1. everyday/Category formula-safe serializers;
2. reconciliation serializer;
3. authenticated routes;
4. Reports UI/accessibility;
5. accountant-pack v2;
6. consolidated QA/professional wording.
