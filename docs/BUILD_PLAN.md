# Build Plan

This plan is the working sequence for Codex or another autonomous coding agent. It must remain aligned with the v2.0.1 master specification.

## Delivery principle

Build progressively. Do not attempt to build the full product at once.

SpendGrove now uses Autonomous Phase Delivery Mode. Once the client approves a phase objective and PR sequence, the agent may create focused PRs, run tests/build/Vercel checks, self-review, merge green in-scope routine PRs and continue through the approved sequence without waiting for PR-by-PR client approval.

The agent must stop for the client when a stop condition in `docs/AUTONOMOUS_DELIVERY_MODE.md` is triggered.

Each phase must end with a complete Phase Summary Report and non-technical user-testing checklist before the agent recommends formal closure.

## Phase 1 — MVP Foundation

Status: closed and accepted by the client.

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
- Add row actions: Import, Skip and Merge.
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

Status: closed and accepted by the client.

Scope:

- inline category creation;
- apply category to same merchant;
- saved import profiles;
- stronger generic mapping;
- merchant aliases;
- parser regression fixtures across supplied bank samples.

## Phase 3A — Persistence & Commit Foundation

Status: implementation complete; ready for final client acceptance testing. Formal closure remains a client decision.

Objective:

Move SpendGrove from browser-local prototype storage toward secure account-based persistence, durable transactions, durable imports and safe audit history while preserving privacy-first CSV handling and review-before-commit.

Closure evidence:

- All approved implementation PRs 3A.0 through 3A.9 are merged.
- Preview database migrations completed successfully.
- Functional PRs passed the Vercel test and production-build gate.
- `docs/PHASE_3A_SUMMARY.md` contains the full merge register, privacy evidence, limitations and non-technical testing checklist.
- Do not begin a later phase until the client accepts or closes Phase 3A and explicitly approves the next scope.

### PR 3A.0 — Auth/database decision record

Status: merged.

- Document Clerk, Neon Postgres, Prisma and Vercel architecture decisions.
- Confirm server-only authenticated runtime data access.
- Confirm user ownership, migration policy and privacy rules.

### PR 3A.1 — Server persistence scaffolding

Status: merged.

- Add server-only Prisma access boundaries.
- Add build-safe environment validation.
- Add Prisma lifecycle pattern for Vercel/serverless use.
- Add temporary server-side auth/user context stub and ownership helpers.

### PR 3A.2 — Production auth and user provisioning

Status: merged.

- Add Clerk auth foundation.
- Add sign-in/sign-up routes and middleware.
- Replace production use of the stub with Clerk-backed current-user context.
- Add minimal user identity mapping fields.
- Lazily create durable `User` and `UserSettings` on first authenticated access.

### PR 3A.3 — Durable manual transactions

Status: merged.

- Persist manual transactions to PostgreSQL for authenticated users.
- Preserve integer-cent money handling, soft delete and user ownership.
- Preserve browser-local fallback.

### PR 3A.4 — Durable custom categories

Status: merged.

- Persist custom categories for authenticated users.
- Keep seeded categories immutable.
- Preserve archive/restore behaviour and duplicate-name safeguards.

### PR 3A.5 — Durable saved import profiles

Status: merged.

- Persist safe saved import profiles for authenticated users.
- Store only safe structural mapping metadata.
- Exclude filenames, sample values, raw rows, balances and private identifiers.

### PR 3A.6 — Durable merchant rules and aliases

Status: merged.

- Persist safe merchant aliases and local rules for authenticated users.
- Store only safe cleaned merchant names, alias keys, category IDs and safe metadata.
- Do not store raw bank descriptions or private references.

### PR 3A.7 — Import commit execution

Status: merged.

- Commit reviewed Import / Skip / Merge decisions to durable storage.
- Create transactions only from safe mapped/reviewed fields.
- Preserve review-before-commit, idempotency and user ownership.

### PR 3A.8 — Audit and history hardening

Status: merged.

- Present safe import batch/history metadata.
- Present safe aggregate audit events for user-owned changes.
- Exclude raw CSV and private bank values.

### PR 3A.9 — Migration assistant and Phase 3A QA closure

Status: implementation merged; final QA documentation ready for client review.

- Provide explicit browser-local manual transaction migration to account storage.
- Preserve the device copy on failure and prevent duplicate retry writes.
- Verify full Phase 3A workflows.
- Produce `docs/PHASE_3A_SUMMARY.md` and the non-technical user-testing checklist.

## Phase 3 — Loans, Properties and Tax

Only begin after explicit client approval following Phase 3A closure.

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

- export/delete;
- privacy policy;
- monitoring;
- security hardening;
- App Store readiness.

Production authentication and persistence foundations are handled in Phase 3A. Do not repeat or expand them here without a new approved plan.

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

Vercel preview deployments are configured. User-facing PRs must include preview links and follow `docs/VERCEL_VISUAL_REVIEW.md`.
