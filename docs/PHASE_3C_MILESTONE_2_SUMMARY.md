# Phase 3C Milestone 2 Summary and Client Review Package

Status: linked-record reporting simplification in progress; not formally closed

Last updated: 4 July 2026

## Delivered objective

SpendGrove provides a privacy-safe current-state view and CSV export for one Property and Australian financial year. The accepted simplified workflow uses eligible transactions already connected to the Property; users do not repeat a separate report-only classification step.

This is record keeping only. It does not provide tax advice, deductibility decisions, accountant certification, ATO integration, a tax return, net Property results, profit/loss, Home dashboard statistics or additional cashflow records.

## Completed work

| Work | PR | Merge commit |
|---|---|---|
| 3C.5 reporting and financial-rules contract | [#87](https://github.com/LatinMaestro/SpendGrove/pull/87) | `8410f785f53a32f673319143883bcb1468d0e7b5` |
| 3C.6 schema foundation and Preview migration plan | [#88](https://github.com/LatinMaestro/SpendGrove/pull/88) | `7e7e918872bcfece6acb566beee86a55d4d89e3d` |
| Preview workflow integrity hardening | [#90](https://github.com/LatinMaestro/SpendGrove/pull/90) | `ceefe0a5df3e1fb59d42cda0339d59f0ff72b2d3` |
| Preview verification correction | [#91](https://github.com/LatinMaestro/SpendGrove/pull/91) | `563498c1095baffedbcc3d12d0645c81dceb496a` |
| Permanent Preview verification handoff | [#92](https://github.com/LatinMaestro/SpendGrove/pull/92) | `46eb30f795e1334a73a21d92eed1cc1b2ccb239d` |
| 3C.7 Property record review foundation | [#93](https://github.com/LatinMaestro/SpendGrove/pull/93) | `4432d2ac615127ac853edcdf0445a4dd5d149002` |
| 3C.8 approved summary and export foundation | [#94](https://github.com/LatinMaestro/SpendGrove/pull/94) | `9fd5dfab86d462666d490adc9c69d807950e77c1` |
| 3C.9 QA and client review package | [#95](https://github.com/LatinMaestro/SpendGrove/pull/95) | `86d039f69f6dc70a30fd13f4e4430edb93acbcfb` |
| Classification-suggestion hardening, now superseded in the normal workflow | [#96](https://github.com/LatinMaestro/SpendGrove/pull/96) | `6e70c8906cdd7f38e751ff2f0b257ab03b20136c` |
| Linked-record reporting simplification | [#97](https://github.com/LatinMaestro/SpendGrove/pull/97) | pending merge |

## Client retesting and accepted simplification

Client retesting confirmed that Property reporting/export worked and that another bank CSV mapped, reached review and imported successfully. The client rejected the extra report-only classification step because it duplicated work already done while importing, categorising and linking transactions.

The accepted direction is:

- current eligible manually Property-linked transactions appear automatically;
- current eligible loan-reconciliation-derived transactions appear automatically when every path resolves clearly to the selected Property;
- split parents, deleted/inactive records and ambiguous cross-Property loan paths remain excluded;
- eligible split children remain included;
- classification and suggestion controls from PR #96 no longer appear in the normal workflow;
- summaries and exports do not read or require `PropertyReportReview` classifications;
- the Preview-only `PropertyReportReview` table remains untouched and dormant; no row is deleted, rewritten or backfilled.

## Preview migration evidence

- Approved migration: `20260703090000_phase_3c_property_reporting_review`.
- Deploy workflow run `28639135158` applied it once using Preview-only secrets.
- Verification-only run `28657045177` confirmed the exact schema, empty review table at verification time and unchanged existing aggregate counts.
- No new Preview migration and no Production migration has run.

## Current eligibility and no-double-count rules

- The report revalidates the authenticated user, Property, transaction, financial year and every current relationship path.
- Active, non-deleted normal transactions and split children may appear; split parents are excluded.
- Manual Property links are authoritative. Matching manual and loan paths produce one row with `BOTH` provenance.
- A loan-derived record is included only when all eligible paths resolve to one Property.
- Unlinking the last eligible relationship removes the transaction from the current report/export.
- The everyday transaction remains the sole cashflow record. Loan repayment breakdowns are analytical records and are never added as extra spending.
- Reporting never creates, edits, duplicates, splits, recategorises or deletes a transaction.

## Simple summary groups

- money in: current linked positive `INCOME` transactions;
- money out: current linked negative `EXPENSE` transactions;
- linked loan payment cashflow: the subset of linked negative expenses connected through loan reconciliation;
- transfer/context count;
- total linked record count.

The linked-loan group is a labelled subset of money out, not an additional cashflow total. SpendGrove does not calculate net result, profit/loss, deductible/taxable totals, percentages, loan components, yield, equity, valuation, net worth, forecasts, tax liability, refund estimates or Home dashboard statistics.

## CSV export

The export is user initiated, generated from the same revalidated current linked rows and not stored by SpendGrove. It contains exactly:

1. `record_id`
2. `financial_year`
3. `property_nickname`
4. `transaction_date`
5. `transaction_type`
6. `amount_aud`
7. `category_label`
8. `connection_source`
9. `spendgrove_notice`

The notice is `Record keeping only - not tax advice.` The export no longer contains or requires `record_classification`.

It excludes merchant/description text, notes, narration, filenames, raw rows, account/BSB/card/customer/loan/lender references, masked identifiers, exact addresses, balances, user IDs, email addresses, secrets, audit data, hidden columns, formulas, summaries and footer rows. Safe nickname/category labels retain spreadsheet-formula protection.

## Bank CSV compatibility evidence

The earlier private-local validation covered 19 supplied formats; all parsed and reached review with complete structural mapping. Raw files and values were not committed or uploaded. Client retesting also confirmed another bank CSV mapped, reviewed and imported successfully.

## Privacy and security confirmation

- Every read, summary and export revalidates ownership and current source relationships.
- No report snapshot, total or export is persisted.
- No raw CSV, row, filename, narration, merchant/description snapshot, account identifier, BSB, card fragment, customer/loan/lender reference, masked identifier, exact address, balance, secret or connection string was introduced.
- The dormant review table is not dropped, backfilled, rewritten or required by the simplified output.
- No tax advice or automatic deductibility decision was introduced.

## Simplification QA evidence

- 76 test files / 458 tests passed.
- TypeScript type-check passed.
- Clean Next.js production build passed.
- Prisma schema, migration SQL, packages and environment configuration are unchanged.
- Eligibility, ownership, manual/loan provenance, split-parent exclusion, split-child inclusion, ambiguous-path exclusion, unlinked/deleted/inactive exclusion, all-linked-row export, safe columns, no-double-count and forbidden-field tests passed.

## Known limitations

- Reports are current-state views; there is no historical relationship/report snapshot.
- Cross-Property loan allocation remains unsupported and ambiguous records are excluded.
- Refunds/reversals are not automatically paired or netted; positive linked income appears in money in.
- Loan principal, interest, fee and balance values are not aggregated or exported.
- The CSV does not map to ATO forms and is not a tax return or accountant-certified report.

## Future import-review proposal only

The ideal later workflow is to let users link an everyday CSV transaction to a Property during import review. A separately approved design could offer neutral user-controlled flags such as `Include in property records`, `Potential property tax record` or `For accountant review`; it should avoid `tax deductible` until a separate tax/EOFY contract is approved. Linked transactions would then surface automatically here. Loan repayments should continue to reconcile to everyday transactions and appear when the Loan Account belongs to the Property.

No import-review Property linking or tax flag is implemented by this hardening.

## Future navigation proposal only

Keep Property reporting inside **Loans** for now. If reporting grows, prefer a later approved **Reports** area for Property/EOFY exports and future everyday reports before adding a standalone **Properties** tab. Reconsider a Properties tab only if Property management becomes a major app pillar. No navigation change is included.

## Non-technical client retesting checklist

Use synthetic test data only.

1. Open **Loans**, expand a Property and load **Property records** for a financial year.
2. Confirm manually linked income, expense and transfer records appear without any classification step.
3. Confirm a reconciled everyday loan payment appears once when the Loan Account belongs to the Property.
4. Confirm the loan-payment group is described as part of money out, not additional spending.
5. Confirm there are no classification, suggestion, bulk-apply or save-review controls.
6. Download the CSV without classifying records and confirm every displayed linked record appears.
7. Confirm the CSV has the nine approved columns and no `record_classification` column.
8. Unlink a Property transaction or repayment reconciliation and confirm it disappears when no eligible path remains.
9. Confirm no merchant description, narration, filename, account/reference detail, exact address, balance, email or hidden total appears.
10. Confirm there is no net result, profit/loss, deductible/taxable value, loan-component total or Home dashboard statistic.
11. Check the controls and record cards on a phone-sized screen for readability and horizontal overflow.

## Stop point

Phase 3C Milestone 2 remains open and must stop for final client retesting after this focused simplification is merged and main is verified. Do not start another milestone or Phase 4.

No Phase 4, recurring, budgets, Home dashboard statistics, Basiq, AI, payments, household mode, document storage or later-module implementation has started.
