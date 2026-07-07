# Next Milestone Options

Status: proposal-only; no option is approved for implementation

Date prepared: 7 July 2026

## Decision requested

Choose one next milestone for a separate approval. Do not combine reporting, everyday budgeting and production-readiness work into one delivery milestone: they have different financial, privacy, schema and client-review gates.

No implementation, schema work, migration, navigation change, Phase 4 work or Production migration is authorised by this document.

## Recommendation

Recommended next step: **Option A - Phase 3C Milestone 3: Import-review Property linking and property-record workflow polish.**

Why: Phase 3C Milestone 2 proved that the simpler linked-record reporting/export workflow is the right direction. The biggest remaining friction is getting transactions linked to Properties earlier, during the normal CSV import/review flow, so reports become useful without another reporting-only task.

Option B is valuable when the client wants SpendGrove to feel more like a complete everyday budgeting app. Option C is prudent before any real public release, but it is better after the core user workflows are a little more settled.

## Option A - Phase 3C Milestone 3: Import-review Property linking and property-record workflow polish

### Objective

Make the accepted Property reporting workflow easier by letting users link transactions to Properties earlier, especially during everyday CSV import review, while preserving user control and the no-tax-advice boundary.

### User value

- Reduces after-the-fact cleanup because Property links can be applied during the normal review-before-commit workflow.
- Makes Property reports/exports more useful immediately after CSV import.
- Keeps SpendGrove simple: upload CSV, review/categorise/link, then export linked Property records.
- Preserves the current accepted rule that reports use linked records automatically without another classification step.

### Recommended PR sequence

1. **PR 3C.10 - Import-review Property-linking contract.** Documentation only. Define what can be linked before commit, eligible rows, split handling, neutral copy, audit codes, user confirmation, no-tax boundaries and rollback behaviour.
2. **PR 3C.11 - Schema and migration assessment.** Confirm whether existing durable `PropertyTransactionLink` can support post-commit creation from import review without schema changes. Stop if any schema or migration is needed.
3. **PR 3C.12 - Import-review Property link UI.** Let users choose `Include in property records` for eligible rows and select one active owned Property before commit. Keep every row reviewable and editable.
4. **PR 3C.13 - Commit integration and safety checks.** On commit, create only validated owned Property links for newly committed eligible transactions. Keep original transaction date, amount, category, merchant and cashflow unchanged.
5. **PR 3C.14 - Manual transaction and workflow polish.** Consider a similarly neutral Property-link control for manual transaction creation/editing if it fits the accepted contract without schema changes.
6. **PR 3C.15 - QA and client review package.** Verify import, manual links, reports/exports, unlink/relink, split-child handling, privacy, mobile layout, Vercel and no-double-count behaviour; stop for client retesting.

### Expected schema and migration needs

Likely none if existing `PropertyTransactionLink` can safely support links created after transaction commit. The contract should explicitly confirm this before implementation.

Stop before implementation if the design needs a new field, staging table, review-state table, durable import-row Property choice, migration or data rewrite.

### Privacy and data risks

- Import review may expose Property context beside transaction details, so copy must stay neutral and concise.
- Durable links must be created only after a transaction is safely committed and owned by the authenticated user.
- Temporary import-review selections must not persist raw CSV rows, filenames, narration, account identifiers or private bank values.
- Property labels must remain safe nicknames only, not exact addresses.

### Exclusions

- Tax advice, deductibility, claimability, percentages or ATO labels.
- Automatic Property matching.
- Transaction allocation or splitting.
- New report calculations or Home dashboard statistics.
- Schema/migration work unless separately approved after the contract gate.
- Documents, receipts, Basiq, AI, payments, household mode, Phase 4 or later modules.

### Stop conditions

Stop for approval if import-review linking requires schema changes, a migration, durable staging state, private source fields, automatic matching, tax wording, allocation/split logic, exact addresses, new packages/providers/secrets, Production migration or navigation changes.

### Vercel and client review points

- CSV import review on mobile and desktop.
- Linking one eligible row to one Property before commit.
- Confirming committed linked transactions appear automatically in Property records/export.
- Unlinking/relinking after commit.
- Split-parent exclusion and split-child eligibility.
- Clear neutral wording: `Include in property records`; no `tax deductible`.

## Option B - Phase 4 Milestone 1: Recurring, budgets and everyday insights

### Objective

Make SpendGrove more complete for everyday users through user-reviewable recurring/subscription detection, category budgets, dashboard refinement and simple trend insights.

### User value

- Helps users understand regular commitments and subscriptions.
- Lets users set practical category budgets.
- Makes the app more useful between CSV imports.
- Adds beginner-friendly everyday insight without live bank connections or AI advice.

### Recommended PR sequence

1. **PR 4.0 - Recurring, budget and insight contract.** Documentation only. Define recurrence evidence, confirmation states, budget periods, rollover, refunds/transfers, split handling, calculation rules, dashboard metrics and wording.
2. **PR 4.1 - Schema foundation and Preview migration plan.** Propose additive user-owned budget and confirmed-pattern records only; stop before migration.
3. **PR 4.2 - Reviewable recurring/subscription patterns.** Show deterministic suggestions and require user confirmation before durable recurring status or reminders.
4. **PR 4.3 - Category budgets.** Add explicit user-entered budgets, clear progress rules and safe correction/archive behaviour.
5. **PR 4.4 - Everyday dashboard and trend insights.** Implement only metrics approved in PR 4.0, with transparent periods and no Property/loan/tax statistics.
6. **PR 4.5 - QA and client review package.** Verify calculations, ownership, privacy, mobile UX, Vercel and migration status; stop for client retesting.

### Expected schema and migration needs

Additive schema work is likely for user-owned budgets, budget periods and confirmed recurring-pattern state. Trend calculations may remain derived from active transactions; persistent snapshots should be avoided unless separately justified.

Any migration must be Preview-only first and separately approved. No Production migration is proposed.

### Privacy and data risks

- Recurrence detection can reveal sensitive behavioural patterns.
- Merchant/category grouping can misclassify private or irregular transactions.
- Budget and trend totals can be wrong if transfers, refunds, split parents or loan breakdowns are counted incorrectly.
- Dashboard summaries increase shoulder-surfing exposure.

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

## Option C - Production readiness planning

### Objective

Prepare SpendGrove for a future real release without running Production migrations or beginning a public launch.

### User value

- Reduces release risk before real users and real Production data enter the system.
- Clarifies privacy, security and support obligations.
- Creates a controlled path for Production migration planning later.
- Helps decide what must be true before App Store or public web rollout.

### Recommended PR sequence

1. **PR P.0 - Production readiness contract.** Documentation only. Define release readiness, environments, privacy obligations, support boundaries, migration gates and explicit non-goals.
2. **PR P.1 - Privacy policy and terms planning.** Draft product-specific policy/terms checklists for legal review; do not present them as legal advice.
3. **PR P.2 - Account export/delete planning.** Define user data export/delete requirements, retention, audit boundaries and safe deletion semantics.
4. **PR P.3 - Security and operational review.** Audit auth, ownership checks, logging, CSV privacy, error handling, dependency posture and Vercel configuration without adding new providers.
5. **PR P.4 - Production migration plan only.** Prepare an exact Production migration checklist and rollback/verification plan; do not execute it.
6. **PR P.5 - Release readiness review package.** Summarise risks, blockers, required approvals, user-facing documents and next decisions.

### Expected schema and migration needs

Planning may identify future schema or migration needs, especially for account export/delete or operational audit controls. This option should not implement those changes unless a separate implementation milestone is approved.

No Production migration is authorised. Any future Production migration requires explicit approval after a complete plan.

### Privacy and data risks

- Policy/terms text can create obligations or promises that the product does not yet satisfy.
- Account deletion/export touches sensitive data and must be designed carefully.
- Operational logging/error monitoring must not expose private transaction, CSV, loan, Property or account details.
- Production migration planning must keep Preview and Production secrets separate.

### Exclusions

- Production migration execution.
- Legal advice or final legal documents without professional review.
- New monitoring providers, secrets, packages or paid services unless separately approved.
- App Store submission.
- Basiq, AI, payments, household mode, document storage or later modules.
- Product features beyond planning and readiness review.

### Stop conditions

Stop for approval if legal commitments are unclear; data export/delete would require schema changes; a provider/package/secret is proposed; logging might expose private data; Production database access is needed; a Production migration is proposed for execution; or release decisions depend on external legal/security advice.

### Vercel and client review points

- Review readiness checklist and risk register.
- Confirm environment separation and migration gates.
- Confirm privacy policy/terms are draft-only and need professional review.
- Confirm account export/delete plan matches the client’s release expectations.
- Confirm no Production migration or public launch action has occurred.

## Approval boundary

This document proposes options only. The client must explicitly approve one option, objective and PR sequence before any implementation starts.

Until then: no Phase 4, recurring, budgets, Home dashboard statistics, tax advice, automatic deductibility, Basiq, AI, payments, household mode, document storage, Production migration, new navigation tab or later-module work is authorised.
