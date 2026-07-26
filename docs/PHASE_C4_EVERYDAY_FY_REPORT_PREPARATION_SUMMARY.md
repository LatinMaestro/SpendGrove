# Phase C4 Everyday Financial-Year Report Preparation Summary

Date: 26 July 2026  
Status: no-schema formula contract, synthetic fixture and reference tests prepared; exact-head verification pending  
Master-plan alignment: C4.1 — everyday financial-year cashflow, Category reporting and reconciliation  
Stacked dependency: PR #259 and all earlier Phase C, master-plan and activation dependencies

## Objective

Freeze the exact source selection, direction, split, transfer, refund, Category, reconciliation, privacy and export formulas before adding a financial-year everyday report to the application.

No application aggregation, route, page, export serializer, accountant-pack version change, schema or provider is included in this package.

## Files delivered

- `docs/PHASE_C4_EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT.md`;
- `tests/fixtures/phase-c4-everyday-fy-reconciliation.json`;
- `tests/phase-c4-everyday-fy-contract.test.ts`;
- this summary.

## Formula decisions

### Source records

The future report uses authenticated owner-scoped durable Transactions.

It excludes:

- cross-user rows;
- records outside the selected Australian financial year;
- inactive or deleted rows;
- split parents.

It counts active split children.

### Direction

- valid positive `INCOME` is Money in;
- valid negative `EXPENSE` is Money out;
- `TRANSFER` is context only regardless of positive or negative sign;
- non-transfer type/sign mismatches fail closed;
- zero or unsafe integer-cent amounts fail closed.

### Positive refunds

A positive refund is a direction-compatible Money in record. It does not reduce the prior Money out Category.

### Category totals

Rows are keyed by both direction and Category ID.

The same label in opposite directions cannot be netted. Uncategorized records remain visible within their direction.

### Loan cashflow

The everyday Transaction is counted once. Linked LoanRepayment principal, interest and fee components remain analytical and are never added to everyday Money out.

### Reconciliation

When a full diagnostic candidate set is intentionally queried:

```text
input = counted + outside period + deleted/inactive + split parent + cross-user
counted = Money in + Money out + transfers
```

When Production queries pre-filter excluded rows, the report must not invent zero exclusion counts. Unqueried diagnostics remain explicitly unavailable.

## Synthetic fixture

The controlling fixture is wholly invented and includes:

- 16 candidate Transactions;
- both financial-year boundary dates;
- two adjacent outside-period records;
- three Money in records;
- six Money out records;
- incoming and outgoing transfers;
- one split parent and two split children;
- one deleted row;
- one cross-user row;
- one uncategorised row;
- one everyday Loan payment;
- one linked analytical LoanRepayment.

Expected report:

- 11 counted Transactions;
- Money in: 3 records / 513,000 cents;
- Money out: 6 records / 142,000 cents;
- transfers: 2 records;
- counted split children: 2;
- exclusions: 2 outside period, 1 deleted/inactive, 1 split parent, 1 cross-user;
- Category totals reconcile exactly by direction;
- Loan analytical components add zero to cashflow.

The fixture contains no real bank, lender, user, filename, narration, banking identifier, amount or balance.

## Reference tests

Nine tests prove:

1. the fixture is synthetic and privacy-safe;
2. financial-year boundary inclusion and adjacent-date exclusion;
3. separate Money in, Money out and transfer totals;
4. positive-refund treatment;
5. split-parent exclusion and split-child inclusion;
6. exact Category reconciliation by direction;
7. counted/excluded candidate reconciliation;
8. Loan no-double-count;
9. neutral wording, AUD/integer-cent and formula-safety contract boundaries.

The reference calculator is test-only. It does not create an application feature or establish a second production implementation.

## Proposed future response

The contract proposes a versioned response with:

- financial-year identity;
- AUD/integer-cent declarations;
- Money in and Money out counts/totals;
- transfer counts;
- counted record and split-child counts;
- direction-specific Category rows;
- truthful reconciliation diagnostics;
- neutral disclaimer.

It explicitly excludes profit, surplus, taxable income, deductible total and net return fields.

## Proposed future downloads

Subject to a focused implementation PR:

- everyday financial-year cashflow CSV;
- financial-year Category CSV;
- reconciliation JSON or text.

All future CSVs must use deterministic columns, two decimal places at export only, CRLF rows, quoting and formula-injection protection.

## Financial boundary

No existing formula changes.

The package preserves:

- integer cents;
- Australian financial years;
- signed direction;
- transfer precedence;
- split no-double-count;
- positive refunds as Money in;
- everyday Transactions as sole cashflow;
- Loan analytical no-double-count;
- no tax, Property return, valuation, forecast or advice calculation.

## Privacy and environment boundary

No raw CSV, filename, narration, merchant history, account/BSB/card/customer/Loan reference, Property address, provider payload, secret or private row was added.

No application, API, Prisma, migration, package, lockfile, workflow, provider, secret, environment, Production, Expo or Apple change exists.

## Expected verification

The exact branch should pass:

- **153 test files / 957 tests**;
- framework dependency verification;
- TypeScript and lint;
- optimized Next.js build;
- route generation and serverless deployment.

Only the existing Import Review memoization warnings are expected.

## Next action after green verification

Implement the pure C4.2 aggregation helper and types against this fixture in a focused no-schema PR.

The first implementation must remain server-only and pure. Store queries, serializers, routes and UI should be reviewed as subsequent focused boundaries rather than hidden in one large change.