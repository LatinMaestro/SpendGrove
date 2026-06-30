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

Status: formally accepted and closed by the client on 22 June 2026.

Objective:

Move SpendGrove from browser-local prototype storage toward secure account-based persistence, durable transactions, durable imports and safe audit history while preserving privacy-first CSV handling and review-before-commit.

Closure evidence:

- All approved implementation PRs 3A.0 through 3A.9 are merged.
- Preview database migrations completed successfully.
- Functional PRs passed the Vercel test and production-build gate.
- `docs/PHASE_3A_SUMMARY.md` contains the final delivery evidence, privacy confirmation, accepted limitations and closure record.
- Final signed-in client retesting completed with no further acceptance comments.
- No Production migration was run.
- No Phase 4 or later module started.

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

Status: merged and accepted.

- Provide explicit browser-local manual transaction migration to account storage.
- Preserve the device copy on failure and prevent duplicate retry writes.
- Verify full Phase 3A workflows.
- Produce `docs/PHASE_3A_SUMMARY.md` and the non-technical user-testing checklist.

## Phase 3B — Loans-First Foundations

Status: Milestones 1 and 2 are formally accepted and closed. Milestone 3 was approved on 30 June 2026 under Autonomous Phase Delivery Mode; PR 3B.9 is active.

Current progress:

- PR 3B.0 merged in #49.
- PR 3B.1 merged in #50.
- The minimal `CAR_LOAN` amendment merged in #53.
- Preview migration run 27958341458 completed successfully.
- No Production migration ran.
- PR 3B.2 merged in #54.
- PR 3B.3 merged in #55.
- Final accepted Milestone 1 main Vercel deployment is green: https://vercel.com/latinmaestros-projects/spendgrove/DmX3T1SbgYwf2EHECNuwbpzMCPqb
- Final functional Milestone 1 main deployment before closure docs is green: https://vercel.com/latinmaestros-projects/spendgrove/DjjRAXdTXP4uRjETdTdavhw4zvD9
- Full tests: 60 files / 352 tests passed; TypeScript and production build passed.
- `docs/PHASE_3B_MILESTONE_1_SUMMARY.md` is the client review package.
- Client signed-in retesting completed on 26 June 2026 with no further acceptance comments.
- The client approved `docs/PHASE_3B_MILESTONE_2_PROPOSAL.md` on 28 June 2026.
- PR 3B.4 merged in #62: durable reviewed repayment commit and safe aggregate history.
- PR 3B.5 merged in #63: repayment history, structured detail and archive/restore.
- PR 3B.6 merged in #64: deterministic high, medium and explicit manual reconciliation suggestions.
- PR 3B.7 merged in #65: user-confirmed link/unlink/relink, split-loan allocation and no-double-count safeguards.
- PR 3B.8 completed the QA, Vercel and client testing package.
- Milestone 2 acceptance hardening merged in PR #68 and its permanent handoff update merged in PR #69.
- Milestone 2 required no schema change, Preview migration or Production migration.
- Full tests after acceptance hardening: 65 files / 380 tests passed; TypeScript and production build passed.
- Final accepted functional Milestone 2 main deployment: https://vercel.com/latinmaestros-projects/spendgrove/Gb2Bs2AveMSiiShDnZkJq3DgocFs
- `docs/PHASE_3B_MILESTONE_2_SUMMARY.md` is the client review package.
- Client signed-in retesting completed on 30 June 2026 with no further acceptance comments.
- `docs/PHASE_3B_MILESTONE_3_PROPOSAL.md` is approved; PRs 3B.9-3B.13 are authorised subject to its stop gates.

Delivered objective:

Establish privacy-safe loan foundations with optional supporting property metadata plus reviewable loan repayment reconciliation, without beginning tax reports, dashboard statistics or Phase 4.

Delivered PR sequence:

1. Financial rules and data-contract decision record.
2. Property, loan account, repayment and reconciliation schema foundation.
3. Loans-first metadata management with optional property linking.
4. Browser-local loan CSV mapping and review.
5. Durable loan repayment commit with safe history.
6. Reconciliation suggestions, manual link/unlink and no-double-count safeguards.
7. Phase 3B QA, Vercel review and client testing.

The detailed inclusions, exclusions, migration gates, privacy risks and stop conditions are in `docs/PHASE_3B_PROPOSAL.md`.

Milestone 1 migration gate: completed. The approved Phase 3B foundation migration ran against Preview only. No Production migration has run.

Milestone 2 gate: formally accepted and closed on 30 June 2026. Milestone 3 is approved for correction, duplicate re-import safety and non-destructive cleanup only. Stop after PR 3B.13 for client retesting. Do not start Phase 4, Home dashboard statistics, tax/EOFY reporting, Basiq, AI, payments or later modules.

## Broader Phase 3 scope — Loans, Properties and Tax

Only begin through separately approved subphases.

Scope:

- LoanAccount;
- home/personal loan CSV import;
- reconciliation engine;
- property records;
- EOFY/property reports.

The delivered Phase 3B milestones are a limited first slice of this broader scope. EOFY/property reporting and automated tax treatment are not included and remain unapproved.

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
