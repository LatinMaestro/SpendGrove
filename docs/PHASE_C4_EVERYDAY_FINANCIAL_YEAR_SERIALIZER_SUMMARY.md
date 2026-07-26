# Phase C4 Everyday Financial-Year Serializer Summary

Date: 26 July 2026  
Status: pure everyday and Category CSV serializers implemented and exact executable head verified  
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

## Outputs

Summary columns:

- `financial_year`;
- `direction`;
- `record_count`;
- `total_aud`;
- `spendgrove_notice`.

Summary rows are Money in, Money out, incoming transfer context and outgoing transfer context. Transfer amount cells remain blank because no transfer amount total is authorised.

Category columns:

- `financial_year`;
- `direction`;
- `category`;
- `record_count`;
- `total_aud`;
- `spendgrove_notice`.

Category IDs and Transaction IDs are not exported.

## Financial safety

- validates contract/version, AUD and integer cents;
- validates non-negative safe-integer counts and totals;
- requires zero counts to have zero totals and non-zero counts to have non-zero totals;
- rejects empty zero-count/zero-value Category rows;
- reconciles transfer counts;
- reconciles counted Transactions to Money in, Money out and transfer context;
- reconciles Category counts and cents separately by direction;
- converts integer cents to exactly two-decimal AUD only at serialization;
- introduces no floating-point financial authority.

Invalid or unreconciled input fails closed with privacy-safe reason codes.

## CSV and privacy safety

- deterministic columns and row order;
- all cells quoted;
- embedded quotes doubled;
- CRLF rows with no trailing row;
- Category labels beginning `=`, `+`, `-` or `@` receive a leading apostrophe;
- no Transaction/Category IDs, raw rows, filenames, narration, merchant history, notes, banking identifiers, Loan references, Property addresses, provider payloads, secrets or audit metadata.

## Tests

Seven tests cover:

1. exact summary rows and blank transfer amounts;
2. deterministic direction-separated Category rows without IDs;
3. formula protection and quoting;
4. deterministic CRLF output;
5. unsupported contract rejection;
6. invalid/unreconciled value rejection;
7. impossible count/total pairs and empty Category-row rejection.

## Exact verification

Executable/test head: `aa9e76cb6de8297b68412259d842fab2f4cd61ca`  
Vercel deployment: `dpl_C6iCH1yHzVBWEKnG9LxZzqDPFDxZ`  
State: READY

Passed:

- framework dependency verification;
- **157 test files / 987 tests**;
- TypeScript and lint;
- optimized Next.js build;
- route generation and serverless deployment.

Only the existing Import Review memoisation warnings remain.

## Boundaries and next action

No formula, stored data, schema, migration, route, UI, accountant pack, package, provider, environment, Production, Expo or Apple change.

Next focused boundary: reconciliation serializer only. Keep authenticated routes, Reports UI/accessibility and accountant-pack v2 separate.
