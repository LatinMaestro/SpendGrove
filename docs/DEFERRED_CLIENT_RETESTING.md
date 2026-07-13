# Deferred Client Retesting

Status: active consolidated backlog

Last updated: 13 July 2026

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
- [ ] Used this month, Budget left and Over by copy is clear and non-judgmental.

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

## Phase 4 Milestone 3 - Beginner-first UI Simplification

Status: implemented, merged, deployed and technically verified; client review deferred

Delivery evidence:

- PR #118 merged as `344be702dea5cf82ae771d4d688cf2622a4b1e44`;
- PR #119 merged as `cc4d44d17d34ef9b86a064dfd25c536e5a2e6bd7`;
- exact PR verification used `6ab45f6c18e1c0d1c1dcc1ec1bb7d108fa51a4b2`;
- 85 test files / 521 tests, TypeScript/lint validity and the production build passed;
- Preview deployment `ESYj1tFsrxZuoPL9No9ZcEiyphZw` and merged-main deployment `GsZrG1sSrzrsSe5nn9Gj4U5qpibr` are Ready;
- no schema change or Preview/Production migration occurred.

### Cross-app simplicity

- [ ] Each screen has an obvious next useful action and clear primary-action hierarchy.
- [ ] Uncommon/destructive actions do not compete with the primary action.
- [ ] Essential correction, unlink, archive and restore actions remain discoverable.
- [ ] Empty sections do not clutter screens.
- [ ] Advanced controls appear only when relevant or deliberately opened.
- [ ] Explanations are concise and technical terms are replaced with plain English.
- [ ] Loading, success and error states explain the next step.
- [ ] Simple Mode remains the default.

### Home and navigation

- [ ] Home feels calm, hides empty sections and clearly presents spending, budgets and regular payments.
- [ ] Month comparison wording is understandable.
- [ ] Existing navigation remains clear and no new tab appears.

### Import and transactions

- [ ] Import follows Choose file, confirm mapping when needed, review, then import.
- [ ] Confident mapping does not force unnecessary controls into view.
- [ ] Import, Skip and Merge remain obvious and unchanged.
- [ ] Duplicate and Property detail appears only when relevant.
- [ ] Transaction rows prioritise date, description/category and amount.
- [ ] Secondary actions remain reachable without crowding.
- [ ] Review-before-commit, safe retry and duplicate-submit prevention remain intact.

### Regular payments and budgets

- [ ] Suggested, confirmed, dismissed and archived regular payments are easy to distinguish.
- [ ] Internal cadence/confidence wording is absent.
- [ ] Actions appear only for relevant lifecycle states.
- [ ] Archived items do not compete with active items by default.
- [ ] Monthly budget, spent and remaining values are clear and calm.
- [ ] No recurring threshold, budget formula or rollover behaviour changed.

### Loans, Property records and Settings

- [ ] Loan Account, everyday transaction and repayment breakdown are clearly distinguished.
- [ ] Repayment components and matching detail use progressive disclosure.
- [ ] Property records remain automatic and reporting appears only when a Property exists.
- [ ] Settings separates everyday preferences from advanced history/testing tools.
- [ ] No Reports or Properties tab appears.

### Accessibility and mobile

- [ ] Headings, labels, keyboard focus, touch targets and live errors/status are usable.
- [ ] Important actions are not unexplained icon-only controls.
- [ ] Long names wrap safely.
- [ ] Narrow screens have no horizontal scrolling.
- [ ] Colour is not the only status signal.

## Phase 4 Milestone 3 - Client-feedback acceptance hardening

Status: implemented, merged, deployed and technically verified; pending final client retesting

Delivery evidence:

- PR #121 contract merged as `54ae6196ed12ff96495b7aed88beec893ddab1df`;
- PR #122 implementation merged as `8bc4c6e4701554ec2cca0ce74e5aab2d38dcff15`;
- 86 test files / 536 tests passed;
- TypeScript/lint validity and clean production build passed;
- Preview `dpl_GrPrQu1QWys6JDfLquwbuW2eEeF5` and main `dpl_AVVZqH2afjZNvPZJF5bp5R3No8sW` are Ready;
- canonical review URL: https://spendgrove.vercel.app.

### Transactions

- [ ] The current Australian calendar month is selected by default.
- [ ] Previous month and Next month controls move exactly one month and have clear accessible labels.
- [ ] The next control is disabled when no later month is permitted.
- [ ] A month with no transactions shows a concise empty state.
- [ ] Search and existing filters operate within the selected month.
- [ ] A long history no longer creates one enormous default page.
- [ ] Dates do not shift across month boundaries.

### Category picker

- [ ] The category chooser opens quickly.
- [ ] Search finds seeded categories.
- [ ] Search finds custom categories.
- [ ] Search matches relevant group labels without case sensitivity.
- [ ] Keyboard and touch selection work.
- [ ] The no-results state is clear.
- [ ] A selection updates the correct review row.
- [ ] Opening/searching the chooser does not refetch the whole category catalogue for every row.

### Category suggestions

- [ ] Pizza, Sushi and Red Rooster-style descriptions receive a sensible reviewable takeaway suggestion.
- [ ] Other approved obvious takeaway brands behave consistently.
- [ ] A user-confirmed merchant/category rule overrides a generic keyword suggestion.
- [ ] Ambiguous descriptions remain manual.
- [ ] A clear outgoing-transfer purpose can provide a safe category suggestion.
- [ ] Suggestions remain editable and nothing is committed until Import is confirmed.
- [ ] No raw description evidence, filename or account detail appears in saved data or messages.

### Property controls

- [ ] The Property selector is hidden until Include in property records is enabled.
- [ ] Enabling the control reveals one active owned Property selector using nicknames only.
- [ ] Unchecking clears the transient Property choice.
- [ ] Skip creates no Property link.
- [ ] Merge ignores/clears the transient choice and remains post-merge manual-link only.
- [ ] Manual transaction create/edit uses the same compact optional pattern.

### Loan reconciliation

- [ ] Everyday-first import order auto-links one unique accepted high-confidence repayment.
- [ ] Loan-first import order auto-links when the matching everyday transaction is later imported.
- [ ] Zero or multiple eligible candidates remain manual.
- [ ] Medium/manual/override candidates remain manual.
- [ ] Cross-user, inactive, deleted or incompatible split records cannot auto-link.
- [ ] The link remains reversible through the existing unlink flow.
- [ ] No duplicate spending or second cashflow transaction appears.
- [ ] No automatic PropertyTransactionLink is created.

### Regular payments

- [ ] A stable merchant with changing trailing references can still form a suggestion when exact amount and interval rules pass.
- [ ] Case and punctuation variation can group only when merchant identity remains clear.
- [ ] Unrelated merchants sharing generic words are not grouped.
- [ ] Exact signed amount remains required.
- [ ] Existing weekly, fortnightly and monthly interval windows remain unchanged.
- [ ] Confirmation is still required before a regular payment becomes durable.
- [ ] Dismissed/deleted lifecycle behaviour remains correct.

### Delete terminology and recovery

- [ ] Transactions show Delete transaction and disappear from active views after confirmation.
- [ ] Budgets show Delete budget and disappear from active budgets.
- [ ] Confirmed regular payments show Delete regular payment and disappear from the active list.
- [ ] Deleted budgets and regular payments remain available only in secondary recovery sections.
- [ ] Restore returns the owned record safely.
- [ ] Suggestions continue to use Dismiss and Show suggestion again.
- [ ] No financial or planning record is hard-deleted.
- [ ] Import idempotency, audit history, Property links and repayment matching remain intact.

### Home comparisons

- [ ] The overall previous-month comparison remains correct.
- [ ] Category comparisons use the same current and previous Brisbane calendar months.
- [ ] Only useful/top category comparisons are shown.
- [ ] Wording such as less, more, about the same and new this month is understandable.
- [ ] Split children are included and split parents excluded.
- [ ] Income, transfers, deleted records and analytical repayments are excluded.
- [ ] No Property, tax, loan-balance, equity, valuation or net-worth statistic appears.

### Privacy, accessibility and regression

- [ ] Month controls, category search and changed compact controls have useful screen-reader labels.
- [ ] Narrow mobile layouts do not scroll horizontally.
- [ ] Duplicate submission prevention and failed-request recovery still work.
- [ ] Existing Import/Skip/Merge, duplicate scoring, budgets, reports and Property-link rules are unchanged.
- [ ] No raw CSV, raw row, narration, filename, account reference, exact address or private identifier is exposed.
- [ ] Everyday transactions remain the only cashflow records.

## Phase 4 Milestone 3 - Second client-review compact views

Status: pending deferred client retesting

### Transactions initial month

- [ ] When the current Brisbane month has active transactions, Transactions opens on that month.
- [ ] When the current month is empty, Transactions initially opens the latest month containing active transactions.
- [ ] When no transactions exist, the current month and existing empty state remain.
- [ ] Previous and Next month controls continue to work.
- [ ] Search and filters remain scoped to the selected month.
- [ ] A long transaction history is not loaded or displayed as one default page.

### Regular-payment review

- [ ] Home shows the number awaiting review, no more than three suggestions and a clear Review all action.
- [ ] Each suggestion initially shows only its name, signed amount, repeat interval, optional next date, Confirm, Dismiss and Edit details.
- [ ] Editing one suggestion reveals only that suggestion's fields.
- [ ] Cancel closes the editor without saving draft changes.
- [ ] Why was this suggested remains available without repeating its explanation by default.
- [ ] An exact duplicate suggestion identity is shown once.
- [ ] Distinct payments sharing a merchant remain separate when amount, cadence or deterministic identity differs.
- [ ] Confirm and Dismiss still require the existing safe user action.
- [ ] Weekly, fortnightly, monthly, exact-amount and interval thresholds are unchanged.

### Loan Accounts

- [ ] Each Loan Account begins as a compact summary with nickname, purpose, optional Property, recent status and counts.
- [ ] Only one Loan Account detail is open at a time.
- [ ] Repayment breakdowns initially show the latest three and View all repayments reveals the full eligible list.
- [ ] Linked everyday transactions initially show the latest three and View all linked transactions reveals the full eligible list.
- [ ] Property records remain behind their existing disclosure.
- [ ] A repayment match needing review remains visible on the compact card.
- [ ] Correction, unlink, archive/restore and no-double-count behaviour still work.
- [ ] Everyday transactions remain the only cashflow records.

### Budgets

- [ ] The blank budget creation form is hidden initially.
- [ ] Add budget reveals category and monthly amount fields.
- [ ] Cancel closes the form without creating a budget.
- [ ] A successful create closes the form and shows the new active budget.
- [ ] Used, remaining, monthly-only, no-rollover, Delete and Restore behaviour remains unchanged.
- [ ] Deleted budgets remain in the secondary recovery section.

### Action hierarchy, accessibility and mobile

- [ ] Each changed card or section has one obvious next action.
- [ ] Edit, Delete, Restore, Details and View all remain quieter but discoverable.
- [ ] Complete histories and edit fields remain hidden until deliberately opened.
- [ ] Previous/Next month, expansion and changed controls have usable keyboard focus and accessible labels.
- [ ] Compact cards wrap on narrow mobile screens without horizontal scrolling.
- [ ] No repeated technical explanation, internal confidence term or private source data is shown.
- [ ] No financial calculation, recurring threshold, budget formula, reconciliation rule, report/export rule or navigation changed.

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
