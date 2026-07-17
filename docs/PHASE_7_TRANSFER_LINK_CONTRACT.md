# Phase 7 Durable Transfer Link Contract and Schema Assessment

Status: exact documentation gate; implementation and migration blocked  
Prepared: 17 July 2026  
Proposed migration: `20260717100000_phase_7_transfer_link_foundation`

## Objective

Let a user confirm that one outgoing transfer and one incoming transfer represent the same movement between their accounts, without creating another cashflow record or changing either transaction.

## Repository truth

- Transactions already support the `TRANSFER` type with signed integer cents.
- Confirmed transfers are excluded from spending and income calculations.
- Import review currently shows a non-durable possible-pair hint only when amounts are exact opposites, dates are within two Australian calendar days and transfer wording remains ambiguous.
- There is no durable transfer-pair model, server action, account export entry or unlink history.
- Category, narration and merchant text are not authoritative for direction.
- Split parents are excluded from counted cashflow; transfer pairing has no accepted split-allocation rule.

## Initial pairing rule

A suggestion may be shown only when all conditions are true:

1. both transactions are active, non-deleted and owned by the authenticated user;
2. both are already confirmed as `TRANSFER`;
3. one amount is strictly negative and the other strictly positive;
4. signed amounts are exact opposites in integer cents;
5. dates differ by no more than two Australian calendar days;
6. neither transaction is a split parent or split child;
7. neither transaction has another active transfer link;
8. exactly one eligible opposite candidate exists.

Narration may support the existing review hint but cannot make a transaction a transfer or make an ambiguous pair durable.

A durable link is created only after explicit user confirmation. Zero or multiple candidates remain unlinked. The initial release has no amount/date mismatch override and no automatic durable link.

## Financial behaviour

- Both existing transactions remain the only cashflow records.
- Linking does not change amount, date, type, category, status, split role, Property link or import history.
- Spending, income, budgets, recurring, Property, Loan and report calculations remain unchanged.
- No synthetic transfer transaction is created.
- No cross-account balance or net-worth conclusion is inferred.
- Unlinking changes only the link lifecycle.

## Ownership and concurrency

Every read and write filters by the authenticated `userId`. Inside one short transaction, the server reloads both records and revalidates all eligibility rules immediately before creating or reactivating a link.

Database foreign keys prove existence, not same-user ownership or sign/type compatibility; those remain mandatory server checks. A unique active-link conflict returns a safe review message and does not retry automatically.

## Split boundary

Split parents and children are excluded from initial durable transfer linking. Allocating one transfer across splits is a separate financial contract. This avoids hidden many-to-many allocation and double counting.

## User experience

- Label: `Possible transfer match`.
- Primary action: `Link transfers`.
- Secondary action: `Not a match` dismisses only the current suggestion in transient review; it creates no durable dismissal record in this milestone.
- Linked transactions show one quiet `Linked transfer` detail.
- `Unlink transfer` remains available in transaction details.
- The counterpart is shown using safe date, direction and amount only; raw narration and account identifiers are not required.

## Exact Prisma additions

Add to `AuditEntityType`:

```prisma
TRANSFER_LINK
```

Add relations:

```prisma
model User {
  transferLinks TransferLink[]
}

model Transaction {
  outgoingTransferLinks TransferLink[] @relation("OutgoingTransferTransaction")
  incomingTransferLinks TransferLink[] @relation("IncomingTransferTransaction")
}
```

Add the model:

```prisma
model TransferLink {
  id                    String    @id @default(cuid())
  userId                String
  outgoingTransactionId String
  incomingTransactionId String
  confirmedAt           DateTime  @default(now())
  unlinkedAt            DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user                User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  outgoingTransaction Transaction @relation("OutgoingTransferTransaction", fields: [outgoingTransactionId], references: [id], onDelete: Restrict)
  incomingTransaction Transaction @relation("IncomingTransferTransaction", fields: [incomingTransactionId], references: [id], onDelete: Restrict)

  @@index([userId, unlinkedAt, createdAt])
  @@index([userId, outgoingTransactionId, unlinkedAt])
  @@index([userId, incomingTransactionId, unlinkedAt])
}
```

Partial unique indexes are required in SQL because Prisma cannot express the active-only uniqueness predicate:

```sql
CREATE UNIQUE INDEX "TransferLink_outgoingTransactionId_active_key"
ON "TransferLink"("outgoingTransactionId")
WHERE "unlinkedAt" IS NULL;

CREATE UNIQUE INDEX "TransferLink_incomingTransactionId_active_key"
ON "TransferLink"("incomingTransactionId")
WHERE "unlinkedAt" IS NULL;

ALTER TABLE "TransferLink"
ADD CONSTRAINT "TransferLink_distinct_transactions_check"
CHECK ("outgoingTransactionId" <> "incomingTransactionId");
```

## Migration SQL assessment

The exact future migration must:

1. add `TRANSFER_LINK` to `AuditEntityType`;
2. create the empty `TransferLink` table;
3. create the three Prisma indexes and two active-only unique indexes;
4. add the distinct-transaction check;
5. add FKs to `User` with cascade and both `Transaction` roles with restrict.

It must not alter, rewrite, backfill, classify or link any existing transaction. New tables must contain zero rows after migration. The enum addition requires a short catalogue lock; no high-volume table rewrite is proposed.

## Privacy and audit

Persist only owned record IDs and lifecycle timestamps. Do not persist or log descriptions, merchant text, amounts, balances, filenames, account references, BSBs, card/customer identifiers or matching evidence.

Audit metadata may contain only a safe reason code (`USER_CONFIRMED` or `USER_UNLINKED`) and no transaction values.

## Export and deletion

Account export includes transfer link ID, the two transaction IDs, confirmation timestamp and unlink timestamp. Account deletion must prove the user cascade removes links without a restriction failure. Normal transaction deletion remains soft; an active link must be unlinked before a hard record deletion path could ever be considered.

## Tests required after the schema gate

- exact opposite amounts and two-day boundary;
- same-day and cross-month Australian dates;
- zero/multiple candidate ambiguity;
- confirmed-transfer requirement;
- positive/negative role enforcement;
- owner isolation and direct-ID attacks;
- active/deleted and stale records;
- split parent/child exclusion;
- one active link per transaction under concurrency;
- explicit confirmation and unlink;
- no new transaction or calculation change;
- export/deletion coverage;
- safe audit metadata.

## Preview and Production gates

No schema or migration file is authorised by this document while the isolated Preview Neon destination is unresolved. After that operator gate is proven:

1. create one focused schema/migration-file PR;
2. update the migration-aware checker for this exact profile;
3. stop before migration;
4. run Preview only after exact-head verification and safe Preview mapping;
5. require a separate Production migration gate with migration history and recovery proof.

## Rollback and forward-fix

In an isolated unused Preview database, rollback may drop `TransferLink` and its indexes before use. Removing a PostgreSQL enum value is not a safe live rollback; prefer forward-fix. No rollback SQL or Production operation is authorised now.

## Packages and providers

None.

## Stop conditions

Stop before changing the two-day/exact-amount rule, supporting split allocation, auto-creating durable links, using narration as authority, changing transfer calculations, adding persistent dismissals, migrating a database, or accessing private Production data.
