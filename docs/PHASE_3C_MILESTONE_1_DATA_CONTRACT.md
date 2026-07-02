# Phase 3C Milestone 1 Property-Linking Data Contract

Status: approved by the client on 2 July 2026 through the authorised PR 3C.0 contract slice

## Purpose

This contract controls Phase 3C Milestone 1. It allows one eligible everyday transaction to carry one optional, user-controlled Property link for neutral property record keeping. The link is supporting metadata only. It does not create another transaction, alter cashflow treatment or imply any tax outcome.

## Cardinality and allocation

- One Property may have many linked transactions.
- One transaction may have at most one durable Property link record and at most one active Property relationship.
- The transaction link record is unique by `transactionId`.
- A user must explicitly unlink before relinking the transaction to a different Property.
- Relinking reuses the transaction's single link record; it does not create parallel active or historical allocation rows.
- A normal transaction or an existing split child may be linked. A split parent is never eligible because it is a display container excluded from totals.
- Phase 3C does not create, edit or allocate transaction splits. A normal transaction that needs allocation across multiple Properties is unsupported and requires a separately approved design.

## Eligible records

Creating or relinking requires all of the following at the server write boundary:

- an authenticated active user;
- a transaction owned by that user;
- `Transaction.status = ACTIVE`;
- `Transaction.deletedAt` is null;
- `Transaction.splitRole` is `NONE` or `CHILD`, never `PARENT`;
- a Property owned by that user;
- `Property.isArchived = false`;
- `Property.deletedAt` is null.

Transaction type, source and category do not change eligibility. Income, expense and transfer records remain whatever they already are; the link must not reinterpret their cashflow treatment.

Every read and write must scope the link, transaction and Property to the authenticated user. Generated foreign-key IDs do not replace application ownership checks.

## Link lifecycle

- **Link:** the user chooses an eligible transaction and active Property, confirms the action and creates or activates the transaction's single link record.
- **Unlink:** the user explicitly confirms removal. The link record remains durable with `unlinkedAt` set; no transaction or Property field changes.
- **Relink:** an unlinked record may be pointed to another active owned Property and reactivated by clearing `unlinkedAt`. Directly changing an active link to another Property is forbidden; unlink must happen first.
- Repeating the already-current requested state must be idempotent and must not create another link record.
- No automatic Property link, unlink, relink, merge or allocation is permitted. The separately approved automatic high-confidence loan repayment reconciliation amendment never creates a `PropertyTransactionLink`.

Link and relink require active eligible records. Unlink remains available for an owned existing link if its Property was later archived or its transaction later became inactive/deleted, solely so the user can detach metadata safely. The server must still verify ownership and current state and must not restore or alter either record.

Property archive/delete and transaction archive/delete flows must not silently unlink or delete a link. Activity reads exclude unlinked links and transactions that are no longer active or have been deleted. Historical link rows remain metadata and never enter totals.

## Minimum durable fields

The single link record may persist only:

- generated link ID;
- authenticated `userId`;
- `transactionId`;
- `propertyId`;
- nullable `unlinkedAt` lifecycle timestamp;
- created and updated timestamps.

No amount, date, merchant, category, description, narration, filename, source text, tax classification, percentage, address or copied transaction/Property snapshot is stored on the link.

## Transaction and no-double-count invariants

Link, unlink and relink must never change:

- transaction date;
- amount in integer cents;
- merchant or description;
- category;
- transaction type or source;
- status or split structure;
- import lineage;
- spending, income, transfer or cashflow treatment.

The everyday transaction remains the only cashflow record. Property activity views query the existing transaction through its active link and do not create a Property transaction copy. Loan repayment breakdowns remain separate analytical records under the accepted Phase 3B no-double-count rules.

## Audit contract

Link, unlink and relink use the existing `TRANSACTION` / `UPDATED` audit shape with the transaction ID as `entityId`. No new audit enum is required.

Audit metadata may contain only:

- `propertyLinkState`: `LINKED`, `UNLINKED` or `RELINKED`;
- `reasonCode`: `MANUAL_USER_ACTION`.

Audit metadata must not contain Property IDs or nicknames, old/new IDs, transaction values, dates, amounts, merchants, categories, narration, source text, addresses or private identifiers.

## Read and activity-view contract

- The neutral Property activity view is authenticated and owner-scoped.
- It may display the existing transaction's already-authorised safe UI fields by joining through an active link; it must not persist a snapshot.
- Linked Loan Account context is queried separately through the existing optional `LoanAccount.propertyId` relationship.
- Loan Account context must not be presented as a transaction link or another payment.
- Everyday transactions connected through active loan repayment reconciliation may be shown in a separate loan-derived section when the Loan Account belongs to the Property. This is a read-time relationship view only and does not create a Property link or transaction copy.
- Copy must use neutral terms such as `Property record keeping`, `Linked transaction` and `Linked Loan Account`.
- No deductible, tax, EOFY, income, expense, profit, yield, equity, valuation, net-worth or dashboard calculation is permitted.

## Privacy and forbidden fields

Do not persist, log, audit or expose through the link workflow:

- exact Property addresses;
- raw CSV files, bytes, rows, headers or original filenames;
- raw bank narration, loan event text or other source text;
- account identifiers, BSBs, card fragments, customer IDs, loan/lender references or masked references;
- transaction or Property snapshots;
- documents, receipts or attachments;
- tax classifications, deductible flags/percentages or advice;
- secrets or connection strings.

Application errors and logs must use general state/reason codes and generated record IDs only where operationally necessary. Tests and previews use synthetic data.

## Schema and migration boundary

The approved minimal foundation is one new `PropertyTransactionLink` table plus Prisma relations on `User`, `Property` and `Transaction`. No existing column, enum, default, constraint or row is changed. No backfill or data rewrite is allowed.

Required database behavior:

- primary key on generated link ID;
- unique `transactionId` to enforce one link record per transaction;
- indexes for owned Property activity and active/unlinked lookup;
- user deletion cascades to that user's link rows;
- Property and Transaction deletion is restricted while a durable link exists;
- application code enforces matching ownership and active-state rules.

PR 3C.1 must match this contract exactly and include additive SQL, rollback notes and data-integrity checks. Stop if another table, field, enum, relation, allocation model, snapshot, trigger, backfill or destructive alteration is required.

No Preview migration may run until the client explicitly approves the merged PR 3C.1 plan. No Production migration is authorised.
