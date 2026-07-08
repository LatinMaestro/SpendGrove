# Phase 3C Milestone 3 Summary - Import-Review Property Linking and Workflow Polish

Status: parked for client retesting after PR 3C.15

Last updated: 8 July 2026

## Milestone objective

Phase 3C Milestone 3 makes the accepted Property reporting workflow easier by letting users link relevant everyday transactions to a Property earlier, especially during CSV import review.

The accepted target workflow is:

1. Upload bank CSV.
2. Review transactions.
3. Categorise transactions.
4. Link relevant transactions to a Property during review where appropriate.
5. Commit reviewed rows.
6. Property records/reports automatically include linked records later.
7. Loan CSV repayments continue to reconcile to everyday transactions and appear in Property records where the Loan Account belongs to that Property.

This milestone remains neutral record keeping only. It does not provide tax advice, automatic deductibility, claimable/deductible percentages, ATO-ready output, accountant certification, tax lodgement workflows, Property profit/loss, Home dashboard statistics, automatic Property matching, allocation/splitting, Basiq, AI, payments, household mode, documents or Phase 4 work.

## Completed PRs

| Work | PR | Merge commit | Notes |
|---|---|---|---|
| 3C.10 import-review Property-linking contract | [#99](https://github.com/LatinMaestro/SpendGrove/pull/99) | `96262b347c5ae0d99366bd4d0ab73e2e54f45ef7` | Documentation-only contract; froze Import/Skip/Merge, split, audit, privacy and no-tax-advice rules. |
| 3C.11 schema and migration assessment | [#100](https://github.com/LatinMaestro/SpendGrove/pull/100) | `b47adba443d6cd475e2011b234bb15c9d951476a` | Confirmed existing `PropertyTransactionLink` supports the milestone with no schema change, migration or durable staging table. |
| 3C.12 import-review Property link UI | [#101](https://github.com/LatinMaestro/SpendGrove/pull/101) | `38572d6b8620ec7a82bc982092353b97d970a58a` | Added transient `Include in property records` selection for eligible Import rows only. |
| 3C.13 commit integration and safety checks | [#102](https://github.com/LatinMaestro/SpendGrove/pull/102) | `be1234c37c6213e12abf1b8fb526828aa1728aa1` | Creates the everyday transaction first, then a Property link in the same safe import commit transaction. |
| 3C.14 manual transaction and workflow polish | [#103](https://github.com/LatinMaestro/SpendGrove/pull/103) | `2c2d5608bb6707148d94fc810951f73b14e4d8f5` | Adds the same neutral Property-link control to manual transaction create/edit using existing link/unlink validation. |
| 3C.15 QA and client review package | pending | pending | This summary and final handoff package. |

## Vercel evidence so far

- PR #101 Vercel Preview: https://vercel.com/latinmaestros-projects/spendgrove/3k4vWhnyCc8NNhNafu5Qpb95fDFo
- PR #102 Vercel Preview: https://vercel.com/latinmaestros-projects/spendgrove/AhuxiNxJkhaZXGu99ug4eTqJw9v5
- PR #103 Vercel Preview: https://vercel.com/latinmaestros-projects/spendgrove/6i4AyfGHJceXLKhnA129SQmDpgd1

Final PR 3C.15 and merged-main Vercel evidence will be reported after PR 3C.15 is merged.

## Schema and migration status

- PR 3C.11 confirmed no Prisma schema change is required.
- No Phase 3C Milestone 3 migration was created.
- No Preview migration was run for Phase 3C Milestone 3.
- No Production migration has run.
- No durable staging table, data rewrite, backfill, table drop, package, provider, secret or environment change was introduced.

## Import-review Property-linking behaviour

During everyday CSV import review:

- Eligible `Import` rows can be marked `Include in property records`.
- The user can choose one active owned Property by safe nickname/usage only.
- The choice remains transient browser/review state until commit.
- If a row changes to `Skip`, the transient Property selection is cleared or ignored.
- `Merge` rows are not eligible for pre-commit Property-link selection in this milestone because they point to an existing transaction rather than creating one future transaction.
- No Property link is created from raw CSV rows, filenames, narration, account identifiers, exact addresses, balances or private source fields.

On commit:

- The existing reviewed import commit path creates the everyday transaction first.
- The server revalidates authenticated user ownership, active Property state and eligible committed transaction state.
- A `PropertyTransactionLink` is created only after the transaction exists and is owned by the authenticated user.
- The link is created in the same atomic import commit path as the transaction.
- `Skip` and `Merge` rows do not create Property links.
- Existing import idempotency and no-double-count behaviour are preserved.

## Manual transaction workflow polish

Manual transaction create/edit now includes the same neutral optional control:

- `Include in property records`
- `Link to property`
- `Record keeping only - not tax advice`

The manual transaction is saved first, then the app uses the existing authenticated Property-link endpoint to create, unlink or relink supporting metadata. If the transaction saves but the optional Property-link update cannot be completed safely, the app shows a safe aggregate warning and leaves the transaction available for later linking from the transaction detail panel.

Manual transaction Property linking:

- does not change transaction date, amount, category, notes, source or cashflow treatment;
- does not create another cashflow record;
- preserves unlink-before-relink behaviour;
- uses safe Property nicknames/usage only;
- does not use tax, deductible, claimable or ATO wording.

## Property report/export retest expectation

The accepted Phase 3C Milestone 2 report/export behaviour remains unchanged:

- current eligible manually Property-linked transactions appear automatically;
- current eligible loan-reconciliation-derived transactions appear automatically when every path resolves clearly to the selected Property;
- eligible imported transactions linked during import review appear automatically after commit;
- eligible manual transactions linked during manual create/edit appear automatically after save;
- split parents are excluded;
- eligible split children are included;
- deleted/inactive records are excluded;
- ambiguous cross-Property loan paths are excluded;
- the everyday transaction remains the only cashflow record;
- loan repayment breakdowns remain analytical/reconciliation records only;
- no report-only classification is required for summary or export.

The accepted export fields remain:

1. `record_id`
2. `financial_year`
3. `property_nickname`
4. `transaction_date`
5. `transaction_type`
6. `amount_aud`
7. `category_label`
8. `connection_source`
9. `spendgrove_notice`

The export excludes `record_classification`, merchant descriptions, narration, filenames, raw rows, account references, identifiers, exact addresses, balances, emails, audit data, hidden columns and totals.

## Bank CSV import regression evidence

Phase 3C Milestone 3 preserves the existing bank CSV importer. The parser and import-review regression suite continues to pass, including the safe fixture coverage added from prior supplied Australian bank CSV compatibility work.

The private-local supplied sample validation from Phase 3C Milestone 2 remains the current compatibility baseline:

- 19 private-local supplied formats reached review.
- Ambiguous common headers remain generic rather than being falsely assigned to a bank.
- No raw CSV files, raw rows, filenames with private meaning, narration, balances, account references or private values are committed or documented.

Client retesting during Phase 3C Milestone 2 also confirmed another bank CSV was mapped, reviewed and imported successfully.

## Privacy and security evidence

Milestone 3 preserves the privacy boundary:

- no raw CSV persistence;
- no raw row persistence;
- no original filename persistence;
- no narration/source-text persistence;
- no account identifiers, BSBs, card fragments, customer IDs, loan/lender references, masked references, exact addresses, balances, secrets or connection strings;
- no automatic Property matching;
- no tax advice or automatic deductibility;
- no duplicate cashflow records;
- user ownership and active/archive/deleted state are revalidated server-side before durable links are created or changed.

Audit metadata remains safe reason-code style metadata only. It does not store raw source values, private identifiers or old/new financial values.

## Local verification evidence

PR 3C.12 local verification:

- 77 test files / 463 tests passed.
- TypeScript type-check passed.
- Production build passed.

PR 3C.13 local verification:

- 77 test files / 465 tests passed.
- TypeScript type-check passed.
- Production build passed.

PR 3C.14 local verification:

- Focused tests: 4 files / 22 tests passed.
- Full tests: 77 test files / 468 tests passed.
- TypeScript type-check passed.
- Production build passed.

PR 3C.15 local verification:

- Full tests: 77 test files / 468 tests passed.
- TypeScript type-check passed.
- Production build passed.

## Mobile review notes

- Import-review Property-link controls use the existing mobile-first row-card pattern and remain optional.
- Manual transaction Property-link controls use the existing modal/card pattern and avoid forcing Property details for everyday transactions.
- The user can continue saving transactions without a Property link.
- Client should retest on mobile-width Vercel pages because the new controls add one compact section to existing review/edit flows.

## Known limitations

- Merge rows cannot be pre-commit linked to a Property in this milestone. The existing transaction can be linked after merge through transaction details.
- There is no automatic Property matching.
- There is no transaction allocation/splitting change.
- Import-review Property selections are not durable staging records and are not recoverable if the browser review state is discarded before commit.
- Manual transaction Property-link update happens after the transaction save through the existing link endpoint. If the optional link update fails, the transaction remains saved and the user can link it later from details.
- The dormant Preview-only `PropertyReportReview` table from Phase 3C Milestone 2 remains untouched and unused by the normal workflow.

## Non-technical client retesting checklist

Use synthetic/demo data only.

1. Open the bank CSV import flow.
2. Upload a supported synthetic bank CSV.
3. On an Import row, choose `Include in property records`.
4. Select an active Property by nickname.
5. Change another row to Skip and confirm no Property link is created for it.
6. Confirm Merge rows do not offer pre-commit Property linking and can still be handled through the existing merge workflow.
7. Commit the reviewed import.
8. Open Loans and the relevant Property records/report view.
9. Confirm the imported linked transaction appears automatically in Property records/export without a report-only classification step.
10. Confirm the transaction amount, date, category and cashflow treatment did not change.
11. Add a manual transaction and choose `Include in property records`.
12. Confirm it appears in Property records/report after save.
13. Edit that manual transaction and change or remove the Property link.
14. Confirm unlink/relink updates the Property records view without creating duplicate cashflow.
15. Confirm no wording says deductible, claimable, taxable, ATO-ready, tax-ready, accountant approved or automatically classified for tax.
16. Confirm the report/export still says `Record keeping only - not tax advice`.

## Recommended next step

Stop for client retesting after PR 3C.15 is merged and the final Vercel deployment is verified.

Do not formally close Phase 3C Milestone 3 until the client confirms retesting is complete.
