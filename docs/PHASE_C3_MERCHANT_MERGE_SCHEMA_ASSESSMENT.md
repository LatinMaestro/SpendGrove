# Phase C3 Merchant Merge Schema Assessment

Date: 26 July 2026  
Status: material additive schema required; no Prisma or migration change authorised  
Depends on: `PHASE_C3_MERCHANT_MERGE_AND_HISTORY_CONTRACT.md`

## 1. Question

Can reversible merchant-profile merging and merchant history be implemented safely using the current SpendGrove schema and existing bulk-operation journal?

## 2. Conclusion

**No. A material additive schema is required.**

The current schema can safely:

- edit, remove and restore a MerchantProfile;
- reassign aliases and rules through the snapshot persistence service;
- relate Transactions to MerchantProfiles;
- apply a merchant Category to selected Transactions through `APPLY_MERCHANT_CATEGORY`;
- journal Category and Property changes per Transaction.

It cannot safely perform a reversible merchant identity merge because the existing bulk journal records only:

- target Category or target Property;
- before/after Category IDs;
- before/after Property IDs;
- Transaction version timestamps.

It does not record:

- source and destination MerchantProfile IDs at operation level;
- Transaction before/after merchant-profile relationships;
- alias before/after merchant-profile relationships and lifecycle state;
- rule before/after merchant-profile relationships, Category, priority and lifecycle state;
- source-profile lifecycle snapshots;
- an alias created from the source profile name;
- exact versions for all merchant entities;
- item-kind-specific conflicts or undo blocks.

Using the current snapshot save service or direct `updateMany` calls would make partial failure, concurrency and exact-state undo unverifiable. `AuditEvent` also remains unsuitable as an undo journal because it is intentionally aggregate and privacy-filtered.

## 3. Existing schema reviewed

### MerchantProfile

Current relevant fields:

- `id`;
- `userId`;
- `name`;
- `normalizedName`;
- `defaultCategoryId`;
- `isActive`;
- `deletedAt`;
- `createdAt`;
- `updatedAt`;
- aliases, rules and Transactions.

### MerchantAlias

Current relevant fields:

- `id`;
- `userId`;
- `merchantProfileId`;
- `aliasName`;
- `normalizedAlias`;
- `isActive`;
- `deactivatedAt`;
- `deletedAt`;
- `updatedAt`.

### MerchantRule

Current relevant fields:

- `id`;
- `userId`;
- optional `merchantProfileId`;
- optional `categoryId`;
- type and normalized pattern;
- priority;
- active/deactivated/deleted lifecycle;
- `updatedAt`.

### Transaction

Current relevant fields:

- optional `merchantProfileId`;
- owner, status, split and version fields.

### BulkOperation / BulkOperationItem

Current operation types:

- `SET_CATEGORY`;
- `APPLY_MERCHANT_CATEGORY`;
- `LINK_PROPERTY`;
- `UNLINK_PROPERTY`.

The item journal contains no merchant-profile before/after fields and has a required Transaction relation, so it cannot represent source-profile lifecycle, alias or rule changes.

## 4. Approaches considered

### Option A — Reuse AuditEvent

Rejected.

Audit events are purpose-limited safe summaries. They must not contain private entity snapshots, normalized patterns or full before/after state and cannot support item-level optimistic undo.

### Option B — Reuse the existing BulkOperation tables unchanged

Rejected.

The current columns cannot record merchant identity changes or non-Transaction entities. Overloading Category/Property fields would be misleading and unsafe.

### Option C — Extend BulkOperation and use one polymorphic item table

Possible but not recommended.

This would require:

- a new merge operation type;
- source/destination merchant fields;
- nullable Transaction/Alias/Rule relations;
- many nullable before/after fields;
- item-kind discrimination;
- complex database constraints to prove one eligible entity per row.

The resulting item table would be difficult to validate, query and review. It would also widen a currently focused Transaction-operation journal into a multi-entity lifecycle journal.

### Option D — Extend BulkOperation plus separate merchant child tables

Possible but not preferred.

This would preserve one top-level operation table but would make `BulkOperation` responsible for two distinct domains:

- Transaction Category/Property changes; and
- Merchant identity/profile/alias/rule consolidation.

The different preview, conflict, undo and lifecycle semantics would make the service and export meaning less clear.

### Option E — Dedicated MerchantMergeOperation with typed item tables

**Recommended.**

This provides:

- explicit domain meaning;
- strongly typed entity snapshots;
- fewer nullable fields;
- clear ownership/indexes;
- isolated service and migration scope;
- precise deletion order;
- safe exact-state undo;
- no weakening of the existing bulk-operation contract.

The separate apply-to-history action continues to use the existing `BulkOperation` framework.

## 5. Recommended additive enums

Provisional names for schema-review purposes:

```prisma
enum MerchantMergeOperationStatus {
  RUNNING
  COMPLETED
  PARTIAL
  FAILED
  REVERTED
  PARTIALLY_REVERTED
}

enum MerchantMergeItemStatus {
  APPLIED
  SKIPPED
  FAILED
  REVERTED
  UNDO_BLOCKED
}

enum MerchantMergeReason {
  ALREADY_APPLIED
  SOURCE_NAME_ALREADY_REPRESENTED
  SOURCE_NAME_CONFLICT
  ALIAS_CONFLICT
  RULE_EXACT_DUPLICATE
  RULE_CONFLICT
  SOURCE_PROFILE_CHANGED
  TARGET_PROFILE_CHANGED
  RECORD_CHANGED
  NOT_FOUND_OR_NOT_OWNED
  OPERATION_DEPENDENCY
  UNEXPECTED_SAFE_FAILURE
}
```

Add to `AuditEntityType` only when the implementation is approved:

```prisma
MERCHANT_MERGE_OPERATION
```

No new AuditAction is required. `CREATED` may record start and `UPDATED` may record completion or undo.

These names are provisional until the material schema PR is explicitly approved and generated SQL is reviewed.

## 6. Recommended MerchantMergeOperation

Provisional shape:

```prisma
model MerchantMergeOperation {
  id                         String                       @id @default(cuid())
  userId                     String
  sourceMerchantProfileId    String
  targetMerchantProfileId    String
  status                     MerchantMergeOperationStatus @default(RUNNING)
  requestedCount             Int                          @default(0)
  appliedCount               Int                          @default(0)
  skippedCount               Int                          @default(0)
  failedCount                Int                          @default(0)
  undoBlockedCount           Int                          @default(0)
  sourceProfileUpdatedAt     DateTime
  targetProfileUpdatedAt     DateTime
  sourceBeforeIsActive       Boolean
  sourceBeforeDeletedAt      DateTime?
  sourceAppliedUpdatedAt     DateTime?
  targetAppliedUpdatedAt     DateTime?
  createdAt                  DateTime                     @default(now())
  completedAt                DateTime?
  undoExpiresAt              DateTime?
  revertedAt                 DateTime?
  updatedAt                  DateTime                     @updatedAt

  user                       User                         @relation(fields: [userId], references: [id], onDelete: Cascade)
  sourceMerchantProfile      MerchantProfile              @relation("MerchantMergeSource", fields: [sourceMerchantProfileId], references: [id], onDelete: Restrict)
  targetMerchantProfile      MerchantProfile              @relation("MerchantMergeTarget", fields: [targetMerchantProfileId], references: [id], onDelete: Restrict)
  transactionItems           MerchantMergeTransactionItem[]
  aliasItems                 MerchantMergeAliasItem[]
  ruleItems                  MerchantMergeRuleItem[]

  @@index([userId, status, createdAt])
  @@index([userId, sourceMerchantProfileId, createdAt])
  @@index([userId, targetMerchantProfileId, createdAt])
}
```

### Rationale

- Both profiles are explicit operation participants.
- Profile versions used for confirmation are preserved.
- Source lifecycle can be restored exactly.
- Aggregate counts remain safe and bounded.
- `Restrict` prevents a hard profile deletion from silently erasing an operation before dependency-ordered account deletion.
- Account deletion must delete merge operations before hard profile deletion.

### Additional relations

Provisional relation additions:

```prisma
model User {
  merchantMergeOperations MerchantMergeOperation[]
  merchantMergeTransactionItems MerchantMergeTransactionItem[]
  merchantMergeAliasItems MerchantMergeAliasItem[]
  merchantMergeRuleItems MerchantMergeRuleItem[]
}

model MerchantProfile {
  mergeOperationsAsSource MerchantMergeOperation[] @relation("MerchantMergeSource")
  mergeOperationsAsTarget MerchantMergeOperation[] @relation("MerchantMergeTarget")
}
```

## 7. Recommended Transaction item

```prisma
model MerchantMergeTransactionItem {
  id                          String                  @id @default(cuid())
  userId                      String
  operationId                 String
  transactionId               String
  status                      MerchantMergeItemStatus
  reason                      MerchantMergeReason?
  beforeMerchantProfileId     String?
  afterMerchantProfileId      String?
  beforeTransactionUpdatedAt  DateTime
  appliedTransactionUpdatedAt DateTime?
  revertedAt                  DateTime?
  createdAt                   DateTime                @default(now())
  updatedAt                   DateTime                @updatedAt

  user                        User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  operation                   MerchantMergeOperation  @relation(fields: [operationId], references: [id], onDelete: Cascade)
  transaction                 Transaction             @relation(fields: [transactionId], references: [id], onDelete: Restrict)

  @@unique([operationId, transactionId])
  @@index([userId, status, createdAt])
  @@index([transactionId, createdAt])
}
```

### Rules

- `beforeMerchantProfileId` must equal the source profile for an applied merge item.
- `afterMerchantProfileId` must equal the target profile.
- No Transaction financial field is stored in the journal.
- Undo verifies `appliedTransactionUpdatedAt` and current target relation before restoring the source relation.
- Account deletion removes items before Transactions.

## 8. Recommended Alias item

```prisma
model MerchantMergeAliasItem {
  id                     String                  @id @default(cuid())
  userId                 String
  operationId            String
  aliasId                String
  status                 MerchantMergeItemStatus
  reason                 MerchantMergeReason?
  createdByOperation     Boolean                 @default(false)
  beforeMerchantProfileId String?
  afterMerchantProfileId String?
  beforeIsActive         Boolean?
  beforeDeactivatedAt    DateTime?
  beforeDeletedAt        DateTime?
  beforeAliasUpdatedAt   DateTime?
  appliedAliasUpdatedAt  DateTime?
  revertedAt             DateTime?
  createdAt              DateTime                @default(now())
  updatedAt              DateTime                @updatedAt

  user                   User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  operation              MerchantMergeOperation  @relation(fields: [operationId], references: [id], onDelete: Cascade)
  alias                  MerchantAlias           @relation(fields: [aliasId], references: [id], onDelete: Restrict)

  @@unique([operationId, aliasId])
  @@index([userId, status, createdAt])
  @@index([aliasId, createdAt])
}
```

### Rules

- Existing aliases preserve their lifecycle state.
- A source-name redirect alias uses `createdByOperation = true` and has no before relationship/version.
- Undo of a created alias is a recoverable delete only when its applied version and destination relation remain unchanged.
- Alias names and normalized aliases are not duplicated in the merge journal.

## 9. Recommended Rule item

```prisma
model MerchantMergeRuleItem {
  id                       String                  @id @default(cuid())
  userId                   String
  operationId              String
  ruleId                   String
  status                   MerchantMergeItemStatus
  reason                   MerchantMergeReason?
  beforeMerchantProfileId  String?
  afterMerchantProfileId   String?
  beforeCategoryId         String?
  afterCategoryId          String?
  beforePriority           Int
  afterPriority            Int
  beforeIsActive           Boolean
  beforeDeactivatedAt      DateTime?
  beforeDeletedAt          DateTime?
  beforeRuleUpdatedAt      DateTime
  appliedRuleUpdatedAt     DateTime?
  revertedAt               DateTime?
  createdAt                DateTime                @default(now())
  updatedAt                DateTime                @updatedAt

  user                     User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  operation                MerchantMergeOperation  @relation(fields: [operationId], references: [id], onDelete: Cascade)
  rule                     MerchantRule            @relation(fields: [ruleId], references: [id], onDelete: Restrict)

  @@unique([operationId, ruleId])
  @@index([userId, status, createdAt])
  @@index([ruleId, createdAt])
}
```

### Rules

- Rule pattern and normalized pattern are deliberately not copied into the journal.
- Category, priority and lifecycle snapshots are explicit because undo must prove they were not silently changed.
- Initial merge blocks materially conflicting rules before operation creation.
- Exact duplicates may be represented as skipped or as a reversible lifecycle adjustment, according to the final service contract.

## 10. Relation additions for entity items

Provisional additions:

```prisma
model Transaction {
  merchantMergeItems MerchantMergeTransactionItem[]
}

model MerchantAlias {
  merchantMergeItems MerchantMergeAliasItem[]
}

model MerchantRule {
  merchantMergeItems MerchantMergeRuleItem[]
}
```

These relations do not change current ownership or financial meaning.

## 11. Database constraints and service invariants

Prisma cannot express every cross-field invariant. The future service and tests must enforce:

- source and target differ;
- operation, profiles and every item share the same user;
- only one running operation may involve a profile as source or target;
- applied Transaction items move source to target only;
- applied Alias and Rule items move source to target only;
- created alias items belong to the target and are uniquely tied to the operation;
- profile source deactivation happens only after required item work;
- aggregate counts equal item outcomes plus profile lifecycle outcome as defined;
- completed operations have `completedAt` and bounded `undoExpiresAt`;
- reverted statuses correspond to item states;
- no Category change is performed by merchant identity merge.

A future migration may use partial unique indexes to prevent multiple running operations involving the same profile. Because PostgreSQL cannot directly enforce a unique condition across separate source and target columns, the service must still acquire and verify profile-level operation locks or use an approved lock-key strategy.

No lock strategy is selected by this document. The implementation PR must provide a deterministic database-safe approach without introducing an external provider.

## 12. Transaction and locking assessment

The operation may affect more records than a normal profile edit. The future implementation must:

- cap affected entities at an approved bounded total;
- reject or batch very large profiles through a later contract rather than running an unbounded transaction;
- create operation items before each entity mutation;
- use optimistic `updatedAt` conditions;
- process items in stable ID order;
- make retries idempotent by operation/item identity;
- never use a profile-wide unjournalled `updateMany` as the final implementation;
- stop source-profile deactivation if required operation setup fails.

The initial maximum is not fixed here because repository data distribution has not been measured and Production data access is prohibited. A later implementation contract must select a conservative cap using synthetic performance evidence only.

## 13. Existing BulkOperation remains separate

No schema extension is required for **Apply category to past transactions** because the current bulk framework already includes:

- `APPLY_MERCHANT_CATEGORY`;
- explicit merchant-profile match;
- target Category;
- 250-item cap;
- direction and split guards;
- per-Transaction before/after Category state;
- optimistic versions;
- 30-minute exact-state undo.

The future UI may invoke this existing operation only after an independent preview and explicit confirmation.

No relationship should be added between `MerchantMergeOperation` and `BulkOperation` in the first implementation. Their independent operation IDs and Activity records preserve the fact that one action does not automatically undo the other.

## 14. Export and deletion impact

### Export

The new operation and item tables must be added to account export using safe fields only.

Operation export:

- IDs;
- source and target profile IDs;
- status and timestamps;
- aggregate counts.

Item export:

- item ID;
- operation ID;
- entity ID;
- item status and safe reason;
- relationship IDs needed for the user's own operation history;
- timestamps.

Do not export duplicated rule patterns, alias values, transaction descriptions, amounts or financial snapshots inside the operation section.

### Deletion order

A future account deletion path must remove:

1. merchant merge Transaction/Alias/Rule items;
2. merchant merge operations;
3. existing merchant rules and aliases as currently ordered;
4. merchant profiles;
5. Transactions and remaining account data according to the established dependency plan.

The exact order must be reconciled with existing Transaction deletion dependencies during implementation. No provider cleanup is needed.

## 15. Migration assessment

The change is additive but material because it introduces:

- new enums;
- a new AuditEntityType value;
- four new owner-scoped tables;
- several foreign keys and indexes;
- export and deletion dependencies;
- new runtime code that must fail closed before migration.

A future migration PR must include:

- final Prisma definitions;
- generated SQL reviewed line-by-line;
- a migration-integrity verifier profile;
- exact expected enum values, tables, columns, foreign keys and indexes;
- runtime gate defaulting false;
- tests proving Production/non-migrated runtimes do not query new tables;
- no backfill or rewrite of existing merchant/transaction rows;
- no automatic operation creation for existing profiles;
- isolated Preview migration only after explicit approval.

The migration folder name and timestamp are intentionally not fixed until the material schema gate is approved. No migration file should be created merely to reserve a name.

## 16. Preview activation sequence

After explicit material approval:

1. Commit exact schema, SQL, verifier and hard-false runtime gate.
2. Review generated client and lockfile impact; no package change is expected.
3. Run full repository checks without database access.
4. Apply the additive migration to the retained isolated synthetic Preview database only.
5. Verify exact database identity before and after migration.
6. Verify all expected objects and no unexpected objects.
7. Activate only the merchant merge service in a focused Preview PR.
8. Run synthetic ownership, conflict, concurrency, partial-failure, export/deletion and undo QA.
9. Add responsive Settings workflow.
10. Complete integrated authenticated Preview QA.
11. Prepare a separate Production migration proposal and obtain explicit approval.

## 17. Rejected shortcuts

Do not:

- reassign all Transactions with one `updateMany` and only write an aggregate audit event;
- use the source profile's `updatedAt` as proof for child entities;
- store raw before/after snapshots in arbitrary JSON;
- copy rule patterns or merchant narration into operation metadata;
- treat profile inactivity as sufficient merge history;
- make merchant Category application part of merge;
- rely on browser-local state for undo;
- implement undo by guessing current relationships;
- reuse ImportUndo tables;
- add a provider or queue to avoid proper database journalling;
- run any migration before explicit approval.

## 18. Decision required before implementation

The material schema gate must approve or amend:

- dedicated operation and typed-item model approach;
- final enum and model names;
- source/destination foreign-key deletion behaviour;
- maximum affected entity count;
- exact rule-duplicate treatment;
- source-name alias requirement;
- locking strategy for operations involving the same profile;
- undo window;
- export fields and deletion order;
- migration identity and Preview execution plan.

Until that decision is recorded, merchant merge remains contract/schema-assessment only.

## 19. Final recommendation

Use a dedicated `MerchantMergeOperation` with typed Transaction, Alias and Rule item journals. Keep historical Category application in the existing bulk-operation system.

This is the clearest and safest architecture because it:

- preserves financial and domain separation;
- avoids a nullable polymorphic journal;
- supports exact-state partial undo;
- keeps private merchant patterns out of operation metadata;
- provides explicit export/deletion treatment;
- leaves existing bulk operations stable;
- can remain fail closed until its isolated migration and QA are complete.
