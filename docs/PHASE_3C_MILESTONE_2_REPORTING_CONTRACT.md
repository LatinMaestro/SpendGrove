# Phase 3C Milestone 2 Reporting and Financial-Rules Contract

Status: approved implementation contract for PR 3C.5

Date: 3 July 2026

## Purpose and boundary

This contract controls Phase 3C Milestone 2. It permits user-controlled Property record review, explicitly approved neutral summaries and a privacy-safe export foundation for Australian financial-year preparation.

SpendGrove is not a tax agent and does not provide tax advice. Nothing in this milestone determines deductibility, taxable income, capital treatment, ownership percentage, apportionment, tax liability or an ATO outcome. Users remain responsible for reviewing records and obtaining professional advice where needed.

The original everyday transaction remains the sole cashflow record. Reporting reads existing owned records and minimum safe user review metadata; it never creates, copies or changes a transaction.

## Client-approved linked-record simplification amendment - 4 July 2026

This amendment supersedes earlier contract clauses that required a `PropertyReportReview` classification before summary or export inclusion.

- Every currently eligible Property-linked everyday transaction is included automatically after the ownership, active-state, financial-year, relationship-resolution, split and ambiguity checks below pass.
- No report-only classification, suggestion confirmation or `PropertyReportReview` write is required in the normal user workflow.
- Summaries use only safe current transaction type/sign and relationship provenance.
- Exports include every eligible current linked record and omit `record_classification`.
- Existing `PropertyReportReview` rows and the Preview-only table remain dormant. They are not dropped, deleted, backfilled, rewritten or used to gate output.
- This amendment changes no schema, migration, transaction, Property link or cashflow record.
- All no-tax-advice, privacy, ownership, no-double-count and forbidden-calculation boundaries remain in force.

## Australian financial-year boundaries

- A financial year starts on 1 July and ends on 30 June of the following calendar year.
- Queries use a start-inclusive, end-exclusive range: 1 July at the start of the stored transaction calendar day through, but not including, the next 1 July.
- The label uses the ending year, for example `2025-26` for 1 July 2025 through 30 June 2026.
- The existing transaction `date` is treated as an Australian calendar date. Reporting must not shift a transaction into another day through browser, server or database timezone conversion.
- The financial year is derived at read/export time and is not copied into reporting metadata.
- Dates outside the selected financial year are excluded even when their link or review metadata was created during that year.

## Eligible Property reporting records

A reporting record is one existing everyday transaction resolved to one Property. It is eligible only when all of these conditions pass at read and write time:

- the user is authenticated and active;
- the transaction, Property and every relationship used belong to that user;
- the transaction has `status = ACTIVE`, `deletedAt = null`, a non-zero integer-cent amount and `splitRole = NONE` or `CHILD`;
- the Property has `deletedAt = null`;
- at least one current relationship path resolves the transaction to that Property under the rules below;
- the transaction date falls inside the selected Australian financial year.

An archived but non-deleted Property may be reviewed for historical record keeping and must carry a clear `Archived` label. Archiving does not create, restore or alter a transaction link. Deleted Properties are excluded.

Eligible records appear in the current report, summary and export without a separate report-only classification choice.

## Relationship precedence and provenance

### Manual Property links

- A current manual relationship requires an owned `PropertyTransactionLink` with `unlinkedAt = null`.
- The manual Property link is authoritative for reporting Property resolution.
- A current manual link is sufficient for neutral record-keeping inclusion after all other eligibility checks pass; it implies no tax treatment.
- If loan reconciliation also resolves the same transaction to the same Property, the record appears once with provenance `BOTH`.
- If loan reconciliation resolves it to another Property, reporting keeps the manual Property only and shows a neutral relationship-conflict warning. It must not copy or allocate the transaction to the other Property.

### Loan repayment reconciliation-derived records

A loan-derived relationship exists only through current owned records:

- an active `LoanReconciliationLink` with `unlinkedAt = null`;
- a non-deleted, non-archived `LoanRepayment`;
- a non-deleted Loan Account linked to a non-deleted Property;
- the same active, non-deleted everyday transaction.

Archived but non-deleted Loan Accounts may provide historical context. Their records must be labelled as archived context and must not become new cashflow.

When no manual Property link exists:

- if every current eligible loan-derived path resolves to exactly one Property, the transaction appears once for that Property;
- if current paths resolve to zero Properties, it is not a Property reporting record;
- if current paths resolve to more than one Property, it is ambiguous and remains excluded from Property summaries and exports;
- the user may resolve the reporting Property only through the existing deliberate manual Property-link flow; reporting must not allocate, split or automatically link it.

Loan repayment principal, interest, fee and balance values remain analytical breakdown fields. Phase 3C Milestone 2 may show those reviewed values as source context, but it does not aggregate or export them and never treats any component as deductible.

### Deduplication

- A transaction appears at most once for one Property report.
- Manual and loan-derived paths to the same Property are provenance, not separate report rows.
- One transaction may not be included in more than one Property summary or export.
- A cross-Property ambiguity is excluded rather than duplicated or proportionally allocated.

## Split transactions

- A split parent is always excluded because it is a display container and not a cashflow record.
- Each active, non-deleted split child may be reviewed independently when it has an eligible Property relationship.
- The child's own integer-cent amount, date, type and category are used.
- The parent amount must not also appear in any count, summary or export.
- Reporting does not create, edit, rebalance or allocate splits.

## Transfers

- A `TRANSFER` transaction appears as context when it has an eligible Property relationship.
- Transfers are excluded from all approved summary totals.
- It appears in the export with its original signed amount and transaction type so the user can recognise account movement context.
- Reporting never infers whether a transfer is income, an expense, a loan payment or an internal account movement.

## Refunds and reversals

- SpendGrove does not automatically pair a refund or reversal with an earlier transaction.
- Reporting does not infer or persist a refund/reversal label. Positive linked `INCOME` transactions appear in the simple money-in group and are never automatically paired or netted.
- Sign-inconsistent or otherwise unclear records remain visible as linked records but contribute only to a summary group when their current type/sign matches that group's rule.
- Reporting does not change the original transaction type, amount, category or date.

## Archived, deleted and inactive records

- Transactions with `status != ACTIVE` or `deletedAt != null` are excluded from review, summaries and exports.
- Split parents are excluded regardless of status.
- Archived or deleted loan repayments do not provide a loan-derived reporting path.
- An unlinked loan reconciliation or Property link does not provide a current reporting path.
- A non-deleted archived Property or Loan Account may be shown only as clearly labelled historical context under the ownership rules above.
- Reporting review metadata may remain durable when its source becomes ineligible, but it is dormant and excluded until a current eligible relationship is revalidated.

## Unlink and relink behavior

- Reports are current-state views, not historical relationship snapshots.
- Unlinking the relationship removes the transaction from that Property's current report without deleting the transaction or review metadata.
- Relinking requires current eligibility and relationship revalidation before the transaction appears in the new current-state report.
- Dormant classification metadata never controls or follows report inclusion.
- Reporting does not preserve or display historical Property assignments.

## No report-only classification requirement

The normal Property report/export workflow has no classification controls or report-only save step. Existing classification metadata is dormant and does not include, exclude or regroup a current eligible record. Reporting groups records only from current safe transaction facts and relationship provenance. These groups are neutral record-keeping views, not tax categories or tax conclusions.

## Approved summary calculations

The approved Property-and-financial-year summaries from currently eligible user-owned transactions are:

- **Money in records:** sum positive current `INCOME` transaction amounts.
- **Money out records:** sum the absolute value of negative current `EXPENSE` transaction amounts.
- **Linked loan payment cashflow records:** show the count and gross amount of the negative `EXPENSE` subset connected through an eligible loan-reconciliation path. This is context within money out and is not added as another cashflow total.
- **Record counts:** total linked records and transfer-context count.

All arithmetic uses integer cents and formats AUD only at the presentation/export boundary. The implementation must use database-safe integer aggregation or checked integer addition and must reject unsafe numeric overflow.

The milestone must not calculate or display:

- net Property result, profit or loss;
- income minus outgoings;
- refunds netted against another group;
- deductible or taxable totals;
- ownership or deductible percentages;
- principal, interest or fee aggregates;
- yield, equity, valuation, net worth, forecast, tax liability or refund estimate;
- Home dashboard statistics.

## Export contract

PR 3C.8 may generate one user-initiated CSV for one owned Property and one selected financial year. It is generated from the same revalidated rows as the on-screen report and is not stored by SpendGrove.

The export contains one row per eligible current linked transaction. Approved columns only:

- `record_id` - generated transaction ID for traceability;
- `financial_year` - derived label;
- `property_nickname` - the existing validated user nickname;
- `transaction_date` - Australian date;
- `transaction_type` - `INCOME`, `EXPENSE` or `TRANSFER`;
- `amount_aud` - exact signed amount derived from integer cents;
- `category_label` - existing safe category label, or `Uncategorised`;
- `connection_source` - `MANUAL_PROPERTY_LINK`, `LOAN_RECONCILIATION` or `BOTH`;
- `spendgrove_notice` - `Record keeping only - not tax advice.`

The export does not consult classification metadata. It includes no summary/footer rows, formulas, hidden columns or report snapshots.

Before download, the UI must warn: `SpendGrove provides record-keeping information only, not tax advice. Review your records and speak with a qualified professional if needed.`

Forbidden export fields include merchant or description text, notes, raw narration, filenames, headers, source rows, account/BSB/card/customer/loan/lender references, masked identifiers, exact addresses, balances, import fingerprints, internal audit data, user IDs, email addresses and secrets.

## Amendment and correction behavior

- Reports and exports are calculated from current source records at request time; no report snapshot is persisted.
- Editing a transaction through the existing transaction workflow immediately affects its future report date, amount, type and category.
- Reporting cannot edit the original transaction.
- A source edit affects the next report after current ownership, eligibility, type/sign and relationship revalidation; no report-only review is required.
- Loan repayment correction retains the accepted unlink-before-edit rule. An unlinked repayment provides no loan-derived Property path.
- Existing classification audit history remains untouched and dormant. This simplified workflow creates no new classification audit event.
- There is no immutable report version, filed-return state or historical financial snapshot in this milestone.

## No-double-count invariants

- The everyday transaction is the only cashflow record.
- Loan repayments remain analytical breakdown records and never add spending or income.
- Manual and loan-derived paths to the same Property produce one reporting row.
- One transaction may contribute to at most one Property summary/export.
- Split parents contribute nothing; eligible split children contribute individually.
- Transfer context contributes to no approved financial total.
- Positive income and negative expenses remain separate and are never silently netted.
- Repeating a report or export changes no durable financial data.

## Wording and disclaimers

Approved neutral terms include:

- `Property records`;
- `Financial year`;
- `Money in records`;
- `Money out records`;
- `Linked loan payment cashflow records`;
- `Record keeping only`;
- `Review before export`.

Every summary and export screen must visibly state that SpendGrove provides record-keeping information only and not tax advice. Loan components may be described only as reviewed breakdown values, never as deductible.

Forbidden claims include `tax-ready`, `ATO-ready`, `accountant approved`, `deductible`, `claimable`, `taxable`, `assessable`, `compliant`, `lodgement ready`, `your tax result` or any statement that a value should be claimed or reported in a particular tax-return field.

## Minimum durable reporting metadata

The schema foundation may persist only:

- a generated review ID;
- authenticated `userId`;
- `propertyId`;
- `transactionId`;
- one approved classification code;
- created and updated timestamps.

No amount, date, financial year, category, merchant, description, narration, Property nickname, Loan Account nickname, relationship provenance, source snapshot, report total, export content or disclaimer snapshot may be persisted in reporting metadata.

The exact model, enum, indexes and foreign keys belong to PR 3C.6 and must be additive. No existing row may be backfilled or rewritten.

## Ownership, privacy and security

- Every read, summary and export revalidates the authenticated user's ownership of the Property, transaction and current relationship path.
- Client-supplied user IDs, Property IDs or transaction IDs are never trusted without server validation.
- Cross-user records must not appear in candidates, summaries, counts, exports, logs or errors.
- Raw CSV files, rows, filenames and narration remain outside reporting persistence and logs.
- Errors and audit events use generated IDs plus safe state/reason codes only where operationally necessary.
- Export generation is ephemeral and user initiated; SpendGrove stores no generated file or export history in this milestone.
- Synthetic data only is used in tests, previews, screenshots and PR evidence.

## Forbidden features and fields

This milestone does not authorise tax advice, accountant certification, automatic deductibility, percentages, ATO integration, pre-filled returns, filing workflows, Property profit/yield/equity/valuation/net-worth features, Home dashboard statistics, automatic Property matching, transaction allocation/splitting, documents/receipts/storage, Basiq, AI, payments, household mode, Phase 4 or later modules.

Forbidden durable fields include raw narration, merchant/description snapshots, filenames, headers, raw rows, account identifiers, BSBs, card fragments, customer IDs, loan/lender references, masked references, exact addresses, balances, secrets, connection strings, deductible flags/percentages, tax-return labels and report snapshots.

## Schema and migration gate

PR 3C.6 may add only the exact minimum additive schema required by this contract, its generated migration SQL, schema/privacy tests and `docs/PHASE_3C_MILESTONE_2_PREVIEW_MIGRATION_PLAN.md`.

PR 3C.6 must stop before any Preview migration and present:

- exact Prisma model and enum changes;
- exact SQL operations;
- foreign keys, unique constraints and indexes;
- rollback notes;
- pre/post-migration integrity checks;
- confirmation that existing Phase 3A-3C Milestone 1 data is untouched.

No Preview migration may run without explicit client approval. No Production migration is authorised.

## Accepted limitations

- Current-state reporting has no historical relationship or report snapshots.
- Cross-Property loan allocation is unsupported and excluded when ambiguous.
- Refunds/reversals are not automatically paired or netted.
- Loan principal, interest and fee values may be reviewed as context but are not aggregated or exported.
- There is no report-only classification step; relationship changes affect the next current-state report automatically.
- No exact address, document, receipt, merchant narration or account reference is available in reports/exports.
- Exports are record-keeping CSVs only and do not map to ATO forms or tax-return labels.

## Approval boundary

The client approved this Milestone 2 objective and PR sequence on 3 July 2026. This PR 3C.5 contract freezes the rules above before schema or application work. PR 3C.6 may prepare only the matching additive schema and unexecuted Preview migration plan. Stop at that gate for explicit migration approval. PRs 3C.7-3C.9 remain blocked until the approved Preview migration succeeds.
