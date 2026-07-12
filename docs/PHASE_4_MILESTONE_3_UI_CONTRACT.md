# Phase 4 Milestone 3 UI Contract - Beginner-first Simplification

Status: approved implementation contract

Date: 12 July 2026

## Objective

Make the existing SpendGrove experience exceptionally simple for beginner budgeting-app users. This milestone changes presentation, hierarchy, wording and disclosure only. It adds no financial capability and changes no product rule.

> Show users only what they need for the task they are currently completing.

## User value

- A first-time user can identify the next action without finance knowledge.
- Everyday tasks remain prominent while uncommon management actions stay reachable.
- Empty or irrelevant modules do not make the app feel unfinished.
- Plain English replaces internal implementation terminology.
- Mobile screens remain calm, readable and accessible.

## Delivery sequence

Internal labels are 4.12-4.17 because Phase 4 Milestone 2 already used 4.6-4.8.

1. 4.12 - contract and interface audit, documentation only.
2. 4.13 - Home and existing navigation simplification.
3. 4.14 - Import and transaction simplification.
4. 4.15 - regular-payment and budget simplification.
5. 4.16 - Loans, Property records and Settings simplification.
6. 4.17 - accessibility/mobile QA and consolidated deferred testing package.

## Global interface rules

### Primary action

Each screen, card, dialog or workflow step has one visually dominant action where practical. Secondary actions use quieter styling. Destructive and uncommon actions never compete with the primary action.

### Progressive disclosure

Visible by default:

- information required to understand the current task;
- the primary action;
- warnings or choices required for a safe financial decision;
- current values the user is about to save;
- recoverable error guidance.

Move behind a labelled detail, More, archived/history or advanced section:

- uncommon correction and archive management;
- technical import/mapping detail after confident mapping;
- repayment component and matching detail;
- merchant-rule management;
- Property record/report detail not needed for the current loan task;
- historical import outcomes;
- development-only reset controls.

Do not hide required review decisions, actionable duplicate warnings, unlink-before-edit requirements, transaction values being committed, or privacy warnings when user action is needed.

### Empty states

Do not render a full feature section merely to say it has no content. Use either no section or one concise empty state with the next useful action. Never show empty financial statistics as meaningful values.

### Language

Prefer Money in, Money out, Spending this month, Budget left, Regular payments, Every 2 weeks, Review transactions, Link to property, Repayment match, Details, Archive and Restore.

Do not expose unexplained provenance, cadence, variance, confidence band, metadata, durable record or cashflow entity. “Reconciliation” becomes “repayment match” or equivalent plain English in beginner-facing UI.

Existing safety disclaimers remain concise and accurate, including “Record keeping only - not tax advice.”

### Simple Mode

Simple Mode remains the default. It uses the same routes and data; no new preference or mode is added. Advanced tools are deliberately opened and essential data/correction access remains available.

## Screen contracts

### Home

Show spending this month, current budget position when budgets exist, confirmed regular payments when they exist, and current review actions when relevant. Hide empty sections. Keep existing routes and add no tab. Property, tax, loan-balance and net-worth statistics remain forbidden.

### Transactions

Prioritise date, safe description/merchant, category and amount. One row action opens details. Edit, duplicate, Property link, archive/delete and other secondary actions remain in details or a clearly labelled More area. Manual create/edit retains all approved fields and validation.

### CSV Import

The visible sequence is Choose file, confirm mapping only when needed, review transactions, import. Confident mapping presents a short confirmation with optional More options. Import/Skip/Merge remain explicit and unchanged. Relevant duplicate warnings, invalid-row errors and required choices remain visible. Private-field scanning remains internal unless user action is required.

### Regular payments

Use Suggested regular payment, Confirmed regular payment, Dismissed and Archived. Show Confirm/Dismiss only for suggestions, Edit/Archive only for active confirmed records, Show suggestion again only for current dismissed suggestions, and Restore only for archived records. Archived/dismissed sections are secondary by default. Detector rules do not change.

### Budgets

Show monthly amount, spent and remaining in calm language. Use concise progress and no complex chart. Archived budgets are secondary by default. Create/Edit/Archive/Restore remain state-specific. Monthly formula, refund limitation and no-rollover rule do not change.

### Loans and Property records

Loans remains the advanced area and current navigation entry. Loan Accounts appear first. Repayment history, breakdown components and repayment-match details use labelled disclosure. Property records remain supporting metadata and current linked-record views. Reporting/export appears only where a Property exists. No Reports or Properties tab is added.

### Settings

Group everyday preferences, privacy/data information and advanced management separately. Technical history, development reset and uncommon tools sit in labelled secondary sections. Unavailable future controls do not clutter the normal view.

## Loading, success and error states

- Loading states identify the item being loaded in plain English.
- Success messages use safe aggregate counts or general wording.
- Errors are short, announced accessibly and explain whether retry is safe.
- Failed requests keep user input where currently supported.
- Submit controls prevent duplicate requests and show progress.
- Disabled controls are not shown unless their unavailable reason is useful.

## Accessibility and mobile rules

Use logical headings, visible labels for important actions, accessible names for icon controls, predictable focus/dialog behaviour, live status/error regions, practical 44px touch targets, safe wrapping for long names, no known horizontal overflow, and status signals that do not rely on colour alone.

## Data, calculations and no-double-count

No server calculation or persistence rule changes:

- everyday transactions remain the only cashflow records;
- recurring and budget records remain planning records;
- loan repayment breakdowns remain analytical records;
- split, transfer, refund and duplicate rules remain unchanged;
- Property links and report/export eligibility remain unchanged;
- no hidden UI action creates extra transactions or links.

## Privacy

Do not expose or newly use raw CSV rows, filenames, raw narration, account references, BSBs, card/customer/loan/lender identifiers, balances, exact addresses, secrets or connection strings. Simplification must not remove privacy warnings required for user action.

## Schema assessment

No Prisma schema change, migration, data rewrite, backfill, package, provider, secret or environment change is needed or authorised.

## Exclusions and mandatory stops

Stop before removing essential functionality; changing calculations, recurrence thresholds, budgets, parsing, duplicate scoring, Import/Skip/Merge, Property links, reports or exports; adding schema/migration, new navigation, package/provider/secret/environment state, notifications, Basiq, AI, payments, tax, Property/net-worth/valuation, loan forecasting, household mode, documents, launch or later modules.

## Client review

After 4.17, stop with Phase 4 Milestones 1, 2 and 3 open. The client will use the consolidated checklist in `docs/DEFERRED_CLIENT_RETESTING.md`.
