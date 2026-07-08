# Next Milestone Options

Status: proposal-only

Date prepared: 8 July 2026

## Context

Phase 3C Milestone 3 is formally accepted and closed. SpendGrove now supports the simple Property-record workflow:

1. upload CSV;
2. review and categorise transactions;
3. optionally link relevant Import rows to a Property during review;
4. commit reviewed rows;
5. optionally link manual transactions to a Property during create/edit;
6. later Property records/reports automatically include current eligible linked records without a report-only classification step.

No next implementation is authorised by this document. The client must explicitly approve one option or a revised plan before work starts.

Vercel usage note: the client is building several apps and Vercel usage is constrained. Future approved implementation phases should prefer larger safe development batches before each Vercel push where this does not weaken scope control, tests, review gates, privacy boundaries or mandatory stop conditions.

## Recommendation

Recommended next step: **Option A - Phase 4 Milestone 1: Recurring, budgets and everyday insights**, if the client wants SpendGrove to feel more complete for everyday use.

Why: Phases 3A-3C have now established durable imports, loans, repayments, Property links and simple Property records/export. The next biggest user-value gap is everyday money management: recurring payments, subscriptions, budgets and clearer day-to-day insight.

If the client wants to reduce launch risk before building more features, choose **Option B - Production readiness planning** first.

Choose **Option C - Small Phase 3C follow-up/property workflow polish** only if client retesting discovers small friction in the newly accepted Property-linking workflow. There are no known minor gaps that require immediate implementation today.

## Option A - Phase 4 Milestone 1: Recurring, budgets and everyday insights

### Objective

Make SpendGrove more useful for everyday personal finance by adding reviewable recurring/subscription patterns, category budgets and simple beginner-friendly insights.

### User value

- Helps users spot regular payments and subscriptions.
- Lets users set practical budget targets by category.
- Makes SpendGrove useful between CSV imports.
- Starts turning reviewed transaction history into simple everyday guidance without live bank linking or AI advice.

### Recommended PR sequence

To reduce Vercel usage, these can be grouped into larger local development batches before each Vercel push when safe.

1. **PR 4.0 - Recurring, budget and insight contract.** Documentation only. Define recurrence evidence, confirmation rules, budget periods, split handling, refunds/transfers, loan no-double-count treatment, insight wording and dashboard boundaries.
2. **PR 4.1 - Schema foundation and Preview migration plan.** Propose the minimum additive user-owned records for confirmed recurring items and budgets; stop before any Preview migration.
3. **PR 4.2 - Reviewable recurring/subscription suggestions.** Deterministic suggestions only; user confirms, dismisses or edits. No automatic bill/merchant commitments.
4. **PR 4.3 - Category budgets.** Add user-entered category budgets, period rules, archive/edit behaviour and safe progress copy.
5. **PR 4.4 - Everyday dashboard and trend insight foundation.** Implement only contract-approved summaries. Keep Property, tax, loan-balance, equity and net-worth stats out.
6. **PR 4.5 - QA and client review package.** Verify calculations, no-double-count rules, ownership, privacy, mobile UX, Vercel and client testing checklist.

### Expected schema/migration needs

Likely yes. Durable budgets and confirmed recurring/subscription items probably need additive user-owned tables or fields.

Required gate:

- PR 4.0 must freeze calculation and wording rules before schema work.
- PR 4.1 must present exact schema, migration SQL, rollback notes and integrity checks.
- Stop before any Preview migration.
- No Production migration unless separately approved later.

### Privacy and data risks

- Recurring/subscription detection can reveal sensitive behavioural patterns.
- Merchant/category grouping may misclassify irregular transactions.
- Budget progress and dashboard summaries can expose sensitive spending at a glance.
- Incorrect treatment of transfers, refunds, split parents or loan repayments could produce misleading totals.

### Exclusions

- Basiq or live bank connection.
- AI-generated advice or categorisation.
- Payments, billing, subscription purchasing or cancellation workflows.
- Tax/EOFY/accountant reports.
- Property profit/loss, yield, equity, valuation or net-worth features.
- Loan balance forecasting or debt advice.
- Household mode, document storage, new navigation tabs or later modules unless separately approved.

### Stop conditions

Stop for approval if:

- recurring thresholds or confidence rules are ambiguous;
- budget period/rollover rules are ambiguous;
- dashboard calculation rules are ambiguous;
- split/refund/transfer/no-double-count rules need changes;
- schema or migration plan is ready;
- private narration, filenames, account references or identifiers would be needed;
- a new package, provider, secret or paid service is proposed;
- Production migration is proposed;
- tax, Property/Home net-worth, Basiq, AI, payments, household mode or later modules enter scope.

### Vercel/client review points

- Contract review before implementation.
- Migration-plan review before Preview migration.
- Synthetic monthly, fortnightly, irregular, refund, transfer, split and archived-transaction scenarios.
- Mobile review of recurring cards, budget cards and dashboard summaries.
- Confirm suggestions are explainable, dismissible and reversible.
- Confirm loan repayment breakdowns do not inflate spending.
- Confirm no tax, Property profit, net-worth or advice wording appears.

## Option B - Production readiness planning

### Objective

Prepare SpendGrove for a future real release without running a Production migration or launching publicly.

### User value

- Reduces risk before real users and Production data.
- Clarifies privacy, security, support and release obligations.
- Creates a safer path toward Production migration planning later.
- Helps decide what must be true before public web or App Store rollout.

### Recommended PR sequence

This option should be mostly documentation/audit work and can be batched with fewer Vercel pushes because it should not change product UI unless explicitly approved.

1. **PR P.0 - Production readiness contract.** Define release readiness, environment boundaries, data/privacy obligations, support boundaries, migration gates and non-goals.
2. **PR P.1 - Privacy policy and terms planning.** Draft product-specific policy/terms checklists for legal review; not legal advice.
3. **PR P.2 - Account export/delete planning.** Define export/delete requirements, retention, audit limits and safe deletion semantics.
4. **PR P.3 - Security and operational review.** Audit auth, ownership, logging, CSV privacy, error handling, dependency posture and Vercel configuration without adding providers.
5. **PR P.4 - Production migration plan only.** Prepare exact Production migration checklist, verification and rollback notes; do not execute.
6. **PR P.5 - Release readiness package.** Summarise risks, blockers, approvals needed and next decisions.

### Expected schema/migration needs

Planning may identify future schema needs, especially for account export/delete or audit controls. This option should not implement them without a separate approved implementation milestone.

No Preview or Production migration is expected during planning.

### Privacy and data risks

- Policy/terms wording can create commitments the product does not yet satisfy.
- Account deletion/export design touches sensitive data and must avoid accidental retention or over-deletion.
- Logging/monitoring review must not expose transaction descriptions, CSV data, loan/property details or identifiers.
- Production migration planning must keep Preview and Production secrets strictly separated.

### Exclusions

- Production migration execution.
- Legal advice or final legal documents without professional review.
- New monitoring providers, secrets, packages or paid services unless separately approved.
- App Store submission.
- Basiq, AI, payments, household mode, document storage or later modules.
- Product feature implementation beyond planning/review.

### Stop conditions

Stop for approval if:

- legal commitments are unclear;
- export/delete requires schema changes;
- a provider/package/secret is proposed;
- logging might expose private data;
- Production database access is needed;
- a Production migration is proposed for execution;
- release decisions require external legal/security advice.

### Vercel/client review points

- Review readiness checklist and risk register.
- Confirm environment separation and migration gates.
- Confirm privacy policy/terms are draft-only and need professional review.
- Confirm account export/delete plan matches release expectations.
- Confirm no Production migration or public launch action occurred.

## Option C - Small Phase 3C follow-up / property workflow polish

### Objective

Reserve a small follow-up lane for minor Property workflow polish only if client retesting finds specific friction after Phase 3C Milestone 3 closure.

There are no known accepted gaps requiring immediate work at closure.

### User value

- Keeps room for tiny usability fixes without opening a broad new reporting or tax phase.
- Protects the accepted simple Property workflow from unnecessary complexity.
- Lets SpendGrove polish labels, empty states or review flow if real use exposes a small rough edge.

### Possible PR sequence

Use only if a concrete minor gap is identified.

1. **PR 3C.F0 - Follow-up scope note.** Document the exact friction, accepted fix and exclusions.
2. **PR 3C.F1 - Focused UI/workflow polish.** Implement only the named minor fix without schema, migration or reporting-rule changes.
3. **PR 3C.F2 - QA/client note.** Verify no regression to import-review linking, manual linking, reports/export, privacy and no-tax wording.

### Expected schema/migration needs

None. If the follow-up needs a schema change, migration, durable staging state or reporting calculation change, stop and convert it into a separate proposed milestone.

### Privacy and data risks

- Even small workflow polish could accidentally expose Property context, private transaction fields or tax-adjacent wording.
- Import-review changes could accidentally weaken review-before-commit or raw CSV boundaries.
- Report/export changes could accidentally reintroduce classification burden or unapproved totals.

### Exclusions

- Tax advice, automatic deductibility, claimable/deductible percentages or ATO labels.
- New report calculations, net/profit totals, Home dashboard statistics or Property analytics.
- Automatic Property matching.
- Transaction allocation/splitting.
- Schema changes, migrations, data rewrites or table drops.
- Basiq, AI, payments, household mode, document storage, new navigation tabs or later modules.

### Stop conditions

Stop for approval if:

- no concrete minor gap is identified;
- the fix requires schema, migration, data rewrite or durable staging state;
- export/report calculations need to change;
- private source fields would be needed;
- tax/deductibility wording appears;
- navigation changes are required;
- new packages/providers/secrets are proposed;
- Phase 4 or Production readiness work enters scope.

### Vercel/client review points

- Review the exact changed screen only.
- Confirm the accepted import-review and manual Property-linking workflows still work.
- Confirm linked records still appear automatically in Property records/export.
- Confirm no report-only classification step returns.
- Confirm no tax/advice/dashboard wording appears.

## Approval boundary

All options are proposal-only.

Do not begin Phase 4, Production readiness implementation, a Phase 3C follow-up, Home dashboard statistics, tax advice, automatic deductibility, Basiq, AI, payments, household mode, document storage, new navigation tabs, Production migration or later modules until the client explicitly approves a plan.
