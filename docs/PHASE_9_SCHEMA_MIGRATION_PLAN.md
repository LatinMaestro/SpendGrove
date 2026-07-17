# Phase 9 Advanced Personal Finance Schema and Migration Plan

Date: 17 July 2026  
Migration: `20260717120000_phase_9_advanced_personal_finance_foundation`  
Status: repository-only and unexecuted  
Runtime: `PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED = false`

## Requirement

The existing schema supports basic recurring items and monthly budgets, but it cannot safely store:

- expanded user-confirmed recurring lifecycle and instance links;
- manual savings goals and contributions;
- manual assets, liabilities, valuations and historical snapshots;
- in-app reminder preferences and reminder lifecycle.

The financial rules are frozen in `docs/PHASE_9_FINANCIAL_CONTRACT.md`.

## Exact additive scope

The migration:

- adds PAUSED, CANCELLED, UNKNOWN and NEEDS_REVIEW to `RecurringItemStatus`;
- adds nullable source, confidence and amount-range fields to `RecurringItem`;
- creates `RecurringInstance`;
- creates `SavingsGoal` and `SavingsGoalContribution`;
- creates `NetWorthItem`, `NetWorthValuation`, `NetWorthSnapshot` and `NetWorthSnapshotEntry`;
- creates `ReminderPreference` and `Reminder`;
- adds safe `AuditEntityType` values;
- adds owner, relation, status/date and deduplication indexes;
- adds owner and source-record foreign keys.

It does not update, delete, copy or backfill any existing row.

Existing `RecurringItem.expectedAmountCents` remains unchanged. New source/confidence/range fields remain null on historical records until an explicit user edit or later approved workflow supplies them.

## Ownership

Every new model includes `userId`. Parent and source relations are revalidated by owner in services before activation.

Foreign-key deletion treatment:

- owned planning data cascades with account deletion;
- recurring instances cascade with the recurring item but restrict deletion of their source Transaction;
- savings contributions cascade with their goal;
- net-worth valuations cascade with their item;
- snapshot entries cascade with their snapshot and restrict deletion of referenced net-worth items;
- optional Property/Loan links become null if the linked source is removed;
- reminders and preferences cascade with account deletion.

Normal product workflows remain recoverable and do not hard-delete financial records.

## Privacy

The schema contains only user-entered planning facts, safe enum codes, dates, integer cents and internal owner/source IDs.

It adds no raw CSV, filename, narration, bank identifier, BSB, card/customer ID, exact address, provider payload, secret or connection string field.

Reminder records contain a safe deduplication key and source ID, not a rendered private message.

## Financial integrity

- Transactions remain the sole cashflow ledger.
- Recurring instances link existing Transactions and create no cashflow.
- Savings contributions are planning records and create no cashflow.
- Net-worth valuations are manual “as at” values and create no cashflow.
- Snapshot totals use integer cents and explicit entries.
- Reminder records create no financial mutation.
- Existing budget, split, transfer, refund, Loan and Property calculations are unchanged.

## Migration order

The Preview workflow must run each migration individually in this order:

1. `20260717090000_phase_6_bulk_operation_foundation`
2. `20260717100000_phase_7_transfer_link_foundation`
3. `20260717110000_phase_7_import_undo_foundation`
4. `20260717120000_phase_9_advanced_personal_finance_foundation`

The workflow remains targeted to the first pending migration. Do not advance its profile until the preceding migration has succeeded and passed exact post-migration verification.

## Locking and operational assessment

- enum additions require short PostgreSQL catalog changes;
- nullable RecurringItem columns require table metadata changes but no row backfill;
- new tables and indexes contain no rows at creation;
- no existing large-table index is rebuilt except one small owner/source index on `RecurringItem`;
- no default is added to the new RecurringItem columns;
- migration duration should be short on Preview, but exact execution evidence is required before any Production proposal.

## Preview verification profile

The migration-aware checker verifies safely:

- no failed or unresolved migration;
- target migration absent before deploy and recorded exactly once after;
- all new enums and expanded recurring status values;
- exact new tables, columns, indexes and foreign keys;
- altered RecurringItem columns and owner/source index;
- new tables empty;
- safe aggregate counts unchanged for existing tables, including all three prior prepared foundations;
- no row content.

## Failure treatment

If Preview migration or post-check fails:

- stop;
- do not retry automatically;
- do not reset;
- do not resolve migration history manually;
- do not run rollback SQL;
- do not use `migrate dev`;
- do not activate runtime;
- record the safe failure code and propose a forward-fix for approval.

Because PostgreSQL enum-value removal is destructive, rollback is not an automatic reverse migration. Prefer a reviewed forward-fix after diagnosis.

## Activation conditions

No service, page, export or account-deletion path may query the new tables until:

- all four ordered Preview migrations pass;
- Preview contains synthetic data only;
- full Preview regression is green;
- each owner-scoped service is exact-head verified;
- a focused activation PR changes the runtime gate;
- every deployed target environment has the required schema.

Account export remains independent of these missing tables until activation.

## Production gate

No Production migration is authorised.

A later Production proposal must prove:

- Preview success and exact schema;
- Production/Preview environment mapping;
- Production migration history without private row access;
- backup/recovery readiness;
- exact migration order;
- expected locking and duration;
- post-migration empty/new-table and unchanged-count checks;
- forward-fix treatment;
- separate client approval.

## Current confirmation

- no Preview migration ran;
- no Production migration ran;
- no manual SQL ran;
- no existing data was read, copied, rewritten or backfilled;
- no provider, package, lockfile, secret or environment changed;
- all Phase 9 runtime remains disabled.
