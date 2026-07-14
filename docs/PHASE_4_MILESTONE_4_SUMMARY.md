# Phase 4 Milestone 4 Summary

Status: implemented, merged, deployed and technically verified; client retesting deferred. Not formally accepted or closed.

Last updated: 14 July 2026

## Objective

Rebuild SpendGrove's presentation into a calm, compact, logo-led and responsive budgeting experience for beginners while preserving every accepted data, financial, import, matching, Property, reporting, ownership, privacy and no-double-count rule.

Phase 4 Milestones 1, 2, 3 and 4 all remain open pending consolidated client testing.

## Completed delivery

- PR #133 / 4.18 - documentation-only UI contract, screen inventory, design specification and market-reference synthesis. Merge: `2e6b194da5a20a1c7c66056f91801d4bbb905e03`.
- PR #134 / 4.19-4.20 - approved brand assets, visual tokens, shared primitives, responsive shell, focused Home and onboarding presentation. Merge: `7896f28e6a7b954d5108b00127888ced4c58cdc0`.
- PR #135 / 4.21-4.22 - compact Transactions, staged CSV Import, and focused Budget and Regular-payment managers. Merge: `6c8822f7cfbdc1ed222d12ab7b96ba7022a94771`.
- PR #136 / 4.23-4.24 - calm Loans hierarchy, secondary Property/recovery controls and grouped Settings. Merge: `41523ac25089e74778cf25eb17e195a0dc6caffa`.
- PR #137 / 4.25 - responsive, semantic-heading, navigation, focus and prohibited-language QA. Merge: `df6e6ef20046fe8dccb409178a3076cf28b87eea`.
- PR #138 / 4.26 - final evidence and consolidated client package.

## Research and design direction

Official App Store references reviewed before implementation:

- Buddy: month-first budgeting and friendly task framing;
- Copilot Money: strong typography, spacing and compact aligned records;
- PocketGuard: one focal everyday-money question;
- Monarch Money: progressive disclosure and effective desktop use;
- MoneyLens and statement-first peers: explicit CSV/privacy positioning.

SpendGrove adopted the useful presentation patterns only. It did not adopt live bank aggregation, AI, investment/net-worth dashboards, debt advice, household features or dense all-in-one dashboards.

The approved repository logo is used from `assets/brand/spendgrove-logo.png`; the compact icon source remains `assets/brand/app-icon-source.png`.

## Final navigation and shell

Exactly five primary destinations remain:

1. Home
2. Transactions
3. Loans
4. Import
5. Settings

Desktop uses a persistent logo-led sidebar. Mobile uses a compact header and five-destination bottom navigation with safe-area spacing. Budgets and Regular payments remain subordinate Home workflows. No new tab or material route hierarchy was introduced.

## Screens overhauled

### Home and onboarding

- one clear Import transactions action;
- compact monthly everyday-money summary;
- budget and regular-payment detail remains subordinate;
- concise privacy-first onboarding;
- empty sections do not compete with the next useful action.

### Transactions and CSV Import

- month-scoped compact transaction rows;
- search stays within the selected month;
- one focused transaction detail surface;
- four visible stages: Choose file, Confirm columns, Review and Import;
- mapping, source detail and advanced review controls appear only when relevant;
- reviewed-import confirmation remains protected against duplicate submission;
- Import, Skip and Merge semantics are unchanged.

### Budgets and Regular payments

- focused subordinate pages with Back to Home;
- contextual create/edit forms rather than permanently expanded forms;
- compact budget progress and lifecycle recovery;
- compact recurring suggestions with one open editor;
- confirmation, dismissal, delete and restore behaviour is unchanged.

### Loans and Property

- calm Loans header with Add loan primary and Import repayments secondary;
- compact Loan cards and one focused selected-loan view;
- Loan repayments remain before Property transactions;
- correction, matching, unlink, Delete and Restore remain reachable secondarily;
- Property report/export remains a separate secondary workflow;
- deleted Loan recovery and privacy guidance use progressive disclosure;
- no repayment, matching, Property-link or report/export rule changed.

### Settings

- clear Preferences, Australian defaults and Data and privacy groups;
- Simple Mode remains the default;
- account history, recovery and development-only tools remain environment-gated and secondary;
- unavailable features remain absent.

## Verification evidence

Final application gate:

- exact PR #137 head `326e24ab95dc26c0fda1e5dfe2d180c2d5576b05`;
- 95 test files / 587 tests passed;
- TypeScript and Next.js lint validity passed;
- optimized production build passed;
- Preview deployment `dpl_54EaJW6HPZDW5MbjBTACTUekJDxb` is Ready;
- merged-main deployment `dpl_2QKHYxtx8dNBW7VacD4eTGbirpTn` is Ready for merge `df6e6ef20046fe8dccb409178a3076cf28b87eea`;
- canonical URL: https://spendgrove.vercel.app;
- public Home, Transactions, Loans, Import and Settings routes loaded without internal errors.

Visual verification covered desktop width 1440 and mobile width 390 for all primary routes plus Budgets and Regular payments. No measured horizontal overflow was present. Each route exposed one semantic primary heading after client session loading.

## Schema, migration and operational status

- no Prisma schema change;
- no migration file change;
- no Preview migration;
- no Production migration;
- no data rewrite or backfill;
- no hard deletion;
- no package, provider, secret or environment-variable change.

The existing Phase 4 Preview schema remains unchanged. No Production migration has run.

## Privacy, financial and safety evidence

- raw CSV files and rows remain transient and are not persisted;
- no filenames, raw narration, account references, exact addresses or private identifiers were added to UI, logs or metadata;
- everyday transactions remain the only cashflow records;
- analytical LoanRepayment records remain excluded from extra spending;
- recurring thresholds, budget calculations, transaction values, duplicate scoring and Import/Skip/Merge rules are unchanged;
- Property-link cardinality and report/export calculations/columns are unchanged;
- no Basiq, AI, payment, notification, tax advice, deductibility, net-worth, valuation or debt-advice feature was introduced.

## Known limitations

- signed-in client review of real account states, keyboard flow, screen reader behaviour and touch interaction remains deferred;
- the selected Loan remains UI state on `/loans`, not a bookmarkable deep link;
- existing refund treatment and monthly-only/no-rollover Budget limits remain unchanged;
- recurring suggestions remain conservative and require confirmation;
- Property reporting remains record keeping only, not tax advice.

## Deferred client testing

The complete non-technical checklist for Phase 4 Milestones 1-4 is maintained in `docs/DEFERRED_CLIENT_RETESTING.md`.

Do not formally accept or close any Phase 4 milestone until the client explicitly completes testing and records acceptance. Do not begin another milestone from this package.
