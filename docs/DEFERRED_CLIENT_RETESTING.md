# Deferred Client Retesting

Status: active consolidated backlog

Last updated: 12 July 2026

## Purpose

The client is temporarily away from the Vercel review environment. Client testing is deferred, not rejected and not accepted.

This document collects every non-technical test that remains pending. Phase 4 Milestone 1 is implemented, merged, deployed and technically verified but remains open. Later Phase 4 work must keep these features visible and testable.

Use synthetic or clearly non-private data. Do not upload or display real account identifiers, private narration or secrets.

## Phase 4 Milestone 1 - Recurring, Budgets and Everyday Insights

Status: pending deferred client retesting

### Recurring items

- [ ] Deterministic suggestions appear only from approved safe merchant/category, type, exact signed amount and repeated interval evidence.
- [ ] Weekly detection works for repeated gaps of 6-8 days.
- [ ] Fortnightly detection works for repeated gaps of 13-16 days.
- [ ] Monthly detection works for repeated gaps of 27-34 days.
- [ ] Ambiguous intervals produce no suggestion.
- [ ] Non-exact amounts produce no suggestion under the conservative initial rule.
- [ ] Two matching occurrences show a review suggestion.
- [ ] Three or more matching occurrences show a clear suggestion.
- [ ] Confirming a suggestion creates one recurring planning record.
- [ ] Editing the safe label, amount, cadence or next expected date before confirmation works.
- [ ] Dismissing a suggestion removes it from the current suggestion list.
- [ ] The dismissed suggestion does not immediately reappear while the same dismissal preference remains.
- [ ] Editing a confirmed recurring item works.
- [ ] Archiving a confirmed recurring item removes it from the active list.
- [ ] Recurring records do not create extra transactions.
- [ ] Recurring records do not move money.
- [ ] Recurring records do not create payments or contact merchants.
- [ ] Transfers, split parents, deleted/inactive and cross-user transactions do not create suggestions.

### Budgets

- [ ] A monthly category budget can be created for an active expense category.
- [ ] A budget can be edited.
- [ ] A budget can be archived.
- [ ] Only one active monthly budget can exist for the same category.
- [ ] Budget progress uses active owned everyday expenses in the current Brisbane calendar month.
- [ ] Eligible split children are included.
- [ ] Split parents are excluded.
- [ ] Income transactions are excluded.
- [ ] Transfers are excluded.
- [ ] Deleted/inactive transactions are excluded.
- [ ] Analytical loan repayment records are excluded.
- [ ] No duplicate cashflow record is created.
- [ ] No budget rollover occurs.
- [ ] No budget is created automatically.
- [ ] Refund limitation is understood: refunds represented as income do not reduce expense progress in this milestone.
- [ ] Used this month, Remaining this month and Over budget copy is clear and non-judgmental.

### Home insights

- [ ] Current-month everyday spending matches active eligible expense transactions.
- [ ] Current-month transaction count is correct.
- [ ] Top spending categories match reviewed transactions.
- [ ] Monthly budget progress appears.
- [ ] Confirmed recurring items appear.
- [ ] Previous-month comparison correctly shows up, down, unchanged or no previous comparison.
- [ ] Editing, recategorising, splitting, archiving or deleting an everyday transaction updates the current view after refresh.
- [ ] Split parents and analytical loan repayment breakdowns do not add extra spending.
- [ ] No Property profit/loss statistic appears.
- [ ] No tax or EOFY statistic appears.
- [ ] No net-worth statistic appears.
- [ ] No equity or valuation statistic appears.
- [ ] No loan-balance or loan-forecast statistic appears.
- [ ] No advice, forecast or judgmental wording appears.
- [ ] Signed-out users do not see private account totals.
- [ ] Mobile layout is readable.
- [ ] No horizontal scrolling occurs on a narrow phone screen.
- [ ] Desktop layout remains clear.

### Milestone 1 privacy and regression

- [ ] No raw CSV row is shown in recurring, budget or insight screens.
- [ ] No original filename is shown.
- [ ] No raw narration is shown.
- [ ] No account, BSB, card, customer, loan or lender reference is shown.
- [ ] No exact Property address is shown.
- [ ] No balance, secret or connection string is shown.
- [ ] Existing transaction import review remains available.
- [ ] Existing Loans, loan CSV and repayment reconciliation flows remain available.
- [ ] Existing Property links and Property records/export remain available.

## Phase 4 Milestone 2 - Recurring and Budget Lifecycle Recovery

Status: implemented, merged, deployed and technically verified; pending deferred client retesting

Delivery evidence:

- contract/no-schema PR #115 merged as `9dde5423db6934718e369e66cc9b3f1759bf26ce`;
- lifecycle recovery PR #116 merged as `71f0b5a50cf6ec65839b83935e779ea5c2ccb59f`;
- 84 test files / 513 tests passed;
- TypeScript/lint validity and clean production build passed;
- canonical review URL: https://spendgrove.vercel.app;
- main deployment `91RcdUep4v6E21iFRvnt5TTHX8Bx` is Ready.

### Recurring lifecycle recovery

- [ ] Active and archived recurring items are shown in clearly separate sections.
- [ ] Archiving an active recurring item moves it to Archived.
- [ ] Restoring an archived recurring item returns it to Active.
- [ ] Restore keeps label, category, type, amount, cadence and next expected date unchanged.
- [ ] An archived item must be restored before editing.
- [ ] A stale restore attempt fails safely.
- [ ] A cross-user recurring item cannot be restored.
- [ ] Restore is blocked when an equivalent active recurring item already exists.
- [ ] Restore creates no transaction.
- [ ] Restore creates no payment and contacts no merchant.
- [ ] No recurring item is hard-deleted.

### Dismissed suggestion recovery

- [ ] Still-relevant dismissed suggestions can be reviewed separately.
- [ ] Dismissed suggestion hash keys are not shown.
- [ ] Stale dismissed patterns that no longer exist are not presented as current suggestions.
- [ ] Show suggestion again requires an explicit user action.
- [ ] Undo removes only the owned dismissal preference.
- [ ] The suggestion returns only if the unchanged detector still finds the pattern.
- [ ] Undo creates no recurring item automatically.
- [ ] Undo creates no transaction or payment.
- [ ] Cross-user dismissal preferences cannot be viewed or changed.
- [ ] No bulk clear is present.

### Budget lifecycle recovery

- [ ] Active and archived budgets are shown separately.
- [ ] Archiving an active budget moves it to Archived.
- [ ] Restoring an archived budget returns it to Active.
- [ ] Restore keeps category, amount and monthly period unchanged.
- [ ] Budget progress remains based on the unchanged Milestone 1 formula.
- [ ] An archived budget must be restored before editing.
- [ ] A stale restore attempt fails safely.
- [ ] A cross-user budget cannot be restored.
- [ ] Restore is blocked if the category is archived, deleted, non-expense or not owned.
- [ ] Restore is blocked when another active monthly budget exists for the category.
- [ ] Restore changes no transaction.
- [ ] No budget is hard-deleted.
- [ ] No rollover, recommendation or automatic budget creation appears.

### Milestone 2 reminder and scope boundaries

- [ ] No push notification exists.
- [ ] No email or SMS reminder exists.
- [ ] No background scheduling exists.
- [ ] No due-soon or overdue threshold appears.
- [ ] nextExpectedDate remains display context only.
- [ ] No new navigation tab appears.
- [ ] No Basiq, AI, payment, tax, Property/net-worth, loan forecast, household or document feature appears.

## Future additions

Every later milestone that remains pending client acceptance must add its non-technical tests to this document. Do not remove completed-but-untested checks until the client explicitly records the result.

## Final return package

When the client returns:

1. Verify every pending milestone deployment is still available.
2. Provide one canonical Vercel URL.
3. Present this checklist in milestone order.
4. Clearly distinguish technically verified from client accepted.
5. Record client comments and perform only approved acceptance hardening.
6. Do not formally close a milestone without explicit client acceptance.
