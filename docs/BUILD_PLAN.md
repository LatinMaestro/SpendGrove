# Build Plan

This plan is the working sequence for Codex or another autonomous coding agent. It must remain aligned with the v2.0.1 master specification.

## Delivery principle

Build progressively. Do not attempt to build the full product at once.

## Phase 1 — MVP Foundation

### Task 1.1 — Project foundation

- Select and initialise the app stack.
- Create mobile-first routing/app shell.
- Add SpendGrove theme tokens.
- Add base layout, navigation and placeholder screens.
- Add development/test commands to `README.md`.
- Provide screenshots or preview notes.

### Task 1.2 — Data model foundation

- Add account-ready user ownership fields, even if auth is a stub.
- Add category, transaction, import batch and merchant-rule foundations.
- Store money as integer cents.
- Add validation schemas.
- Add seed categories.

### Task 1.3 — Onboarding and settings

- Add privacy-first introduction.
- Add Simple Mode default.
- Add feature flags.
- Add settings screen foundation.
- Make clear that advanced modules are future/disabled unless enabled.

### Task 1.4 — Manual transactions

- Add transaction list.
- Add create/edit/delete/duplicate where practical.
- Add transaction detail screen/modal.
- Add category selection.
- Add future CSV match hint foundation.
- Add duplicate warning foundation where practical.

### Task 1.5 — CSV import foundation

- Add Import landing page.
- Add upload/parse foundation.
- Add privacy scan foundation.
- Add safe column detection for private fields.
- Add bank detection/profile placeholders.
- Add manual mapping foundation where practical.
- Add synthetic sample fixtures.

### Task 1.6 — Import review and history foundation

- Add review-before-commit workflow.
- Add row actions: Import, Skip, Merge.
- Add editable category/merchant foundations.
- Add import summary.
- Add import history and batch detail foundation.

### Task 1.7 — Merchant rule foundation

- Add local merchant cleanup utility.
- Add merchant profile/rule structure where practical.
- Add apply-to-same-merchant foundation where practical.
- Do not implement Basiq.

### Task 1.8 — Phase 1 QA and review

- Run full checks.
- Provide UI screenshots/previews.
- Provide CSV test report using synthetic fixtures.
- Provide known limitations.
- Request client approval for Phase 2.

## Phase 2 — Import Refinement

Only begin after client approval.

Scope:

- inline category creation;
- apply category to same merchant;
- saved import profiles;
- stronger generic mapping;
- merchant aliases;
- parser regression fixtures across supplied bank samples.

## Phase 3 — Loans, Properties and Tax

Only begin after client approval.

Scope:

- LoanAccount;
- home/personal loan CSV import;
- reconciliation engine;
- property records;
- EOFY/property reports.

## Phase 4 — Recurring, Budgets and Insights

Only begin after client approval.

Scope:

- recurring/subscription detection;
- budgets;
- dashboard refinement;
- trends and reminders.

## Phase 5 — Production Readiness

Only begin after client approval.

Scope:

- production auth;
- export/delete;
- privacy policy;
- monitoring;
- security hardening;
- App Store readiness.

## Phase 6 — Desktop Web Platform

Only begin after client approval.

Scope:

- desktop import centre;
- bulk editing;
- advanced reports;
- account/billing;
- future accountant workspace.

## Phase 7 — Optional Enhancements

Only begin after separate approvals.

Scope:

- Basiq sandbox-to-production review;
- AI assistants;
- household mode;
- documents;
- net worth;
- accountant packs.


## Root-level plan pointer

`PLAN.md` exists at the repository root for agents that look for simple planning files. The authoritative active build plan remains this file.

## Visual preview setup task

Once the app shell can run, connect the GitHub repository to Vercel and enable preview deployments for pull requests. From that point, user-facing UI PRs should include preview links and follow `docs/VERCEL_VISUAL_REVIEW.md`.
