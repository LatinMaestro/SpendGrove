# Phase 4 Milestone 2 Summary

Status: implemented, merged, deployed and technically verified; client retesting deferred. Not formally accepted or closed.

Last updated: 12 July 2026

## Objective

Improve recurring and monthly-budget lifecycle recovery without changing the accepted Phase 4 Milestone 1 detection thresholds, calculations, privacy boundaries or no-double-count rules.

## Completed delivery

- PR #115 / PR 4.6 — documentation-first lifecycle contract, no-schema assessment and consolidated deferred testing register. Merge: `9dde5423db6934718e369e66cc9b3f1759bf26ce`.
- PR #116 / PR 4.7 — recurring and budget lifecycle recovery. Merge: `71f0b5a50cf6ec65839b83935e779ea5c2ccb59f`.
- PR 4.8 — this QA and deferred client review package.

## Features delivered

Recurring items:

- active and archived items are shown separately;
- an owned archived item can be explicitly restored;
- restore preserves its safe label, category, transaction type, expected amount, cadence and next expected date;
- ownership and stale-edit checks run server-side;
- restore is blocked when an equivalent active item already exists;
- no recurring item is hard-deleted.

Dismissed suggestions:

- still-current dismissed deterministic suggestions are shown separately;
- the user can explicitly choose “Show suggestion again”;
- only the exact owned dismissal preference is removed;
- undo does not confirm or create a recurring item;
- hash keys and private evidence are not displayed.

Monthly budgets:

- active and archived budgets are shown separately;
- an owned archived monthly budget can be explicitly restored;
- restore preserves category, amount and monthly period;
- ownership, stale-edit, active expense-category and duplicate-active checks run server-side;
- no budget is hard-deleted.

## Preserved calculations and data rules

- recurring detection remains deterministic and unchanged;
- budget progress remains the Brisbane calendar-month total of active owned everyday expense transactions;
- split parents remain excluded and eligible split children included;
- income, transfers, deleted/inactive/cross-user transactions and analytical loan repayment records remain excluded;
- everyday transactions remain the only cashflow records;
- recurring items and budgets remain planning records;
- restore and dismissal undo create no transaction, cashflow, payment, reminder or merchant contact.

## Schema and migration status

- no Prisma schema change;
- no new migration file;
- no Preview migration;
- no Production migration;
- no data rewrite, backfill, table drop or durable staging state;
- no package, provider, secret or environment change.

The previously verified Phase 4 foundation migration remains the only Phase 4 Preview migration. Production has not been migrated.

## Verification evidence

PR #116 final preview:

- deployment: `CnC9hWFjjRmwx9p4rKhHdVxxmHrC`;
- state: Ready;
- 84 test files / 513 tests passed;
- TypeScript and lint validity passed;
- clean Next.js production build passed.

Merged main:

- merge commit: `71f0b5a50cf6ec65839b83935e779ea5c2ccb59f`;
- deployment: `91RcdUep4v6E21iFRvnt5TTHX8Bx`;
- state: Ready;
- canonical URL: https://spendgrove.vercel.app;
- public `/`, `/transactions`, `/import` and `/loans` returned HTTP 200.

## Privacy and security

Reads and writes remain authenticated and user-owned. Audit metadata contains safe state, reason and method codes only. The lifecycle flows do not persist or expose raw CSV files, raw rows, filenames, narration, account references, BSBs, card/customer/loan/lender identifiers, balances, exact addresses, secrets or connection strings.

## Known limitations

- client visual and signed-in workflow testing is deferred;
- no reminders, notifications, due-soon/overdue thresholds or scheduling;
- no bulk restore or bulk dismissal clearing;
- dismissed suggestions are shown only while the unchanged detector still finds the pattern;
- archived records must be restored before editing;
- no budget rollover;
- no changed refund treatment or financial formulas.

## Deferred client testing

The complete non-technical checklist for Phase 4 Milestones 1 and 2 is maintained in `docs/DEFERRED_CLIENT_RETESTING.md`. Both milestones remain open until the client explicitly completes retesting and records acceptance.

## Excluded work

No new navigation, Production migration, tax advice, automatic deductibility, Property/net-worth/loan-balance statistics, Basiq, AI, payments, household mode, document storage or later module was started.
