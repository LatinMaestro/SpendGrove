# Phase C1 Saved View Schema and Migration Assessment

Prepared: 26 July 2026  
Status: exact repository assessment; additive schema is recommended but not authorised for implementation by this document  
Master-plan alignment: Phase C1.1  
Related contract: `PHASE_C1_TRANSACTION_SAVED_VIEWS_AND_AUDIT_CONTRACT.md`

## 1. Assessment conclusion

### Transaction saved views

A durable cross-device saved-view workflow requires a new owner-scoped additive model.

The following alternatives are rejected:

- **browser-local storage only** — fails cross-device web/native parity, export/deletion and owner-reference requirements;
- **unbounded JSON inside `UserSettings.featureFlags`** — weak validation, unclear reference integrity, difficult query/update semantics and contrary to the existing Phase 6 assessment;
- **AuditEvent metadata** — audit is privacy-minimized evidence, not mutable preference storage;
- **BankImportProfile or other existing preference model** — wrong lifecycle and domain purpose;
- **cached transaction-result storage** — duplicates financial data and creates stale/privacy risk.

### Activity history

The first privacy-safe user-facing activity-history workflow does **not** require a new schema or migration. The existing `AuditEvent` table and indexes are sufficient for bounded owner-scoped reads, provided an allowlisted mapper prevents raw metadata exposure.

The activity mapper must be presentation-only. It must not extend audit metadata, create a second audit table or store financial snapshots.

## 2. Current schema evidence

Current relevant models:

- `User` — direct account owner;
- `UserSettings` — one row per user with bounded account preferences and a generic feature-flag JSON field;
- `Transaction` — existing owner-scoped ledger and filterable fields;
- `Category` — owner-scoped category lifecycle;
- `Property` and `PropertyTransactionLink` — owner-scoped Property context;
- `AuditEvent` — owner-scoped event evidence with safe optional JSON metadata.

Current `AuditEvent` indexes support:

- recent account history through `[userId, createdAt]`; and
- entity history through `[userId, entityType, entityId]`.

No current model represents a reusable named set of transaction filters.

## 3. Proposed additive model

The future exact schema PR should use a model equivalent to:

```prisma
enum TransactionSavedViewDateMode {
  CURRENT_MONTH
  FIXED_MONTH
}

enum TransactionSavedViewPropertyFilter {
  ALL
  NONE
  SPECIFIC
}

enum TransactionSavedViewRecordState {
  CURRENT
  ACTIVE_ONLY
  NEEDS_REVIEW_ONLY
  DELETED_ONLY
}

enum TransactionSavedViewReviewFilter {
  ALL
  NEEDS_REVIEW
  CSV_MATCH
  DIRECTION_CORRECTION
}

enum TransactionSavedViewSort {
  DATE_DESC
  DATE_ASC
  AMOUNT_DESC
  AMOUNT_ASC
}

model TransactionSavedView {
  id             String                             @id @default(cuid())
  userId         String
  name           String
  normalizedName String
  isDefault      Boolean                            @default(false)
  dateMode       TransactionSavedViewDateMode       @default(CURRENT_MONTH)
  fixedMonth     String?
  direction      TransactionType?
  categoryId     String?
  propertyFilter TransactionSavedViewPropertyFilter @default(ALL)
  propertyId     String?
  source         TransactionSource?
  recordState    TransactionSavedViewRecordState    @default(CURRENT)
  reviewFilter   TransactionSavedViewReviewFilter   @default(ALL)
  sort           TransactionSavedViewSort           @default(DATE_DESC)
  pageSize       Int                                @default(50)
  createdAt      DateTime                           @default(now())
  updatedAt      DateTime                           @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category? @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  property Property? @relation(fields: [propertyId], references: [id], onDelete: Restrict)

  @@unique([userId, normalizedName])
  @@index([userId, isDefault])
  @@index([userId, updatedAt])
  @@index([categoryId])
  @@index([propertyId])
}
```

The exact names remain subject to Prisma formatting and generated-SQL review. No schema text or migration SQL is added by this assessment.

## 4. Required relation additions

The exact schema PR would also add relations equivalent to:

```prisma
model User {
  // existing fields
  transactionSavedViews TransactionSavedView[]
}

model Category {
  // existing fields
  transactionSavedViews TransactionSavedView[]
}

model Property {
  // existing fields
  transactionSavedViews TransactionSavedView[]
}
```

No relation to `Transaction` is required because a saved view stores no selected result rows.

No relation to Household or Accountant models is permitted in the initial implementation.

## 5. Field-by-field rationale

### `userId`

Direct ownership is mandatory. Every query begins with authenticated user ownership rather than inferring ownership through another record.

### `name` and `normalizedName`

Store the safe user-facing name and a deterministic comparison value. This provides case/whitespace-insensitive uniqueness without relying on database collation assumptions.

Normalization should:

- trim leading/trailing whitespace;
- collapse internal whitespace;
- use `toLocaleLowerCase("en-AU")` or an equivalent stable server rule;
- reject detected private bank identifiers;
- enforce 1–60 characters on the display value;
- enforce a bounded normalized length.

### `isDefault`

This supports an explicit default view. The database does not provide a portable Prisma partial unique index for one default per user. The service must therefore clear the previous default and set the new default within one serializable transaction.

A focused SQL partial unique index should not be introduced unless generated-SQL and cross-environment support are separately justified. The initial contract relies on the transactional service invariant plus tests.

### `dateMode` and `fixedMonth`

The first version supports only dynamic current month and one fixed Australian calendar month. `fixedMonth` is a bounded `YYYY-MM` string because it represents a month key rather than an instant.

Service invariants:

- `CURRENT_MONTH` requires `fixedMonth = null`;
- `FIXED_MONTH` requires a valid `YYYY-MM`;
- month parsing uses explicit Australian/Brisbane calendar semantics;
- no open-ended arbitrary date range is persisted initially.

### `direction`

Nullable existing `TransactionType` means all directions. This reuses accepted financial direction terminology without adding a duplicate enum.

### `categoryId`

Nullable means all Categories. A non-null value must be an owned Category. `onDelete: Restrict` avoids a database deletion silently converting the view to all Categories.

Archived or soft-deleted Categories retain their relation and can be shown as a repair state.

### `propertyFilter` and `propertyId`

A separate enum distinguishes:

- all Properties;
- no Property link; and
- one specific owned Property.

Nullable `propertyId` alone cannot distinguish “all” from “unlinked only”.

Service invariants:

- `SPECIFIC` requires an owned `propertyId`;
- `ALL` and `NONE` require `propertyId = null`;
- `onDelete: Restrict` prevents silent broadening.

### `source`

Nullable existing `TransactionSource` means all sources. No import batch, bank profile, bank name or filename is stored.

### `recordState`

A dedicated enum is required because the built-in current ledger includes current active and needs-review records. A nullable `TransactionStatus` cannot represent that combined state safely.

Definitions:

- `CURRENT` — existing non-deleted ledger semantics;
- `ACTIVE_ONLY` — status active;
- `NEEDS_REVIEW_ONLY` — status needs review;
- `DELETED_ONLY` — recoverable deleted records under the approved lifecycle.

### `reviewFilter`

This stores only safe derived states. It does not store an error message or private reason text.

- `NEEDS_REVIEW` derives from current status;
- `CSV_MATCH` derives from the accepted hint field;
- `DIRECTION_CORRECTION` derives from the shared sign/type invariant;
- `ALL` applies no additional review filter.

### `sort`

Only four stable sort choices are included initially. Every query also applies a deterministic secondary ordering to avoid duplicate/missing rows during pagination.

### `pageSize`

The service accepts only 25, 50 or 100. Database check constraints should not be hand-written outside the generated migration unless the repository’s migration process explicitly verifies them. The service and tests enforce the allowlist.

### timestamps

`updatedAt` supports optimistic concurrency and audit-friendly recency. No numeric version field is required for this small preference model initially.

## 6. Data classification

Saved-view definitions are account preference data with financial-context references. They are lower sensitivity than transaction rows but still private because Category and Property choices may reveal personal context.

They must be treated as:

- owner-scoped;
- excluded from analytics payloads;
- excluded from public/client screenshots unless synthetic;
- included in account export/deletion;
- unavailable to household/accountant access by default;
- prohibited from logs beyond safe counts and error codes.

## 7. Schema invariants enforced by service

Prisma alone cannot express every cross-field rule. The service must enforce:

1. maximum 12 views per user;
2. one default view per user;
3. normalized name uniqueness;
4. fixed-month/date-mode compatibility;
5. property filter/property ID compatibility;
6. owned active/archived Category reference validation;
7. owned active/archived Property reference validation;
8. page-size allowlist;
9. safe enum-only filter input;
10. no search text or arbitrary JSON;
11. optimistic `updatedAt` match for update/delete/default actions;
12. neutral not-found response for cross-owner IDs.

## 8. Referential-deletion treatment

### Normal Category/Property lifecycle

SpendGrove currently favours archive/soft-delete lifecycles. The relation remains available so the view can show an archived or repair state.

### Hard deletion

`Restrict` is recommended for Category and Property references because `SetNull` would silently change a filtered view into an unfiltered view.

Before an authorised hard deletion of a referenced Category or Property, a future lifecycle service must either:

- delete the affected saved views after explicit user confirmation; or
- require the user to repair them.

### Account deletion

The account-deletion service must delete `TransactionSavedView` rows before deleting Category and Property records. The direct `userId` cascade remains a final safeguard, not the only ordering mechanism.

## 9. Migration ordering

The saved-view migration must be additive and ordered after all migrations currently present in the repository, including the six Phase 6–11 foundations.

The exact timestamp/name should be generated only when the implementation PR begins. A descriptive candidate is:

`phase_c1_transaction_saved_views`

Do not reuse, edit or reorder an existing migration.

## 10. Expected generated migration responsibilities

The future generated SQL should contain only:

- creation of the five new enum types;
- creation of the `TransactionSavedView` table;
- primary key;
- foreign keys to User, Category and Property with reviewed deletion actions;
- unique `(userId, normalizedName)` constraint;
- bounded indexes listed above.

It must not:

- change Transaction, Category or Property financial fields;
- rewrite or backfill existing rows;
- create a default saved view for existing users;
- copy browser-local filters;
- inspect Production rows;
- alter AuditEvent metadata;
- create triggers, functions or manual SQL outside repository conventions;
- create a stored query/result cache.

## 11. Existing-data and backfill decision

No backfill is required.

After activation:

- every user continues with the built-in current-month view;
- no database row is created until the user explicitly saves a view;
- existing transient filters remain transient;
- browser-local settings are not imported, migrated or deleted;
- native/web clients receive the same empty durable-view list until the user creates one.

## 12. Preview migration gate

Before running a Preview migration, the exact schema PR must include:

- formatted Prisma schema;
- generated SQL;
- additive-only diff review;
- expected enums, table, columns, constraints, indexes and foreign keys;
- migration-file identity pinning consistent with repository controls;
- isolated Preview database identity proof;
- preflight confirming the expected repository migration tail;
- postflight confirming exact objects with safe counts only;
- no reset, resolve, manual SQL or automatic retry;
- runtime gate remaining false.

The current Preview migration workflow must not be rerun for prior migrations merely to add this one. A later workflow profile must recognise the already healthy history and apply only the exact new pending migration under a separately approved gate.

## 13. Runtime activation sequence

Recommended states:

1. schema and migration merged; runtime hard-false;
2. exact migration applied to isolated Preview through the approved workflow;
3. service/export/deletion implementation merged behind fail-closed runtime;
4. verified Preview-only activation and synthetic QA;
5. separate Production mapping, backup and migration proposal;
6. explicit Production migration approval and execution;
7. focused Production runtime activation.

Production must not query the table before the Production migration is verified.

## 14. Account export changes

The future export should add a safe `transactionSavedViews` collection.

Permitted fields:

- ID;
- display name;
- date/filter/sort enums;
- fixed month;
- owned Category/Property references and safe labels;
- default flag;
- timestamps.

Exclude `normalizedName` unless a portability reason is documented. Never export cached results because none are stored.

## 15. Account deletion changes

The future deletion sequence must:

1. count/delete saved views for the authenticated user;
2. do so before Category and Property hard deletion;
3. include a safe aggregate result count;
4. never delete referenced Transactions, Categories or Properties as a side effect of deleting a view;
5. preserve another user’s records;
6. include failure/retry treatment under the existing account-deletion contract.

## 16. Audit treatment for saved-view mutations

No new `AuditEntityType` is required initially.

Saved-view create/update/default/delete actions may use the existing `SETTINGS` entity type with:

- `entityId` set to the saved-view ID where permitted;
- existing `CREATED`, `UPDATED` or `DELETED` action;
- allowlisted `reasonCode` only;
- no view name, filter definition, Category/Property ID, search text or financial value in metadata.

Candidate safe reason codes:

- `TRANSACTION_SAVED_VIEW_CREATED`;
- `TRANSACTION_SAVED_VIEW_UPDATED`;
- `TRANSACTION_SAVED_VIEW_DEFAULT_CHANGED`;
- `TRANSACTION_SAVED_VIEW_DELETED`.

This avoids an audit enum migration solely for preference records. If later audit requirements justify a dedicated entity type, that requires its own exact review.

## 17. Activity-history schema decision

No schema change.

Use existing AuditEvent fields and indexes. The implementation should introduce:

- a server-only allowlisted event mapper;
- an owner-scoped read service;
- bounded API responses;
- purpose-limited view types;
- UI components.

Do not add:

- `beforeJson`/`afterJson` columns;
- transaction snapshots;
- raw metadata copies;
- new audit tables;
- provider logging;
- a generic metadata browser.

## 18. Activity-history query assessment

### Account list

Existing `[userId, createdAt]` index supports recent account events.

### Transaction detail

Existing `[userId, entityType, entityId]` index supports direct Transaction events.

Some feature operations are recorded at their own entity type, such as BulkOperation or TransferLink. Initial activity history should display only events it can map accurately. It must not infer transaction-level causation from unrelated aggregate rows.

A later service may join through owner-scoped operation/item/link tables where the relation is exact and already authorised. This requires no audit schema change but must be bounded and tested.

## 19. Security and privacy assessment

Primary threats:

- arbitrary query/predicate injection;
- cross-user reference IDs;
- a deleted reference silently broadening results;
- search text or narration persisted as a preference;
- raw audit metadata sent to clients;
- before/after financial snapshots retained indefinitely;
- saved views automatically shared with household/accountant users;
- native clients implementing divergent filter semantics.

Controls:

- strict Zod discriminated/enum schemas;
- direct user ownership;
- owned Category/Property resolution;
- `Restrict` relation deletion;
- fail-closed repair states;
- no free-text persistence;
- server-only query translation;
- allowlisted audit mapper;
- bounded pagination;
- export/deletion coverage;
- shared API contracts and parity fixtures.

## 20. Financial assessment

No financial calculation or record mutation is required.

The implementation must not change:

- transaction amount/type/date/category semantics;
- transfer exclusion;
- split counting;
- budget/report formulas;
- duplicate scoring;
- import merge behaviour;
- Property tax grouping;
- Loan reconciliation.

A saved view may select records but cannot alter totals. Any summary shown for a filtered view must reuse existing accepted calculation services and clearly identify the filter scope.

## 21. Package, provider and environment assessment

No package, provider, secret or new environment variable is required.

Use existing:

- Prisma;
- Zod;
- Next.js routes/actions;
- React components;
- current design system;
- existing Vercel/Neon/Clerk boundaries.

The future native client uses the same API contract and requires no direct database access.

## 22. Verification requirements for the exact schema PR

- `prisma format`;
- `prisma validate`;
- generated client;
- exact generated SQL review;
- focused schema structure tests;
- migration-integrity profile tests;
- TypeScript;
- lint;
- complete automated tests;
- optimized build;
- Vercel Preview build without runtime activation;
- account export/deletion compile-time assertions;
- Production dependency audit.

## 23. Decision

Repository conclusion:

- cross-device saved views require a separate owner-scoped additive model;
- no view result, search text or arbitrary predicate is stored;
- Category/Property references fail closed rather than broadening;
- no existing data is migrated or backfilled;
- activity-history UI reuses AuditEvent through a server-only allowlisted mapper and needs no schema change;
- no schema, migration, database action or runtime activation is authorised by this assessment.

The next schema PR must not begin until the material schema/migration gate is explicitly satisfied under repository governance.
