# Deferred Client Retesting

Status: preserved historical acceptance and QA checklist

Last updated: 15 July 2026

## Purpose

The client completed the consolidated Production review and formally accepted and closed Phase 4 Milestones 1-4 on 15 July 2026.

This document is retained unchanged as the historical non-technical test catalogue and QA evidence. Its unchecked boxes record the original review package; they are not unresolved closure blockers and must not be deleted or rewritten.

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

### Loans - canonical repayment and Property views

Delivery evidence:

- contract PR #127 merged as `04e8099f8f2c6a41cbb3021c3b7efee2afdbff72`;
- implementation PR #128 merged as `87012a22bc029d2094ed19f5a8853ad4009f98f3`;
- 89 test files / 553 tests, TypeScript, lint and optimized production build passed;
- main deployment `dpl_6U5SJiVuHhZSyZjr5LvLZxx1EPZ4` is Ready;
- canonical review URL: https://spendgrove.vercel.app.

- [ ] Loan overview is concise and shows nickname, type, optional Property, latest repayment and only useful action status.
- [ ] Loan and Property names are not repeated in several cards.
- [ ] Only one Loan Account detail is open at a time.
- [ ] Each repayment appears once under Loan repayments.
- [ ] Repayment principal, interest, fees and balance-after details expand only when requested and empty details are hidden.
- [ ] A matched everyday cashflow does not appear again as a separate repayment or linked-transaction history.
- [ ] Other Property expenses and income remain visible under Property transactions.
- [ ] A car, personal or other non-Property loan shows no Property transactions or Property records control.
- [ ] Loan repayments and Property transactions show the latest three initially; View all and Show latest three work.
- [ ] An unmatched repayment has one useful warning and its review/matching action remains available.
- [ ] Property records/export remains accessible through View property records but is not repeated inline.
- [ ] Delete, Deleted repayments and Restore wording is simple while safe recovery remains available.
- [ ] Correction, manual match, unlink, delete and restore actions remain reachable.
- [ ] No duplicate spending, cashflow or durable Property link is created by the combined display.
- [ ] Everyday transactions remain the only cashflow records and LoanRepayment remains analytical detail.
- [ ] Privacy information is available under How SpendGrove keeps loan information private.
- [ ] The Loan page fits a narrow phone without horizontal scrolling and important controls are keyboard accessible.

### Final focused Loan detail review

Delivery evidence:

- final contract PR #130 merged as `5f907c52ac586e34cc83ffd869b8985a99fc0862`;
- implementation PR #131 merged as `18d416e3ef5ea63f8b86081e11332f7a72634ffa`;
- 90 test files / 558 tests, TypeScript, lint and optimized production build passed;
- main deployment `dpl_9mAuvoqGkSt9Cw1TqPUAW9zX7DKH` is Ready;
- canonical review URL: https://spendgrove.vercel.app.

- [ ] The Loans overview contains compact Loan Account cards only.
- [ ] View loan replaces the overview with one focused Loan; no other Loan cards appear underneath.
- [ ] Back to loans returns to the overview and there is no large Close details button.
- [ ] The Loan header shows the Loan and optional Property relationship once.
- [ ] Loan repayments appear before Property transactions.
- [ ] Healthy repayments show no repetitive Matched label.
- [ ] An unresolved repayment shows Needs review and a clear Match transaction action.
- [ ] Only one repayment detail opens at a time.
- [ ] Principal, interest, fees and balance after appear only when present and requested.
- [ ] Latest three, View all repayments and Show latest three work.
- [ ] Edit repayment, Unlink repayment, Delete repayment and Restore repayment remain reachable under secondary controls.
- [ ] Deleted repayments is secondary and no cleanup wording appears.
- [ ] Matching uses plain language; Search for another transaction and Search by date remain reachable.
- [ ] A deliberately chosen poor match still requires explicit confirmation.
- [ ] Property transaction rows lead with category or safe merchant identity; Money in/out is secondary.
- [ ] Reconciled repayment cashflows do not appear again under Property transactions.
- [ ] Other linked Property income and expenses remain visible.
- [ ] A non-Property loan shows no Property transaction or report section.
- [ ] View property report opens a focused report workflow rather than adding another long inline section.
- [ ] Financial year, Load records and CSV export remain available and unchanged inside the report.
- [ ] The report closes back to the same Loan.
- [ ] The focused Loan view fits a narrow phone without horizontal scrolling.
- [ ] Back, repayment disclosure, More, matching and report controls work by keyboard and have clear screen-reader labels.
- [ ] No duplicate cashflow, repayment or Property record is created.


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

## Phase 4 Milestone 4 - Beginner-First Full UI Overhaul

Status: implemented, merged, deployed and technically verified; pending deferred client retesting.

Review URL: https://spendgrove.vercel.app

Delivery evidence:

- PR #133: `2e6b194da5a20a1c7c66056f91801d4bbb905e03`;
- PR #134: `7896f28e6a7b954d5108b00127888ced4c58cdc0`;
- PR #135: `6c8822f7cfbdc1ed222d12ab7b96ba7022a94771`;
- PR #136: `41523ac25089e74778cf25eb17e195a0dc6caffa`;
- PR #137: `df6e6ef20046fe8dccb409178a3076cf28b87eea`;
- 95 test files / 587 tests, TypeScript, lint and optimized build passed;
- main deployment `dpl_2QKHYxtx8dNBW7VacD4eTGbirpTn` Ready.

### App shell and navigation

- [ ] The SpendGrove logo is clear and correctly proportioned.
- [ ] Desktop shows a calm left sidebar without wasting the main content area.
- [ ] Mobile shows a compact header and bottom navigation.
- [ ] Primary navigation contains exactly Home, Transactions, Loans, Import and Settings.
- [ ] Budgets and Regular payments remain easy to reach from Home without becoming extra primary tabs.
- [ ] The current destination is obvious.
- [ ] Browser zoom, keyboard focus and the Skip to content link remain usable.
- [ ] No page has horizontal scrolling at a narrow phone width.
- [ ] Important touch controls are comfortable to tap.
- [ ] The visual system feels consistent, light and calm rather than card-heavy.

### Home and onboarding

- [ ] Home makes Import transactions the obvious next action.
- [ ] The current month is understandable without finance terminology.
- [ ] Budget and regular-payment summaries are compact and useful.
- [ ] Empty sections do not clutter Home.
- [ ] Add transaction remains available as a secondary action.
- [ ] Onboarding explains CSV-first privacy in plain language.
- [ ] Completing or dismissing onboarding does not hide essential features.

### Transactions

- [ ] Transactions open one month at a time.
- [ ] Previous and next month controls are clear and accessible.
- [ ] Search applies to the selected month.
- [ ] Rows prioritise date, safe description/category and amount.
- [ ] Opening one transaction provides its secondary actions without expanding every row.
- [ ] Edit, Property link, split, duplicate and recoverable Delete remain reachable where applicable.
- [ ] Long descriptions and category names wrap or truncate cleanly.
- [ ] Transaction values, categories, split behaviour and cashflow totals are unchanged.

### CSV Import

- [ ] The flow clearly reads Choose file, Confirm columns, Review and Import.
- [ ] A confidently mapped file does not show unnecessary mapping controls.
- [ ] More column options remains available when needed.
- [ ] Import, Skip and Merge decisions are easy to distinguish.
- [ ] Category search and Property linking remain available only when relevant.
- [ ] Duplicate warnings remain visible when action is required.
- [ ] The import summary remains visible near the final action on mobile.
- [ ] Pressing Import repeatedly cannot create duplicate submissions.
- [ ] Raw filenames, rows, narration and private bank identifiers are not exposed or stored.

### Budgets

- [ ] Budgets opens as a focused subordinate Home workflow.
- [ ] Add budget is the obvious primary action.
- [ ] The create form stays hidden until Add budget is selected.
- [ ] Active budgets clearly show used and remaining amounts.
- [ ] Edit and Delete are secondary but discoverable.
- [ ] Deleted budgets and Restore remain available without cluttering active budgets.
- [ ] Monthly-only, no-rollover and existing spending calculations are unchanged.

### Regular payments

- [ ] Regular payments opens as a focused subordinate Home workflow.
- [ ] Suggestions appear before confirmed regular payments.
- [ ] Suggestion cards are compact until Edit details is selected.
- [ ] Confirm and Dismiss remain obvious.
- [ ] Only one suggestion or confirmed-item editor opens at a time.
- [ ] Why was this suggested remains available without repeating long explanations.
- [ ] Deleted regular payments and dismissed suggestions remain recoverable.
- [ ] Confirmation remains required and no payment is moved or scheduled.

### Loans and Property records

- [ ] The Loans overview has a calm heading, compact cards and one View loan action per Loan.
- [ ] Add loan is primary and Import repayments is secondary.
- [ ] A selected Loan shows Back to loans, Loan repayments first and Property transactions second when applicable.
- [ ] Healthy repayments do not show repetitive status labels.
- [ ] Needs review remains obvious and actionable.
- [ ] Repayment details, matching, correction, unlink, Delete and Restore remain reachable.
- [ ] A non-Property Loan shows no empty Property section.
- [ ] Property report/export remains available as a secondary workflow.
- [ ] Deleted Loan recovery and privacy guidance remain accessible without dominating the page.
- [ ] No repayment, everyday transaction or Property record appears twice.

### Settings

- [ ] Settings is organised into Preferences, Australian defaults and Data and privacy.
- [ ] Simple Mode remains on by default.
- [ ] The analytics preference remains understandable.
- [ ] Currency, date and financial-year defaults are easy to inspect.
- [ ] The privacy introduction remains reachable.
- [ ] Import history, recovery and development-only tools remain secondary and appear only where allowed.
- [ ] Unavailable or future features do not appear as distracting controls.

### Cross-app safety and accessibility

- [ ] Every page has one obvious title and next action.
- [ ] Loading, empty, success and error states are concise and understandable.
- [ ] Keyboard focus is visible on changed controls.
- [ ] Dialogs and disclosures can be opened and closed without a mouse.
- [ ] Screen-reader labels explain icon controls.
- [ ] No private CSV/source value appears in UI errors or help text.
- [ ] No financial calculation, recurring threshold, Budget formula, import decision, matching rule, Property-link rule or report/export value changed.
- [ ] No Basiq, AI, payment, tax-advice, net-worth, valuation or debt-advice feature appears.

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

## Phase 4 Milestone 4 - Monthly category spending chart

Use owned synthetic transactions and review both desktop and mobile.

1. Confirm the chart defaults to the same month as Transactions.
2. Use Previous month and Next month and confirm the chart updates with the heading.
3. Add the visible category amounts and confirm they equal the donut-centre total.
4. Confirm the largest categories appear first in the legend.
5. Use a month with more than five categories and confirm the five largest plus accurate Other.
6. Open View breakdown and confirm every real category appears instead of a synthetic Other row.
7. Select a category and confirm its transactions appear for the same month with a clear removable filter.
8. Confirm transactions needing category review remain represented as Needs review.
9. Open a month with no eligible expenses and confirm the compact empty state.
10. Type in transaction search and confirm it filters the list without changing the whole-month chart.
11. Review at a narrow mobile width and confirm the chart remains compact with no horizontal scrolling.
12. Confirm long category names truncate safely while the full name remains accessible.
13. Navigate with a keyboard and confirm the chart description, View breakdown and category rows are available to assistive technology.
14. Confirm no Property, tax, loan-balance, equity, valuation or net-worth statistics appear.
15. Confirm existing transaction amounts, monthly spending, splits, transfers and refund treatment have not changed.

Known review note: real categories now use deterministic non-persisted colours, while Needs review and Other use fixed colours. Currency amounts and category names remain authoritative.


### Milestone 4 chart correctness hardening

Use the client's existing July review dataset or equivalent owned synthetic records.

1. Confirm incoming money is excluded from the monthly spending donut, legend and breakdown.
2. Confirm both incoming and outgoing transfers are excluded from monthly spending.
3. Confirm Needs review contains only otherwise eligible negative everyday expenses without a usable category.
4. Open Needs review and confirm its displayed transactions add exactly to its chart value; the known `+$2,500.00` incoming row must not appear.
5. Confirm the donut, legend, full breakdown and selected-category transaction filter reconcile for the same month.
6. Confirm a positive category share below 0.1% displays `<0.1%`, while exact zero displays `0%`.
7. Move between populated months and confirm each real category keeps an understandable consistent colour; Needs review and Other remain visually consistent.
8. Type in transaction search and confirm the whole-month chart does not change.
9. Confirm no narration, filename, account reference, banking identifier, exact address or other raw source information appears in chart or breakdown UI.
10. Confirm Home monthly spending and category comparisons exclude the same positive incoming anomaly.
11. If the anomaly's category has a budget, confirm it no longer inflates that budget's used amount.
12. Edit the existing inconsistent transaction through the normal transaction correction flow and confirm no automatic data rewrite or duplicate transaction occurs.

Technical verification already proves a `+250000` positive `EXPENSE` anomaly is excluded from aggregate and drilldown. The connected verification browser was signed out, so populated July visual confirmation remains a client test rather than a claimed technical observation.

## Phase 4 Milestone 4 - Transaction sign/type integrity

Use owned synthetic data and the existing known anomaly only through the normal UI.

1. Confirm a positive imported ordinary transaction cannot become an expense through category selection.
2. Confirm a negative imported ordinary transaction cannot become income through category selection.
3. Confirm a positive Needs review transaction displays as Money in.
4. Confirm a negative Needs review transaction displays as Money out.
5. Confirm incoming and outgoing transfer direction remains correct and transfers remain excluded from spending.
6. Confirm learned merchant and keyword suggestions apply only when compatible with direction.
7. Confirm manual Money in, Money out and Transfer create/edit flows enforce compatible direction and category.
8. Open an existing inconsistent transaction and confirm contextual Needs correction guidance appears without a global warning.
9. Correct that transaction through Edit and confirm the appropriate chart, comparison or budget eligibility updates.
10. Confirm no historical transaction was automatically changed or duplicated.
11. Recheck the monthly chart, Home comparison and budget progress for sign-safe totals.
12. Confirm the minimalist Transactions and CSV review layout remains intact on desktop and mobile.
13. Confirm zero-value transactions and zero-value split children are rejected with plain wording.
14. Confirm mixed-direction split children are rejected and valid same-direction children still reconcile exactly.
15. Confirm positive refunds remain Money in and do not reduce expense-budget progress.
16. Confirm negative income adjustments are presented as Money out under the current model and require a compatible money-out category.

Technical evidence: 101 test files / 633 tests, TypeScript, lint and optimized build passed. Preview `dpl_NgKKnxdaY1zKgwUaNyDSD66ALfBY` is Ready. The connected browser verification was signed out, so populated durable-record correction and post-correction calculation checks remain deferred client tests.

## Acceptance outcome — 15 July 2026

Client acceptance date: 15 July 2026.

Final accepted baseline:

- PR #146 implementation merge: `78574362f07781a1181766a5ae68f663ee02d03f`;
- PR #147 QA/handoff merge and accepted `main`: `a401d40275c4c63d5759a690dbc4830e45d46917`;
- Production deployment: `dpl_EYxdfCR5SdgAEdyDR2AZsX841wzJ`, Ready from the accepted `main` commit;
- 101 test files / 633 tests passed;
- TypeScript validity, Next.js lint and optimized production build passed;
- public `/`, `/transactions` and `/import` returned HTTP 200;
- desktop route smoke and 390 px horizontal-overflow verification passed.

The transaction sign/type invariant is accepted: confirmed transfer treatment takes precedence, otherwise signed integer cents determine direction, and categorisation must remain compatible with that direction. Existing inconsistent records were not rewritten, backfilled or silently reclassified; they remain user-correctable and excluded from incompatible calculations.

No unresolved blocker remains for Phase 4 Milestones 1-4. The complete deferred-client checklist and all historical QA evidence remain preserved as the acceptance record.

Phase 5 remains unapproved and not started. Progression requires a separate client approval and documentation-first planning gate covering objective, user value, PR sequence, data and financial rules, privacy/security boundaries, schema and migration assessment, deployment/client review points, exclusions and mandatory stop conditions.

The checklist above remains available for future regression review. Its preservation does not reopen Phase 4 or authorise Phase 5.
