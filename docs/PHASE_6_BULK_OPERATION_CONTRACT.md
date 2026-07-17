# Phase 6 Bulk Transaction Operation Contract

Status: schema and implementation gate  
Prepared: 17 July 2026  
Applies to: Phase 6 PR 6.3A onward

## Objective

Allow desktop users to update repeated transaction information safely while preserving ownership, financial direction, split rules, Property cardinality, auditability and recovery.

No bulk operation may exist only as optimistic browser state. Every target is reloaded and authorized by the server.

## Initial supported operations

1. Set category on selected transactions.
2. Apply a category to selected transactions sharing an accepted safe merchant identity.
3. Link selected eligible transactions to one Property.
4. Unlink selected eligible Property transaction links.

Excluded:

- bulk delete;
- amount, date, direction or type changes;
- split creation/edit;
- transfer pairing;
- Loan reconciliation;
- report/tax classification;
- automatic Property replacement;
- import-row staging mutation.

## Selection and request

- maximum 250 opaque transaction IDs per request;
- duplicate IDs are rejected before execution;
- IDs must come from the current authenticated view;
- no description, merchant text, amount, filename or bank identifier is sent as evidence;
- server treats client eligibility counts as untrusted;
- session user is authoritative.

## Per-record eligibility

Every target must be:

- owned by the authenticated user;
- active/non-deleted;
- a leaf transaction: unsplit or split child;
- not a split parent;
- direction/sign compatible;
- current at write time;
- eligible for the exact requested field.

Analytical LoanRepayment rows are not Transaction targets.

## Category operations

The chosen category must be:

- active;
- owned or seeded/available under the existing category contract;
- direction-compatible with each target;
- not used to change transaction type, signed amount or transfer treatment.

Per-record result:

- APPLIED when category changes;
- SKIPPED when already set to the requested category;
- FAILED when stale, missing, unauthorized, incompatible or otherwise unsafe.

Merchant learning is not implicit. “Apply to same merchant” is an explicit operation using the accepted safe MerchantProfile/Alias identity and the selected target scope.

## Merchant scope

Initial scope is selected records only.

The server verifies that each target belongs to the accepted safe merchant identity. Substring matches and raw narration are prohibited.

“All history” is deferred until a separate preview/count and performance contract exists.

## Property operations

Link:

- Property must be active and owned;
- unlinked eligible target may be linked;
- target already linked to the same Property is SKIPPED;
- target linked to another Property is FAILED with ALREADY_LINKED_TO_ANOTHER_PROPERTY;
- no silent replacement.

Unlink:

- active owned link may be marked unlinked through the existing lifecycle;
- no link is SKIPPED;
- another user’s link is not disclosed.

No Property address, tax conclusion, Loan relationship or automatic match is involved.

## Execution and partial failure

- create one owner-scoped operation in RUNNING state;
- process targets in bounded server batches;
- revalidate immediately before each write;
- use a short database transaction per bounded batch or per record, not one unbounded account-wide lock;
- create one item result for every requested unique transaction ID;
- independent successes remain successful if another record fails;
- never retry a failed financial mutation automatically;
- finalize as COMPLETED, PARTIAL or FAILED from item outcomes;
- return safe counts and reason codes only.

## Safe reason codes

Allowed initial codes:

- ALREADY_APPLIED
- ALREADY_LINKED_TO_PROPERTY
- ALREADY_LINKED_TO_ANOTHER_PROPERTY
- CATEGORY_INCOMPATIBLE
- CATEGORY_UNAVAILABLE
- PROPERTY_UNAVAILABLE
- NOT_ACTIVE
- SPLIT_PARENT
- DIRECTION_NEEDS_CORRECTION
- MERCHANT_IDENTITY_MISMATCH
- STALE_RECORD
- NOT_FOUND_OR_NOT_OWNED
- UNEXPECTED_SAFE_FAILURE

No reason code includes a private value.

## Concurrency

For each applied category operation, record:

- Transaction.updatedAt immediately before write;
- Transaction.updatedAt returned by the applied write.

Undo is allowed only when the current field and updatedAt still match the operation’s applied state.

For Property operations, undo additionally checks the current active PropertyTransactionLink state and Property ID.

A subsequent edit, split, delete/restore, link change or other field-changing operation invalidates undo for that item.

## Undo

- user may request undo for 30 minutes after completion;
- expiry is stored as undoExpiresAt;
- undo is explicit and never automatic;
- undo reauthorizes operation and every target;
- only APPLIED items are candidates;
- current state must exactly match the recorded post-state;
- safe prior category/Property reference must remain available and compatible;
- stale items become UNDO_BLOCKED and are not changed;
- independent eligible items may revert;
- operation finalizes REVERTED or PARTIALLY_REVERTED;
- undo itself creates no new Transaction and never changes amount/date/type.

After expiry, users may still correct records through normal transaction workflows.

## Durable operation history

Store only:

- operation/user IDs;
- operation type/status/timestamps;
- safe aggregate counts;
- target category/Property IDs where needed;
- item/transaction IDs;
- safe before/after category or Property IDs;
- pre/applied updatedAt values;
- item status and safe reason code;
- reverted timestamp.

Do not store:

- raw CSV;
- filenames;
- descriptions or narration;
- merchant source text;
- amounts/balances;
- account/BSB/card/customer identifiers;
- notes;
- exact Property addresses;
- broad transaction snapshots.

## Retention, export and deletion

- operation history remains account data until the complete-product retention policy is approved;
- account deletion cascades operations/items;
- account export includes a safe operation summary: type, status, timestamps and counts;
- per-item internal undo references are excluded from normal export unless required for data portability review;
- future retention cleanup must not run before a separate Phase 15 policy.

## Audit events

- add BULK_OPERATION as an AuditEntityType;
- create aggregate CREATED/UPDATED audit events referencing the operation ID;
- metadata may contain operation type, status and counts only;
- item details, transaction values and private source text stay out of AuditEvent.metadata.

## User experience

Before commit:

- show selected count;
- show requested change;
- show known client-side conflicts as advisory only;
- require explicit confirmation.

After commit:

- show applied/skipped/failed counts;
- provide Undo only while operation reports at least one applied, still-eligible item and has not expired;
- allow safe details listing by generic reason/count;
- do not expose database/audit terminology.

No row-selection checkbox appears until at least one supported bulk action is available.

## API boundary

Recommended subordinate account routes:

- POST /api/account/transactions/bulk-operations
- POST /api/account/transactions/bulk-operations/[operationId]/undo
- GET /api/account/transactions/bulk-operations/[operationId]

All routes require authentication, owner lookup, bounded request parsing and safe errors.

## Tests required before UI merge

- cross-user IDs are not disclosed or changed;
- split parents excluded, eligible children allowed;
- positive/negative/transfer category compatibility;
- stale record handling;
- duplicate IDs;
- 250-item boundary;
- partial success;
- category apply/already-applied;
- Property link/same/different/unlink;
- no Property replacement;
- merchant identity scope;
- exact undo;
- expired/stale/partially blocked undo;
- account export/deletion;
- safe audit metadata;
- no amounts/descriptions/private values in journal;
- no financial calculation change.

## Mandatory stops

Stop before:

- implementing beyond the four initial operations;
- changing category compatibility, transfer, split, Property or reconciliation rules;
- bulk deletion;
- “all history” merchant update;
- migration without exact SQL/Preview checks;
- Production migration;
- retention cleanup;
- provider/package/secret/environment change;
- private Production data access.

## Completion criteria

Bulk actions are not complete until schema, Preview migration, server actions, UI, exact-head tests, Vercel evidence where available, account export/deletion coverage and consolidated client tests are all recorded.
