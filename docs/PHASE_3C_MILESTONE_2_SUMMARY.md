# Phase 3C Milestone 2 Summary and Client Review Package

Status: focused classification-suggestion acceptance hardening in progress; not formally closed

Last updated: 4 July 2026

## Delivered objective

SpendGrove now provides a privacy-safe, user-controlled Property record-review foundation for one selected Property and Australian financial year. Users explicitly classify current eligible records, see only the approved separate gross record-keeping groups and counts, and may download a user-initiated safe-field CSV.

This milestone provides record keeping only. It does not provide tax advice, deductibility decisions, accountant certification, ATO integration, a tax return, net Property results, profit/loss, Home dashboard statistics or additional cashflow records.

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
| Classification-suggestion acceptance hardening | focused PR | pending merge |

## Client retesting and focused hardening

Client retesting confirmed the Property review/report/export flow worked. A further bank CSV was also mapped, reviewed and imported successfully.

The focused hardening adds deterministic suggestions without silently storing a classification. Suggestions use only current safe transaction type, amount sign, seeded category metadata and Property connection source. The user may change a suggestion, save one row manually or explicitly confirm a bounded bulk action. The server recomputes every suggestion and revalidates ownership, eligibility, relationship state, classification compatibility and stale timestamps before writing. Safe aggregate counts report applied, skipped and remaining-review records.

The following suggestions are permitted:

- a negative loan-reconciliation expense suggests `LOAN_PAYMENT_CONTEXT`;
- a negative manually Property-linked expense suggests `PROPERTY_OUTGOING`;
- a transfer suggests `TRANSFER_CONTEXT`;
- positive income suggests `PROPERTY_INCOME` only for the exact seeded `Rental income` category;
- positive income suggests `REFUND_OR_REVERSAL` only for the exact seeded `Refunds / rebates` category.

Custom or ambiguous positive-income categories, relationship conflicts, stale rows, unsupported combinations and already classified records remain manual. Suggestions are review aids only, are not tax advice and are not included in summary/export until the user confirms and saves them.

## Preview migration evidence

- Approved migration: `20260703090000_phase_3c_property_reporting_review`.
- Original deploy workflow run: `28639135158` at `ceefe0a5df3e1fb59d42cda0339d59f0ff72b2d3`.
- That run passed secret-safe preflight and applied the migration once. Its original post-check stopped because its constraint query was too broad; no migration retry or rollback occurred.
- Verification-only workflow run: `28657045177` at `563498c1095baffedbcc3d12d0645c81dceb496a`.
- Verification-only skipped `prisma migrate deploy` and confirmed the migration was applied once, no failed migration state existed, the seven-value enum and exact table columns matched, the approved primary key/indexes/foreign keys existed, the table was empty and existing aggregate row counts were unchanged.
- The migration ran against Preview-only secrets. No Production migration has run.

## Record eligibility and review rules implemented

- Australian financial years run from 1 July through 30 June using start-inclusive/end-exclusive date boundaries.
- Reads and writes revalidate the authenticated user, Property, transaction and every current relationship path.
- Active, non-deleted normal transactions and split children may be reviewed; split parents are excluded.
- A current manual Property link is authoritative.
- A current loan-reconciliation path is eligible only when every valid path resolves to one Property.
- Manual and loan paths to the same Property produce one record with `BOTH` provenance.
- Ambiguous cross-Property loan paths are excluded rather than duplicated or allocated.
- Archived, non-deleted Property or Loan Account context is labelled; deleted source records are excluded.
- A classification is always user-confirmed and must be compatible with the current transaction type/sign and relationship path. A deterministic suggestion may prefill the browser review control but is not persisted until manual or confirmed bulk save.
- Transaction and review timestamps provide stale-edit protection.
- A source edit that makes a saved classification incompatible marks it for re-review and excludes it from summaries/exports.
- Reporting never creates, edits, duplicates, splits, recategorises or deletes an everyday transaction.

## Calculations included

Only these Property-and-financial-year values are shown:

- gross Property income records and contributing record count;
- gross Property outgoing records and contributing record count;
- gross refund/reversal records and contributing record count;
- gross loan-payment cashflow records and contributing everyday-transaction count;
- transfer-context record count;
- other-Property-record count.

All arithmetic uses integer cents and checked safe-integer addition. The everyday transaction remains the sole cashflow record; loan repayment breakdowns are never added as extra spending.

## Calculations excluded

SpendGrove does not calculate net Property result, profit/loss, income less outgoings, netted refunds, deductible/taxable totals, ownership or deductible percentages, principal/interest/fee totals, yield, equity, valuation, net worth, forecasts, tax liability, refund estimates or Home dashboard statistics.

## CSV export fields

The export is user initiated, generated from the same revalidated current rows, delivered with private no-store headers and not stored by SpendGrove. It contains exactly:

1. `record_id`
2. `financial_year`
3. `property_nickname`
4. `transaction_date`
5. `transaction_type`
6. `amount_aud`
7. `category_label`
8. `record_classification`
9. `connection_source`
10. `spendgrove_notice`

The notice is `Record keeping only - not tax advice.` User-entered safe nickname/category labels are neutralised when they begin with spreadsheet-formula characters.

The export excludes unclassified, explicitly excluded and now-incompatible records. It also excludes merchant/description text, notes, narration, filenames, raw rows, account/BSB/card/customer/loan/lender references, masked identifiers, exact addresses, balances, user IDs, email addresses, secrets, audit data, hidden columns, formulas, summaries and footer rows.

## Attached bank CSV compatibility validation

The 19 attached CSVs were handled only inside ignored `sample-data/private-local/`. The raw ZIP, CSVs, rows, values and filenames were not committed, uploaded, copied into documentation or exposed in screenshots. Private-looking source patterns were treated as sensitive.

All 19 files parsed, received complete date/amount/description mappings, produced 12 of 12 structurally review-ready rows and reached review-before-commit. Sanitised review text produced zero private-pattern leak flags. No parser/schema/persistence redesign was needed.

Ambiguous common headers now remain `Generic or custom CSV` instead of being mislabeled as a specific bank. A specific bank profile is confirmed only when its accepted header signature is unambiguous; generic files still receive complete suggested mapping plus the visible manual-mapping warning.

| Supplied source/format | Amount layout | Date layout | Result |
|---|---|---|---|
| ANZ | Signed amount | DD/MM/YYYY | Supported through safe generic mapping; review ready |
| BankSA | Debit/credit | DD/MM/YYYY | Supported through safe generic mapping; review ready |
| Bankwest | Debit/credit | DD/MM/YYYY | Supported through safe generic mapping; review ready |
| Bendigo | Debit/credit | DD/MM/YYYY | Supported through safe generic mapping; review ready |
| BOQ | Debit/credit | DD/MM/YYYY | Supported through safe generic mapping; review ready |
| CommBank | Signed amount | DD/MM/YYYY | Supported through safe generic mapping; review ready |
| Heritage | Debit/credit | DD/MM/YYYY | Supported through safe generic mapping; review ready |
| ING | Signed amount | DD/MM/YYYY | Supported through safe generic mapping; review ready |
| Macquarie | Debit/credit | YYYY-MM-DD | Supported through safe generic mapping; review ready |
| NAB | Debit/credit | DD/MM/YYYY | Supported through safe generic mapping; review ready |
| Suncorp | Debit/credit | DD/MM/YYYY | Supported through safe generic mapping; review ready |
| ubank | Signed amount | YYYY-MM-DD | Supported through safe generic mapping; review ready |
| Westpac | Debit/credit | DD/MM/YYYY | Confirmed profile; review ready |
| Five unidentified supplied sources | Debit/credit | DD/MM/YYYY | Supported through safe generic mapping; all review ready |
| One unidentified supplied source | Signed amount | YYYY-MM-DD | Supported through safe generic mapping; review ready |

Source names above are safe bank labels only. No original filenames are retained.

## QA evidence

- Focused classification-suggestion hardening: 76 test files / 458 tests passed; TypeScript type-check and clean production build passed.
- Final local suite: 76 test files / 453 tests passed.
- TypeScript type-check: passed.
- Clean Next.js production build: passed.
- Prisma schema and migration SQL: unchanged by PRs 3C.7-3C.9.
- Prisma schema and migration SQL remain unchanged by the focused acceptance hardening; no new Preview or Production migration was run.
- Ownership, current eligibility, manual precedence, ambiguity exclusion, split-parent exclusion, stale-edit, classification compatibility, summary, no-double-count, exact export-field, no-store and privacy tests passed.
- Importer regression tests confirm ambiguous generic layouts are not falsely assigned to a specific bank.
- Local public smoke checks returned HTTP 200 for `/`, `/loans`, `/import`, `/transactions` and `/settings`, with no internal server error.
- PR #95 Vercel Preview: https://vercel.com/latinmaestros-projects/spendgrove/4xbZEEEa4RA6Dzjq95DMphp65YEw (verification in progress at package publication).
- Merged-main deployment will be verified after PR #95 merges.

## Mobile review notes

- The Property review uses a single-column mobile baseline; summary cards become two columns only from the small breakpoint.
- Financial-year/load controls wrap instead of forcing a fixed-width row.
- Classification and save controls stack on mobile and all primary buttons use at least 44-pixel touch height.
- The export confirmation actions wrap and the copy contains no wide table or fixed-width content.
- Signed-in phone-sized interaction remains an explicit client retesting item; no authenticated account data was introduced into automated screenshots or logs.

## Privacy and security confirmation

- Reporting persists only the already-approved user/Property/transaction IDs, neutral classification and timestamps.
- No report totals, financial-year snapshots or exports are persisted.
- No raw CSV, raw row, original filename, narration, merchant/description snapshot, account identifier, BSB, card fragment, customer/loan/lender reference, masked identifier, exact address, balance, secret or connection string was added to reporting storage, logs, audit metadata or documentation.
- Audit metadata remains safe state/reason/classification codes plus generated IDs.
- Every read, classification write, summary and export revalidates user ownership and current source relationships.
- CSV export uses a generated safe filename and contains no private source-detail columns.
- No Production migration has run.

## Known limitations

- Reports are current-state views; there is no historical relationship/report snapshot or filed-return version.
- Cross-Property loan allocation is unsupported and ambiguous records are excluded.
- Refunds and reversals are not automatically paired or netted.
- Classification is user-confirmed. Deterministic suggestions cover only clear approved cases; unsupported or ambiguous records remain manual and source edits or relinking may require re-review.
- Loan principal, interest, fee and balance values are not aggregated or exported.
- Bank detection deliberately stays generic when headers are shared by multiple banks; users see and confirm the suggested mapping.
- No address, document, receipt, merchant narration or account reference appears in review/export.
- The CSV does not map to ATO forms and is not a tax return or accountant-certified report.

## Non-technical client retesting checklist

Use synthetic test data only.

1. Open **Loans**, expand a Property's **Property record keeping**, then load **Property record review**.
2. Switch between available financial years and confirm only records dated inside the selected year appear.
3. Confirm manually Property-linked transactions appear once.
4. Confirm a transaction connected through a Property-linked Loan Account appears once and shows its connection source.
5. Confirm an archived Property or Loan Account is clearly labelled where relevant.
6. Confirm loan-connected outgoing, manually Property-linked outgoing and transfer records show the expected neutral suggestion.
7. Confirm only exact seeded rental-income and refund/rebate categories receive an income suggestion; ambiguous/custom income remains unclassified.
8. Change one suggestion before saving and confirm the changed classification is preserved.
9. Choose **Apply suggested classifications**, cancel once, then confirm; verify only eligible unchanged suggestions are saved and the result shows aggregate applied/skipped/remaining counts.
10. Refresh and confirm saved classifications remain selected; confirm unconfirmed suggestions do not appear in summaries or CSV export.
11. Try changing the same source transaction in another tab, then apply/save from the older review and confirm the stale row is skipped or requires refresh.
12. Confirm Property income, outgoing, refund/reversal and loan-payment values remain separate gross groups.
13. Confirm transfer and other-Property records show counts only.
14. Confirm there is no net result, profit/loss, deductible/taxable value, loan-component total or Home dashboard statistic.
15. Choose **Prepare CSV export**, read the record-keeping warning, then download the CSV.
16. Confirm the CSV has exactly the ten approved columns and omits unclassified, suggestion-only and **Excluded** records.
17. Confirm the CSV contains no merchant description, narration, filename, account/reference details, exact address, balance, email or hidden totals.
18. Unlink a manual Property transaction or loan repayment reconciliation, refresh the review and confirm the current record disappears when no eligible path remains.
19. Import one synthetic bank CSV with common generic headers and confirm SpendGrove asks you to check the suggested mapping instead of guessing a bank.
20. Check `/loans` on a phone-sized screen: financial-year selection, suggestion controls, summary cards, classification controls and export warning should remain readable without horizontal scrolling.

## Future navigation proposal only

Keep Property reporting inside **Loans** for now. If reporting grows, prefer a later approved **Reports** area for Property/EOFY exports and future reporting workflows before adding a standalone **Properties** tab. A Properties tab should be reconsidered only if Property management becomes a major app pillar. No navigation change is included in this hardening.

## Stop point and recommendation

Phase 3C Milestone 2 remains open and will be parked for final client retesting after the focused hardening is merged and main is verified. Do not start another milestone or Phase 4 until the client accepts this package and separately approves a proposal.

No Phase 4, recurring, budgets, Home dashboard statistics, Basiq, AI, payments, household mode, document storage or later-module implementation has started.
