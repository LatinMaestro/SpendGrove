# Phase C4 Everyday Financial-Year Reconciliation Output

Date: 26 July 2026  
Status: pure reconciliation JSON serializer implemented; exact-head verification pending  
Master-plan alignment: C4.5 — reconciliation response/export  
Stacked dependency: PR #268 → PR #266 → PR #265 → PR #262 → PR #260 → PR #259 and earlier gates

## Delivered

- `src/server/everyday-financial-year-reconciliation-output.ts`;
- `tests/server/everyday-financial-year-reconciliation-output.test.ts`;
- this summary.

## Scope

One pure deterministic JSON serializer for aggregate everyday financial-year reconciliation evidence.

No database query, accepted-source ID list, API route, download response, UI, accountant-pack change, stored data, schema or migration is included.

## Contract

- contract: `spendgrove.everyday-financial-year-reconciliation`;
- version: `1`;
- exact generation time and Australian financial-year boundaries;
- AUD and integer-cent declarations;
- source mode and verified owner scope;
- counted Money in, Money out and transfer-context records;
- incoming and outgoing transfer counts;
- counted split children;
- diagnostic exclusions only when the source mode authorises them;
- uncategorised and Category-row counts;
- analytical Loan record count;
- Money in and Money out integer-cent totals;
- explicit zero analytical Loan cashflow contribution;
- fixed neutral notices and disclaimer.

## Fail-closed validation

The serializer rejects:

- unsupported report contract, version, currency or money representation;
- invalid generation time or financial-year identity;
- unsafe or negative counts and totals;
- impossible zero-count/non-zero-total pairs;
- transfer and counted-record mismatches;
- Category count or total mismatches;
- incomplete owner-scoped diagnostics;
- fabricated eligible-only exclusion counts;
- diagnostic source-count mismatches;
- any non-zero analytical Loan cashflow contribution.

## Privacy

The output excludes:

- Transaction and Category IDs;
- accepted source-record IDs;
- raw CSV and filenames;
- narration, merchant history and notes;
- account, BSB, card, customer and Loan references;
- exact Property addresses;
- provider payloads, secrets and private audit metadata.

Accepted owned source IDs remain a later authenticated traceability boundary. Production must never query cross-user rows to populate a denial count.

## Tests

Six tests cover:

1. exact owner-scoped fixture reconciliation;
2. eligible-only null diagnostic counts;
3. deterministic output and identifier exclusion;
4. contract, timestamp and financial-year rejection;
5. count, Category and source diagnostic mismatch rejection;
6. fabricated eligible diagnostics and analytical Loan cashflow rejection.

Expected baseline after execution: **158 test files / 993 tests**.

## Boundary

No financial formula, source membership, persistence, schema, migration, route, UI, accountant pack, package, provider, environment, Production, Expo or Apple change.

## Next

After exact green, add only the authenticated report route and download-response boundary. Keep Reports UI/accessibility and accountant-pack v2 separate.
