# Next Milestone Options

Status: Option A approved on 3 July 2026 as Phase 3C Milestone 2; Option B remains unapproved

Date prepared: 3 July 2026

## Decision requested

Choose one next milestone for a separate approval. Do not combine both options into one delivery milestone: reporting rules and everyday budgeting rules have different financial, privacy, schema and client-review gates. They can be delivered sequentially after separate approvals.

## Option A - Phase 3C Milestone 2: Property/EOFY reporting contract and reporting foundations

### Objective

Define a privacy-safe, user-controlled reporting contract on top of the accepted Property links, then build only the reporting foundations explicitly approved by that contract. The milestone would support neutral record review and future EOFY preparation without tax advice or automatic deductibility decisions.

### User value

- Gives users a structured view of Property-linked records by Australian financial year.
- Reduces manual gathering while keeping every source transaction visible and reviewable.
- Establishes clear calculation and classification rules before any report can imply a tax outcome.
- Makes the accepted Property-linking foundation useful without changing the original transactions.

### Recommended PR sequence

1. **PR 3C.5 - Reporting and financial-rules contract.** Documentation only. Define financial-year boundaries, eligible records, transfers/refunds, split children, loan repayment treatment, missing data, user classifications, amendment behavior, disclaimers and forbidden claims.
2. **PR 3C.6 - Exact schema foundation and Preview migration plan.** Propose only the minimum additive model required by the approved contract. Stop before any migration.
3. **PR 3C.7 - Property record review foundation.** After migration approval, provide financial-year filtering and transaction-level review using existing records; no totals not expressly approved in PR 3C.5.
4. **PR 3C.8 - Approved summary/export foundation.** Implement only approved calculations and privacy-safe export fields. Keep every result traceable to user-reviewed records and clearly non-advisory.
5. **PR 3C.9 - QA and client review package.** Verify calculation fixtures, ownership, reversibility, no-double-count behavior, privacy, Vercel and migration status; stop for client retesting.

### Expected schema and migration needs

A small additive schema change is likely if durable user classifications, reporting exclusions or review states are approved. The exact model cannot be selected before PR 3C.5 freezes calculation and lifecycle rules. It must not copy narration, merchant text, amounts, filenames, addresses or source rows into reporting metadata.

Any migration requires a separately presented Preview plan and explicit approval. It must preserve all Phase 3A-3C Milestone 1 data. No Production migration is proposed.

### Privacy and data risks

- A report may expose sensitive financial patterns or imply an unsupported tax conclusion.
- Copied transaction snapshots could retain private source data after the original changes.
- Incorrect inclusion, split, refund or loan rules could double count values.
- Exports may leave SpendGrove's protected environment.

Controls should use owned existing records, generated IDs, minimum classification codes, explicit user review, safe aggregate audit metadata, synthetic fixtures and clear export warnings. Raw CSV content, narration, account references and exact addresses remain forbidden.

### Exclusions

- Tax advice or accountant certification.
- Automatic deductibility decisions, percentages or claims.
- Lodgement, ATO integration or pre-filled tax returns.
- Property profit, yield, equity, valuation or net-worth features unless separately contracted.
- Home dashboard statistics.
- Automatic Property matching, transaction allocation or splitting.
- Documents, receipts or storage.
- Basiq, AI, payments, household mode and later modules.

### Stop conditions

Stop for approval if calculation rules are ambiguous; tax treatment is requested; classification or allocation needs change; a schema or migration plan is ready; existing data could be rewritten; private source fields are proposed; an export could expose identifiers; new packages/providers/secrets are needed; or any Production migration is proposed.

### Vercel and client review points

- Contract review before code or schema work.
- Migration-plan review before Preview migration.
- Synthetic financial-year boundary, refund, transfer, split-child and loan no-double-count scenarios.
- Trace each displayed value to an owned active transaction without copied cashflow.
- Confirm neutral wording, correction behavior and phone/desktop usability.
- Confirm exports contain only approved safe fields and no private source details.

## Option B - Phase 4 Milestone 1: Recurring, budgets and everyday insights

### Objective

Make SpendGrove more useful for everyday budgeting through user-reviewable recurring patterns, category budgets, carefully defined dashboard refinement and trend insights, while preserving CSV-first privacy and user control.

### User value

- Helps users anticipate regular commitments and subscriptions.
- Lets users set practical category budgets and understand progress.
- Makes the everyday experience feel more complete between CSV imports.
- Surfaces understandable trends without bank connections or AI profiling.

### Recommended PR sequence

1. **PR 4.0 - Recurring, budget and insight contract.** Documentation only. Define recurrence evidence, confirmation states, budget periods, rollover, refunds/transfers, split handling, calculation rules, dashboard metrics and wording.
2. **PR 4.1 - Exact schema foundation and Preview migration plan.** Propose additive user-owned budget and confirmed-pattern records only; stop before migration.
3. **PR 4.2 - Reviewable recurring/subscription patterns.** Show deterministic suggestions and require user confirmation before durable recurring status or reminders.
4. **PR 4.3 - Category budgets.** Add explicit user-entered budgets, clear progress rules and safe correction/archive behavior.
5. **PR 4.4 - Everyday dashboard and trend insights.** Implement only metrics approved in PR 4.0, with transparent periods and no Property/loan/tax statistics.
6. **PR 4.5 - QA and client review package.** Verify calculations, ownership, privacy, mobile UX, Vercel and migration status; stop for client retesting.

### Expected schema and migration needs

Additive schema work is likely for user-owned budgets, periods and confirmed recurring-pattern state. Trend calculations may remain derived from existing active transactions; persistent snapshots should be avoided unless separately justified.

PR 4.1 must present exact fields, constraints, indexes, rollback notes and data-integrity checks. Stop before any Preview migration. No Production migration is proposed.

### Privacy and data risks

- Recurrence detection can reveal sensitive behavioral patterns.
- Merchant-based grouping can misclassify irregular or private transactions.
- Budget and trend totals can be wrong if transfers, refunds, split parents or loan breakdowns are counted incorrectly.
- Dashboard summaries increase shoulder-surfing exposure.

Controls should use existing safe merchant/category fields, deterministic explainable rules, explicit confirmation, user ownership, hidden-by-default sensitive detail where appropriate, and no narration/raw-source persistence. Loan repayments remain analytical and must not inflate spending.

### Exclusions

- Basiq or live bank connections.
- AI-generated advice or classifications.
- Payments, billing or subscription purchasing.
- Tax/EOFY, Property or accountant reports.
- Property, loan, equity, valuation or net-worth dashboard statistics.
- Automated financial advice, forecasting guarantees or credit recommendations.
- Household mode, document storage and later modules.

### Stop conditions

Stop for approval if recurrence thresholds, budget rollover, refunds/transfers, split handling or dashboard calculations are ambiguous; a schema/migration plan is ready; a new package/provider/secret is proposed; private narration or identifiers are needed; automatic actions would replace user confirmation; loan/property/tax totals enter scope; or any Production migration is proposed.

### Vercel and client review points

- Contract review before implementation, especially recurring thresholds and dashboard formulas.
- Migration-plan review before Preview migration.
- Synthetic monthly, fortnightly, irregular, refund, transfer, split and archived-transaction scenarios.
- Confirm suggestions are explainable, dismissible and reversible.
- Confirm budget periods and progress are understandable on phone-sized screens.
- Confirm loan repayment records do not create extra spending and no excluded statistics appear.

## Should both be done?

Both may be valuable, but not in one milestone. Combining them would mix tax-adjacent reporting rules with recurring and budget calculations, enlarge the schema gate and make client acceptance harder to isolate.

Recommended sequence: **Option A first, narrowly scoped to its contract and reporting foundations, then Option B under a separate Phase 4 approval.** This completes the current Property record-keeping arc while its ownership, linkage and no-double-count rules are fresh. If the immediate product priority is everyday engagement rather than reporting continuity, Option B is a reasonable alternative, but it should explicitly defer Option A rather than absorb it.

## Approval boundary

The client selected Option A on 3 July 2026. Its implementation is controlled by `docs/PHASE_3C_MILESTONE_2_REPORTING_CONTRACT.md` and the explicit PR 3C.6 migration gate. Option B remains unapproved: no Phase 4, recurring, budgets, insights or Home dashboard statistics may start. No Basiq, AI, payments, household mode, document storage or later module is authorised.
