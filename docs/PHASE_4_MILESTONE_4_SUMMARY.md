# Phase 4 Milestone 4 Summary

Status: client accepted and closed; implemented, merged, technically verified and deployed to Production

Last updated: 15 July 2026

## Objective

Rebuild SpendGrove's presentation into a calm, compact, logo-led and responsive budgeting experience for beginners while preserving every accepted data, financial, import, matching, Property, reporting, ownership, privacy and no-double-count rule.

The client formally accepted and closed Phase 4 Milestones 1, 2, 3 and 4 on 15 July 2026 after consolidated Production review.

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

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Do not formally accept or close any Phase 4 milestone until the client explicitly completes testing and records acceptance. Do not begin another milestone from this package.

## Focused client-review enhancement - monthly category spending

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed and technically verified. Phase 4 Milestones 1-4 remain open pending consolidated client acceptance.

### Delivery

- PR #139 / 4.27 contract and assessment: `f858566fa38fb4755ae11985b09785d216cd72e5`.
- PR #140 / 4.28 implementation and regressions: `1e347102f9583b33c1b873a340c64c38c151e382`.
- PR 4.29 QA and consolidated testing documentation.

### User experience

Transactions now places a compact selected-month category donut below the month/search toolbar and above the count/list. The centre shows one authoritative Spent total. The legend shows every category when there are five or fewer, otherwise the five largest plus exact presentation-only Other.

View breakdown opens a focused subordinate Transactions view with every real category, amount, percentage and transaction count. Choosing a category returns to the same month with a removable filter. Search continues to affect only the list, not the whole-month chart.

No-expense months show a concise empty state. Needs review spending remains visible. The SVG includes an accessible title/description and the legend provides a complete textual equivalent.

### Financial source of truth

The selected-month server query now produces safe aggregate values from the same approved expense eligibility used by everyday insights:

- owned active everyday expenses only;
- selected Brisbane calendar month;
- split children included and split parents excluded;
- income, transfers, analytical loan records, deleted/inactive and cross-user rows excluded;
- absolute integer cents until display.

Focused reconciliation tests prove the category sum and donut total equal the existing approved everyday monthly-spending total. Existing income-style refund treatment is unchanged.

### Verification

- 97 test files / 597 tests passed;
- TypeScript and Next.js lint passed;
- optimized production build passed;
- Preview `dpl_FEx2aJUeSRNp7nZAPsgCNXMrSffH` Ready;
- main `dpl_BV7bZ6LX8tth2iMs96q7QgGmKe3W` Ready;
- canonical `/transactions` HTTP 200;
- deployed responsive shell showed no horizontal overflow at approximately 390, 768, 1024 and 1440 px and no browser console errors.

The connected browser had no signed-in data session, so populated-chart visual and screen-reader client review remains explicitly deferred rather than inferred.

### Safety

No Prisma schema, migration, data rewrite/backfill, package/lockfile, provider, secret or environment change. No Preview or Production migration. No transaction, refund, split, transfer, category, budget, recurring, import, loan, Property, report/export or navigation rule changed. The chart receives safe aggregate category names, totals, percentages, counts and month only.

### Known limitations

- search intentionally does not change the whole-month chart;
- existing refund treatment is unchanged;
- percentage display rounding may not total exactly 100%, while currency remains authoritative;
- category colours are deterministic but palette collisions remain possible when many categories are present;
Historical pre-acceptance record (superseded by the 15 July 2026 closure): - populated signed-in visual and assistive-technology review remains pending client acceptance.


## Chart correctness client-review hardening

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed and technically verified on 14 July 2026; Phase 4 Milestones 1-4 remain open pending consolidated client acceptance.

### Delivery

- PR #142 / 4.30 eligibility and source-of-truth audit: `6c2f9019d1476fe86a127d1ffd698e5bd3a68d7f`.
- PR #143 / 4.31 focused implementation and regression tests: `d6ae6bfaee81d475fd18387ad5a57b17dff97ee6`.
- PR 4.32 QA, handoff and deferred-testing package.

### Root cause and record state

The deployed Needs review drilldown accepted only `EXPENSE` records. Because the client's positive `+$2,500.00` row appeared there, the API record was an `EXPENSE` with a positive signed amount rather than a correctly typed income or transfer.

Import review can produce that inconsistent pairing when no safe category suggestion exists: the seeded Needs review category supplies type `EXPENSE`, while commit preserves the positive source amount. Existing chart and everyday-insight helpers checked type and then summed absolute values without also requiring the negative money-out sign.

No Production database was queried. The connected database project exposed only a branch named production, so the audit used repository and deployed predicate evidence without accessing Production data or private source text.

### Exact correction

One canonical pure eligibility helper now requires:

- authenticated owner;
- active and not deleted;
- type `EXPENSE`;
- strictly negative integer-cent amount;
- not a counted split parent;
- valid date and selected month where applicable.

The Transactions chart and everyday insights reuse this helper. Each category aggregate also contains its owned eligible transaction IDs, and the category drilldown filters by that exact set. Donut, legend, breakdown and drilldown therefore share one record set.

Needs review means only an otherwise eligible expense without a usable active category. Income, incoming/outgoing transfers, positive/zero expense anomalies, analytical LoanRepayment records, split parents, inactive/deleted and cross-user records are excluded.

### Other affected totals

The same type-only defect existed in the everyday-insight helper. It could inflate:

- Home current/previous monthly spending;
- Home category comparisons;
- category-budget progress when an affected category had an active budget.

Those views now use the same sign-safe guard. The approved budget formula, refund treatment and comparison periods did not change.

### Durable-data outcome

No record was rewritten, backfilled or automatically reclassified. The existing positive `EXPENSE` remains incorrectly classified until the user edits it through the normal transaction correction flow, but it is excluded from spending totals and chart drilldowns.

The import category/type model was not redesigned. Broad bank-format import classification remains outside this hardening and requires a separate approved contract if pursued.

### Presentation

- exact zero percentage: `0%`;
- positive percentage below 0.1%: `<0.1%`;
- other percentages: restrained one-decimal rounding with trailing `.0` removed;
- real category colours: deterministic safe-key palette selection;
- Needs review: fixed amber;
- Other: fixed neutral slate.

Colours are not persisted, category records are unchanged and no dependency was added.

### Verification

- 99 test files / 612 tests passed;
- TypeScript validity and Next.js lint passed;
- optimized production build passed;
- implementation Preview `dpl_AgLcw4d35Z2WNU9yiGGLmZ7UEpCP` Ready at `eb1aca3dc3f4b23e11e2a9e6618c6a94fb0c759b`;
- merged-main `dpl_Asvt3s72xB9grd9VSuyPWAk5fmst` Ready at `d6ae6bfaee81d475fd18387ad5a57b17dff97ee6`;
- public `https://spendgrove.vercel.app/transactions` HTTP 200;
- Preview had no browser console errors and no horizontal overflow at a verified 390 px viewport.

The first real build found one stale source assertion after the eligibility logic moved into the shared helper. Only that assertion was corrected; the exact follow-up head then passed all checks.

The connected browser had no authenticated data session. Populated July confirmation is therefore deferred. Tests prove that a `+250000` positive expense anomaly cannot enter spending or Needs review, but this summary does not claim an observed corrected client total.

### Safety and unchanged boundaries

No Prisma schema, migration, data rewrite/backfill, package/lockfile, provider, secret or environment change. No Preview or Production migration. No Production data access. No signed-money convention, refund, transfer, split, category, budget formula, import semantics, recurring, Property, Loan, report/export or navigation rule changed. No raw CSV/source narration, filename, merchant/source text, account reference, banking identifier, exact address or private import metadata is exposed.

### Remaining limitations

- the durable inconsistent record still needs ordinary user correction;
- broad import type/category modeling is unchanged;
- income-style refund treatment is unchanged;
- search intentionally remains list-only;
- deterministic palette hashing can assign the same colour to different categories when many categories exist;
Historical pre-acceptance record (superseded by the 15 July 2026 closure): - signed-in populated-data and assistive-technology review remain pending client acceptance.

## Transaction sign/type integrity delivery (14 July 2026)

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged and technically verified; Phase 4 Milestones 1-4 remain open pending consolidated client acceptance.

### Delivery

- PR #145 / 4.33 audit contract: `53fadcbab4a009bbaec85e46f06f3a56602fc8f5`.
- PR #146 / 4.34 implementation: `78574362f07781a1181766a5ae68f663ee02d03f`.
- PR 4.35: QA, handoff and consolidated client-testing record.

### Shared invariant

Transaction direction is determined by:

1. confirmed transfer treatment;
2. otherwise signed integer cents;
3. compatible category selection.

Zero values are invalid. Positive non-transfer amounts are Money in / `INCOME`; negative non-transfer amounts are Money out / `EXPENSE`; signed confirmed transfers remain `TRANSFER`. Categories, merchant learning, keyword suggestions and Needs review cannot reverse direction.

### Hardened paths

- CSV review and server commit;
- Import and Merge validation, with Skip remaining non-writing;
- local merchant/category suggestions;
- manual transaction create/edit;
- generic transaction request validation;
- split sign, type, zero and exact-total validation;
- contextual anomaly presentation.

Property links and loan reconciliation do not alter direction. Duplicate scoring and Import/Skip/Merge semantics are unchanged.

### Edge-case outcome

- Positive non-transfer refunds remain Money in and stay excluded from expense spending and budget progress; they do not net the original expense.
- Negative income adjustments are Money out under the current model and may affect spending until the user selects an appropriate compatible category.
- Incoming and outgoing confirmed transfers remain excluded from spending and existing transfer-excluded income totals.
- Split children must be same-direction and type-compatible with the parent; mixed-direction children are rejected.

### Existing records

No historical transaction was rewritten or reclassified. The known positive `EXPENSE` remains visible, excluded from incompatible calculations by the canonical spending guard and correctable through Edit transaction. Only affected rows/details show Needs correction.

### Verification

- 101 test files / 633 tests passed;
- TypeScript validity and Next.js lint passed;
- optimized production build passed;
- final Preview `dpl_NgKKnxdaY1zKgwUaNyDSD66ALfBY` Ready at `ec7f5fd88b8af4ff1e4b6a18a1cbab35a8940d04`;
- public Preview Transactions loaded with no browser console errors;
- 390 px browser check found no horizontal overflow.

The first real builds identified a missing helper import and then two stale expectations. Only those focused defects were corrected; the exact final head passed. The connected browser had no authenticated data session, so durable anomaly correction remains deferred client testing.

### Safety and unchanged boundaries

No Prisma schema, migration, backfill, data rewrite, manual SQL, Production database access, package/lockfile, provider, secret or environment change. No transfer threshold, signed-money convention, refund formula, split counting, duplicate scoring, budget formula, Property/Loan/reporting or navigation change. No private source content is added to logs or audit metadata.

### Known limitations

- Existing anomalies require user confirmation through Edit; there is no automatic remediation.
- Positive refunds do not reduce the original expense category or budget.
- Negative income adjustments use the current Money out model; no contra-income model exists.
- Mixed-direction splits are unsupported.
- Narration-only transfer hints remain reviewable and are not authoritative.
Historical pre-acceptance record (superseded by the 15 July 2026 closure): - Populated signed-in and assistive-technology checks remain pending consolidated client acceptance.

## Formal closure evidence

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

This closure accepts the transaction sign/type integrity work delivered through PR #146 and the QA/handoff delivered through PR #147. No unresolved Phase 4 blocker remains.
