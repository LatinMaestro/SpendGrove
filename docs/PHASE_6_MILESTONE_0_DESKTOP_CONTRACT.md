# Phase 6 Milestone 0 — Desktop Web and Bulk Workflow Contract

Status: active implementation contract  
Prepared: 17 July 2026  
Phase: Phase 6 — Desktop Web Platform and Bulk Workflows

## Objective

Make SpendGrove efficient on larger screens while preserving the accepted beginner-first mobile experience, authenticated ownership, review-before-commit, privacy-first CSV handling and financial calculations.

This milestone defines the implementation boundary. It adds no feature code, schema or migration.

## User value

A desktop user should be able to:

- understand where to import, review and manage records;
- use available width for comparison and scanning;
- find transactions without scrolling through mobile-shaped cards;
- select records deliberately and perform safe repeated work;
- manage merchants, categories and import profiles from one understandable area;
- reach reports and account administration without cluttering everyday mobile navigation.

## Preserved product structure

Primary destinations remain:

1. Home
2. Transactions
3. Loans
4. Import
5. Settings

Phase 6 may add subordinate desktop views and in-page workspaces. It must not add a sixth mobile bottom-navigation item without a new navigation decision.

The existing responsive shell, logo, colour tokens, plain-English copy and progressive disclosure remain the presentation baseline.

## Desktop breakpoints and layout

- Below the existing large-screen breakpoint, retain the current mobile/tablet header and five-item bottom navigation.
- At large widths, retain the left desktop sidebar and use the main content area more deliberately.
- Do not simply enlarge mobile cards.
- Prefer a compact toolbar plus table/list for high-volume records.
- Keep readable maximum widths for forms and explanatory content.
- Use split panes only when each pane has a clear purpose and remains keyboard-accessible.
- Avoid fixed heights that trap content or create nested scrolling.
- No horizontal page scrolling at approximately 1024 px, 1280 px or 1440 px.

## Action hierarchy

Each workspace has:

- one clear primary task;
- quiet filters and secondary actions;
- bulk actions hidden until at least one eligible row is selected;
- destructive or correction actions behind confirmation;
- advanced history, profile and rule management in subordinate panels.

Do not show inactive controls that cannot work for the current selection.

## Phase 6 delivery sequence

### PR 6.0A — Contract, interface audit and schema assessment

Documentation only:

- this contract;
- current interface audit;
- schema/migration assessment.

### PR 6.1 — Desktop shell and Import Centre

No-schema implementation:

- preserve current navigation labels and mobile behaviour;
- add desktop page/context header treatment where needed;
- compose upload, mapping, review, profiles and history into a coherent Import Centre;
- use wider mapping/review layouts without changing import semantics;
- preserve browser-local parsing, privacy scan and review-before-commit.

### PR 6.2 — Desktop transaction ledger and filter foundation

No-schema first implementation:

- provide a desktop table/ledger while retaining compact mobile rows;
- month/date, category, direction and review-state filters;
- Property/Loan filters only where existing safe server data already supports them;
- sorting over the selected owned result set;
- row selection foundation;
- no durable saved filters yet.

### PR 6.3A — Bulk-operation and undo schema contract

Required before durable bulk mutation:

- exact supported actions;
- exact operation and item schema, if required;
- pre/post values without private source narration;
- ownership, deletion/export and retention;
- partial failure and concurrency;
- undo eligibility;
- SQL, indexes, Preview migration and forward-fix plan.

Stop before any migration until the exact files are approved under the roadmap migration workflow.

### PR 6.3B — Safe bulk actions

Only after the schema/undo gate is complete:

- bulk category update;
- apply category to same safe merchant;
- bulk Property link/unlink only under the cardinality rules below;
- per-record server authorization and revalidation;
- result summary and eligible undo where contracted.

### PR 6.4 — Merchant, category and import-profile administration

- reuse existing owner-scoped MerchantProfile, MerchantAlias, MerchantRule, Category and BankImportProfile actions;
- responsive desktop management views;
- no richer tax/Property defaults until the Phase 7/8 schema contract.

### PR 6.5 — Reports and account administration consolidation

- expose existing report/export/account actions in a desktop-friendly subordinate workspace;
- no new report calculation or export column;
- no household/accountant access.

### PR 6.6 — QA and consolidated client package

- full regression, visual/device/accessibility/ownership/privacy/financial checks;
- update the complete feature register and deferred client checklist.

## Import Centre contract

The Import Centre is a composition of existing capabilities, not a new import engine.

Default hierarchy:

1. Choose or drop CSV.
2. Confirm mapping only when needed.
3. Review.
4. Import.
5. Show concise completion.
6. Profiles and past imports remain secondary.

Desktop mapping:

- use the additional width for source column, selected meaning, safe sample shape and issue state;
- never display excluded private values;
- retain the same mapping validator;
- keep one primary Continue action.

Desktop review:

- keep Import / Skip / Merge semantics;
- allow compact table-like rows with the same editable merchant/category/Property controls;
- show row detail only when needed;
- bulk review assistance may reduce taps but must not bypass review;
- private-field scanning remains internal unless user action is required;
- preserve duplicate and stale-row safeguards.

Import history:

- remains safe aggregate metadata;
- no raw rows, filenames, balances or identifiers;
- undo is not added in PR 6.1.

## Transaction ledger contract

Desktop columns may include only safe accepted values:

- selection;
- Australian date;
- safe cleaned merchant/description;
- category;
- direction;
- amount;
- quiet Property/Loan context where already available;
- review/correction state;
- row details action.

Do not expose:

- raw CSV narration;
- filename;
- account/BSB/card/customer identifiers;
- audit IDs;
- internal enum names;
- source hashes;
- technical reconciliation/provenance terms.

The mobile view remains compact and must not be forced into a horizontally scrolling table.

## Filter rules

Initial no-schema filters:

- selected Australian month/date range;
- search within the selected result set;
- category;
- Money in / Money out / Transfer;
- Needs review / Needs correction;
- Property/Loan association only when existing query contracts can supply safe identifiers.

Rules:

- filters never change transaction values;
- filters are owner-scoped server-side where data is fetched;
- filtering a list does not silently change Home/chart/budget calculations;
- active filters are visible and individually removable;
- Clear all is secondary;
- saved filters are deferred to a schema/client-preference decision.

## Selection rules

A selected row must remain:

- owned by the authenticated user;
- active/non-deleted at action time;
- a supported transaction shape for the requested action;
- represented by an opaque transaction ID only in the request;
- reloaded and revalidated on the server.

Selection clears when:

- the user changes to an incompatible month/result set;
- a mutation succeeds for the selected rows;
- authentication/session identity changes;
- the view is replaced by a different workspace.

Selection must never persist into another user session through browser-local storage.

## Bulk category update rules

Eligible:

- active owned ordinary transactions;
- eligible split children;
- unsplit leaf transactions;
- direction-compatible selected category;
- current records that pass per-row concurrency validation.

Ineligible:

- split parent display containers;
- deleted/inactive records;
- another user’s record;
- transaction with a sign/type anomaly until corrected;
- transfer when the selected category would change transfer treatment;
- analytical LoanRepayment records.

Behaviour:

- preview eligible, skipped and conflicting counts before commit;
- never change signed amount, type, date, split structure, Property link or reconciliation;
- merchant-rule learning is a separate explicit choice;
- partial failure returns safe reason codes and does not report successful rows as failed;
- audit contains entity IDs/action codes only, not raw descriptions or amounts.

## Apply-to-same-merchant rules

- use only the accepted safe merchant profile/alias identity;
- show the match count and scope before commit;
- scope defaults to active owned eligible records;
- user chooses current view or all eligible history only when explicitly offered;
- category direction compatibility is revalidated per record;
- ambiguous merchant identity is excluded;
- no raw narration is persisted or logged;
- no generic merchant-name substring update.

## Bulk Property-link rules

Existing cardinality remains one active Property link per eligible Transaction.

Allowed:

- link unlinked eligible owned transactions to one active owned Property;
- keep rows already linked to that Property unchanged;
- unlink selected rows through a separate explicit action.

Not allowed silently:

- replacing a different existing Property link;
- linking split parents;
- changing LoanAccount relationships;
- creating links for Skip/Merge staging rows;
- using exact addresses or automatic Property matching.

Conflicting rows must be excluded and listed as “already linked to another Property”; replacement requires an explicit per-record correction flow unless a later contract approves a separate bulk-replace action.

## Bulk deletion

Bulk transaction deletion is excluded from the first Phase 6 bulk scope. It creates wider reconciliation, import-idempotency, Property/report and recovery risks. Existing single-record recoverable deletion remains.

A future bulk-delete proposal must define relation impact, recovery, audit and undo separately.

## Undo and operation history

A toast-only client undo is not sufficient for durable bulk financial changes.

Before bulk mutation ships, the implementation must determine whether a durable owner-scoped operation journal is required. If used, it must:

- record action type, actor/user, timestamps and target IDs;
- record only minimum structured before/after references needed for safe reversal;
- exclude raw narration, filenames, account identifiers and unnecessary amounts;
- mark each item succeeded/skipped/failed;
- prevent undo after incompatible subsequent edits;
- revalidate ownership and current state;
- never reverse an unrelated later change;
- enter account export/deletion and retention contracts.

The schema assessment records this as a mandatory PR 6.3A gate.

## Concurrency and partial failure

- server reloads each target under the authenticated owner;
- mutation uses bounded batches;
- each record is validated immediately before write;
- one stale/conflicting record does not make already successful independent records appear failed;
- atomicity may be per record or bounded transaction according to the exact action contract;
- result reports aggregate counts and safe reason codes;
- no automatic retry of failed financial mutations.

## Accessibility

- semantic table headers on desktop;
- mobile list remains a list, not a squeezed table;
- selection checkboxes have transaction-specific accessible labels using safe display text;
- bulk toolbar is keyboard reachable and announced when it appears;
- focus moves predictably after filtering, mutation and dialog close;
- 44 px touch targets where practical;
- visible focus and no colour-only states;
- long merchant/category/Property names truncate visually but remain available to assistive technology.

## Performance

- use server pagination or bounded month/result queries;
- do not load all account history for a normal ledger page;
- reuse category/profile catalogues;
- debounce only presentation search; server queries remain bounded;
- do not rerender every import row for unrelated toolbar state;
- large synthetic imports and transaction histories require regression evidence;
- no new package solely for tables, grids or virtualization without a separate dependency gate.

## Privacy and security

- server authentication and resource ownership remain the security boundary;
- no browser-local selection or filter state crosses users;
- chart/table components receive safe display records, not raw CSV rows;
- no private source values in URL query strings;
- URLs may contain safe month, category ID and opaque filter values;
- errors use safe codes and plain language;
- no analytics/monitoring provider is added in Phase 6.

## Financial integrity

Phase 6 does not change:

- signed integer-cent amounts;
- transaction types or transfer precedence;
- split totals;
- spending, budget or chart eligibility;
- recurring thresholds;
- duplicate scoring;
- Import/Skip/Merge semantics;
- Loan reconciliation;
- Property-link cardinality;
- report/export formulas;
- tax/refund treatment.

## Exclusions

- new primary navigation destination;
- new financial calculation;
- parser/bank coverage expansion (Phase 7);
- import undo implementation (Phase 7, though shared operation design may be reused);
- advanced/tax report calculations (Phase 8);
- net worth/reminders (Phase 9);
- household/accountant access (Phase 10);
- documents (Phase 11);
- Basiq/AI (Phase 12);
- native work (Phase 13);
- payments (Phase 14);
- provider/security operations outside current baseline (Phase 15).

## Mandatory stops

Stop before:

- any schema/migration not covered by an exact PR 6.3A contract;
- a new table/grid dependency;
- a new navigation destination;
- any financial/import/reconciliation/report formula change;
- bulk hard deletion;
- automatic replacement of Property links;
- raw source/private values in UI, logs, URLs or audit;
- provider, package, secret or environment change;
- Production migration/data access;
- browser-local data migration/deletion.

## Milestone exit criteria

- interface audit and schema assessment are merged;
- PR 6.1 and 6.2 no-schema scopes are clear;
- bulk operation safety and schema gate are explicit;
- no feature implementation, schema, migration, provider or data mutation occurred in Milestone 6.0.
