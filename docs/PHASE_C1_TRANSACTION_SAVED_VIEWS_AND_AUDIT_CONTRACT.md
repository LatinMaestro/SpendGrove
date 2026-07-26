# Phase C1 Transaction Saved Views and Audit History Contract

Prepared: 26 July 2026  
Status: repository contract proposed; implementation remains gated by the exact schema/migration assessment and current stacked dependencies  
Master-plan alignment: Phase C1 — Transactions, saved views and audit  
Feature-register alignment: `TX-07`, `TX-08`, `TX-11`, `PLAT-02`, `PLAT-04`, `LIFE-01`, `LIFE-02`

## 1. Objective

Complete the desktop transaction-ledger workflow by defining:

1. cross-device saved transaction views that work consistently on web and the future native client; and
2. a privacy-safe read-only audit-history presentation that helps users understand material transaction changes without exposing raw financial or import metadata.

This contract does not add a Prisma model, migration, API, component, provider, package, environment variable or Production behaviour. It freezes the permitted product and data boundary for later focused implementation.

## 2. Current repository truth

The existing signed-in ledger already provides:

- an owner-scoped, bounded month query;
- Australian month navigation;
- search within the loaded month;
- desktop direction and category filters;
- a semantic large-screen table;
- mobile/tablet transaction cards;
- transaction detail, edit, duplicate, split, Property link, delete and restore workflows;
- direction-correction guidance;
- Preview-only bulk operations in PR #231;
- existing owner-scoped `AuditEvent` records.

The current filters are transient React state. They are cleared when the component is recreated and are not available on another browser or the future iPhone/iPad client.

The current browser-local settings store is prototype preference storage. It is not suitable for account-owned cross-device saved views because:

- it is device-specific;
- it is not included in durable account export or deletion;
- it is not shared with the native client;
- it cannot enforce owner-scoped references to Categories or Properties;
- it risks silent loss or divergence across devices;
- existing control documents explicitly require a separate decision before cross-device saved views.

The existing `UserSettings.featureFlags` JSON must not be used as an unbounded saved-view container.

## 3. Non-negotiable boundaries

Every implementation must preserve:

- integer-cent financial storage and calculations;
- Australian dates and July-to-June financial-year rules;
- transaction signed-direction and transfer precedence;
- split parents excluded and split children included in totals;
- Loan repayment no-double-count behaviour;
- review-before-commit for imported transactions;
- owner-scoped server authorization;
- no raw CSV retention;
- no raw row, narration, filename, account identifier, balance or secret in logs, audit output or saved-view definitions;
- no automatic sharing of personal saved views or audit history;
- complete account export and account deletion coverage;
- Production fail-closed treatment until any required migration is separately approved and verified.

Saved views are presentation preferences. They must not change, classify, calculate, mutate or cache financial records.

Audit history is explanatory evidence. It must not be treated as an undo journal, financial source of truth or substitute for the current record state.

## 4. Product language

Use the user-facing term **Saved view**.

A saved view means:

> A reusable set of safe transaction filters and sorting choices. It does not copy, move, share or change any transactions.

Use **Activity history** for the user-facing audit presentation.

Activity-history wording should answer:

- what type of change occurred;
- when it occurred;
- whether it came from a user-confirmed workflow or an import/bulk operation where safely known; and
- whether the current record may have changed again since that event.

It must not imply a complete forensic record where the existing audit model does not contain that evidence.

## 5. Saved-view scope

### 5.1 Initial supported scope

The first durable saved-view implementation is limited to the signed-in Transactions ledger.

It may preserve only these bounded choices:

| Field | Allowed values | Notes |
|---|---|---|
| Name | user-entered safe text | 1–60 characters after whitespace normalization |
| Date mode | `CURRENT_MONTH`, `FIXED_MONTH` | Current month is dynamic; fixed month uses `YYYY-MM` |
| Direction | all, Money in, Money out, Transfer | Maps to the accepted transaction type contract |
| Category | one owned Category or all | Reference by owner-scoped ID only |
| Property | one owned Property, no Property, or all | Reference by owner-scoped ID only |
| Source | all, Manual, Imported | No bank/profile name stored in the view |
| Record state | active, needs review, deleted/recoverable where supported | Deleted records remain a deliberate explicit filter |
| Review state | all, needs review, possible CSV match, direction correction | Derived through existing safe predicates |
| Sort | date newest/oldest, amount high/low | Stable secondary ordering by record ID or creation time |
| Page size | 25, 50 or 100 | Bounded; default 50 |

### 5.2 Deliberately excluded from initial persistence

Do not persist:

- free-text search terms;
- merchant or payee text;
- transaction descriptions or narration;
- notes;
- amount ranges;
- balances;
- Loan references;
- bank names, account names, account IDs or import filenames;
- raw query strings;
- arbitrary JSON predicates;
- selected transaction IDs;
- bulk-operation draft state;
- table column widths or arbitrary layout JSON;
- cached results, totals or report values.

Free-text search remains transient because a user may enter private narration, reference numbers or other sensitive content. A saved view may be applied first and a transient search may then narrow its current results.

### 5.3 Maximum and naming rules

- Maximum 12 active saved views per user.
- Names are normalized by trimming, collapsing internal whitespace and generating a locale-stable lowercase comparison value.
- Names must be unique per user after normalization.
- Reject names containing detected private bank identifiers.
- A name collision returns a clear validation error; it does not overwrite another view.
- The user may rename, duplicate and delete a view.
- Duplicating a view creates a new record with a non-conflicting name and does not copy current search text or selected rows.

### 5.4 Default view

- Zero or one saved view may be the user’s default Transactions view.
- Choosing a default is explicit.
- Setting a new default clears the previous default in the same server transaction.
- Deleting the default returns the ledger to the built-in current-month view.
- A saved view cannot silently become default merely because it was most recently used.
- Last-opened view may remain transient initially; durable last-view behaviour requires a separate decision if requested.

### 5.5 Built-in view

The immutable built-in view is:

- current Australian month;
- all directions;
- all categories;
- all Properties;
- all sources;
- active and needs-review records under the existing ledger rules;
- newest date first;
- 50 rows per page;
- no saved search text.

The built-in view is not stored as a database row and cannot be renamed or deleted.

## 6. Reference lifecycle and fail-closed behaviour

### 6.1 Category references

When a referenced Category is archived:

- retain the saved-view reference;
- label it as archived where it remains owner-accessible;
- allow the user to repair or remove the filter;
- do not broaden the view silently.

When a referenced Category is deleted or no longer owned:

- the view enters `NEEDS_REPAIR` presentation state;
- applying it returns no records or omits the invalid filter only after explicit user confirmation;
- the API must not silently change it to “all categories”.

### 6.2 Property references

The same fail-closed treatment applies to archived, deleted or no-longer-owned Properties.

A Property nickname may be resolved at read time for presentation. Exact addresses must not be copied into a saved view or its audit metadata.

### 6.3 Future model changes

If a future filter enum value or referenced feature is removed:

- preserve the row for user repair where safe;
- return a typed unsupported-filter state;
- do not run a broader query than the user saved;
- migration/backfill must not invent replacement financial meaning.

## 7. Ownership and collaboration

- Every saved view is personally owned by one SpendGrove user.
- Every create/read/update/delete/default action revalidates the authenticated user.
- Category and Property references must belong to the same user.
- Direct-ID and cross-user requests return a neutral not-available response.
- Existing or future household membership does not expose personal saved views.
- Saved views are not shared when their filtered Transactions or reports are shared.
- A future household-saved-view capability requires its own permissions and privacy contract.
- Accountant access does not expose a user’s saved views unless a later explicit scope is approved.

## 8. Account export, deletion and retention

### 8.1 Export

Account export should include safe saved-view definitions containing:

- view ID;
- safe name;
- date mode and fixed month where applicable;
- enum filter choices;
- owned Category/Property IDs and safe current labels where appropriate;
- default state;
- created/updated timestamps.

Export must not include:

- cached transaction results;
- raw search text;
- descriptions or narration;
- balances;
- before/after financial values;
- hidden normalized-name internals unless needed for technical portability.

### 8.2 Account deletion

Saved views must cascade-delete with the user before the user row is removed. Account deletion must not delete referenced Categories, Properties or Transactions merely because a saved view referenced them.

### 8.3 User deletion of a view

Initial implementation may hard-delete the small preference record after explicit confirmation because:

- the view contains no financial record;
- deleting it does not delete or change Transactions;
- a separate recoverable lifecycle would add schema and UI complexity without preserving money data.

A safe high-level audit event may record that a saved view was deleted, but it must not copy the full filter definition.

### 8.4 Retention

Saved views persist until the user deletes them or their account is deleted. They do not require an undo window or background retention policy.

## 9. Saved-view API boundary

The future server API should expose typed owner-scoped operations equivalent to:

- `GET /api/account/transaction-saved-views`;
- `POST /api/account/transaction-saved-views`;
- `PATCH /api/account/transaction-saved-views/[viewId]`;
- `DELETE /api/account/transaction-saved-views/[viewId]`;
- `POST /api/account/transaction-saved-views/[viewId]/default`.

Requirements:

- authenticate before persistence access;
- validate strict bounded payloads;
- normalize the name server-side;
- validate owned Category/Property references;
- enforce the per-user limit;
- use optimistic concurrency through `updatedAt` for edits;
- return safe typed conflict and unavailable errors;
- never accept a raw Prisma `where`, arbitrary JSON predicate or user-supplied SQL/query expression;
- never return Transactions in the saved-view management response.

Applying a saved view should translate the allowlisted definition into the existing bounded transaction query contract. The saved-view record is not itself financial authority.

## 10. Web experience

### 10.1 Progressive disclosure

On desktop:

- provide a compact **Views** control near the existing month/search/filter controls;
- show built-in current-month view first;
- list user views by default status and name;
- provide Save current filters, Rename, Duplicate, Make default and Delete actions;
- explain that free-text search and selected rows are not saved;
- show a repair warning when a referenced Category or Property is unavailable.

On mobile web:

- saved views may be available through the existing filter sheet or a compact overflow action;
- do not add a new primary navigation destination;
- preserve minimum touch targets and beginner-first language.

### 10.2 Save flow

The save confirmation must preview only the safe definition:

- date scope;
- direction;
- category;
- Property;
- source;
- review state;
- sort and page size.

It must not show or store raw narration from the current search field.

### 10.3 Applying a view

Applying a view:

- clears current selected-row/bulk-operation draft state;
- leaves the user on Transactions;
- updates visible filter controls;
- loads records through owner-scoped server queries;
- displays a clear chip/banner naming the active view;
- permits temporary changes without automatically rewriting the view;
- requires explicit **Update saved view** to persist changes.

## 11. Future native parity

The future Expo client must use the same API and enums. It must not implement a separate local-only saved-view format.

Native requirements:

- the built-in view and durable views match web semantics;
- device-local transient search remains unsynchronised;
- offline display may show the most recently received definition but must not imply it is current if a server refresh fails;
- saved-view writes require authenticated server confirmation;
- sign-out clears cached definitions under the native cache policy;
- no server-only module or Prisma type enters the native bundle.

## 12. Activity-history scope

### 12.1 Initial user-facing surfaces

Activity history should be available through:

1. a transaction-detail section showing events for that owned Transaction; and
2. an account-level recent activity list in Settings or the existing account-administration area.

It must not add a new primary navigation tab.

### 12.2 Read-only nature

The activity list is read-only. Actions such as undo, restore, unlink or correction remain in their approved feature-specific workflows and are not inferred from an audit row.

### 12.3 Bounded queries

- Transaction detail: latest 50 events for one owned transaction.
- Account recent activity: latest 100 allowlisted user-facing events.
- Cursor pagination may be added if needed; no unbounded query.
- Newest first, with stable timestamp/ID ordering.
- Signed-out, cross-user and unowned entity access fails before returning events.

## 13. Audit presentation allowlist

The API must map stored events into a purpose-limited view model. It must never serialize raw `AuditEvent.metadata` to the browser or native client.

Allowed output fields:

- event ID;
- event timestamp;
- safe event family;
- safe action label;
- entity type;
- entity ID only where already needed by an owned route;
- a generic plain-English summary generated from an allowlisted mapper;
- safe aggregate counts where the source contract already permits them;
- optional safe current Category or Property nickname resolved through an owned relation.

Permitted examples:

- “Transaction created.”
- “Transaction updated.”
- “Transaction deleted.”
- “Transaction restored.”
- “Import row merged after review.”
- “Category updated through a bulk operation.”
- “Property link removed.”
- “Transfer link confirmed.”
- “Import undo completed for 8 eligible rows; 2 rows were left unchanged.”

The exact wording must reflect available evidence and avoid claiming who performed an action unless authenticated actor evidence exists.

## 14. Prohibited activity-history content

Never expose through the activity API or UI:

- raw metadata objects or unknown keys;
- transaction descriptions, imported narration or merchant source text;
- notes;
- amounts, balances, budget values or Loan values;
- raw before/after snapshots;
- CSV rows or filenames;
- BSBs, account numbers, card/customer/member IDs or Loan references;
- invitation/access tokens or hashes;
- storage provider object keys, checksums or URLs;
- exact Property addresses;
- email addresses unless a later identity-specific contract requires them;
- internal error text, stack traces or provider responses;
- secret/environment identifiers.

Unknown metadata shapes must fall back to a generic safe event label or be omitted. They must never be stringified for display.

## 15. Audit mapping rules

The mapper should use:

- `entityType`;
- `action`;
- a small allowlist of safe `reasonCode` values;
- known aggregate count keys already approved by the relevant feature contract;
- owned current relations for safe labels.

It should reject or ignore:

- unknown metadata keys;
- nested free text;
- arbitrary numeric fields;
- raw IDs not required for routing;
- any value rejected by the existing privacy validator.

A displayed event remains useful even if metadata is omitted. Example: `TRANSACTION + UPDATED` can safely display “Transaction updated” without explaining which private field changed.

## 16. Activity-history ownership

- Account-level history is queried by authenticated user ID only.
- Transaction history first proves the Transaction belongs to the authenticated user, including recoverable deleted records where the approved lifecycle permits access.
- Audit rows alone do not establish ownership of another entity.
- Household members see only events generated for an explicitly shared purpose-limited surface if a later contract permits it; no such access is included now.
- Accountants do not receive personal activity history under the current selected-record/report read-only scope.

## 17. Audit export, deletion and retention

- Existing account export treatment for audit rows remains the controlling foundation.
- User-facing mapping does not create a second durable audit copy.
- Account deletion must remove/anonymize audit rows in the existing dependency order.
- No new indefinite before/after payload is permitted.
- Any future audit-retention exception requires legal/privacy approval and must be disclosed.

## 18. Accessibility and responsive requirements

Saved views and activity history must include:

- keyboard-operable controls;
- clear focus states;
- labelled dialogs and confirmation text;
- accessible selected/default states;
- live-region feedback for save/update/delete errors where appropriate;
- screen-reader-friendly event text and timestamps;
- no colour-only meaning;
- no horizontal overflow at 390 px;
- desktop efficiency without removing mobile access;
- Australian date/time presentation with unambiguous year where needed.

## 19. Testing contract

### 19.1 Saved-view service tests

- create/list/update/delete under the owning user;
- cross-user direct-ID denial;
- category/property ownership denial;
- maximum-view enforcement;
- normalized duplicate-name rejection;
- default-view replacement in one transaction;
- optimistic concurrency conflict;
- invalid reference enters fail-closed repair state;
- no arbitrary query fields accepted;
- no free-text search persistence;
- export includes safe definitions only;
- account deletion removes views without deleting source records.

### 19.2 Query translation tests

- current-month dynamic behaviour;
- fixed-month Australian boundary;
- direction/category/Property/source/status/review filters;
- stable sorting and bounded page sizes;
- split-parent and transfer rules remain unchanged;
- saved view does not change totals or Transactions;
- applying a view cannot reach another user’s Category, Property or Transaction.

### 19.3 Activity-history tests

- owner-scoped account and transaction queries;
- signed-out and direct-ID denial;
- bounded result count and ordering;
- known action/reason mapping;
- unknown metadata fallback;
- raw metadata never returned;
- descriptions, amounts, filenames, account identifiers, addresses and provider internals absent;
- deleted owned transaction history handled under approved lifecycle;
- no mutation endpoint exposed.

### 19.4 UI tests

- save/update/default/duplicate/delete flows;
- transient search excluded from saved definition;
- selected rows cleared when switching view;
- repair state for deleted references;
- mobile and desktop controls;
- keyboard, focus and screen-reader labels;
- empty/loading/error states;
- activity list does not expose prohibited values.

## 20. Proposed focused PR sequence

1. **C1.1 — Contract and schema assessment**  
   This documentation package only.
2. **C1.2 — Exact additive saved-view schema and verifier profile**  
   Only after explicit schema/migration approval; no runtime activation.
3. **C1.3 — Owner-scoped saved-view service, export and deletion**  
   Behind a hard-false runtime gate until Preview migration evidence exists.
4. **C1.4 — Saved-view web workflow**  
   Progressive disclosure in the existing ledger; no navigation change.
5. **C1.5 — Privacy-safe activity-history mapper, API and UI**  
   Reuse existing AuditEvent; no raw metadata response.
6. **C1.6 — Integrated QA and client-review package**  
   Exact-head automated checks, Preview/browser accessibility and deferred client testing.
7. **Native parity**  
   Reuse the final API and contracts during native Transactions delivery.

## 21. Hard stops

Do not proceed to schema or implementation when:

- PRs #242–#244 or their dependencies are unresolved and the intended base is unclear;
- the saved-view schema/migration has not been explicitly approved;
- a Production migration or Production data inspection is required;
- activity presentation would require raw metadata or private financial values;
- a new package/provider/secret/environment variable is proposed;
- cross-device semantics cannot be maintained for the future native client;
- household/accountant sharing scope must expand;
- financial calculations or transaction query semantics would change.

## 22. Acceptance criteria for this contract

This contract is complete when it has been reviewed against:

- `AGENTS.md`;
- the master specification sections 11, 12, 14, 16, 29 and 30;
- `PHASE_6_SCHEMA_ASSESSMENT.md`;
- the App Store submission master plan;
- the complete-product feature register;
- review gates and Definition of Done;
- current ledger and audit implementation.

Approval of this document authorises only the later preparation sequence. It does not itself authorise a schema migration, Production activation, new provider, financial-rule change or public release.
