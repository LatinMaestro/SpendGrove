# Phase 3C Milestone 1 Summary - Property-Linked Record Keeping

Date implementation completed: 2 July 2026

Date formally accepted and closed: 3 July 2026

Status: formally accepted and closed after client retesting completed with no further acceptance comments

## Delivered outcome

Phase 3C Milestone 1 adds an optional, user-controlled Property link to an existing everyday transaction for neutral record keeping:

- one eligible transaction can link to one active owned Property;
- link, unlink and later relink are explicit and reversible;
- an active link must be unlinked before another Property can be chosen;
- the everyday transaction remains the only spending, income and cashflow record;
- linking does not alter the transaction date, amount, merchant, category, source or split state;
- the Loans page provides a neutral Property record-keeping activity view;
- linked Loan Account context appears separately from linked everyday transactions;
- no Property, tax, EOFY, net-worth or Home statistics are calculated.

The separately approved development-testing utility can soft-delete all everyday transactions for the signed-in test account in local development or Vercel Preview only. It safely detaches active loan reconciliation and Property links while preserving Loan Accounts, repayment breakdowns, Properties, categories, settings, profiles and merchant rules.

## Focused client acceptance hardening

Client retesting found that confirming every clear repayment match was repetitive and that the separate loan-reconciliation and manual Property-link relationships were not obvious in the Loans UI.

- After durable repayment save, SpendGrove automatically links only when exactly one current candidate is `HIGH`: exact remaining amount and zero-to-one-day difference.
- The same serializable ownership, active-state, allocation and no-double-count validation used by manual linking runs immediately before the automatic write.
- Zero, multiple, medium, manual, override, stale, incompatible or uncertain-allocation cases remain unlinked for manual review.
- Automatic links use the existing `SUGGESTED`, `HIGH` and `EXACT_AMOUNT_NEAR_DATE` persisted values plus safe `AUTO_HIGH_CONFIDENCE` audit metadata; no schema change is required.
- Automatic links remain reversible through the existing unlink flow and never create or modify an everyday transaction.
- No automatic `PropertyTransactionLink` is created.
- Property activity now separates **Linked through repayment breakdowns** from **Manually linked property transactions**.
- Active Loan Account cards now hold the Loan edit pencil, linked Property edit pencil and Property record-keeping activity. A compact **Other Properties** area remains only for Properties not linked to an active loan.

## Completed PRs and merge commits

| Work | PR | Merge commit |
|---|---|---|
| 3C.0 Property record-keeping contract | [#78](https://github.com/LatinMaestro/SpendGrove/pull/78) | `cf9712c65ee0e6527e4a3e6ae12485237fbad99e` |
| 3C.1 schema foundation and Preview migration plan | [#79](https://github.com/LatinMaestro/SpendGrove/pull/79) | `f3778c03b45981ac831066cfb9ae93f709075e84` |
| 3C.1A development-only transaction reset utility | [#80](https://github.com/LatinMaestro/SpendGrove/pull/80) | `7eeb6f7f830d93b86e2e6786935c9f222a97d8c4` |
| 3C.2 manual Property link and unlink | [#81](https://github.com/LatinMaestro/SpendGrove/pull/81) | `3577584b8c19f1c1c9cb4792325994e08dfd2454` |
| 3C.3 Property record-keeping activity view | [#82](https://github.com/LatinMaestro/SpendGrove/pull/82) | `743d3d8f11b92d625b266f833f0b35cdff00ca3c` |
| 3C.4 QA and client review package | [#83](https://github.com/LatinMaestro/SpendGrove/pull/83) | `601196634df666067b454328b61dfd193f40f33f` |
| Client acceptance hardening | [#84](https://github.com/LatinMaestro/SpendGrove/pull/84) | `f1ad1b90184e24cbacdb249a37b36fdc9b832ed5` |
| Permanent acceptance deployment handoff | [#85](https://github.com/LatinMaestro/SpendGrove/pull/85) | `5799f05ab7eefdc7df86c09debb97537a9028d8e` |

## Schema and migration status

- PR 3C.1 added exactly one `PropertyTransactionLink` table.
- The table contains generated link ID, authenticated `userId`, `transactionId`, `propertyId`, nullable `unlinkedAt`, and created/updated timestamps only.
- It has the approved unique transaction index, owner-scoped indexes and foreign-key behavior.
- No existing Phase 3A or Phase 3B table, column, enum, constraint, default or row was altered or rewritten.
- The approved `Preview Prisma Migration` workflow ran once from `main` with confirmation `RUN PREVIEW MIGRATION`.
- Preview workflow run `28552337732` succeeded at commit `f3778c03b45981ac831066cfb9ae93f709075e84` using Preview-only Neon secrets.
- No manual SQL, reset, migration retry or Production secret was used.
- No Production migration has run.
- The focused acceptance hardening changes no Prisma model, enum, table, column, index or migration file.

## Manual link, unlink and relink behavior

- The link action appears in everyday transaction details.
- The server rechecks the signed-in user, transaction owner, active/non-deleted transaction state, non-parent split state, Property owner and active/non-deleted Property state.
- Repeating the current Property link is idempotent.
- Choosing a different Property while linked is rejected with an unlink-first instruction.
- Unlink requires explicit confirmation and leaves the transaction and Property unchanged.
- A later link reuses the single durable link record.
- Audit metadata contains only `propertyLinkState` and `MANUAL_USER_ACTION`; it contains no Property details or transaction values.

## Property record-keeping activity view

- The Loans page keeps Loan Accounts as the primary records, with Loan and linked Property edit controls on each active Loan Account card.
- A compact **Other Properties** area appears only for Properties not linked to an active Loan Account.
- Each linked Property can open a neutral record-keeping panel directly from its Loan Account card.
- The panel reads existing active everyday transactions through active links; it creates no Property transaction copy.
- Individual date, amount, safe merchant label and category can be displayed from the existing transaction.
- Reconciled everyday transactions are derived separately through the Property's active Loan Accounts and active repayment links; manual Property links remain a distinct section.
- The view computes no totals, percentages, income, expense, profit, yield, equity, valuation, net worth, tax or dashboard result.
- Inactive/deleted transactions and unlinked relationships do not appear.

## Development-testing transaction reset

- Available only when the server identifies local development or Vercel Preview/development.
- Hidden and unavailable in public Production context.
- Requires the exact confirmation phrase `DELETE TRANSACTIONS`.
- Uses existing bulk soft-delete semantics for the current authenticated user's everyday transactions.
- Deactivates affected active loan reconciliation and Property links.
- Preserves everyday-transaction ownership boundaries and all non-transaction product records.
- Reports safe aggregate changed/detached counts only.

## Privacy and security evidence

- All link and activity operations are authenticated and user-scoped.
- Ownership and lifecycle state are revalidated server-side.
- The link table stores no financial value, merchant, category, description, narration, filename, source text, address or account reference.
- Activity reads select no transaction description, notes, raw narration, filename, lender name or account reference.
- Audit metadata contains safe state/reason codes only.
- Raw CSV files, rows, original filenames and raw bank narration are not persisted by this milestone.
- No exact Property address, account identifier, BSB, card fragment, customer ID, loan/lender reference, masked reference, secret or connection string was added.
- No new package, provider, paid service, secret or environment configuration was introduced.

## Test, build and Vercel evidence

- Final functional regression suite: 70 test files / 416 tests passed.
- Focused acceptance-hardening regression suite: 71 test files / 424 tests passed.
- TypeScript type-check: passed.
- Next.js production build: passed.
- PR 3C.0 Preview: https://vercel.com/latinmaestros-projects/spendgrove/6jcQRRsiZzFfbGcbZstLahADDstU
- PR 3C.1 Preview: https://vercel.com/latinmaestros-projects/spendgrove/2RvmUcQeTC8Yq5NvJWxgb5RAy4Vy
- PR 3C.1A Preview: https://vercel.com/latinmaestros-projects/spendgrove/G9M1uBhtpoqQmfsjXY7vFVw3hSaU
- PR 3C.2 Preview: https://vercel.com/latinmaestros-projects/spendgrove/6ffiuYMWNdUeieD8i2PzwVnSvUxi
- PR 3C.3 Preview: https://vercel.com/latinmaestros-projects/spendgrove/CL3b1EdsnHzcjKRJYoL9We8rPnX6
- Main after PR 3C.3: https://vercel.com/latinmaestros-projects/spendgrove/2CKHMQpQr5LtfsVj4yC3DpovkyjA
- Production alias: https://spendgrove.vercel.app

- PR #84 acceptance-hardening Preview: https://vercel.com/latinmaestros-projects/spendgrove/9MzRCWw6MZCJsdM5ijEZq32oG1Yh
- PR #84 acceptance-hardening merged-main deployment: https://vercel.com/latinmaestros-projects/spendgrove/7jPxdoX8ptmf72bP3MKiuCiTLezZ
- Final permanent-handoff main deployment after PR #85: https://vercel.com/latinmaestros-projects/spendgrove/D5Jk9T4ek1rfghB2JR7tafxhzwtq
- Public smoke checks returned HTTP 200 for `/`, `/loans`, `/loans/import`, `/transactions` and `/settings`, with no internal server error.

## Known limitations

- One transaction can link to one Property only; there is no allocation across Properties.
- A split child may link, but a split parent cannot.
- Property linking remains entirely manual; there is no automatic Property suggestion, matching or `PropertyTransactionLink` creation.
- Loan repayment reconciliation auto-links only one unambiguous current high-confidence candidate; every other candidate remains manual.
- Direct active relink is intentionally unavailable; unlink first.
- The activity view is a record list, not a report, summary or Property profile.
- Archived/deleted transactions are absent from active Property activity even though durable unlink history remains.
- Property and Loan Account nicknames remain user-entered safe labels; exact addresses and private account references are unsupported.
- There is no tax classification, deductible percentage, tax advice, EOFY report, accountant report or Property statistic.
- There are no Home dashboard statistics, documents, receipts, Basiq, AI, payments, household mode or Phase 4 features.

## Non-technical client testing checklist

Use fictional or synthetic values only.

1. Sign in and create or use an active Property with a safe nickname in **Loans**.
2. Open **Transactions**, choose an active everyday transaction and open its details.
3. Under **Property record keeping**, choose the active Property and link it.
4. Confirm the transaction date, amount, merchant, category and source did not change.
5. Return to **Loans**, find the supporting Property and open **Property record keeping**.
6. Confirm the linked everyday transaction appears once with its existing date, amount, merchant label and category.
7. If a Loan Account uses that Property, confirm its context appears separately under **Linked Loan Account context**.
8. Confirm the Loan Account is not presented as another payment or transaction.
9. Return to the transaction, choose **Unlink Property**, review the confirmation and confirm unlink.
10. Return to the Property activity view and confirm the transaction no longer appears.
11. Link the transaction again, then unlink it and link it to a different active Property.
12. Confirm the app requires unlink before switching Properties.
13. Confirm an archived Property cannot be selected for a new link.
14. Confirm a deleted/inactive transaction cannot create a new link and does not appear in activity.
15. Confirm an existing split child can link while a split parent cannot.
16. Check **Transactions** and confirm Property linking created no duplicate spending or income record.
17. Confirm no Property totals, income/expense statistics, profit, yield, equity, valuation, net worth or Home statistic appears.
18. Confirm no tax wording, deductibility conclusion, EOFY report or tax advice appears.
19. Confirm no exact address, narration, filename, account reference or private identifier is requested or displayed.
20. In an approved Vercel Preview or local-development session only, open **Settings > Development testing**.
21. Confirm Production does not show or permit the development-testing transaction reset.
22. In Preview, enter `DELETE TRANSACTIONS`, run the reset and confirm only aggregate counts are shown.
23. Confirm the signed-in test account's everyday transactions leave the active app view while Loan Accounts, repayment breakdowns, Properties, categories, settings, profiles and merchant rules remain.
24. Confirm affected loan reconciliation and Property links are safely detached.
25. Repeat the main link, unlink and activity checks on a phone-sized screen.
26. Save a synthetic repayment with exactly one eligible everyday transaction of the same amount dated zero or one day away.
27. Confirm the repayment is linked automatically and can still be unlinked normally.
28. Repeat with zero and then two exact high-confidence candidates; confirm neither case links automatically.
29. Repeat with medium, manual and override-band candidates; confirm they remain in the existing review flow.
30. Test a transaction with an uncertain existing split-loan allocation and confirm it remains manual.
31. For a Property-linked Loan Account, confirm its reconciled everyday transaction appears under **Linked through repayment breakdowns**.
32. Unlink the repayment and confirm that loan-derived activity disappears without changing the everyday transaction.
33. Manually link another transaction to the Property and confirm it appears only under **Manually linked property transactions**.
34. Confirm the Loan Account and linked Property edit pencils are available on the active Loan Account card.
35. Confirm the old **Optional supporting records** wording is gone and unlinked Properties remain manageable under **Other Properties**.

## Milestone stop

Phase 3C Milestone 1 was formally accepted and closed by the client on 3 July 2026. Its delivered behavior, privacy controls and known limitations are accepted. No later milestone or module was started as part of closure.

## Recommended next step

Review the proposal-only choices in `docs/NEXT_MILESTONE_OPTIONS.md`. Reports, tax treatment, Property statistics, recurring behavior, budgets, insights and Home dashboard statistics require a separately approved contract and implementation milestone.
