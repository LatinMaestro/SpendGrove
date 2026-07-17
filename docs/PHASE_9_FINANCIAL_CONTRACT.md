# Phase 9 Advanced Personal Finance Contract

Date: 17 July 2026  
Status: governing contract for repository-side Phase 9 delivery; client review deferred  
Runtime status: no migration-dependent Phase 9 feature is enabled

## Objective

Complete SpendGrove's advanced personal-finance planning experience without changing the accepted cashflow ledger, signed-money rules, transfer treatment, split treatment, Loan no-double-count rules or privacy boundaries.

Phase 9 covers:

- recurring-payment and subscription lifecycle completion;
- monthly-budget refinement;
- savings goals;
- manually maintained assets, liabilities and net-worth history;
- plain-English insights;
- in-app reminders and notification preferences;
- disabled push-notification foundations only.

This contract does not authorise a Production migration, live bank connection, market-data provider, push provider, AI, advice or automatic financial mutation.

## Current repository truth

Implemented and reusable:

- authenticated owner-scoped Transactions with integer cents;
- `INCOME`, `EXPENSE` and `TRANSFER` direction;
- transaction sign/type integrity and direction-compatible categories;
- split parent/child reconciliation and no-double-count rules;
- monthly everyday-spending eligibility;
- monthly category budgets with no rollover;
- deterministic recurring suggestions with user confirmation;
- active/deleted recovery for regular payments and budgets;
- current and previous-month insights;
- Loan Accounts, recorded balances and analytical repayment breakdowns;
- Properties and accepted linked-record reporting;
- complete account export and account deletion;
- safe audit events.

Existing schema is insufficient for:

- paused/cancelled/unknown/needs-review recurring lifecycle;
- recurring-to-Transaction instance links;
- amount ranges and source/confidence on confirmed recurring items;
- savings goals and manual contributions;
- assets, liabilities, valuations and durable snapshots;
- reminder preferences and in-app reminder lifecycle.

These require additive schema and unexecuted migration planning. The ordered Phase 6/7 Preview migrations remain pending first.

## Controlling financial precedence

For every actual Transaction:

1. confirmed transfer treatment;
2. otherwise signed integer-cent amount;
3. compatible categorisation.

Planning records never change an actual Transaction's amount, type, category, date or cashflow treatment.

- strictly positive ordinary Transactions are Money in;
- strictly negative ordinary Transactions are Money out;
- confirmed transfers remain transfers in either direction;
- zero-value Transactions are invalid;
- positive refunds do not reduce spending or budget progress;
- negative income adjustments follow the current Money out treatment;
- mixed-direction splits remain unsupported.

## Shared ownership and privacy rules

Every Phase 9 row must contain `userId` or inherit ownership only through a mandatory owned parent while retaining an owner index where practical.

Every read and write must:

- require authenticated user context;
- filter by owner at the database boundary;
- revalidate related Category, Transaction, Loan and Property ownership;
- use optimistic concurrency for user-edited durable planning records;
- exclude deleted/inactive rows from active calculations;
- return safe reason codes without private source content.

Never persist in Phase 9 metadata, reminders, logs or audit metadata:

- raw CSV rows or files;
- filenames;
- raw narration;
- bank account, BSB, card or customer identifiers;
- exact Property addresses;
- provider secrets;
- unneeded merchant-level history;
- transaction amounts or balances in audit metadata.

Actual planning records may contain the integer-cent amounts required for their user-facing purpose.

## Recurring and subscription contract

### Lifecycle

A confirmed recurring item may be:

- `ACTIVE`: currently expected;
- `PAUSED`: temporarily not expected;
- `CANCELLED`: user says it ended;
- `UNKNOWN`: user cannot confirm its current state;
- `NEEDS_REVIEW`: a confirmed item changed and requires user attention;
- `ARCHIVED`: removed from normal views but recoverable.

Delete/Restore wording remains beginner-facing. Internally, recoverable archive behaviour remains.

Only the user can move a confirmed item to ACTIVE, PAUSED, CANCELLED, UNKNOWN or ARCHIVED. Detection may propose NEEDS_REVIEW but must not silently cancel, pause or reactivate an item.

### Source and confidence

Allowed durable source codes:

- `MANUAL`;
- `CONFIRMED_SUGGESTION`.

Allowed safe detection-confidence codes:

- `USER_CONFIRMED`;
- `CLEAR_PATTERN`;
- `REVIEW_PATTERN`;
- null for a manual item without detection evidence.

Confidence is explanatory context only. It never confirms a recurring item without the user.

No raw merchant evidence, narration, changing reference token or suggestion hash is stored on the item.

### Frequency and expected date

Existing cadence labels remain:

- Weekly;
- Every 2 weeks;
- Monthly;
- Other.

The approved detector thresholds remain unchanged:

- weekly: 6–8 days;
- fortnightly: 13–16 days;
- monthly: 27–34 days;
- exact signed amount for automatic pattern detection;
- two occurrences are review-only;
- three or more are clear;
- ambiguity produces no suggestion.

A user-confirmed expected date is planning context. A later actual instance may propose advancing the next date by one cadence, but the date must not be advanced across an ambiguous or missed sequence without user review.

### Expected amount range

A confirmed item may have a signed integer-cent range:

- `expectedAmountMinCents <= expectedAmountMaxCents`;
- both values are non-zero and have the same sign;
- both are compatible with the recurring transaction type;
- an exact amount stores the same value in both fields;
- transfers may be represented only when confirmed as transfers;
- currency is AUD under the current product settings.

The existing exact-amount detector remains unchanged. Ranges describe a user-confirmed item and do not broaden automatic suggestion thresholds.

### Instances

A recurring instance is an owner-scoped link between one confirmed recurring item and one existing active owned Transaction.

- the Transaction remains the sole cashflow record;
- the instance creates no predicted or duplicate Transaction;
- one Transaction may belong to at most one active recurring instance;
- linked item and Transaction types/signs must be compatible;
- split parents cannot be instances when eligible children are the counted records;
- linking and unlinking are explicit and reversible;
- imported and manual Transactions are treated identically after persistence;
- expected-but-not-yet-seen dates remain derived planning occurrences, not durable Transactions;
- missed/changed-payment review creates a planning alert, not a financial record.

No automatic link is created when more than one eligible item or Transaction exists.

### Subscription wording

“Subscription” is a user-facing label for a recurring payment the user identifies as subscription-like. SpendGrove does not contact, cancel or purchase from a merchant.

## Budget contract

Phase 9 retains:

- monthly Category budgets only;
- one active budget per owned expense Category;
- Brisbane/Australian calendar-month boundaries;
- active owned eligible everyday expenses;
- eligible split children included;
- counted split parents excluded;
- income and transfers excluded;
- analytical LoanRepayment excluded;
- deleted/inactive/cross-user rows excluded;
- positive refunds not netted;
- integer-cent amount as authority.

Budget rollover remains disabled. No rollover formula or historical recalculation is approved.

Phase 9 may improve:

- prior-month comparison using the same canonical periods;
- calm over-budget wording;
- responsive progress visualisation;
- in-app threshold reminders at user-selected 80% and/or 100%.

Threshold reminders describe observed progress only. They do not recommend spending changes or create a forecast.

## Savings-goal contract

### Goal lifecycle

A savings goal contains:

- owner;
- user-entered name;
- positive target amount in integer cents;
- optional target date;
- optional positive opening progress;
- status ACTIVE, PAUSED, COMPLETED or ARCHIVED;
- timestamps and optimistic-concurrency value.

### Contributions and progress

Initial Phase 9 support uses manual planning contributions only.

- contributions are positive integer-cent planning amounts;
- zero and negative contributions are rejected;
- contributions have an Australian calendar date and optional safe user note;
- contribution rows are recoverably removable;
- progress = opening progress + active manual contributions;
- display may exceed 100%, but stored amounts are never altered to cap progress;
- completion is explicit or occurs when calculated progress reaches/exceeds target, subject to user confirmation before status change;
- contributions are not Transactions, income, expenses or transfers;
- no cash movement is implied;
- no actual Transaction is automatically linked in the first implementation;
- future Transaction linking requires a separate exact rule to avoid double counting.

Pausing or archiving a goal does not change contributions. Restore is explicit.

### Goal reminders

In-app reminders may cover target date and 25/50/75/100% milestones. A reminder creates no contribution and makes no forecast.

## Net-worth contract

### Items

A net-worth item is either an ASSET or LIABILITY and has:

- owner;
- user-entered name;
- item category;
- optional link to an owned Property or Loan Account where compatible;
- ACTIVE or ARCHIVED lifecycle;
- no live-provider balance.

Asset categories:

- CASH;
- PROPERTY;
- INVESTMENT;
- SUPERANNUATION;
- VEHICLE;
- OTHER_ASSET.

Liability categories:

- HOME_LOAN;
- PERSONAL_LOAN;
- CREDIT_CARD;
- OTHER_LIABILITY.

### Valuations

- values are user-entered non-negative integer cents;
- each value has an explicit “as at” Australian date;
- no inferred market value, equity, yield or advice;
- a correction adds/updates an owned valuation with audit-safe reason codes;
- a linked Property does not automatically supply a value;
- a linked Loan may optionally display its recorded `currentBalanceCents` as context, but it is not counted unless the user confirms a net-worth valuation;
- one active net-worth item may link to a given Property or Loan Account to prevent duplicate representation;
- transaction-account balances are not inferred from Transaction history.

### Snapshot formula

For a snapshot date:

`assetTotalCents = sum(latest active owned asset valuation on or before the date)`

`liabilityTotalCents = sum(latest active owned liability valuation on or before the date)`

`netWorthCents = assetTotalCents - liabilityTotalCents`

All arithmetic uses safe integers and fails closed on overflow.

A snapshot stores the totals and the item/value entries used so historical trends do not change when a later valuation is added. Snapshot creation is explicit. It does not mutate source valuations.

No item may be counted twice through both a linked Loan/Property and a separate automatically inferred balance. There is no automatic inference.

### Net-worth wording

Use:

- “Value you entered”;
- “Balance you entered”;
- “As at”;
- “Net worth snapshot”;
- “Based on your records”.

Do not use:

- appraised;
- market value;
- guaranteed;
- equity advice;
- investment performance;
- debt advice;
- credit advice.

## Forecasting contract

No general cashflow, loan-balance, investment-return or net-worth forecast is approved in the first Phase 9 implementation.

Allowed forward-looking presentation is limited to:

- confirmed recurring next expected date;
- user-entered savings target date;
- user-selected reminder dates;
- descriptive current budget threshold state.

Any forecast formula requires a later focused financial contract.

## Insight contract

Insights must be deterministic, traceable and non-judgmental.

Allowed sources:

- canonical monthly spending;
- category comparisons;
- active monthly budgets;
- confirmed recurring planning records;
- savings-goal progress;
- explicit net-worth snapshots;
- unresolved Loan matching counts;
- import recency.

Allowed wording:

- “More than last month” / “Less than last month”;
- “Budget used” / “Budget remaining”;
- “Regular payment expected”;
- “Goal milestone reached”;
- “Based on the values you entered”;
- “Needs review”.

No advice, guarantee, credit assessment, tax conclusion, behavioural profiling or private narration is permitted.

## Reminders and notification contract

### Initial delivery

Phase 9 provides in-app reminders only.

Supported reminder families:

- recurring expected date;
- budget 80% and 100% threshold;
- user-selected import reminder;
- savings-goal milestone or target date;
- unmatched Loan repayment;
- EOFY preparation dates.

### Rules

- reminders are owner-scoped planning records;
- the user can enable/disable each family;
- timezone is the account’s Australian timezone;
- dates use Australian calendar semantics;
- acknowledgement/dismissal is explicit;
- duplicate active reminders for the same source/event/date are prevented;
- reminder text contains safe labels and no raw source narration;
- no email, SMS, background provider or remote push is activated;
- no reminder creates or mutates a financial record;
- no lock-screen content exists while push is disabled.

Push preference fields/interfaces may be prepared behind a false runtime gate, but no native credential, provider or delivery call is authorised.

## Deletion, export and audit

Complete account export must eventually include all Phase 9 owned records after their schema exists in every runtime environment.

Before migration execution:

- account export must not query missing Phase 9 tables;
- guarded features remain disabled;
- export continues using existing verified tables only.

Account deletion must cascade all later Phase 9 rows through owned relations after migration.

Recoverable lifecycle:

- recurring items, budgets, goals, contributions, net-worth items and reminders use Delete/Deleted/Restore presentation where applicable;
- snapshots may be recoverably removed but not silently recomputed;
- no hard deletion of financial/planning evidence from normal UI;
- account deletion remains the separate complete-erasure workflow.

Audit metadata may contain only entity, action, safe reason/method/status codes and changed-field names. Do not include labels, notes, dates, amounts, balances or source identifiers in metadata.

## Household readiness

All Phase 9 records remain private to their current owner.

Future household sharing:

- is explicit and record-scoped;
- never converts existing records automatically;
- requires the Phase 10 permissions contract;
- must not expose browser-local data;
- must preserve personal/private status.

No household field or sharing behaviour is enabled in Phase 9 unless required by the later Phase 10 contract.

## Additive schema assessment

A single Phase 9 foundation is preferred to reduce migration fragmentation, but it must be proposed as exact Prisma and SQL in a separate PR.

Likely additive changes:

- extend `RecurringItemStatus`;
- add recurring source/confidence enums and fields;
- add recurring amount-range fields;
- add `RecurringInstance`;
- add `SavingsGoal` and `SavingsGoalContribution`;
- add net-worth item/category/status, valuation, snapshot and snapshot-entry models;
- add reminder preference/reminder models and enums;
- add safe audit entity values;
- add user relations, owner indexes and exact unique constraints.

The schema PR must prove:

- no destructive alteration;
- existing ACTIVE/ARCHIVED recurring records remain valid;
- existing exact expected amount remains preserved;
- no existing budget or Transaction row changes;
- no backfill from private data;
- account export remains fail-closed until activation;
- deletion cascades are complete;
- migration order follows the three pending Phase 6/7 migrations;
- Preview checker uses safe aggregate counts only;
- runtime gates are false before missing-table access.

No Preview or Production migration is authorised by this contract.

## Ordered delivery sequence

1. **PR 9.0 — Financial contract and current-state audit**  
   This document and permanent roadmap links.

2. **PR 9.1 — Additive Phase 9 schema and unexecuted migration foundation**  
   Exact Prisma/SQL/checker profile/tests. All new runtime gates false. This PR follows the three already-pending migrations in repository order.

3. **PR 9.2 — Recurring/subscription completion preparation**  
   Owner-scoped services, instance-link rules and UI behind the Phase 9 schema gate. Preserve existing detector thresholds.

4. **PR 9.3 — Budget refinement without rollover**  
   Reuse existing schema/calculations where possible. Any reminder persistence remains gated.

5. **PR 9.4 — Savings-goal preparation**  
   Manual planning contributions only; no Transaction linking.

6. **PR 9.5 — Manual net-worth preparation**  
   Manual items/valuations/snapshots; no provider or inferred balances.

7. **PR 9.6 — In-app insights and reminder preparation**  
   Deterministic safe reminders; push disabled.

8. **PR 9.7 — QA, migration/activation handoff and consolidated deferred client package**.

Independent no-schema work may be delivered operationally. Missing-table-dependent work must remain fail-closed until the ordered Preview migration and a later separate Production gate.

## Verification requirements

Every implementation PR must include, as applicable:

- owner and two-user isolation;
- integer-cent overflow checks;
- direction and transfer compatibility;
- split-parent/child no-double-count;
- recurring exact detector regression;
- recurring instance uniqueness/ambiguity;
- budget formula parity;
- manual savings contribution reconciliation;
- net-worth item deduplication and snapshot arithmetic;
- reminder deduplication/timezone;
- export/deletion coverage after activation;
- safe audit metadata;
- no raw source data;
- no missing-table query while disabled;
- full tests, TypeScript, lint and optimized build;
- Vercel/browser evidence where available.

## Mandatory runtime and operator gates

Do not enable Phase 9 missing-table runtime until:

1. the retained isolated Preview secrets are proven;
2. the Phase 6 bulk migration passes;
3. the Phase 7 transfer-link migration passes;
4. the Phase 7 import-undo migration passes;
5. the exact Phase 9 Preview migration receives its own verification;
6. full Preview regression is green;
7. a later focused activation PR is reviewed.

Do not run any Production migration without separate exact approval, proven environment mapping, migration history and recovery evidence.

## Exclusions

Phase 9 does not include:

- live bank, investment or valuation feeds;
- Basiq;
- AI;
- tax or financial advice;
- loan forecasting;
- automatic Property valuation or equity;
- mixed-direction splits;
- budget rollover;
- automatic savings contributions;
- household sharing;
- accountant access;
- document storage;
- push/email/SMS activation;
- payment collection;
- new primary navigation;
- Production migration or data rewrite.

## Completion status

Phase 9 is complete only when all repository-side PRs are merged, guarded states are truthful, calculations reconcile, privacy/ownership tests pass, the migration/activation status is explicit and the consolidated client checklist is updated.

Client review remains deferred. Repository completion does not equal client acceptance, migration approval, Production activation or public release.
