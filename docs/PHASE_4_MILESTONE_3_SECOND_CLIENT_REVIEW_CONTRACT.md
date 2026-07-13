# Phase 4 Milestone 3 Second Client-Review Hardening Contract

Status: client-approved; implementation gated by this contract

Last updated: 13 July 2026

## Objective

Resolve the remaining beginner-workflow issues identified in the five-minute client recording without redesigning or regressing the accepted month navigation, searchable category picker, compact Property control, category suggestions, Delete wording, category comparisons or loan reconciliation.

Phase 4 Milestones 1, 2 and 3 remain open pending explicit client acceptance.

## Impact assessment

Repository truth confirms the approved work can be implemented with existing models, routes and financial rules.

- No Prisma schema or migration change is required.
- No Preview or Production migration is authorised.
- No data rewrite, backfill or hard deletion is required.
- No package, provider, secret or environment change is required.
- Recurring exact signed-amount and cadence thresholds remain unchanged.
- Budget calculations, monthly-only period and no-rollover rule remain unchanged.
- Loan repayment matching, allocation, ownership and no-double-count rules remain unchanged.
- Transaction date storage and Brisbane month boundaries remain unchanged.
- Property-link cardinality, import semantics and report/export rules remain unchanged.
- No bottom-navigation tab or product module is added.

Stop before implementation if any statement above proves false.

## Initial transaction month

- Keep the existing Australia/Brisbane calendar-month query and navigation.
- If the current month has at least one eligible active owned transaction, open it.
- Otherwise, request only the latest eligible active transaction month through an efficient owned server query and open that month.
- If no eligible transactions exist, keep the current month and existing empty state.
- Do not load complete transaction history to find the month.
- Search and filters remain scoped to the selected month.
- Future-dated transaction handling and month arrows remain unchanged.

## Regular-payment presentation

- Home shows the awaiting-review count, at most three highest-priority suggestions and one Review all action.
- Each suggestion is compact by default: safe name, expected signed amount, plain-English interval, optional next date, Confirm, Dismiss and Edit details.
- Editable label, amount, interval and date fields appear only for the selected suggestion.
- Opening one editor closes other suggestion editors.
- Cancel discards transient edits.
- Why suggested remains behind labelled disclosure.
- Suppress only repeated presentation of the same deterministic suggestion identity.
- Distinct amount, cadence or payment identities remain separate.
- Exact signed amount, cadence windows, confirmation, dismissal and recovery rules do not change.

## Loan Account presentation

- The Loans overview shows compact account summaries only.
- Each summary contains nickname, purpose label, optional Property nickname, recent repayment status, repayment count, linked everyday-transaction count and one View loan/View details action.
- At most one Loan Account detail is open at a time.
- Details show the latest three repayment breakdowns and latest three linked everyday transactions first.
- View all repayments and View all linked transactions reveal complete eligible lists.
- Property records remain behind a labelled disclosure.
- Required reconciliation warnings stay visible.
- Correction, unlink, history and no-double-count behaviour remain reachable and unchanged.

## Monthly-budget presentation

- Active budget summaries remain visible.
- The blank create form is hidden until Add budget is selected.
- Cancel closes the form and clears transient input.
- Deleted budgets remain secondary and collapsed.
- Monthly calculations, lifecycle and no-rollover behaviour remain unchanged.

## Action hierarchy and accessibility

- Each changed card/section has one dominant current-task action where practical.
- Edit, Delete, Restore, Details and historical lists remain secondary.
- Zero-count sections are hidden unless they provide a useful next action.
- Important beginner actions use visible text.
- Disclosures retain accessible labels, focus states, keyboard operation and practical touch targets.
- Changed layouts must not introduce horizontal scrolling.

## Privacy and no-double-count

- Use only approved safe structured transaction, recurring, budget, loan and Property metadata.
- Do not persist or log raw CSV files/rows, filenames, narration, private descriptions, account references, identifiers, balances, exact addresses or secrets.
- Everyday transactions remain the only cashflow records.
- Recurring items, budgets and loan repayment breakdowns remain planning/analytical records and never add spending.

## Approved delivery

1. Documentation-only contract and impact review.
2. One coherent implementation and focused regression-test PR.
3. Full QA, Vercel evidence and consolidated deferred-client documentation PR.

Prefer one meaningful Vercel Preview for the implementation batch. Documentation-only deployments may be skipped or treated as unchanged-app evidence where the connected workflow permits.

## Mandatory stops

Stop before schema/migration, data rewrite/backfill, hard delete, recurring-threshold, budget-formula, loan-reconciliation, transaction-date/month-boundary, import, Property-link, report/export, package/provider/secret/environment, bottom-navigation, Basiq, AI, payment, notification, tax, Property/net-worth/valuation, household or document-storage change.

After QA, stop. Keep all three Phase 4 milestones open and do not begin another milestone.
