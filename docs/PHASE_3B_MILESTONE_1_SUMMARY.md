# Phase 3B Milestone 1 Summary — Loans-First Foundations

Date completed: 23 June 2026

## Status

Implementation is complete and stopped for client review.

PR 3B.4 and Milestone 2 have not started. Phase 4, Home dashboard statistics, tax/EOFY reporting and later modules have not started.

## Delivered outcome

Milestone 1 established a privacy-safe Loans-first foundation:

- Loan Accounts are the main user-facing records.
- Supported choices are owner-occupier home loan, investment property loan, car loan, personal loan and other loan.
- Properties are optional supporting metadata for relevant home or investment loans.
- Loan and property records use safe nicknames and broad descriptive metadata only.
- Users can create, edit, archive and restore Loan Accounts.
- Users can edit, archive and restore optional property records.
- A user must choose the owning Loan Account before selecting a loan CSV.
- Loan CSV parsing, column mapping and repayment review happen in browser memory.
- Review supports date, total payment, principal, interest, fees and balance after payment.
- Linked property context appears only when the selected loan has a property.
- The review model contains no raw narration and provides no durable commit action.

## Completed PRs and merge commits

| Work | PR | Merge commit |
|---|---|---|
| 3B.0 financial rules and data contract | [#49](https://github.com/LatinMaestro/SpendGrove/pull/49) | `518851d15f07415067c8dfaaeb2d26f7c15cc9ae` |
| 3B.1 schema foundation and Preview migration plan | [#50](https://github.com/LatinMaestro/SpendGrove/pull/50) | `fa1a872c87d15a8c7853819485670e47b2da25ca` |
| Loans-first clarification | [#52](https://github.com/LatinMaestro/SpendGrove/pull/52) | `1e4adeaf3a9b73e4c0d13f3a009a2edb329b21d8` |
| Minimal `CAR_LOAN` amendment | [#53](https://github.com/LatinMaestro/SpendGrove/pull/53) | `3938a0c2ef872553fa18df1c9b41832f83516e44` |
| 3B.2 Loans-first metadata management | [#54](https://github.com/LatinMaestro/SpendGrove/pull/54) | `52406a62318741b339a1ddc6371eb5c7f9fd17f1` |
| 3B.3 browser-local loan CSV mapping and review | [#55](https://github.com/LatinMaestro/SpendGrove/pull/55) | `8eb07b0f6f24e577f14c90cf68968762ca0430d1` |

## Deployment and migration evidence

- Final Milestone 1 main deployment: https://vercel.com/latinmaestros-projects/spendgrove/6gadsxgV1Xh7Epj23aEb5FWAh7Bn
- Production alias: https://spendgrove.vercel.app
- PR 3B.3 preview deployment: https://vercel.com/latinmaestros-projects/spendgrove/DXPQ2DwFMwHRNbtswPuxfhVahVEh
- Preview migration workflow: [run 27958341458](https://github.com/LatinMaestro/SpendGrove/actions/runs/27958341458)
- The workflow used the approved Preview-only Neon secret names and completed successfully from `main`.
- No Production migration was run.
- PRs 3B.2 and 3B.3 required no further schema change or migration.

## Test and build evidence

- PR 3B.3 focused tests: 3 files / 9 tests passed.
- Full regression suite: 60 files / 334 tests passed.
- TypeScript type-check: passed.
- Next.js production build: passed.
- Vercel PR preview: green.
- Vercel merged-main deployment: green.
- Mobile browser verification at 390×844: no horizontal overflow, no console errors and all five primary navigation items remained available.

## Privacy and security evidence

- Raw loan CSV files, raw rows, original filenames and narration are held only in browser memory and are discarded on reset or page close.
- No CSV upload, durable repayment write or browser storage is used by PR 3B.3.
- Private identifier columns are locked out of mapping.
- Review rows contain only parsed dates, integer-cent repayment components, optional balance-after values and structured warnings.
- Durable Loan Accounts and properties contain safe nicknames and broad type/purpose/usage metadata only.
- Exact addresses, account numbers, lender references, customer IDs, masked account references, BSBs, card fragments, secrets and connection strings are not requested or persisted.
- All durable metadata queries and writes remain authenticated and user-owned.
- Loan purpose and property usage remain descriptive; no deductibility or tax conclusion is produced.

## Known limitations

- Milestone 1 reviews repayment rows but cannot save them.
- Durable repayment history, idempotent commit, reconciliation suggestions, manual link/unlink and no-double-count enforcement are reserved for an approved Milestone 2.
- The client must perform final signed-in browser testing because automated verification does not use the client’s protected authenticated session.
- Unusual or headerless loan CSVs may require manual column matching.
- Component mismatches are warned for review; no automated correction is made.
- Balance-after values are review-only and are not used to infer loan balances or financial advice.
- No property profile, property-level financial statistics, everyday-transaction-to-property tax link, Home dashboard statistic or report is included.

## Client testing checklist

1. Open Loans on the final main deployment and sign in.
2. Create one Loan Account for each needed type: owner-occupier, investment, car, personal and other.
3. Confirm car, personal and other loans do not require a property.
4. For a home or investment loan, create or link an optional property using a nickname and broad usage only.
5. Edit, archive and restore a Loan Account.
6. Edit, archive and restore an optional property.
7. Open **Review loan CSV**.
8. Confirm a Loan Account must be selected before a CSV can be chosen.
9. Select a property-linked loan and confirm its linked property context appears.
10. Select a non-property loan and confirm no property details are requested.
11. Review the supplied synthetic home-loan and personal-loan CSV fixtures.
12. Confirm date, payment, principal, interest, fee and balance columns can be corrected before review.
13. Confirm private identifier columns are excluded and raw narration is never shown.
14. Confirm the original filename is not displayed.
15. Confirm the page clearly says **Review only — nothing saved** and offers no commit action.
16. Reset the CSV or close the page and confirm the transient review is cleared.
17. Check the flow on a phone-sized viewport.

## Recommended next step

After the client accepts Milestone 1, prepare a separate Milestone 2 approval gate for PR 3B.4 durable reviewed repayment commit and PR 3B.5 reconciliation/no-double-count safeguards. Do not implement either until explicitly approved.
