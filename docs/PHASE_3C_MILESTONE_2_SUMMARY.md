# Phase 3C Milestone 2 Summary and Closure Record

Status: formally accepted and closed

Closed: 7 July 2026

## Accepted objective

Phase 3C Milestone 2 delivers a privacy-safe current-state Property record review and CSV export foundation for one Property and Australian financial year.

The accepted simplified workflow uses eligible everyday transactions already connected to the Property. Users do not perform a separate report-only classification step before the report or export becomes useful.

This is record keeping only. It does not provide tax advice, deductibility decisions, accountant certification, ATO integration, a tax return, net Property results, profit/loss, Home dashboard statistics or additional cashflow records.

## Completed work

| Work | PR | Merge commit | Final status |
|---|---|---|---|
| 3C.5 reporting and financial-rules contract | [#87](https://github.com/LatinMaestro/SpendGrove/pull/87) | `8410f785f53a32f673319143883bcb1468d0e7b5` | Accepted |
| 3C.6 schema foundation and Preview migration plan | [#88](https://github.com/LatinMaestro/SpendGrove/pull/88) | `7e7e918872bcfece6acb566beee86a55d4d89e3d` | Accepted |
| Preview workflow integrity hardening | [#90](https://github.com/LatinMaestro/SpendGrove/pull/90) | `ceefe0a5df3e1fb59d42cda0339d59f0ff72b2d3` | Accepted |
| Preview verification correction | [#91](https://github.com/LatinMaestro/SpendGrove/pull/91) | `563498c1095baffedbcc3d12d0645c81dceb496a` | Accepted |
| Permanent Preview verification handoff | [#92](https://github.com/LatinMaestro/SpendGrove/pull/92) | `46eb30f795e1334a73a21d92eed1cc1b2ccb239d` | Accepted |
| 3C.7 Property record review foundation | [#93](https://github.com/LatinMaestro/SpendGrove/pull/93) | `4432d2ac615127ac853edcdf0445a4dd5d149002` | Accepted |
| 3C.8 approved summary and export foundation | [#94](https://github.com/LatinMaestro/SpendGrove/pull/94) | `9fd5dfab86d462666d490adc9c69d807950e77c1` | Accepted |
| 3C.9 QA and client review package | [#95](https://github.com/LatinMaestro/SpendGrove/pull/95) | `86d039f69f6dc70a30fd13f4e4430edb93acbcfb` | Accepted |
| Classification-suggestion hardening | [#96](https://github.com/LatinMaestro/SpendGrove/pull/96) | `6e70c8906cdd7f38e751ff2f0b257ab03b20136c` | Superseded/de-emphasised in the normal workflow |
| Final linked-record reporting simplification | [#97](https://github.com/LatinMaestro/SpendGrove/pull/97) | `3fa62d4f2ee387754198a317ca112314aad4725f` | Accepted final simplification |

## Client retesting and final accepted direction

Client retesting confirmed:

- the Property reporting/export flow worked;
- another bank CSV mapped, reached review and imported successfully;
- the extra report-only classification step was too much user effort;
- the accepted direction is that Property reports/exports use already-linked Property records automatically;
- PR #96's classification-suggestion workflow is superseded/de-emphasised in the normal user flow by PR #97's simpler linked-record reporting;
- no tax advice or automatic deductibility was introduced.

Final accepted behaviour:

- current eligible manually Property-linked transactions appear automatically;
- current eligible loan-reconciliation-derived transactions appear automatically when every path resolves clearly to the selected Property;
- split parents are excluded;
- eligible split children are included;
- deleted/inactive records are excluded;
- ambiguous cross-Property loan paths are excluded;
- unlinked records disappear from the current report/export when no eligible path remains;
- the everyday transaction remains the only cashflow record;
- loan repayment breakdowns remain analytical/reconciliation records only;
- no report-only classification is required for summary or export.

## Preview migration evidence

- Approved migration: `20260703090000_phase_3c_property_reporting_review`.
- Deploy workflow run `28639135158` applied it once using Preview-only secrets.
- Verification-only run `28657045177` confirmed the exact approved schema, an empty `PropertyReportReview` table at verification time and unchanged existing aggregate counts.
- No new Preview migration ran during PR #97.
- No Production migration has run.
- The Preview-only `PropertyReportReview` table remains dormant and untouched. It is not dropped, backfilled, rewritten, deleted or required by the normal reporting/export workflow.

## Current eligibility and no-double-count rules

- The report revalidates the authenticated user, Property, transaction, financial year and every current relationship path.
- Active, non-deleted normal transactions and split children may appear; split parents are excluded.
- Manual Property links are authoritative. Matching manual and loan paths produce one row with `BOTH` provenance.
- A loan-derived record is included only when all eligible paths resolve to one Property.
- Unlinking the last eligible relationship removes the transaction from the current report/export.
- The everyday transaction remains the sole cashflow record.
- Loan repayment breakdowns are analytical records and are never added as extra spending.
- Reporting never creates, edits, duplicates, splits, recategorises or deletes a transaction.

## Simple summary groups

Accepted simple groups:

- money in records: current linked positive `INCOME` transactions;
- money out records: current linked negative `EXPENSE` transactions;
- linked loan payment cashflow records: the subset of linked negative expenses connected through loan reconciliation;
- transfer/context count;
- total linked record count.

The linked-loan group is a labelled subset of money out, not an additional cashflow total.

SpendGrove does not calculate net result, profit/loss, deductible/taxable totals, ownership percentages, deductible percentages, principal/interest/fee aggregates, yield, equity, valuation, net worth, forecasts, tax liability, refund estimates or Home dashboard statistics.

## Accepted CSV export

The export is user initiated, generated from the same revalidated current linked rows and not stored by SpendGrove.

It contains exactly:

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

The export excludes merchant descriptions, notes, narration, filenames, raw rows, account references, BSBs, card/customer/loan/lender references, masked identifiers, exact addresses, balances, user IDs, email addresses, secrets, audit data, hidden columns, formulas, totals, summaries and footer rows. Safe nickname/category labels retain spreadsheet-formula protection.

## Bank CSV compatibility evidence

Private-local validation during PR #95 covered 19 supplied bank CSV formats; all parsed and reached review with complete structural mapping. Raw files and values were not committed or uploaded.

Client retesting also confirmed another bank CSV mapped, reached review and imported successfully.

## Final deployment and testing evidence

- PR #97 merge commit: `3fa62d4f2ee387754198a317ca112314aad4725f`.
- Final main Vercel deployment: https://vercel.com/latinmaestros-projects/spendgrove/BXE1ynjLmCEuxDXL8NhZc79bSsBr
- Live alias: https://spendgrove.vercel.app
- Live `/`, `/loans` and `/transactions` returned HTTP 200 without internal errors.
- 76 test files / 458 tests passed.
- TypeScript type-check passed.
- Clean Next.js production build passed.
- Prisma schema, migration SQL, packages and environment configuration were unchanged by PR #97.

## Privacy and security confirmation

- Every read, summary and export revalidates ownership and current source relationships.
- No report snapshot, total or export is persisted.
- No raw CSV, row, filename, narration, merchant/description snapshot, account identifier, BSB, card fragment, customer/loan/lender reference, masked identifier, exact address, balance, secret or connection string was introduced.
- The dormant review table is not dropped, backfilled, rewritten or required by the simplified output.
- No tax advice or automatic deductibility decision was introduced.
- No Production migration has run.

## Accepted limitations

- Reports are current-state views; there is no historical relationship/report snapshot.
- Cross-Property loan allocation remains unsupported and ambiguous records are excluded.
- Refunds/reversals are not automatically paired or netted; positive linked income appears in money in.
- Loan principal, interest, fee and balance values are not aggregated or exported.
- The CSV does not map to ATO forms and is not a tax return or accountant-certified report.
- The dormant `PropertyReportReview` table remains in Preview because removing it would require a separate schema/migration decision.

## What this milestone is not

Phase 3C Milestone 2 is not:

- tax advice;
- an ATO-ready report;
- accountant-certified output;
- a deductible or claimable calculator;
- a tax lodgement workflow;
- a Property profit/loss report;
- a Home dashboard statistic;
- a net-worth, equity or valuation feature.

## Future import-review proposal only

The ideal later workflow is to let users link an everyday CSV transaction to a Property during import review. A separately approved design could offer neutral user-controlled flags such as `Include in property records`, `Potential property tax record` or `For accountant review`; it should avoid `tax deductible` until a separate tax/EOFY contract is approved.

Linked transactions would then surface automatically in Property reports/exports without another classification step. Loan repayments should continue to reconcile to everyday transactions and appear when the Loan Account belongs to the Property.

No import-review Property linking or tax flag is implemented by this milestone closure.

## Future navigation proposal only

Keep Property reporting inside **Loans** for now. If reporting grows, prefer a later approved **Reports** area for Property/EOFY exports and future everyday reports before adding a standalone **Properties** tab. Reconsider a Properties tab only if Property management becomes a major app pillar.

No navigation change is included in this milestone closure.

## Closure

The client accepted Phase 3C Milestone 2 on 7 July 2026 after Vercel review of PR #97 with no further acceptance comments.

No Phase 4, recurring, budgets, Home dashboard statistics, tax advice, automatic deductibility, Basiq, AI, payments, household mode, document storage or later-module implementation has started.
