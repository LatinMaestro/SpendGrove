# Phase 4 Milestone 4 UI Overhaul Contract

Status: approved and frozen for implementation  
Date: 14 July 2026  
Milestone: Phase 4 Milestone 4 - Beginner-First Full UI Overhaul

## Objective

Rebuild SpendGrove's presentation into a calm, compact and trustworthy consumer budgeting experience for beginners while preserving every accepted financial, import, ownership, privacy, recovery and no-double-count rule.

Permanent product rule:

> Show the minimum information and controls needed for the task the user is completing.

The interaction sequence is:

1. Show a useful summary.
2. Offer one obvious next action.
3. Reveal supporting detail only when requested.
4. Keep correction, recovery and advanced management secondary but reachable.

Phase 4 Milestones 1-3 remain implemented and technically verified but open pending consolidated client acceptance. Milestone 4 also remains open until client visual testing is complete.

## Binding scope

This milestone may substantially change:

- layout and spacing;
- responsive navigation presentation;
- component structure;
- typography and colour application;
- card/list density;
- information hierarchy;
- loading, empty, success and error presentation;
- dialogs, drawers and progressive disclosure;
- user-facing wording;
- the visual placement of existing actions.

This milestone must not change:

- persisted data or schema;
- any migration;
- transaction amounts, dates, types or categories;
- integer-cent or signed-money handling;
- Australian date behaviour;
- CSV parsing, duplicate scoring or Import / Skip / Merge semantics;
- review-before-commit;
- split, transfer or refund rules;
- merchant-rule priority;
- recurring evidence, cadence or confirmation rules;
- budget formulas, period or no-rollover rules;
- loan calculations or matching thresholds;
- Property-link cardinality;
- Property report sources, calculations or export columns;
- soft-delete/recovery behaviour;
- ownership, audit or privacy boundaries;
- the rule that everyday transactions are the only cashflow records.

## Approved brand source

The repository assets are the approved source:

- full logo and wordmark: `assets/brand/spendgrove-logo.png`;
- compact app-icon source: `assets/brand/app-icon-source.png`;
- current application icon: `app/icon.svg`.

Implementation must copy approved raster assets unchanged to an appropriate public brand path where required. Do not redraw, distort, recolour or place the logo in a decorative container. Use the full wordmark in desktop/sidebar or generous header contexts and the compact approved symbol where space is constrained. Provide meaningful alternative text when the logo conveys identity and empty alternative text only when an adjacent visible name already supplies it.

The logo establishes:

- primary evergreen/deep teal;
- supporting leaf green;
- warm off-white/neutral surfaces;
- dark neutral text;
- restrained semantic warning, error and success colours.

A monochrome treatment may be produced with CSS only when contrast requires it.

## Market research findings

Research was limited to current public product and App Store presentation. SpendGrove will use general interaction principles, not copy trade dress, screenshots, icons or proprietary assets.

| Reference | Useful pattern | SpendGrove adaptation | Explicitly not adopted |
|---|---|---|---|
| Buddy | Friendly month-first budgeting, clear plan/remaining/insight hierarchy and short category presentation | One monthly amount first, compact budget rows, approachable language | Shared budgeting and decorative category density |
| Copilot Money | Strong typography, aligned transaction rows, clear review queue, disciplined spacing and polished state handling | High-quality typography, compact transaction review, one focal task | Bank aggregation, AI, investments, net worth and dense dashboards |
| PocketGuard | One central question and visually obvious remaining amount | Each screen answers one or two questions with one primary action | Opaque “safe to spend”, debt advice and connected-account automation |
| Monarch Money | Progressive disclosure, customisable information hierarchy and strong desktop use of space | Responsive rail, compact desktop lists, reports kept subordinate | Account/net-worth/report density, household/advisor and AI features |
| MoneyLens / statement-first peers | Private statement import positioned as an alternative to bank connection | Make CSV import a polished primary workflow and keep privacy reassurance concise | AI scoring, private enrichment and new data ingestion methods |

Research references:

- https://apps.apple.com/au/app/buddy-money-budget-planner/id936422955
- https://apps.apple.com/us/app/copilot-track-budget-money/id1447330651
- https://apps.apple.com/us/app/pocketguard-budget-planner-app/id949414211
- https://apps.apple.com/us/app/monarch-budget-track-money/id1459319842
- https://apps.apple.com/au/app/moneylens-budget-tracker/id6760237037

The resulting SpendGrove direction is distinctive: logo-led evergreen and leaf-green branding, calmer neutral surfaces, CSV-first privacy, reviewable automation, compact rows and progressive disclosure without account, investment, advice or net-worth density.

## Current interface inventory and binding redesign rules

### Global shell

Current purpose: provide branding, authentication, mode state and five primary destinations.

Current problems:

- the header repeats brand text and “Your money, simply” on every page;
- the mode/preference treatment competes with account controls;
- the shell is constrained like a mobile card column even on wide screens;
- the floating five-item pill remains mobile-shaped on desktop;
- page content receives large bottom padding and broad card styling regardless of viewport;
- no active navigation treatment is reliably derived from the current route.

Redesign:

- mobile keeps the existing five destinations in a compact safe-area bottom bar;
- tablet/desktop uses a compact left rail/sidebar with the full approved wordmark;
- no sixth destination;
- Settings/profile remains quiet;
- use a content frame suited to the workflow, not one global narrow maximum width;
- remove the global tagline and prominent advanced preference;
- show a compact page header only when useful.

### Home

Primary question: what happened this month, how are budgets going and is anything waiting?

Must remain visible:

- current Australian month;
- current-month everyday spending;
- understandable previous-month comparison;
- relevant budget progress;
- confirmed/upcoming regular-payment context;
- actionable review needs;
- Import transactions and Add transaction access.

Move behind disclosure or omit when empty:

- full category comparisons;
- long regular-payment lists;
- repeated onboarding/privacy explanations;
- duplicated quick actions;
- zero-value/empty feature panels.

Current problems:

- oversized dark hero;
- multiple large mint/green cards;
- onboarding competes with ongoing use;
- recurring and budget management components are rendered as full administrative sections.

Redesign:

- compact monthly financial summary with one primary amount;
- at most two quick actions;
- no more than three budget or regular-payment previews;
- Needs attention appears only when actionable;
- completed onboarding disappears from normal Home;
- use compact rows and dividers before additional cards.

### Transactions

Primary question: what happened in the selected month?

Must remain visible per row:

- safe cleaned merchant or useful identity;
- category;
- Australian date;
- amount.

Secondary only:

- source, Property and split indicators when relevant;
- Edit, Property link, split, notes and Delete inside detail;
- filters only while active or opened.

Current problems:

- tall cards;
- routine Expense/Income/Imported badges;
- repeated Details/Edit/Delete controls;
- desktop presents stretched mobile cards.

Redesign:

- compact 56-72px rows where content permits;
- mobile: title/amount first line, category/date second line;
- desktop: aligned date, merchant, category and amount columns;
- row selection or quiet overflow opens a focused detail surface;
- integrate month navigation, search and filter into one compact toolbar;
- preserve approved initial-month fallback and month-scoped query behaviour.

### CSV Import

Primary question: what does the user need to confirm before importing safely?

Must remain visible:

- four-stage flow: choose, confirm if needed, review, import;
- date, cleaned description, amount, category and Import/Skip/Merge choice;
- warnings that require action;
- selected/skipped/merge counts and final import action.

Secondary:

- advanced mapping;
- duplicate evidence;
- raw-source preview only where already safely approved;
- Property selector until Property transaction is chosen;
- merchant-rule detail.

Current problems:

- oversized analysis/loading state;
- mapping and privacy explanation can dominate;
- row cards repeat large action areas;
- desktop review lacks efficient density.

Redesign:

- compact step indicator;
- concise loading/progress panel with live status;
- confident mapping stays collapsed;
- desktop compact review list/table;
- mobile one expanded row editor at a time;
- sticky summary/footer with one import action;
- preserve searchable category reuse and prevent list-wide rerenders where practical.

### Budgets

Primary question: how much is used and left this month?

Must remain visible:

- category;
- monthly budget;
- spent;
- remaining;
- compact progress;
- Add budget.

Secondary:

- Edit/Delete in detail or overflow;
- Deleted budgets behind one management disclosure;
- create form only after Add budget.

Current problem: management controls and forms carry too much weight.

Redesign: compact selectable progress rows, one focused creation/edit surface, no formula or lifecycle change.

### Regular payments

Primary question: what regular payments are confirmed and what needs review?

Must remain visible:

- merchant;
- signed amount;
- plain timing;
- next expected date when available;
- Confirm/Dismiss only on suggestions.

Secondary:

- reason explanation;
- edit/delete for confirmed items;
- dismissed/deleted management;
- only one open editor.

Current problem: cards and action sets are oversized and Home can duplicate the workflow.

Redesign: compact rows, review items before confirmed items, state groups not all expanded simultaneously, no internal cadence/confidence terminology.

### Loans and Property records

Primary question: what are the repayments and what other transactions relate to the linked Property?

Must preserve:

- compact Loan overview;
- focused selected-loan view;
- repayments first;
- Property transactions second only when applicable;
- plain Needs review state;
- repayment detail, matching, correction, unlink, Delete/Restore;
- secondary Property report/export workflow.

Current problem: the accepted simplified information model still uses large administrative surfaces and repeated privacy/help treatment.

Redesign:

- compact Loan cards and repayment rows;
- only one repayment detail at a time;
- no routine healthy badges;
- report remains a separate secondary dialog/subview;
- matching tools preserve every current rule but use plain language;
- no Property section for non-Property loans.

### Settings

Primary question: where can the user change preferences or manage less-common items?

Groups:

1. Preferences
2. Categories and merchant rules
3. Data and privacy
4. Loan and Property management only where existing controls require it
5. Deleted items
6. Help

Current problems:

- many rounded green panels;
- technical/development controls can resemble ordinary settings;
- privacy copy is repeated elsewhere.

Redesign:

- clean grouped rows with chevrons;
- advanced/development controls remain environment-gated and visually secondary;
- one primary privacy explanation location;
- unavailable/future features remain absent.

### Onboarding and states

Onboarding must use existing durable state only. It may not require a new persisted field.

Minimum first-run sequence:

1. welcome and privacy promise;
2. Australian defaults;
3. existing simplicity preference;
4. import first CSV or continue manually.

When complete, it disappears from normal Home and remains reachable through Settings where currently possible.

Loading states must be compact and announced. Empty states must explain one useful next action. Errors must preserve work, be actionable and never expose private source values. Success messages should be short, aggregate and non-sensitive.

## Visual tokens

Binding token direction is maintained in `docs/DESIGN_SYSTEM.md`.

### Colour roles

- evergreen: brand, primary actions and active navigation;
- leaf green: selected states and meaningful positive progress;
- neutral canvas: application background;
- white: primary surfaces;
- neutral border: separation only;
- amber: needs review;
- red: errors/destructive confirmation only.

Pale green is not the default card fill. Green is not decoration.

### Type roles

- page title;
- section title;
- primary amount;
- row title;
- secondary metadata;
- helper text.

Routine labels use sentence case. Avoid uppercase tracking except a genuine short brand/eyebrow use.

### Density

- compact rows: 56-72px when content allows;
- interactive targets: at least 44px where practical;
- card padding: 16-20px;
- modest radii;
- subtle borders;
- minimal shadows;
- no nested card-on-card decoration.

### Action hierarchy

- one primary action per page or major section;
- secondary actions outlined or neutral;
- tertiary actions text/overflow;
- destructive actions requested from detail/More and confirmed;
- no permanent Edit/Delete pair on each row;
- no full-width primary treatment for closing or back navigation.

### Badges

Badges are reserved for states needing recognition or action. Routine Expense, Income, Imported, Matched, Active and Linked labels are not badges.

## Shared component contract

Create or refactor reusable primitives without a new component library:

- responsive app shell;
- page header and compact section header;
- primary financial summary;
- compact record row;
- attention state;
- compact empty/loading/error state;
- searchable picker;
- accessible detail dialog/drawer;
- overflow menu;
- month selector;
- progress row;
- confirmation dialog;
- deleted-items disclosure.

Components must preserve semantic HTML, labelled controls, keyboard access, visible focus, focus return after dialogs, duplicate-submit prevention and existing stale/ownership protections.

## Responsive contract

### Mobile, approximately 390px

- compact five-item bottom navigation;
- safe-area spacing;
- stacked content;
- compact rows;
- one expanded editor/detail at a time;
- no horizontal scrolling or obscured actions.

### Tablet, approximately 768px

- navigation changes only when there is enough persistent width;
- two-column layout only when it improves comprehension;
- dialogs and pickers fit without keyboard obstruction.

### Compact desktop, approximately 1024px

- left rail/sidebar;
- workflow-appropriate content width;
- aligned lists/tables;
- no stretched mobile cards.

### Desktop, approximately 1440px

- stable navigation rail;
- generous but bounded content;
- efficient grids for summaries only;
- no wall of cards or empty width-filled panels.

## Accessibility contract

Target and honestly test:

- WCAG AA text/control contrast;
- semantic headings;
- associated labels;
- visible focus;
- logical keyboard order;
- accessible icon names;
- non-colour state cues;
- Escape/Cancel and focus return for dialogs;
- 44px practical touch targets;
- live announcements for import/loading/error outcomes;
- reduced-motion support through platform media preferences;
- no claim of complete accessibility certification.

## Performance contract

- reuse already loaded category data;
- avoid rerendering an entire import list for one row edit;
- do not render hidden histories;
- do not fetch all history for summary screens;
- avoid decorative animation and new runtime dependencies;
- preserve server month limits and duplicate-submit safeguards.

## Delivery gates

1. PR 4.18: this documentation-only contract, inventory and design system.
2. PR 4.19: approved brand assets, tokens, responsive shell and shared components.
3. PR 4.20: Home and onboarding.
4. PR 4.21: Transactions and CSV Import.
5. PR 4.22: Budgets and regular payments.
6. PR 4.23: Loans and Property workflows.
7. PR 4.24: Settings and secondary management.
8. PR 4.25: responsive, accessibility and visual-consistency QA.
9. PR 4.26: evidence and consolidated client package.

Meaningful visual deployment gates:

- shell + Home;
- everyday core workflows;
- completed overhaul.

Documentation-only PRs do not require a new Vercel build when the application is unchanged.

## Tests required

Preserve all existing tests and add focused assertions for:

- exact five-item mobile and desktop navigation;
- active destination and non-obscuring mobile navigation;
- completed onboarding not dominating Home;
- relevant-only Home sections and non-duplicated quick actions;
- compact Transactions with details/actions still reachable;
- month and search/filter rules unchanged;
- four-stage Import flow, conditional mapping/Property detail and sticky summary;
- compact Budget/Regular-payment rows with lifecycle actions reachable;
- focused Loans hierarchy with reports secondary and no duplicate presentation;
- grouped Settings with privacy and recovery reachable;
- keyboard, accessible names and focus return;
- target-width overflow regressions;
- absence of new schema, migration and prohibited financial/privacy changes.

## Stop conditions

Stop before implementation if any requirement needs:

- a schema, migration or persistent data-model change;
- a data rewrite/backfill or hard deletion;
- a calculation, matching, import, report/export, ownership or privacy-rule change;
- removal of an essential correction/recovery path;
- a sixth navigation destination or major information architecture change;
- a new provider, operationally material package, secret or environment variable;
- a brand decision not resolvable from the approved assets.

## Exclusions

No Basiq, live bank connection, AI, payment, paywall, external notification, tax advice, ATO integration, Property profit/yield/equity/valuation/net-worth, loan forecasting, debt/credit advice, household mode, document storage, public launch, App Store submission or later milestone work.

## Client review state

Milestone 4 will stop after QA and remain open. The consolidated client checklist must cover Phase 4 Milestones 1-4 and representative signed-in mobile and desktop visual review. No milestone may be accepted or closed on the client's behalf.
