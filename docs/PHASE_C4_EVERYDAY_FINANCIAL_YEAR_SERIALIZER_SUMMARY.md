# Phase C4 Everyday Financial-Year Serializer Summary

Date: 26 July 2026  
Status: pure everyday and Category CSV serializers implemented; exact-head verification pending  
Master-plan alignment: C4.4 — formula-safe everyday/Category exports  
Stacked dependency: PR #266 → PR #265 → PR #262 → PR #260 → PR #259 and earlier gates

## Delivered

- `src/server/everyday-financial-year-report-output.ts`;
- `tests/server/everyday-financial-year-report-output.test.ts`;
- this summary.

## Scope

Two pure serializers:

- everyday financial-year summary CSV;
- financial-year Category CSV.

No service query, API route, download response, reconciliation serializer, UI or accountant-pack change is included.

## Everyday summary CSV

Columns:

- `financial_year`;
- `direction`;
- `record_count`;
- `total_aud`;
- `spendgrove_notice`.

Rows:

- Money in;
- Money out;
- Incoming transfer context;
- Outgoing transfer context.

Transfer amount cells remain blank because C4.1 does not authorise a transfer amount total. Blank is truthful; `0.00` would imply a calculated zero amount.

## Category CSV

Columns:

- `financial_year`;
- `direction`;
- `category`;
- `record_count`;
- `total_aud`;
- `spendgrove_notice`.

Rows preserve the deterministic Category order produced by the verified C4.2 helper. Category IDs and Transaction IDs are not exported.

## Financial safety

- report contract/version, AUD and integer-cent declarations are validated;
- counts and totals must be non-negative safe integers;
- transfer counts must reconcile;
- counted Transactions must reconcile to Money in, Money out and transfer context;
- Category counts and cents must reconcile separately by direction;
- money converts from integer cents only at serialization;
- AUD values use exactly two decimals and no locale separators;
- no floating-point financial authority is introduced.

Invalid or unreconciled input fails closed with a privacy-safe serializer reason code.

## CSV safety

- deterministic columns and row order;
- all cells quoted;
- embedded quotes doubled;
- CRLF row boundaries;
- no trailing row;
- Category labels beginning `=`, `+`, `-` or `@` receive a leading apostrophe;
- neutral record-keeping notice on every row.

## Privacy boundary

Outputs contain no:

- Transaction or Category IDs;
- raw CSV rows or filenames;
- narration, merchant history or notes;
- account, BSB, card, customer or Loan references;
- Property addresses;
- provider payloads, secrets or audit metadata.

## Tests

Six tests cover:

1. exact everyday summary rows and blank transfer amounts;
2. deterministic direction-separated Category rows without internal IDs;
3. formula protection and CSV quoting;
4. deterministic CRLF output;
5. unsupported contract rejection;
6. invalid/unreconciled value rejection.

Expected baseline:

- **157 test files / 986 tests**;
- framework verification;
- TypeScript/lint;
- optimized Next.js build;
- route/serverless generation.

## Boundaries

No change to formulas, stored data, Transaction/Category/Loan records, schema, migrations, routes, UI, accountant pack, packages, providers, environments, Production, Expo or Apple.

## Next

After exact-head green:

1. reconciliation serializer only;
2. authenticated routes;
3. Reports UI/accessibility;
4. accountant-pack v2;
5. consolidated QA/professional wording.
