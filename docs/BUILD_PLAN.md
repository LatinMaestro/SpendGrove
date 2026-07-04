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

Status: Milestones 1, 2 and 3 are formally accepted and closed. No further Phase 3B implementation is authorised.

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
- PR 3B.9 merged in #71: correction and duplicate-safety contract.
- PR 3B.10 merged in #72: safe structured repayment correction with unlink-before-edit and stale-edit protection.
- PR 3B.11 merged in #73: exact structured duplicate warnings, default exclusion, possible-overlap review and per-row deliberate override.
- PR 3B.12 merged in #74: active/archived repayment filtering and bounded non-destructive cleanup.
- PR 3B.13 merged in #75 with the final Milestone 3 QA, Vercel evidence and client testing package.
- Loan CSV post-save navigation acceptance hardening merged in #76.
- Milestone 3 required no schema change, Preview migration or Production migration.
- Final Milestone 3 acceptance-hardening verification: 66 test files / 398 tests passed; TypeScript and production build passed.
- Final accepted Milestone 3 main deployment is green: https://vercel.com/latinmaestros-projects/spendgrove/47tZxLxacyMGS814n9Dhbb2r8p4k
- `docs/PHASE_3B_MILESTONE_3_SUMMARY.md` is the client review package.
- Client signed-in retesting completed on 1 July 2026 with no further acceptance comments.

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

Milestone 2 gate: formally accepted and closed on 30 June 2026. Milestone 3 gate: formally accepted and closed on 1 July 2026. Review `docs/PHASE_3C_MILESTONE_1_PROPOSAL.md` only; do not start implementation, Phase 4, Home dashboard statistics, tax/EOFY reporting, Basiq, AI, payments or later modules without explicit approval.

## Broader Phase 3 scope — Loans, Properties and Tax

Only begin through separately approved subphases.

Scope:

- LoanAccount;
- home/personal loan CSV import;
- reconciliation engine;
- property records;
- EOFY/property reports.

The delivered Phase 3B milestones are a limited first slice of this broader scope. EOFY/property reporting and automated tax treatment are not included and remain unapproved.

## Phase 3C Milestone 1 - Property-Linked Record-Keeping Foundations

Status: formally accepted and closed on 3 July 2026 after client retesting completed with no further acceptance comments. PRs #78-#85 contain the implementation, acceptance hardening and permanent deployment handoff.

PR 3C.1 verification before migration: Prisma format/generation/validation passed; 67 test files / 402 tests passed; TypeScript and production build passed.

The client approved the Preview-only migration on 2 July 2026. Workflow run `28552337732` completed successfully from `main` at `f3778c03b45981ac831066cfb9ae93f709075e84` using Preview-only secrets. No Production migration ran and no application code had written the new table. The separately approved PR 3C.1A development-only transaction reset utility merged in #80 as `7eeb6f7f830d93b86e2e6786935c9f222a97d8c4` before PR 3C.2.

PR 3C.1A verification: 68 test files / 408 tests passed; TypeScript and production build passed. It uses existing soft-delete and unlink lifecycle fields only and introduces no schema, migration, package, provider, secret or environment configuration. PR 3C.2 verification is 69 test files / 413 tests. Final functional verification after PR 3C.3 is 70 test files / 416 tests, TypeScript and production build passed. PRs 3C.2-3C.4 require no further schema or migration change.

Focused acceptance-hardening verification: 71 test files / 424 tests passed; TypeScript and production build passed. The existing reconciliation and Property-link schemas remain unchanged.

Objective: let an authenticated user manually link one eligible owned everyday transaction to one active owned Property as reversible supporting metadata, while preserving the transaction as the only cashflow record.

Approved sequence:

1. PR 3C.0 - property record-keeping contract.
2. PR 3C.1 - exact minimal schema foundation and Preview migration plan.
3. Stop before any Preview migration and obtain explicit client approval.
4. PR 3C.2 - manual property link, unlink and relink after the approved Preview migration succeeds.
5. PR 3C.3 - neutral Property record-keeping activity view.
6. PR 3C.4 - QA, Vercel review and client testing package.

The focused amendment permits only automatic reconciliation of exactly one revalidated high-confidence repayment candidate; it does not permit automatic Property matching or `PropertyTransactionLink` creation. The milestone still excludes tax/EOFY/accountant reports, deductibility decisions, property/Home statistics, transaction allocation, new providers and all Phase 4 or later work. No Production migration is authorised.

Closure evidence: 71 test files / 424 tests, TypeScript type-check and production build passed. The final functional main deployment is https://vercel.com/latinmaestros-projects/spendgrove/7jPxdoX8ptmf72bP3MKiuCiTLezZ and the final documentation handoff deployment is https://vercel.com/latinmaestros-projects/spendgrove/D5Jk9T4ek1rfghB2JR7tafxhzwtq. Phase 3C used one approved Preview-only migration workflow run (`28552337732`) for Milestone 1; no Production migration has run.

The client selected Option A from `docs/NEXT_MILESTONE_OPTIONS.md` on 3 July 2026. Option B remains unapproved; do not start Phase 4, recurring, budgets, insights, Home dashboard statistics, Basiq, AI, payments or later modules.

## Phase 3C Milestone 2 - Property/EOFY Reporting Contract and Foundations

Status: implementation and local QA complete under Autonomous Phase Delivery Mode. PRs 3C.5-3C.8 are merged; PR 3C.9 is ready for Vercel verification and client review packaging. The milestone is not formally closed and must stop at client retesting.

PR 3C.5 merged in #87 as `8410f785f53a32f673319143883bcb1468d0e7b5`. Its contract permits only explicit neutral classifications, four separate gross record-keeping summaries plus counts, and an ephemeral safe-field CSV; it forbids net/profit, deductibility, tax, loan-component and Home dashboard calculations.

PR 3C.6 schema foundation: one `PropertyRecordClassification` enum and one `PropertyReportReview` table containing only generated ID, owner/Property/transaction IDs, classification and timestamps. The additive migration is applied to Preview only and verified; no Production migration has run.

PR 3C.6 verification: Prisma format/generation/validation passed; 72 test files / 429 tests passed; TypeScript type-check and production build passed. No migration was run.

PR 3C.6 merged in #88 as `7e7e918872bcfece6acb566beee86a55d4d89e3d`. Preview deploy run `28639135158` applied the approved migration once at workflow-hardening commit `ceefe0a5df3e1fb59d42cda0339d59f0ff72b2d3`. Verification-only run `28657045177` at correction commit `563498c1095baffedbcc3d12d0645c81dceb496a` skipped deploy and passed exact schema, empty-table and unchanged aggregate-count checks. The migration is Preview-only; no Production migration has run. PR 3C.7 may continue.

Approved sequence:

1. PR 3C.5 - reporting and financial-rules contract.
2. PR 3C.6 - exact schema foundation and Preview migration plan.
3. PR 3C.7 - Property record review foundation.
4. PR 3C.8 - approved summary/export foundation.
5. PR 3C.9 - QA and client review package.

PR 3C.7 implements current-state review for one owned Property and Australian financial year. It permits only explicit compatible neutral classifications, applies ownership/active-state/relationship and stale-edit validation on every write, marks incompatible saved classifications for re-review, and calculates no summary or report value.

PR 3C.7 merged in #93 as `4432d2ac615127ac853edcdf0445a4dd5d149002`. PR 3C.8 derives only the contract-approved separate gross groups and counts from those revalidated rows and provides one user-confirmed, ephemeral CSV containing only the ten approved safe columns. It calculates no net result or tax outcome and stores no report/export snapshot.

PR 3C.8 merged in #94 as `9fd5dfab86d462666d490adc9c69d807950e77c1`. PR 3C.9 completed the privacy, ownership, no-double-count, calculation, export and attached-sample compatibility audit. The 19 private-local supplied formats all reached review; ambiguous common headers remain generic rather than being falsely assigned to a bank. Final local verification: 76 test files / 453 tests, TypeScript and production build passed.

The controlling financial, privacy, classification, calculation, export and no-double-count rules are in `docs/PHASE_3C_MILESTONE_2_REPORTING_CONTRACT.md`. No tax advice, automatic deductibility, ATO integration, Property profit/yield/equity/valuation/net-worth feature, Home dashboard statistics, Phase 4 or later module is authorised.

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
