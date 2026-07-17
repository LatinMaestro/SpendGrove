# Phase 6 Desktop Interface Audit

Audit date: 17 July 2026  
Method: read-only review of current main routes, components, server boundaries, schema and tests  
Scope: desktop shell, Transactions, Import, merchant/category/profile management, reports and account administration

## Executive finding

SpendGrove already has a real responsive desktop shell: a sticky 15.5 rem left sidebar appears at large widths, main content is bounded to approximately 76 rem, and the five accepted destinations remain consistent with mobile.

The remaining desktop gap is workflow density and composition. High-volume areas still use mobile-shaped cards, one-at-a-time controls or settings disclosure. Phase 6 should add desktop tables, toolbars and subordinate workspaces while preserving the mobile presentation.

## Current navigation and shell

### Implemented

- skip-to-content link;
- responsive mobile header;
- five-item mobile bottom navigation;
- large-screen sticky sidebar;
- SpendGrove logo and current visual tokens;
- authenticated page guard at AppShell;
- bounded main content and horizontal-overflow protection;
- current destinations: Home, Transactions, Loans, Import and Settings;
- Budgets and Regular payments remain subordinate to Home.

### Gaps

- no desktop workspace context/subnavigation for Import, merchant management or reports;
- sidebar uses the same five destinations but offers no safe secondary task grouping;
- account/profile controls remain visually separate from task context;
- no desktop command/search pattern;
- no breadcrumb/subordinate-view convention beyond focused existing views;
- main content often remains a single mobile-width workflow inside the wide canvas.

### Recommendation

Preserve primary navigation. Add page-level desktop context and subordinate panels inside existing destinations. Do not create a sixth mobile destination.

## Home

### Current purpose

Everyday summary, budgets, regular payments and review prompts.

### Desktop status

Complete baseline / minor polish only. Phase 6 should not turn Home into a dense analytics dashboard.

### Phase 6 treatment

- preserve current cards and formulas;
- use wide space for balanced columns only where content exists;
- no new metrics;
- links may open subordinate management views.

## Transactions

### Current implementation

- authenticated page;
- month-first transaction experience;
- import completion status;
- browser-local preservation notice;
- DurableManualTransactions supplies list, add/edit, chart/breakdown, search/filter and lifecycle actions;
- component is large and combines data fetch, month navigation, chart, filters, forms, list and details;
- mobile compact rows are the dominant presentation.

### Gaps

- no semantic desktop ledger/table;
- no row selection or contextual bulk toolbar;
- no multi-column scan of date, merchant, category, direction, amount and review state;
- no desktop filter rail/toolbar;
- no saved views;
- no safe bulk category/merchant/Property action;
- large component creates rerender and maintainability risk;
- limited pagination/bounded history posture should be verified for desktop result sets;
- audit/correction history is not a first-class desktop workflow.

### Essential actions to preserve

- month navigation and latest-populated initial month;
- monthly category chart/breakdown;
- list search and filters;
- Add transaction;
- Edit;
- split/correction behaviour;
- Property link/unlink;
- Delete/Restore;
- Needs correction;
- category drilldown and removable filter.

### Recommendation

Extract shared transaction view-model/data hooks and introduce two presentations:

- compact list below the desktop breakpoint;
- semantic ledger at large widths.

Use the same server data and actions. Do not maintain separate calculation logic.

## Import

### Current implementation

CsvImportFoundation owns a four-step flow:

1. Choose file.
2. Confirm columns.
3. Review.
4. Import.

Implemented controls include:

- hidden native CSV file input;
- 5 MB file limit;
- browser-local read/parse;
- privacy scan;
- manual column roles;
- mapping preview;
- review component;
- reset/back/continue actions;
- simple progress indicator.

ImportReviewFoundation contains the accepted row review, category, merchant, Property, duplicate and commit behaviour.

Import history is currently in Settings under Advanced account tools, not in the Import destination. Merchant rules and profile-related controls are split across components/settings rather than presented as one Import workspace.

### Gaps

- no Import Centre landing/context;
- saved profiles and history are not easy to discover during import;
- mapping is vertically stacked rather than using desktop width for source-to-role comparison;
- review rows/cards are not optimized for large desktop batches;
- no desktop review summary/selection assistance;
- profile management is not adjacent to mapping;
- history is separated from the task destination;
- no import undo;
- no supported-bank/format matrix visible to users;
- no parser quality/sample guidance.

### Essential behaviour to preserve

- original filename is not displayed;
- raw CSV remains browser-local and is not uploaded;
- private fields are excluded;
- mapping must be confirmed;
- every row remains reviewable;
- Import/Skip/Merge semantics;
- category suggestion/override;
- Property selector progressive disclosure;
- duplicate safeguards;
- commit ownership/idempotency;
- completion routing.

### Recommendation

Create an Import Centre within /import with subordinate “New import”, “Profiles” and “Past imports” views or sections. On mobile, keep the current direct step flow and move secondary views behind quiet actions. On desktop, show secondary context without distracting from the active step.

No new route is required for PR 6.1, though safe query-state or subordinate routes may be used if they stay under /import.

## Settings and account administration

### Current implementation

Settings includes:

- preferences;
- privacy controls;
- Advanced account tools disclosure;
- account import history;
- development reset only in testing;
- account deletion.

### Gaps

- import history belongs contextually in Import as well as account management;
- merchant/category/profile management is fragmented;
- account export/deletion/privacy/help can be grouped more clearly for desktop;
- no complete account administration overview;
- no future household/role or document controls, correctly absent.

### Recommendation

Keep destructive account deletion secondary. Reuse the same Import history component from Import Centre and Settings if needed; do not duplicate fetching or business logic.

## Merchant profiles, aliases and rules

### Current implementation

- owner-scoped models and server actions exist;
- MerchantRuleManager provides useful management;
- aliases, category rules and cleaned merchant logic are implemented;
- current normal workflows expose category learning and corrections.

### Gaps

- no cohesive desktop merchant directory/profile workspace;
- no combined display of profile, aliases and active rules;
- no safe merge/history workflow;
- no apply-to-history preview;
- no rule impact count;
- no richer defaults;
- long management component is not integrated into a high-level admin workspace.

### Recommendation

Phase 6.4 should first expose existing operations coherently. Merchant merge/history and richer defaults remain Phase 7/8 schema/financial gates.

## Categories

### Current implementation

- seeded and owner custom categories;
- searchable category picker;
- create/archive/restore controls;
- direction/type compatibility;
- recurring/budget/transaction use.

### Gaps

- no desktop category administration table;
- impact/reassignment checks need clear presentation before archive;
- no combined merchant-rule usage count;
- future household visibility not applicable yet.

### Recommendation

Provide compact active/deleted sections and safe usage context using existing actions. Do not change category IDs, types or calculations.

## Saved import profiles

### Current implementation

- durable BankImportProfile model and actions;
- safe structural mapping metadata only;
- ownership and privacy tests.

### Gaps

- management discoverability;
- profile-to-bank/header matching explanation;
- rename/default/delete/restore posture should be audited against existing actions;
- no Import Centre profile panel.

### Recommendation

Bring existing profile controls into /import. Do not store filenames, samples or private values.

## Loans and Properties

### Current implementation

Already uses compact Loan cards and focused selected-loan view, canonical repayments, Property transactions and secondary reports.

### Desktop gaps relevant to Phase 6

- wide layouts can improve header/action placement;
- existing report actions can feed Phase 6.5;
- no bulk Loan/Property mutation is approved.

### Recommendation

No Loan/Property redesign in Phase 6. Preserve Phase 4 accepted structure.

## Budgets and Regular payments

### Current implementation

Subordinate Home routes with compact create/edit/lifecycle workflows.

### Desktop gaps

Minor spacing/density only. Bulk or new lifecycle work belongs to Phase 9.

### Recommendation

No Phase 6 functional changes.

## Reports

### Current implementation

- monthly spending aggregates and category chart;
- Property financial-year records/export;
- account export;
- accepted disclaimers.

### Gaps

- no cross-module report centre;
- no advanced everyday/loan report suite;
- no accountant pack;
- no saved report configurations;
- no document evidence.

### Recommendation

Phase 6.5 may consolidate links to existing reports only. New report calculations belong to Phase 8.

## Data/backend reuse

Available server boundaries support:

- authenticated user resolution;
- owner-scoped transaction queries/actions;
- categories;
- import commit/history/profiles;
- merchant profiles/aliases/rules;
- Loan/Property actions and reports;
- budgets/recurring/insights;
- account export/deletion.

Phase 6 should extract reusable client presentation and add bounded query parameters rather than introduce a second desktop API.

## Current schema conclusion

The existing schema is sufficient for:

- desktop shell;
- Import Centre composition;
- responsive mapping/review layout;
- desktop transaction ledger over current records;
- transient filters and selection;
- merchant/category/profile administration using existing actions;
- existing report/account link consolidation.

It is not sufficient for a robust durable bulk-operation journal/undo or cross-device saved transaction views without a new design.

## Accessibility risks

- wide tables need semantic headers and keyboard row actions;
- selection must not be communicated only by background colour;
- sticky toolbars must not cover focused rows;
- horizontal overflow cannot become the interaction model;
- every compact icon needs a label;
- split/detail rows need clear hierarchy;
- dialogs must restore focus;
- drag/drop file affordance cannot replace the native Choose file action.

## Mobile regression risks

- desktop table styles leaking below breakpoint;
- desktop secondary navigation adding a sixth bottom item;
- wide toolbars wrapping into unusable action clusters;
- hidden essential import controls;
- selection state persisting through mobile navigation;
- excessive initial import content pushing Choose file below the fold.

## Performance risks

- loading all transaction history to populate a table;
- rerendering every review row for filter/search text;
- fetching category/profile catalogues per row;
- large client component state;
- rendering complete import history beside active review;
- computing report aggregates in multiple clients.

## Recommended first implementation batch

PR 6.1 can safely proceed without schema:

1. add an Import Centre header/context within /import;
2. keep New import as the default;
3. make Profiles and Past imports secondary and lazy;
4. improve large-screen mapping and review layout using existing components;
5. preserve mobile directness;
6. add focused interface/accessibility tests.

PR 6.2 can then add the no-schema desktop transaction ledger and transient filters.

Bulk mutation must wait for PR 6.3A’s exact schema/undo decision.

## Audit completion statement

This audit changed no source, schema, migration, package, provider, secret, environment or data. It did not access Production data. It identifies presentation and workflow gaps only; completed financial rules remain authoritative.
