# Phase 3C Milestone 1 Proposal - Property-Linked Record-Keeping Foundations

Status: proposal only; client approval required before implementation

Date prepared: 1 July 2026

## Proposed objective

Add a privacy-safe, user-controlled foundation for linking an existing everyday transaction to an optional Property for neutral property-related record keeping. This milestone would make the relationship reviewable and reversible without producing tax advice, deductibility decisions, EOFY reports, property statistics or Home dashboard statistics.

Everyday transactions would remain the only cashflow/spending records. A property link would be supporting metadata only and would never duplicate, recategorise or change the transaction amount.

## Recommended PR-sized task breakdown

### PR 3C.0 - Property record-keeping contract

- Define the permitted purpose and neutral user-facing language.
- Freeze ownership, link/unlink, archive and no-double-count rules.
- Define the minimum persisted fields and forbidden private fields.
- Decide whether one transaction may link to one Property only or whether a separately approved allocation model is required.
- Define audit reason codes without amounts, narration or property nicknames.

This PR should be documentation-only.

### PR 3C.1 - Schema foundation and Preview migration plan

- Present the exact minimal user-owned transaction-to-Property relation.
- Reuse existing Property and Transaction ownership where possible.
- Add no tax classification, deductible percentage, report snapshot or private source field.
- Add schema/privacy tests and migration SQL review.
- Stop before running any Preview migration.

### PR 3C.2 - Manual property link and unlink

- Let an authenticated user link one eligible owned everyday transaction to one active owned Property.
- Support explicit unlink and relink with confirmation.
- Keep transaction date, amount, merchant, category and cashflow treatment unchanged.
- Exclude archived/deleted/cross-user records and revalidate ownership on write.
- Record safe link-state/reason codes only.

### PR 3C.3 - Property record-keeping activity view

- Show linked everyday transactions in a neutral Property record-keeping view.
- Show existing linked Loan Account context separately where available.
- Do not calculate property profit, yield, equity, net worth, deductible totals or tax outcomes.
- Preserve exact-address and private-source exclusions.

### PR 3C.4 - QA and client review package

- Run full tests, type-check and production build.
- Verify Preview and merged-main deployments.
- Audit ownership, link reversibility, no-double-count, privacy, logging and migration status.
- Provide a synthetic-data client checklist and stop for client retesting.

## Scope inclusions

- Existing safe Property nicknames and usage metadata.
- Explicit user-controlled links between owned everyday transactions and an owned Property.
- Reversible manual link, unlink and relink.
- Neutral property-related record-keeping language.
- A property activity list that reuses existing transaction records.
- Safe state/reason-code auditing.
- Ownership, stale-state, privacy and no-double-count regression tests.

## Scope exclusions

- Tax or EOFY reports.
- Accountant reports or workspace.
- Automated deductibility decisions, percentages, conclusions or tax advice.
- Property income, expense, profit, yield, equity, valuation or net-worth statistics.
- Home dashboard statistics.
- Automatic property matching or linking.
- Transaction splitting or allocation unless separately designed and approved.
- Changing transaction amounts, categories, merchants or cashflow treatment through property linking.
- Exact property addresses, documents, receipts or document storage.
- Raw CSV files, rows, filenames, headers, narration or source text.
- Account identifiers, BSBs, card fragments, customer IDs, loan/lender references or masked references.
- Recurring, subscriptions, budgets, insights, reminders, Basiq, AI or payments.
- Household mode, Phase 4 or any later module.
- New package, provider, paid service, secret or environment change.

## Expected schema and migration needs

A schema amendment is likely because an everyday transaction currently has no approved durable Property relationship. The recommended minimum is a user-owned relation containing only generated IDs, `userId`, `transactionId`, `propertyId`, timestamps and an archive/unlink state if required by the audit contract.

The exact cardinality and lifecycle must be frozen in PR 3C.0 before Prisma changes. No tax-purpose field, deductible flag/percentage, report value, narration snapshot, merchant snapshot, amount copy or address field should be added.

Any migration must be additive and preserve all existing Phase 3A/3B data. A separate client gate is required before running a Preview migration. No Production migration is proposed or authorised.

## Privacy and data risks

Key risks are exposing another user's Property or transaction, turning a neutral link into an implied tax conclusion, copying narration or financial values into link/audit records, introducing exact addresses, and double-counting linked transactions in future summaries.

Controls should include authenticated ownership checks on both records, generated IDs only in the relation, no copied transaction content, neutral wording, explicit user action, reversible links, safe reason-code auditing, synthetic fixtures and regression tests proving the transaction remains the sole cashflow record.

## No-double-count approach

- The everyday transaction remains the single spending/income record.
- A Property link is metadata and creates no additional cashflow row.
- Linking never changes amount, category, merchant, date or transaction source.
- Property views reuse the linked transaction rather than creating a property transaction copy.
- Loan repayment breakdowns remain analytical records and continue to follow the accepted Phase 3B no-double-count rules.
- Any future aggregate/reporting work requires a separate financial contract and approval.

## Vercel and client review points

If approved, client review should confirm with synthetic data that:

1. A transaction can be linked only to an owned active Property.
2. Link, unlink and relink are deliberate and reversible.
3. The original transaction remains unchanged and appears only once in Transactions.
4. A non-property loan continues to require no Property.
5. The Property activity view uses neutral record-keeping wording and shows no tax conclusion or statistic.
6. Archived/deleted/cross-user records cannot be linked.
7. No exact address, narration, account reference, filename or raw source detail is requested or shown.
8. Phone-sized link and activity flows remain usable.

User-facing PRs require green Vercel Previews. Signed-in mutation checks should use synthetic data in the client's protected session.

## Stop conditions requiring client approval

Stop and request approval if:

- the transaction-to-Property cardinality or allocation rules are ambiguous;
- any schema design differs from the approved PR 3C.0 contract;
- any migration is destructive or could rewrite existing Phase 3A/3B data;
- any Preview migration is ready to run;
- any Production migration is proposed;
- a durable field could contain an exact address, narration, source text, filename or private identifier;
- linking would change a transaction or create another cashflow record;
- tax classification, deductibility, EOFY/report calculations or advice is requested;
- property/Home statistics or dashboard work appears;
- automatic matching/linking, transaction allocation or split logic is needed;
- a new package, provider, paid service, secret or environment change is proposed;
- Phase 4 or any later module enters scope.

## Approval boundary

This document is proposal-only. Do not create PR 3C.0 or begin implementation until the client explicitly approves the objective, PR sequence, scope, migration gates and stop conditions.
