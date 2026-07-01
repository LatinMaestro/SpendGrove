# Phase 3B Milestone 3 Summary - Repayment Corrections and Duplicate Re-import Safety

Date implementation completed: 1 July 2026

Status: implementation and QA complete; awaiting client retesting

## Delivered outcome

Milestone 3 adds recovery and duplicate-safety controls to the accepted loan repayment workflow without changing its schema, financial rules, reconciliation tolerances, privacy boundary or no-double-count treatment:

- users can correct approved structured values on active, unmatched and unlinked repayment breakdowns;
- linked repayments must be unlinked before financial/date correction and archived repayments must be restored first;
- correction uses the existing `updatedAt` value to reject stale edits;
- loan CSV review checks exact structured duplicates against the owning Loan Account and earlier reviewed rows;
- likely duplicates are warning-only and excluded by default;
- same-date/same-total rows with different components remain visible as possible overlaps;
- `Save anyway` requires a visible confirmation on each likely-duplicate row;
- commit repeats the structured duplicate check inside a serializable transaction;
- repayment history has separate active and archived views;
- individual archive/restore remains available;
- confirmed multi-select archive/restore is capped at 100 owned repayments and reports changed/skipped counts.

Everyday-account transactions remain the only cashflow/spending records. Correction, duplicate review and cleanup never create, update, archive, unlink or delete an everyday transaction.

## Completed PRs and merge commits

| Work | PR | Merge commit |
|---|---|---|
| 3B.9 correction and duplicate-safety contract | [#71](https://github.com/LatinMaestro/SpendGrove/pull/71) | `8c4b9123f0e07cd1a602cb1dcad1c7b30b60c36f` |
| 3B.10 safe repayment correction | [#72](https://github.com/LatinMaestro/SpendGrove/pull/72) | `d79bc24b2bebe277b39729d655e995d8c7d1253d` |
| 3B.11 deliberate duplicate loan re-import safeguards | [#73](https://github.com/LatinMaestro/SpendGrove/pull/73) | `3ea74c685bef3076aadae801ec421b270233622c` |
| 3B.12 safer repayment cleanup | [#74](https://github.com/LatinMaestro/SpendGrove/pull/74) | `e608a6af37c1f10b298f3d0536484cdbffbd40cd` |
| 3B.13 QA, Vercel review and client testing package | [#75](https://github.com/LatinMaestro/SpendGrove/pull/75) | `d962136313ea6b00adb729428fe0deddadd0bb5e` |

## Client acceptance hardening

PR [#76](https://github.com/LatinMaestro/SpendGrove/pull/76) fixes the client-reported post-save navigation gap without changing the durable commit contract. After the existing repayment save returns success, the browser replaces the import route with `/loans` and hands off only a bounded aggregate saved count. The Loans page shows general completion copy and the normal Loan Account list. Replacement navigation keeps browser Back from returning to and resubmitting the frozen review request.

If save fails, the success branch is never reached: the user stays on the review screen with selected rows, warnings and the existing safe failure message. Frozen-request idempotency, commit-time duplicate rechecking, per-row duplicate override and selected/excluded counts are unchanged.

## Safe repayment correction

Correction is limited to repayment date, total, principal, interest, fees and optional balance after. Amounts remain integer cents; missing remains distinct from zero; known components cannot exceed the total by more than two cents; and complete components must reconcile within two cents.

The owner, Loan Account, source, import batch lineage, reconciliation link and archive/deletion state cannot be moved or rewritten through correction. The server rechecks ownership, active Loan Account state, repayment state, active-link absence and `updatedAt` inside a serializable write boundary. Correction audit metadata contains changed-field codes and `CORRECTED` only, never old/new dates, amounts or balances.

## Duplicate re-import safeguards

Duplicate assessment uses only:

- owning Loan Account;
- repayment date;
- total payment;
- principal;
- interest;
- fees;
- optional balance after.

An exact tuple is a likely duplicate. The same date and total with a non-exact component/balance tuple is a possible overlap. Archived non-deleted repayments participate; deleted repayments do not. The browser defaults likely duplicates to excluded and keeps possible overlaps selected for review. A likely duplicate can be saved only after its own `Save anyway` confirmation.

The server repeats the exact check at commit time. If a selected exact match lacks an override, the whole write is rejected for refreshed review. A completed frozen request still returns its original result before duplicate assessment, preserving idempotency. No fingerprint, candidate snapshot, filename, narration or raw row is stored.

## Non-destructive cleanup

- Active and archived repayment histories are filtered separately.
- Individual archive/restore remains available.
- Bulk archive/restore requires confirmation and accepts at most 100 unique owned repayment IDs with stale tokens.
- Cross-user, missing or deleted selections reject the request without revealing record details.
- Stale, newly linked, already-updated or already-in-state selections are skipped and reported only as aggregate counts.
- A serializable transaction is retried once on a concurrency conflict.
- Archive never unlinks automatically; cleanup never hard-deletes a repayment or alters an everyday transaction.
- Source, import lineage and historical reconciliation evidence remain intact.

## Schema and migration status

- The existing Phase 3B schema was sufficient.
- No Prisma schema file changed.
- No migration file was added or edited.
- No Preview migration was required or run for Milestone 3.
- No Production migration was run.
- No table, column, enum, relation, index, fingerprint, revision table or data rewrite was introduced.

## Privacy and security evidence

- Every read and write is authenticated and user-owned.
- Unknown fields are rejected at the correction, duplicate-check and cleanup boundaries.
- Raw CSV files, bytes, rows, filenames, headers, narration and loan event text remain browser-local.
- Duplicate responses contain only a transient reviewed-row number, classification and structured reason code.
- Duplicate overrides are request-only and are not persisted as fingerprints or candidate snapshots.
- Correction audit metadata contains changed-field codes only; duplicate audit metadata contains aggregate warning/override counts only; archive audit metadata contains safe state codes only.
- Audit metadata contains no old/new financial values, dates, balances, nicknames, source text or private identifiers.
- No account identifiers, BSBs, card fragments, customer IDs, loan references, masked references, exact property addresses, secrets or connection strings were added.
- No new package, provider, paid service, secret or environment change was introduced.

## Test, build and Vercel evidence

- Acceptance-hardening regression suite: 66 test files / 398 tests passed.
- Acceptance-hardening TypeScript type-check: passed.
- Acceptance-hardening Next.js production build: passed.
- PR 3B.13 merged-main deployment: https://vercel.com/latinmaestros-projects/spendgrove/4rEpVMNznLD32KFbeQ4YYejwvBT2
- Final regression suite: 65 test files / 394 tests passed.
- TypeScript type-check: passed.
- Next.js production build: passed.
- PR 3B.9 preview: https://vercel.com/latinmaestros-projects/spendgrove/7W3hc1rC91FTp8isDwFioKW1PKT4
- PR 3B.10 preview: https://vercel.com/latinmaestros-projects/spendgrove/Ac1zQC8spzLfASuik7QucFoWRfco
- PR 3B.11 preview: https://vercel.com/latinmaestros-projects/spendgrove/Beajmh9g5bEisTj2Ze28L6MLt7A1
- PR 3B.12 preview: https://vercel.com/latinmaestros-projects/spendgrove/5acWb392SBigHakoMW7iHurSuAvL
- Main after PR 3B.12: https://vercel.com/latinmaestros-projects/spendgrove/8bsg1jYHMBtMkE1YWJS9u9rR1Vag
- Production alias: https://spendgrove.vercel.app
- Live public smoke checks returned HTTP 200 for `/`, `/loans` and `/loans/import`; both loan routes rendered their account-session shell and neither returned an internal server error.

The PR #76 preview and merged-main deployment are recorded in the final client handoff after Vercel reports green.

## Known limitations

- Correction does not keep durable old/new financial values or an immutable revision history; only safe changed-field codes are audited.
- Linked repayments must be unlinked before correction and archived repayments restored first.
- Loan duplicate detection is deliberately exact and structured. It does not use fuzzy text, narration, filenames or date/amount tolerances.
- A user can deliberately create another exact repayment after confirming `Save anyway` for that row.
- Possible overlaps are review warnings, not automatic suppression or merging.
- Cleanup is archive/restore only and bulk actions are capped at 100 selections.
- Reconciliation remains deterministic, user-confirmed and reversible with the accepted confidence bands unchanged.
- Repayment breakdowns do not feed spending, income, property, loan, net-worth or Home dashboard statistics.
- No tax/EOFY/property/accountant report, deductibility decision, tax advice, property profile or everyday-transaction-to-property tax link exists.
- No recurring, subscriptions, budgets, insights, reminders, Basiq, AI, payments, household mode, accountant workspace or document storage was added.

## Non-technical client testing checklist

Use fictional or synthetic values only.

1. Sign in and open **Loans**.
2. Expand an active Loan Account with an unmatched repayment breakdown.
3. Choose **Edit breakdown**, change one structured amount or the date, and save.
4. Confirm the corrected values appear and source/import history has not moved to another Loan Account.
5. Open a linked repayment and confirm editing is unavailable until **Unlink breakdown** is used.
6. Archive a repayment and confirm it must be restored before editing.
7. Open **Import Loan CSV** for the same Loan Account and review a synthetic row that exactly matches an existing active repayment.
8. Confirm it says **Likely duplicate — excluded by default** and is not selected.
9. Confirm the exact-match row is saved only after its own **Save anyway** confirmation.
10. Repeat with an exact match to an archived repayment and confirm the warning still appears.
11. Review two identical rows in one synthetic CSV and confirm the later row is treated as likely duplicate.
12. Review a row with the same date and total but a different principal, interest, fee or balance value.
13. Confirm it says **Possible overlap — review before saving** and remains selectable.
14. Save a normal non-duplicate row and confirm the saved/excluded counts remain correct.
15. Return to **Loans** and switch between **Active** and **Archived** repayment history.
16. Confirm individual archive and restore still work.
17. Choose **Select to archive**, select several unlinked repayments, tick the confirmation and archive them.
18. Confirm the result reports changed and skipped counts and the records move to **Archived**.
19. Select archived repayments and use **Restore selected**.
20. Confirm linked repayments cannot be selected for archive and no everyday transaction is altered or removed.
21. Check **Transactions** and confirm correction, duplicate review and cleanup created no extra spending/income entry.
22. Confirm car, personal and other loans still work without property details.
23. Confirm no filename, narration, account reference or exact address appears in saved repayment history.
24. Confirm no tax advice, deductible claim, Home statistic, property report or later-module feature appears.
25. Repeat the core correction, duplicate-warning and archive/restore checks on a phone-sized screen.
26. Save selected synthetic repayment breakdowns and confirm the app automatically returns to **Loans**, not the import screen.
27. Confirm the Loans page shows only a general success message and aggregate saved count, with the relevant Loan Account available to open for repayment history.
28. Confirm a failed save remains on the review screen with selections, warnings and the safe error intact.
29. Use browser Back after a successful save and confirm it does not resubmit or create another repayment save.
30. Re-import an exact duplicate and confirm it is still excluded by default unless **Save anyway** is confirmed for that row; confirm selected, excluded and saved counts remain correct.

## Client review stop

Milestone 3 implementation is complete. Stop here for client retesting. Do not begin another milestone, Phase 4, Home dashboard statistics, tax/EOFY reporting, Basiq, AI, payments or later modules without explicit approval.

## Recommended next step

Complete client retesting, formally accept and close Milestone 3 if no further comments remain, then prepare a separate proposal-only decision on the next approved scope. No next-phase implementation is authorised by this package.
