# Phase 3B Milestone 2 Summary - Durable Loan Repayments and Reconciliation

Date implementation completed: 29 June 2026

Status: implementation complete; awaiting client retesting and formal acceptance

## Delivered outcome

Milestone 2 turns the accepted browser-local loan CSV review into a durable, privacy-safe repayment workflow:

- users choose the owning Loan Account before reviewing a CSV;
- only clear, warning-free repayment breakdowns can be selected for saving;
- the user explicitly confirms the selected rows before anything is committed;
- saving is atomic and retry-safe for the frozen request;
- recent loan CSV saves show aggregate counts and dates only;
- each Loan Account shows structured repayment history and expandable repayment detail;
- reconciliation suggests possible existing everyday transactions using the approved amount/date rules;
- users can link, unlink and relink a repayment breakdown;
- one everyday transaction can support multiple loan breakdowns for split-loan payments;
- the everyday transaction remains the sole cashflow/spending record.

No tax conclusion, report, Home dashboard statistic or later module was added.

## Completed PRs and merge commits

| Work | PR | Merge commit |
|---|---|---|
| 3B.4 durable reviewed repayment commit and safe aggregate history | [#62](https://github.com/LatinMaestro/SpendGrove/pull/62) | `1cedad415bc4d0f12687b98ac83741174d2808ff` |
| 3B.5 repayment history and repayment detail | [#63](https://github.com/LatinMaestro/SpendGrove/pull/63) | `f92e7f56a28b75a0c8b5c6a6f7bc1dfb4b04a1d1` |
| 3B.6 reconciliation candidate suggestions | [#64](https://github.com/LatinMaestro/SpendGrove/pull/64) | `17fb6abe9e536186ea1ec8c035ed2dd71a047774` |
| 3B.7 manual link/unlink and no-double-count safeguards | [#65](https://github.com/LatinMaestro/SpendGrove/pull/65) | `7ab14bee38193de0e587971b0f21a3600446b99c` |
| 3B.8 QA, Vercel review and client testing package | current PR | pending merge |

## Durable repayment commit

- The browser sends only selected reviewed dates and structured integer-cent repayment values.
- Rows with warning codes, non-repayment events, missing dates or missing/invalid totals cannot be committed.
- The user may exclude otherwise valid rows before saving.
- The confirmation panel states exactly how many repayment breakdowns will be saved and excluded.
- The first save attempt freezes its request and payload. A network retry reuses that same request instead of creating a second batch.
- The server writes the safe import batch and all repayments in one database transaction.
- A completed retry returns the original aggregate result.
- Safe history contains completion date and reviewed/saved/excluded counts only.

The retry guarantee applies to the same frozen request. A separate later import is intentionally a new request; Milestone 2 does not add a private content fingerprint.

## Repayment history and detail

Loan Account cards show:

- repayment date;
- total repayment;
- principal;
- interest;
- fees;
- optional balance after;
- reconciliation state;
- linked everyday transaction date and amount only when an active link exists.

The UI labels repayment records as analytical breakdowns, not extra payments or spending entries. Unmatched repayments can be archived and restored. An actively linked repayment must be unlinked before it can be archived.

## Reconciliation suggestions

Suggestions are deterministic and never create a link automatically.

Approved bands:

- **High confidence:** exact amount and zero to one calendar day apart.
- **Medium confidence:** zero to two cents difference and zero to three calendar days apart, or exact amount and two to seven days apart.
- **Manual candidate:** no more than one dollar difference and no more than seven days apart, shown only after the user opens wider manual matching.

The comparison uses the absolute everyday transaction amount. For a transaction already supporting another split-loan breakdown, the existing linked allocation is added before calculating variance for the next repayment.

Deleted, inactive, zero-value, split-parent, cross-user, archived and already-linked repayment records are excluded as applicable.

For transactions outside the candidate bands, the user can deliberately search one exact transaction date. Results are labelled as an explicit manual override search rather than likely matches, and every result requires confirmation of the displayed amount variance and date difference.

## Link, unlink, relink and no-double-count behaviour

- Every link is initiated by the user.
- Medium, manual and override links require an additional mismatch confirmation.
- Ownership, active state, amount variance, date difference and existing split allocation are recalculated on the server immediately before the write.
- Link writes run in a serializable database transaction.
- One repayment can have only one active everyday transaction link.
- One everyday transaction can support multiple repayment breakdowns for split-loan payments.
- Unlinking preserves both records and makes the repayment unmatched again.
- Relinking reuses the existing safe link record and repeats every eligibility check.
- Linking never creates, updates, deletes or duplicates an everyday transaction.
- The everyday transaction counts once; all linked repayment cards remain loan-analysis breakdowns only.

## Schema and migration status

- Milestone 2 used the existing Phase 3B foundation unchanged.
- No Prisma schema change was needed.
- No migration file was added or edited.
- No Preview migration was required or run for Milestone 2.
- The earlier Phase 3B foundation migration remains applied to Preview only.
- No Production migration was run.
- No data rewrite occurred.

## Privacy and security evidence

- Raw loan CSV files, bytes, rows, filenames, headers, event text and narration remain in browser memory only.
- No raw CSV or source narration is sent in a repayment commit or reconciliation request.
- Repayment commit schemas reject unknown fields.
- Durable repayments contain only the authenticated user/Loan Account relationship, date, structured integer-cent components, optional balance-after value, safe source, status and import lineage.
- Reconciliation links contain only approved IDs, confidence/method/reason codes, signed variance, day difference and unlink timestamp.
- Candidate responses contain IDs, dates, structured amounts, allocation, variance, day difference and safe codes only.
- Linked transaction context shows date and amount only, never narration or merchant text.
- Every read and write is scoped to the authenticated user.
- Link writes re-check both repayment and transaction ownership inside the atomic transaction.
- Audit metadata contains aggregate counts or safe state/method/confidence/reason codes only. It contains no amounts, balances, labels or source text.
- Tests enforce that reconciliation code never writes an everyday transaction.
- Exact property addresses, account numbers, lender references, customer IDs, masked account references, BSBs, card fragments, secrets and connection strings are not requested, persisted or logged.

## Test, build and Vercel evidence

- Full regression suite: 65 test files / 375 tests passed.
- TypeScript type-check: passed.
- Next.js production build: passed.
- PR 3B.4 preview: https://vercel.com/latinmaestros-projects/spendgrove/DrpjL7qAw5wji3opUVtXHnhRQHLH
- PR 3B.5 preview: https://vercel.com/latinmaestros-projects/spendgrove/GHncJBdaGWt6VpmXMqm2N1ZP3J5Y
- PR 3B.6 preview: https://vercel.com/latinmaestros-projects/spendgrove/3WcmJgL8zrZsjqrfcJdEQUuN7bHX
- PR 3B.7 preview: https://vercel.com/latinmaestros-projects/spendgrove/3MynVjB5Re4shdQ4p8BdDELAzhDw
- Final functional Milestone 2 main deployment: https://vercel.com/latinmaestros-projects/spendgrove/H19jmvDTo34LpD31hjASNEsTKy6u
- Production alias: https://spendgrove.vercel.app
- Vercel checks for PRs 3B.4 through 3B.7 and each merged main commit were green.
- Mobile signed-out checks at 390×844 passed for `/loans` and `/loans/import`: no horizontal overflow, no console errors, and all five primary navigation items remained available.

Signed-in end-to-end testing is intentionally left to the client because Codex does not use or expose the client's protected authenticated session.

## Known limitations

- A separate later import of the same source starts a new request; content-based repeat-import detection is not part of this milestone.
- Saved repayment breakdowns can be archived/restored but not edited after commit.
- Reconciliation suggestions depend on eligible existing everyday transactions already being present.
- Matching is deterministic and user-driven; there is no automatic link.
- Out-of-band manual search uses an exact transaction date and safe date/amount context only; it does not search narration.
- Balance-after values are stored review context and are not used to infer advice or automatically rewrite a Loan Account balance.
- Loan repayment breakdowns do not feed spending, income, property, loan, net-worth or Home dashboard statistics.
- No tax/EOFY/property/accountant report, automated deductibility decision, tax advice, property profile or everyday-transaction-to-property tax link exists.
- No recurring, subscriptions, budgets, insights, reminders, Basiq, AI, payments, household mode, accountant workspace or document storage was added.

## Non-technical client testing checklist

Use fictional or synthetic data only for testing.

1. Sign in and open **Loans**.
2. Confirm your existing active Loan Accounts still appear and properties remain optional supporting information.
3. Open **Import Loan CSV**, select the owning Loan Account and use a synthetic loan CSV.
4. Confirm clear repayment breakdowns are selected for saving by default.
5. Confirm warning rows and non-repayment events say they are excluded from saving.
6. Deselect one clear repayment and verify the saved/excluded counts update.
7. Tick the confirmation and save the selected repayments.
8. Confirm the success message reports the correct saved and excluded counts.
9. Return to **Loans** and expand the Loan Account's repayment history.
10. Confirm each repayment shows date, total, principal, interest, fees and optional balance after without narration.
11. Confirm the page calls these records breakdowns and does not imply extra spending.
12. Archive and restore an unmatched repayment breakdown.
13. Create or import a synthetic everyday transaction with the exact repayment amount and a date zero or one day away.
14. Open **Find possible matches** and confirm the transaction appears as **High confidence**.
15. Link it and confirm the repayment shows the linked everyday date/amount.
16. Check Transactions and confirm no extra transaction was created and the existing transaction was not changed.
17. Unlink the breakdown and confirm both the repayment and everyday transaction remain.
18. Relink it and confirm the checks run again.
19. Test a two-cent/date-tolerant synthetic case and confirm the mismatch must be acknowledged before linking.
20. Open **Search wider manually** and test a synthetic difference of no more than one dollar within seven days.
21. Confirm manual-band results do not appear until wider matching is opened.
22. Use **Search this exact date** for a deliberately out-of-band synthetic transaction.
23. Confirm it is described as a manual override, not a likely match, and requires mismatch confirmation.
24. For a split-loan case, create two Loan Accounts with synthetic $1,600 repayment breakdowns and one existing $3,200 everyday transaction.
25. Link the first repayment through exact-date manual override, then confirm the second repayment can recognise the existing $1,600 allocation and reconcile to the same transaction.
26. Confirm the $3,200 everyday transaction still appears once and neither loan breakdown is counted as another payment.
27. Confirm an actively linked repayment cannot be archived until it is unlinked.
28. Confirm car, personal and other loans work without property details.
29. Confirm no tax advice, deductible claim, Home statistic or property report appears.
30. Repeat the key flow on a phone-sized screen.

## Client decision required

Please complete signed-in Milestone 2 retesting and report any acceptance comments. Formal Milestone 2 closure requires explicit client acceptance.

## Recommended next step

After Milestone 2 acceptance, formally close the milestone before approving more implementation. If further Phase 3B work is desired, prepare a proposal-only Milestone 3 focused on repayment correction and deliberate duplicate re-import safeguards. Do not implement that proposal, tax/property reports, Home dashboard statistics, Phase 4 or later modules without a separate approval.
