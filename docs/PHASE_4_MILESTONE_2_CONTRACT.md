# Phase 4 Milestone 2 Contract - Recurring and Budget Lifecycle Recovery

Status: approved for autonomous implementation from the client's 12 July 2026 continuation authority

Date: 12 July 2026

## Objective

Make the accepted Phase 4 foundations easier to correct and maintain by adding safe recovery for archived recurring items and monthly budgets, plus user-controlled review and undo of still-relevant dismissed recurring suggestions.

This milestone builds only on the existing RecurringItem, RecurringSuggestionDismissal and CategoryBudget models. It does not add a new financial calculation, reminder system, notification system, transaction link or navigation area.

## User value

- Users can recover a recurring item archived by mistake.
- Users can see archived recurring items instead of only an aggregate count.
- Users can review a dismissed recurring suggestion when the same deterministic pattern still exists.
- Users can undo that dismissal and return the pattern to normal suggestion review.
- Users can recover a monthly category budget archived by mistake.
- Active and archived lifecycle states are clear and reversible.
- Phase 4 Milestone 1 remains visible and testable while client retesting is deferred.

## Delivery sequence

To reduce Vercel usage, use three coherent PRs:

1. PR 4.6 - lifecycle contract, no-schema assessment and deferred client-testing register. Documentation only.
2. PR 4.7 - recurring and budget lifecycle recovery. One coherent user-facing implementation batch.
3. PR 4.8 - regression hardening, QA and consolidated deferred client package.

PR 4.6 must merge before implementation. PR 4.7 may proceed only while the no-schema assessment remains true. Stop after PR 4.8 with both Phase 4 Milestones 1 and 2 open pending deferred client retesting.

## Data and calculation rules

No Milestone 1 calculation changes are authorised.

Recurring detection remains:

- same active owned safe MerchantProfile;
- same active owned category;
- same transaction type;
- exact same signed integer-cent amount;
- weekly interval 6-8 days;
- fortnightly interval 13-16 days;
- monthly interval 27-34 days;
- two occurrences produce a review suggestion;
- three or more produce a clear suggestion;
- ambiguous patterns produce no suggestion.

Budget progress remains:

spent_cents = sum(abs(amount_cents)) for active owned EXPENSE transactions in the category and current Brisbane calendar month.

Budget progress still:

- includes eligible split children;
- excludes split parents;
- excludes income;
- excludes transfers;
- excludes deleted/inactive and cross-user transactions;
- excludes analytical loan repayment records;
- has no rollover;
- does not subtract income-style refunds.

Dashboard formulas and no-double-count treatment remain unchanged.

## Recurring-item lifecycle

Existing states:

- ACTIVE;
- ARCHIVED.

Archive behaviour remains unchanged.

Restore behaviour:

- restore is explicit and user-initiated;
- only an owned ARCHIVED recurring item may be restored;
- the request must include the currently displayed updatedAt value;
- stale restore attempts fail safely;
- restore changes status to ACTIVE and clears archivedAt;
- restore does not change label, category, transaction type, amount, cadence or next expected date;
- restore must not create a transaction or payment;
- restore must not contact a merchant;
- restore must not change recurring confidence thresholds;
- restore must be rejected if an equivalent active recurring item already exists for the same user with the same category, transaction type, expected amount, cadence and normalised label;
- safe audit metadata uses reasonCode RECURRING_ITEM_RESTORED and stateCode ACTIVE only.

Archived items cannot be edited directly. The user restores first, then uses the existing active-item edit flow.

No recurring item is hard-deleted in this milestone.

## Dismissed suggestion lifecycle

A dismissal is a user preference record, not a transaction or financial record.

Review rules:

- detect current recurring patterns using the unchanged deterministic detector;
- compare current pattern keys with the authenticated user's owned dismissal keys;
- show a dismissed suggestion only when that exact safe key still resolves to a current valid pattern;
- do not show stale dismissal keys whose underlying pattern no longer exists;
- do not expose the hash key in the UI;
- display only the same safe suggestion facts already allowed in normal suggestion review.

Undo rules:

- undo is explicit and user-initiated;
- server revalidates ownership and confirms the dismissal exists;
- undo deletes only the owned RecurringSuggestionDismissal preference row;
- deleting the preference is permitted because the model has no archive state and the row is not financial evidence;
- no recurring item or transaction is deleted;
- no bulk clear is included;
- after undo, the suggestion may return only if the unchanged current detector still finds it and no active recurring item already represents it;
- safe audit metadata uses reasonCode RECURRING_SUGGESTION_DISMISSAL_UNDONE and methodCode USER_UNDO only;
- the dismissal hash, amounts, dates, merchant labels and private data must not enter audit metadata.

## Budget lifecycle and interaction rules

Existing states:

- ACTIVE;
- ARCHIVED.

Archive behaviour remains unchanged.

Restore behaviour:

- restore is explicit and user-initiated;
- only an owned ARCHIVED monthly budget may be restored;
- stale updatedAt requests fail safely;
- the linked category must still be an active owned EXPENSE category;
- no other active MONTHLY budget may exist for the same user/category;
- restore changes status to ACTIVE and clears archivedAt;
- restore does not change category, amount or period;
- restore does not alter any transaction or budget progress fact;
- safe audit metadata uses reasonCode BUDGET_RESTORED and stateCode ACTIVE only.

Archived budgets cannot be edited directly. The user restores first, then uses the existing edit flow.

No budget is hard-deleted. No automatic budget creation, rollover, copying or amount recommendation is included.

## Reminder behaviour

No reminder behaviour is implemented in this milestone.

Specifically:

- no push notifications;
- no email or SMS;
- no background scheduling;
- no external notification provider;
- no due-soon or overdue threshold;
- no automatic next-date advancement;
- no budget alert threshold;
- no lock-screen content.

The existing nextExpectedDate remains user-entered display context only. Any reminder or scheduling milestone requires a separate contract and client approval.

## Correction, archive and delete behaviour

- Active recurring items and budgets use their existing safe edit flow.
- Archived recurring items and budgets require restore before edit.
- Archive and restore are reversible lifecycle changes.
- Recurring items and budgets are never hard-deleted.
- The only permitted hard delete is an explicit undo of an owned dismissal preference.
- No transaction, import row, loan record, Property link or reporting record is created, updated or deleted through these lifecycle actions.
- No bulk archive, restore or delete is included.

## Ownership and privacy boundaries

Every read and write must be scoped to the authenticated user.

Do not use, persist, log or display:

- raw CSV files;
- raw rows;
- filenames;
- raw narration or source text;
- account identifiers;
- BSBs;
- card fragments;
- customer IDs;
- loan or lender references;
- masked references;
- exact addresses;
- balances;
- secrets or connection strings.

Allowed UI facts remain:

- user-confirmed recurring label;
- safe category label;
- transaction type;
- integer-cent expected amount;
- cadence;
- optional next expected date;
- safe active/archived/dismissed state;
- safe aggregate counts.

Allowed audit metadata is limited to safe lifecycle reason, method, state and changed-field codes.

## No-double-count rules

- Everyday transactions remain the only spending/income/cashflow records.
- Recurring items remain planning records.
- Dismissal rows remain preference records.
- Budgets remain planning targets.
- Restore and dismissal undo create no transaction.
- Loan repayment breakdowns remain analytical and excluded from budget/dashboard totals.
- Split rules, transfer rules and refund rules are unchanged.
- Property reporting records are not read or changed.

## Accepted wording

Use:

- Active recurring items;
- Archived recurring items;
- Restore recurring item;
- Dismissed suggestions;
- Review dismissed suggestions;
- Show suggestion again;
- Active budgets;
- Archived budgets;
- Restore budget;
- Restoring does not change transactions;
- Planning record only;
- No payment is created.

Avoid:

- cancelled subscription;
- bill cancelled;
- payment restored;
- payment scheduled;
- due soon;
- overdue;
- guaranteed;
- financial advice;
- tax deductible;
- claimable;
- taxable;
- ATO-ready;
- debt advice;
- credit advice.

## Exclusions

Do not implement:

- any schema change or migration;
- Production migration;
- reminder or notification infrastructure;
- push, email or SMS notifications;
- background jobs or scheduling;
- new navigation tabs;
- automatic recurring confirmation;
- changed recurring thresholds;
- fuzzy amount matching;
- automatic transaction-to-recurring linking;
- transaction splitting or allocation changes;
- changed budget formulas;
- rollover;
- budget recommendations;
- payments, billing or subscription purchasing/cancellation;
- Basiq or live bank connection;
- AI;
- tax advice or automatic deductibility;
- Property profit/yield/equity/valuation/net-worth statistics;
- loan forecasting, debt or credit advice;
- household mode;
- document storage;
- new package, provider, paid service, secret or environment variable;
- unrelated later modules.

## Client testing points

Recurring:

- archived list is visible;
- active item can archive;
- archived item can restore;
- restored item returns to active list;
- stale and cross-user restore fail;
- equivalent active duplicate prevents restore;
- dismissed current suggestions are visible separately;
- undo dismissal returns the suggestion to normal review when still eligible;
- no transaction or payment is created.

Budgets:

- archived list is visible;
- active budget can archive;
- archived budget can restore;
- restored budget returns to active progress;
- stale, cross-user, inactive-category and duplicate-active restore fail;
- amount, category and progress remain unchanged by restore;
- no transaction is changed.

Regression:

- all deferred Milestone 1 recurring, budget and Home checks remain testable;
- no Property/tax/loan-balance dashboard statistic appears;
- mobile layout has no horizontal scrolling.

## Mandatory stop conditions

Stop and ask before proceeding if:

- any Prisma schema or migration change is needed;
- dismissal undo cannot be limited to the owned preference row;
- recurring or budget restore needs a new field or state;
- duplicate-active restore cannot be enforced with current fields;
- a reminder, notification, due-status or scheduling rule becomes necessary;
- recurring thresholds or budget formulas need to change;
- a transaction link or private source field is needed;
- a new package, provider, secret or environment variable is needed;
- navigation changes are needed;
- Production migration, Basiq, AI, payments, tax, Property/net-worth, loan forecasting, household, documents or unrelated modules enter scope;
- Phase 4 Milestone 1 testing would be removed or obscured.

## End state

After PR 4.8:

- Phase 4 Milestone 1 remains implemented and open pending deferred client retesting;
- Phase 4 Milestone 2 remains implemented and open pending deferred client retesting;
- docs/DEFERRED_CLIENT_RETESTING.md contains one consolidated non-technical checklist;
- no milestone is formally accepted or closed on the client's behalf;
- stop and wait for the client to return.
