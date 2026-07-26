# Phase C3 Merchant Merge and History Contract

Date: 26 July 2026  
Status: product, financial, privacy and reversible-operation contract prepared; implementation and schema remain unapproved  
Master-plan alignment: Phase C3 — Merchant and category completion  
Feature-register alignment: MER-06, MER-07, TX-09, TX-10, TX-11

## 1. Objective

Define a safe, reversible and audit-ready way for a user to consolidate two merchant identities and, separately, apply a merchant category to selected historical transactions.

The workflow must improve merchant organisation without silently changing financial meaning, transaction direction, historical categories, tax treatment, Property links, Loan treatment or report totals.

This contract deliberately separates two user intentions:

1. **Merge merchant identity** — consolidate one owned merchant profile into another while preserving all existing financial values and categories.
2. **Apply category to history** — optionally recategorise explicitly previewed eligible transactions through the existing guarded bulk-operation framework.

These actions must never be combined into one implicit operation.

## 2. Current repository truth

The repository currently provides:

- owner-scoped `MerchantProfile`, `MerchantAlias` and `MerchantRule` records;
- cleaned profile names and normalized keys;
- exact, contains and starts-with deterministic rules;
- user-confirmed category learning;
- profile edit, remove and restore;
- alias and rule enable, disable, restore and recoverable deletion;
- `Transaction.merchantProfileId` for durable merchant identity;
- owner-scoped account export and deletion coverage;
- an existing bulk-operation journal for category and Property changes;
- safe aggregate Activity history.

The existing bulk-operation journal can safely record:

- Category changes;
- apply-merchant-category changes;
- Property link and unlink changes;
- per-transaction versions and exact-state undo.

It cannot safely record a merchant-profile merge because it does not persist:

- source and destination merchant profiles;
- before and after `merchantProfileId` values;
- alias reassignment state;
- rule reassignment state;
- source-profile lifecycle state;
- created redirect aliases;
- exact versions for every merchant entity affected by the merge.

A merchant merge therefore requires a separate material schema gate before implementation.

## 3. User-facing terminology

Use:

- **Merge merchants**;
- **Merchant to merge**;
- **Keep this merchant**;
- **Preview merge**;
- **Merge merchants** for final confirmation;
- **Undo merchant merge** while eligible;
- **Apply category to past transactions** as a separate action.

Do not expose:

- canonical/source/destination database terminology;
- normalized keys;
- internal IDs;
- relation names;
- operation enums;
- migration or journal terminology.

## 4. Identity merge boundary

### 4.1 Source and destination

The user explicitly selects:

- one active or removed owned source profile to merge; and
- one active owned destination profile to keep.

The source and destination must:

- belong to the authenticated user;
- be different records;
- not be hard deleted;
- have complete cleaned profile data;
- not already be involved in another running merchant merge;
- remain unchanged between preview and confirmation.

The destination must be active. A removed source may be merged only after the preview clearly identifies it as removed.

### 4.2 What identity merge changes

A successful identity merge may:

- reassign owned Transactions from the source profile to the destination profile;
- reassign non-deleted source aliases to the destination profile;
- reassign non-deleted source rules to the destination profile where conflict checks pass;
- create one destination alias from the source cleaned merchant name where safe and not already represented;
- mark the source profile inactive after all required merge steps complete;
- retain the source profile as a recoverable operation participant rather than hard deleting it;
- record safe aggregate Activity history.

### 4.3 What identity merge never changes

The merge must not change any Transaction:

- amount in cents;
- signed direction or `TransactionType`;
- source;
- status or deletion state;
- date;
- description, imported sanitized description or notes;
- Category;
- split role or parent/child relation;
- import batch or row relation;
- Property relation;
- Loan reconciliation relation;
- transfer link;
- recurring-instance relation;
- review state or duplicate keys.

The merge must not change any merchant rule's:

- Category;
- type;
- normalized pattern;
- priority;
- active/deactivated/deleted lifecycle state,

except where an explicit conflict resolution approved by this contract is applied and journalled.

### 4.4 Historical record scope

Merchant identity consolidation applies to every owned Transaction directly related to the source profile, including active, needs-review and recoverably deleted records.

This is safe only because the identity merge does not alter any financial value or eligibility rule. Including recoverably deleted records keeps historical identity consistent if a transaction is later restored.

Split parents and children may both retain merchant identity and may therefore be reassigned. The merge must not change their financial counting treatment.

## 5. Preview requirements

Before confirmation, the server must calculate a fresh owner-scoped preview containing only safe aggregate information.

The preview may show:

- source cleaned display name;
- destination cleaned display name;
- number of Transactions whose merchant identity would move;
- counts grouped by active, needs-review and deleted lifecycle state;
- number of aliases that would move;
- number of rules that would move;
- whether the source name can become an alias;
- count and plain-English type of conflicts;
- destination default Category and source default Category as labels only;
- a clear statement that existing transaction Categories will not change;
- a clear statement that report totals and cashflow will not change;
- the undo eligibility window.

The preview must not return:

- transaction descriptions or merchant narration;
- amounts, balances or totals;
- dates or financial-year values;
- filenames or import details;
- bank, account, card, customer or Loan identifiers;
- exact Property details;
- normalized names or patterns;
- raw alias/rule patterns;
- internal entity IDs beyond opaque request identifiers already owned by the user;
- cross-user existence information.

The preview is not a durable reservation. Confirmation must repeat every ownership, conflict and version check.

## 6. Alias handling

### 6.1 Existing source aliases

Each non-deleted source alias may move to the destination when:

- it remains owned by the user;
- it still belongs to the source profile;
- its version is unchanged;
- its normalized alias does not conflict with another owned profile name other than the source;
- its normalized alias does not create an ambiguous destination identity.

Inactive aliases remain inactive after reassignment. Merge must not reactivate them.

### 6.2 Source profile name as alias

The source cleaned display name should become an alias of the destination only when:

- it is not already the destination profile name;
- it is not already an equivalent destination alias;
- it does not conflict with another owned profile or alias;
- it passes the existing private-identifier and merchant-name validation;
- the preview states that the alias will be created.

If this alias cannot be created safely, the preview must identify the conflict. The merge must not silently omit a required redirect alias if doing so would make the identity result misleading.

### 6.3 Alias conflicts

The initial release must fail closed rather than guessing when:

- a normalized source alias matches a third merchant profile;
- a source alias and destination identity would be ambiguous;
- the source name conflicts with another profile or alias;
- an alias changed after preview.

The user must resolve the alias conflict using the existing merchant-management controls before retrying the merge.

## 7. Rule handling

### 7.1 Non-conflicting rules

A source rule may move to the destination when:

- it remains owned and related to the source;
- its version is unchanged;
- the destination has no rule with the same type and normalized pattern; or
- the destination has an exact semantic duplicate with the same Category, priority and lifecycle state.

An exact semantic duplicate does not need to remain active twice. The initial implementation may retain the destination rule and keep the source duplicate inactive, but that decision must be recorded per item and must be undoable.

### 7.2 Material rule conflicts

The merge must stop before confirmation if source and destination contain the same rule identity with different:

- Categories;
- priorities;
- active states; or
- lifecycle states.

The merge UI must direct the user to resolve these rules first. It must not choose one Category or priority automatically.

### 7.3 Direction compatibility

Merchant rules remain suggestions only. After merge:

- transfer precedence still wins;
- direction-incompatible Categories are ignored during suggestion application;
- review-before-commit remains mandatory;
- no existing Transaction is recategorised by the identity merge.

## 8. Source profile lifecycle

After all required entity changes complete successfully:

- source `isActive` becomes false;
- source is not hard deleted;
- source aliases and rules that moved retain their own lifecycle state;
- source remains visible only through merge history and undo while relevant;
- the destination remains active;
- the source default Category is not copied to the destination automatically.

A partial merge must not present the source as fully merged. The operation status and recovery controls must truthfully show partial completion or failure.

## 9. Separate apply-to-history workflow

### 9.1 Purpose

After identity merge, the user may separately choose **Apply category to past transactions** for the destination merchant.

This uses the existing `APPLY_MERCHANT_CATEGORY` bulk-operation meaning and must not be part of merchant identity merge.

### 9.2 Eligibility

The apply-to-history preview may include only explicitly selected owned Transactions that are:

- active and not deleted;
- not split parents;
- direction-consistent;
- related to the confirmed destination merchant profile;
- compatible with the selected active Category;
- unchanged since preview;
- not otherwise excluded by existing bulk-operation safety checks.

The maximum remains 250 Transactions per operation unless a later separately approved contract changes it.

### 9.3 No silent category change

The default Category shown on a merchant profile remains a future suggestion. The user must separately preview and confirm historical recategorisation.

Merchant merge must never trigger `APPLY_MERCHANT_CATEGORY` automatically.

### 9.4 Undo

Apply-to-history continues using the existing 30-minute exact-state bulk undo window and existing per-record stale, split, direction and ownership guards.

Undoing category application does not undo merchant identity merge. Undoing merchant identity merge does not automatically undo a separate Category operation.

The UI must show these as two independent operations.

## 10. Concurrency and exact-state rules

Confirmation must execute through one bounded server operation that:

1. authenticates before persistence access;
2. proves ownership of source and destination;
3. rejects identical profiles;
4. checks that neither profile is hard deleted;
5. checks destination active state;
6. checks source and destination versions from preview;
7. checks for another running operation involving either profile;
8. reloads every affected Transaction, alias and rule owner/version;
9. records the operation and item snapshots before applying changes;
10. applies each item with optimistic version conditions;
11. records per-item outcomes;
12. deactivates source only after required item processing;
13. finalizes safe aggregate counts;
14. writes one safe aggregate audit event.

No unbounded update may run from a profile ID alone. Each affected record must have an operation item and exact-state evidence.

Cross-user or missing IDs return the same neutral unavailable response.

## 11. Undo contract

### 11.1 Window

The initial merchant merge undo window is 30 minutes from successful operation creation, matching the existing guarded bulk-operation recovery posture.

### 11.2 Undo eligibility

Undo may restore an item only when:

- the operation belongs to the authenticated user;
- the window remains open;
- the item was successfully applied;
- the entity still has the exact version and relationship written by the merge;
- no later merge or conflicting operation depends on it;
- source and destination profiles remain eligible;
- account deletion has not begun.

### 11.3 Exact restoration

Undo must restore:

- each Transaction's prior merchant profile;
- each alias's prior merchant profile and lifecycle state;
- each rule's prior merchant profile and lifecycle/category/priority state;
- source active/deleted state;
- destination state only where the operation changed it;
- a source-name alias created by the operation, by recoverably removing it only when unchanged.

Undo must never rewrite amounts, dates, Categories, splits, Properties, Loans, transfers, imports or reports.

### 11.4 Partial undo

If an item changed after merge:

- it remains unchanged;
- the item becomes undo-blocked;
- the operation truthfully reports partial reversal;
- no force overwrite is offered;
- affected records can be corrected through ordinary user workflows.

No manual SQL, reset or silent retry is permitted.

## 12. Activity history

Activity history may show only safe summaries such as:

- `Merchant merge completed for 12 records.`
- `Merchant merge partially completed; 2 records were left unchanged.`
- `Merchant merge undone for 10 records; 2 records were left unchanged.`

It must not expose:

- source or destination normalized keys;
- alias or rule patterns;
- transaction descriptions;
- amounts or balances;
- filenames, account references or provider details;
- raw operation-item metadata.

Detailed operation review remains an authenticated owner-only management surface with bounded safe counts.

## 13. Export, deletion and retention

### 13.1 Account export

Account export must include a versioned safe merchant-merge section containing:

- operation ID;
- source and destination profile IDs already present in the user's export;
- status;
- created/completed/reverted timestamps;
- requested, applied, skipped, failed and undo-blocked counts;
- safe per-kind outcome counts.

It must not duplicate raw alias patterns, rule patterns, merchant narration or transaction content inside operation history.

Existing merchant profile, alias, rule and Transaction export sections remain the source of record detail.

### 13.2 Account deletion

Account deletion must remove merchant-merge operation items before profiles, aliases, rules, Transactions and user deletion where foreign-key order requires it.

Deletion is dependency-ordered and idempotent. There is no provider cleanup because this feature uses PostgreSQL only.

### 13.3 Retention

Recoverable operation history follows the account's approved financial-record retention posture. It is not analytics and must not be copied to external monitoring.

## 14. Security and privacy

The implementation must:

- authenticate before database client/store construction where practical;
- scope every query and mutation by `userId`;
- validate bounded IDs and request shape;
- reject unknown fields;
- use transaction and item caps;
- avoid raw source narration in logs, errors, audit and operation metadata;
- avoid amounts, balances, filenames and banking identifiers;
- use neutral cross-user errors;
- rate-limit preview and confirmation endpoints under the future approved application/platform plan;
- provide no household or accountant merge authority in the initial release;
- provide no automatic browser-local migration.

Only the personal record owner may merge their merchant profiles.

## 15. User interface

Merchant merge belongs inside the existing Settings merchant-management workspace.

The workflow uses progressive disclosure:

1. choose **Merge merchants** from an individual merchant's secondary controls;
2. choose the merchant to keep;
3. review safe counts and conflicts;
4. acknowledge that Categories and financial records do not change;
5. confirm the merge;
6. review per-kind outcome counts;
7. use **Undo merchant merge** while eligible;
8. separately choose **Apply category to past transactions** where desired.

Required states:

- loading;
- no eligible destination;
- clean preview;
- conflict preview;
- confirmation;
- running;
- completed;
- partial;
- failed;
- undo available;
- undo expired;
- partially undone;
- neutral unavailable/cross-user error.

Accessibility requirements:

- full keyboard operation;
- labelled source/destination controls;
- clear focus order;
- no colour-only status;
- polite status updates;
- explicit destructive/reversible wording;
- minimum touch targets;
- no horizontal overflow at 390 px;
- screen-reader-readable counts and conflict summaries.

## 16. Required synthetic tests

### 16.1 Ownership and authentication

- signed-out preview and confirmation fail before writes;
- cross-user source profile denied;
- cross-user destination profile denied;
- opaque missing and cross-user errors are equivalent;
- household member and accountant cannot merge another user's profiles.

### 16.2 Preview

- source and destination cannot match;
- destination must be active;
- removed source is labelled accurately;
- counts include active, needs-review and deleted owned Transactions;
- preview exposes no descriptions, amounts, filenames or normalized patterns;
- preview is invalidated by profile, alias, rule or Transaction changes.

### 16.3 Merge

- all eligible Transaction identities move without any other field changing;
- split parents and children retain counting behaviour;
- active/inactive aliases retain lifecycle state;
- non-conflicting rules retain Category, type, priority and lifecycle;
- source name alias is created only when safe;
- source becomes inactive only after required processing;
- destination Category remains unchanged;
- no existing Transaction Category changes;
- no report, budget or Loan total changes.

### 16.4 Conflicts

- alias/profile-name conflict blocks merge;
- changed alias blocks or skips safely;
- materially different duplicate rule blocks merge;
- exact duplicate rule outcome is explicit and undoable;
- concurrent operation involving either profile is blocked;
- stale records never receive force updates.

### 16.5 Undo

- full exact-state undo restores all relationships and lifecycle states;
- created redirect alias is recoverably removed when unchanged;
- changed Transaction blocks only its own undo item;
- changed alias/rule blocks only its own item;
- expired undo denied;
- second undo is idempotently unavailable;
- partial undo reports accurate aggregate counts;
- no financial value changes during undo.

### 16.6 Apply category to history

- remains a separate explicit operation;
- only selected eligible destination-merchant Transactions are considered;
- direction-incompatible Category is rejected;
- split parents excluded;
- already-applied records skipped;
- stale records blocked;
- 250-item limit retained;
- undo remains independent from merge undo.

### 16.7 Lifecycle

- export includes safe operation aggregates;
- account deletion removes all operation records in order;
- audit metadata is aggregate and allowlisted;
- no raw/private data appears in logs or errors;
- responsive Settings workflow meets keyboard and 390 px criteria.

## 17. Delivery sequence

1. This product/financial/privacy contract.
2. Exact schema assessment and proposed migration objects.
3. Explicit material schema approval.
4. Focused Prisma schema, migration SQL, verifier profile and fail-closed runtime gate.
5. Isolated Preview migration and integrity verification.
6. Owner-scoped preview, merge and undo service with synthetic tests.
7. Account export/deletion and Activity-history integration.
8. Responsive Settings UI and accessibility QA.
9. Separate apply-to-history integration using the existing bulk-operation service.
10. Consolidated authenticated synthetic Preview QA.
11. Separate Production migration and activation approval.

## 18. Hard stops

Stop before:

- Prisma schema or migration changes without explicit material approval;
- Preview migration execution without exact database-identity and migration gate approval;
- Production migration or table access;
- merging profiles using unjournalled `updateMany` operations;
- silently changing historical Categories;
- force-overwriting stale entities;
- using raw narration or real financial data in tests/evidence;
- adding provider, package, secret or environment changes;
- real-user activation before the complete release gate.

## 19. Exit criteria

Merchant merge/history is complete only when:

- identity merge and Category history are separate, explicit workflows;
- every affected entity has durable exact-state operation evidence;
- owner isolation and conflict handling are proven;
- merge and undo preserve every financial rule;
- source/destination, alias and rule semantics are deterministic;
- export/deletion and safe Activity history are complete;
- authenticated synthetic Preview QA passes;
- exact-head checks pass;
- Production migration and activation are separately approved and verified.
