# Build Plan

## Current active delivery — 17 July 2026

Status:

- Phase 4 Milestones 1–4 are accepted and closed.
- Phase 5 repository implementation through Milestones 1–6 is technically complete, pending deferred client acceptance and not formally closed.
- PR #165 merged as `8146c37040da98c9e08bac3123c8f78a3ef0caec` and records the complete-product audit, feature register, App Store delivery plan, decision register and revised Phase 6–15 roadmap.
- The former limited Phase 6–7 ending is superseded.
- Phase 6 — Desktop Web Platform and Bulk Workflows is active.
- Immediate task: Milestone 6.0 desktop contract and interface inventory, including exact bulk-action/undo safety rules and schema assessment.
- After 6.0, continue through the approved Phase 6 sequence and later merged-roadmap phases while all mandatory gates are satisfied.
- Consolidated client review is deferred until the complete pre-release application is ready.

Current boundaries:

- preserve accepted Phase 1–5 behaviour and financial/privacy rules;
- do not work outside `docs/COMPLETE_PRODUCT_DELIVERY_ROADMAP.md`;
- contract material schema changes before implementation and use Preview-only migration gates;
- no Production migration, private Production financial-row access or unapproved backfill;
- no provider purchase/upgrade, secret/environment exposure or live external-provider activation;
- no automatic browser-local deletion/migration;
- no real-user invitation, public launch, TestFlight external distribution or App Store submission;
- do not formally close Phase 5 or later phases without client acceptance.

Controlling records:

- `docs/COMPLETE_PRODUCT_DELIVERY_ROADMAP.md`;
- `docs/COMPLETE_PRODUCT_CURRENT_STATE_AUDIT.md`;
- `docs/COMPLETE_PRODUCT_FEATURE_REGISTER.md`;
- `docs/APP_STORE_END_TO_END_DELIVERY_PLAN.md`;
- `docs/REMAINING_CLIENT_AND_OPERATOR_DECISIONS.md`;
- `docs/PHASE_5_SUMMARY.md`;
- `docs/PHASE_5_CLIENT_REVIEW_CHECKLIST.md`;
- `docs/CODEX_CURRENT_HANDOFF.md`.

## Delivery principle

Build progressively. Do not attempt to build the full product at once.

SpendGrove now uses Autonomous Phase Delivery Mode. Once the client approves a phase objective and PR sequence, the agent may create focused PRs, run tests/build/Vercel checks, self-review, merge green in-scope routine PRs and continue through the approved sequence without waiting for PR-by-PR client approval.

The agent must stop for the client when a stop condition in `docs/AUTONOMOUS_DELIVERY_MODE.md` is triggered.

Each phase must end with a complete Phase Summary Report and non-technical user-testing checklist before the agent recommends formal closure.

Vercel usage note: as of 8 July 2026, the client is also running several apps and Vercel usage is constrained. For future approved implementation phases, prefer larger safe development batches before each Vercel push where this does not weaken scope control, tests, review gates, privacy boundaries or mandatory stop conditions.

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

The client selected the then-proposed Phase 3C Milestone 2 reporting option on 3 July 2026. That milestone is now formally accepted and closed. Current next options are proposal-only in `docs/NEXT_MILESTONE_OPTIONS.md`; do not start Phase 4, recurring, budgets, insights, Home dashboard statistics, Basiq, AI, payments or later modules without explicit approval.

## Phase 3C Milestone 2 - Property/EOFY Reporting Contract and Foundations

Status: formally accepted and closed on 7 July 2026 after client Vercel retesting completed with no further acceptance comments.

PR 3C.5 merged in #87 as `8410f785f53a32f673319143883bcb1468d0e7b5`. Its contract permits only explicit neutral classifications, four separate gross record-keeping summaries plus counts, and an ephemeral safe-field CSV; it forbids net/profit, deductibility, tax, loan-component and Home dashboard calculations.

PR 3C.6 schema foundation: one `PropertyRecordClassification` enum and one `PropertyReportReview` table containing only generated ID, owner/Property/transaction IDs, classification and timestamps. The additive migration is applied to Preview only and verified; no Production migration has run.

PR 3C.6 verification: Prisma format/generation/validation passed; 72 test files / 429 tests passed; TypeScript type-check and production build passed. No migration was run.

PR 3C.6 merged in #88 as `7e7e918872bcfece6acb566beee86a55d4d89e3d`. Preview deploy run `28639135158` applied the approved migration once at workflow-hardening commit `ceefe0a5df3e1fb59d42cda0339d59f0ff72b2d3`. Verification-only run `28657045177` at correction commit `563498c1095baffedbcc3d12d0645c81dceb496a` skipped deploy and passed exact schema, empty-table and unchanged aggregate-count checks. The migration is Preview-only; no Production migration has run.

Completed sequence:

1. PR 3C.5 - reporting and financial-rules contract.
2. PR 3C.6 - exact schema foundation and Preview migration plan.
3. PR 3C.7 - Property record review foundation.
4. PR 3C.8 - approved summary/export foundation.
5. PR 3C.9 - QA and client review package.

PR 3C.7 implements current-state review for one owned Property and Australian financial year. It permits only explicit compatible neutral classifications, applies ownership/active-state/relationship and stale-edit validation on every write, marks incompatible saved classifications for re-review, and calculates no summary or report value.

PR 3C.7 merged in #93 as `4432d2ac615127ac853edcdf0445a4dd5d149002`. PR 3C.8 derives only the contract-approved separate gross groups and counts from those revalidated rows and provides one user-confirmed, ephemeral CSV containing only the ten approved safe columns. It calculates no net result or tax outcome and stores no report/export snapshot.

PR 3C.8 merged in #94 as `9fd5dfab86d462666d490adc9c69d807950e77c1`. PR 3C.9 completed the privacy, ownership, no-double-count, calculation, export and attached-sample compatibility audit. The 19 private-local supplied formats all reached review; ambiguous common headers remain generic rather than being falsely assigned to a bank. Final local verification: 76 test files / 453 tests, TypeScript and production build passed.

PR 3C.9 merged in #95 as `86d039f69f6dc70a30fd13f4e4430edb93acbcfb`. Suggestion hardening PR #96 merged as `6e70c8906cdd7f38e751ff2f0b257ab03b20136c` but is superseded/de-emphasised in the normal UI by the simpler accepted direction. Final linked-record simplification PR #97 merged as `3fa62d4f2ee387754198a317ca112314aad4725f`: current eligible linked records feed reports and exports directly without a report-only classification save.

Focused hardening verification: 76 test files / 458 tests passed; TypeScript type-check and clean production build passed.

Linked-record simplification verification: 76 test files / 458 tests passed; TypeScript type-check and clean production build passed. Live `/`, `/loans` and `/transactions` returned HTTP 200 without internal errors. Final accepted main deployment: https://vercel.com/latinmaestros-projects/spendgrove/BXE1ynjLmCEuxDXL8NhZc79bSsBr

The controlling current-state eligibility, privacy, calculation, export and no-double-count rules are in `docs/PHASE_3C_MILESTONE_2_REPORTING_CONTRACT.md`, including the client-approved linked-record simplification amendment. The existing Preview-only review table remains dormant and untouched; no schema or migration change is required. The accepted export has exactly `record_id`, `financial_year`, `property_nickname`, `transaction_date`, `transaction_type`, `amount_aud`, `category_label`, `connection_source` and `spendgrove_notice`; it excludes `record_classification`, merchant descriptions, narration, filenames, raw rows, account references, identifiers, exact addresses, balances, emails, audit data, hidden columns and totals. No tax advice, automatic deductibility, ATO integration, Property profit/yield/equity/valuation/net-worth feature, Home dashboard statistics, Phase 4 or later module is authorised.

Closure evidence is in `docs/PHASE_3C_MILESTONE_2_SUMMARY.md`.

## Phase 3C Milestone 3 - Import-review Property Linking and Property-Record Workflow Polish

Status: formally accepted and closed on 8 July 2026 after client Vercel retesting completed with no further acceptance comments.

PR 3C.10 merged in #99 as `96262b347c5ae0d99366bd4d0ab73e2e54f45ef7`. It created `docs/PHASE_3C_MILESTONE_3_IMPORT_PROPERTY_LINKING_CONTRACT.md`, confirmed Import rows as eligible, Skip rows as ineligible and Merge rows as post-merge/manual-link only for this milestone.

Objective:

Make the accepted Property reporting workflow easier by letting users link transactions to Properties earlier, especially during everyday CSV import review, while preserving user control, privacy-first CSV handling and the no-tax-advice boundary.

Target workflow:

1. Upload bank CSV.
2. Review transactions.
3. Categorise transactions.
4. Link relevant transactions to a Property during review where appropriate.
5. Commit reviewed rows.
6. Property records/reports automatically include linked records later.
7. Loan CSV repayments continue to reconcile to everyday transactions and appear in Property records where the Loan Account belongs to that Property.

Approved sequence:

1. PR 3C.10 - Import-review Property-linking contract.
2. PR 3C.11 - Schema and migration assessment.
3. PR 3C.12 - Import-review Property link UI.
4. PR 3C.13 - Commit integration and safety checks.
5. PR 3C.14 - Manual transaction and workflow polish.
6. PR 3C.15 - QA and client review package.

PR 3C.10 contract rules:

- eligible import-review Property-linking is limited to reviewed everyday bank CSV `Import` rows that can become one future committed transaction;
- `Skip` rows never create transactions or Property links;
- Merge rows are not eligible for pre-commit Property-link selection in this milestone because they point at an existing transaction instead of creating one new future transaction;
- Property links are created only after successful transaction commit and server-side ownership/active-state validation;
- split parents are excluded and eligible split children may be linked;
- manual transaction create/edit Property-link support may be added only if it fits without schema changes or migration;
- copy must remain neutral, such as `Include in property records`, `Link to property` and `Record keeping only - not tax advice`.

Schema/migration gate:

PR 3C.11 must assess whether the existing `PropertyTransactionLink` table can support post-commit links created from import review. Preferred outcome is no schema change, no migration and no durable staging table. Stop if schema changes, Preview migration, Production migration, durable staging state, data rewrite, backfill, table drop, package, provider, secret or environment change is needed.

PR 3C.11 assessment conclusion: `docs/PHASE_3C_MILESTONE_3_SCHEMA_ASSESSMENT.md` confirms the existing `PropertyTransactionLink`, Property-link service and import commit path are sufficient for PRs 3C.12-3C.15 if the implementation creates links only after imported transactions exist and remain owned/eligible. No Prisma schema change, migration, durable staging table, data rewrite, package, provider, secret or environment change is needed.

PR 3C.12 implementation note: add the import-review UI affordance only. Eligible `Import` rows can choose `Include in property records` and select one active owned Property by safe nickname/usage. The choice is transient review state and is cleared/ignored for `Skip` and `Merge` rows. No `PropertyTransactionLink` row is created until PR 3C.13 commit integration, and no schema change or migration is introduced.

PR 3C.13 merged in #102 as `be1234c37c6213e12abf1b8fb526828aa1728aa1`. It extends the existing reviewed import commit request with an optional safe `propertyLinkPropertyId` on `Import` rows only. The commit path creates the transaction first, revalidates active owned Property state server-side, then creates the `PropertyTransactionLink` and safe audit code in the same atomic transaction. `Skip` and `Merge` rows do not create Property links. No schema change, migration, staging table, raw CSV persistence or private source-field persistence was introduced.

PR 3C.14 merged in #103 as `2c2d5608bb6707148d94fc810951f73b14e4d8f5`. It adds the same neutral Property-link control to manual transaction create/edit because this fits the accepted contract without schema changes or migration. The transaction remains the only cashflow record; the Property link remains optional supporting metadata; no tax wording, automatic Property matching or reporting calculation changes were introduced.

PR 3C.15 merged in #104 as `5acd4ace3a4612b1b6a2ba6fafe5cc56dc2d5111`. It is the QA and client review package in `docs/PHASE_3C_MILESTONE_3_SUMMARY.md`.

Final accepted evidence:

- Final main Vercel deployment: https://vercel.com/latinmaestros-projects/spendgrove/8UCAm6Z6KfHKtKfcTUeJfhH3gHP5
- Live route checks passed for `/`, `/loans` and `/transactions`: HTTP 200.
- Final verification: 77 test files / 468 tests passed; TypeScript type-check passed; production build passed.
- No schema change, new Preview migration, Production migration, durable staging table, data rewrite, backfill, table drop, package/provider/secret/env change occurred.
- No Phase 4, Home dashboard statistics, tax advice, automatic deductibility, Basiq, AI, payments, household mode, document storage or later-module work started.

Strict exclusions remain: no Production migration, new Preview migration without separate approval, tax advice, automatic deductibility, ATO integration, Property profit/yield/equity/valuation/net-worth feature, Home dashboard statistics, automatic Property matching, transaction allocation/splitting, documents/receipts/storage, Basiq, AI, payments, household mode, Phase 4, recurring, budgets, insights, new navigation tabs or later modules.

## Phase 4 - Recurring, Budgets and Everyday Insights

### Milestone 1 - Foundations

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed and technically verified; client retesting deferred. Not formally accepted or closed.

Delivered:

- deterministic reviewable recurring/subscription suggestions;
- safe confirm, dismiss, edit and archive lifecycle;
- user-entered monthly category budgets;
- current-month budget progress;
- everyday Home spending/category/budget/recurring overview;
- explicit previous-month comparison;
- preserved privacy and no-double-count rules.

Evidence:

- completed PRs #106-#114;
- latest verification 84 test files / 511 tests;
- TypeScript/lint validity and clean production build passed;
- final main deployment EQhMvit4s8b4SdhsSdZFyE3bMwtZ is Ready;
- Preview migration 20260708090000_phase_4_recurring_budgets_foundation applied once and verified;
- no Production migration ran.

The client is temporarily away from the Vercel environment and explicitly deferred retesting without rejecting or accepting the milestone. The client authorised continued development. Preserve Milestone 1 testability and record any later acceptance feedback as focused hardening.

### Milestone 2 - Recurring and Budget Lifecycle Recovery

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed and technically verified; client retesting deferred. Not formally accepted or closed.

Objective:

- restore archived recurring items;
- review and undo still-relevant dismissed recurring suggestions;
- restore archived monthly budgets;
- make active/archived lifecycle states clear;
- preserve every Milestone 1 formula and boundary.

Controlling documents:

- docs/PHASE_4_MILESTONE_2_CONTRACT.md;
- docs/PHASE_4_MILESTONE_2_SCHEMA_ASSESSMENT.md;
- docs/DEFERRED_CLIENT_RETESTING.md.

Completed sequence:

1. PR 4.6 - contract, no-schema assessment and deferred testing register: #115, merge `9dde5423db6934718e369e66cc9b3f1759bf26ce`.
2. PR 4.7 - recurring and budget lifecycle recovery: #116, merge `71f0b5a50cf6ec65839b83935e779ea5c2ccb59f`.
3. PR 4.8 - regression QA and consolidated deferred client package.

Evidence:

- 84 test files / 513 tests passed;
- TypeScript/lint validity and clean production build passed;
- Preview deployment `CnC9hWFjjRmwx9p4rKhHdVxxmHrC` is Ready;
- main deployment `91RcdUep4v6E21iFRvnt5TTHX8Bx` is Ready;
- public Home, Transactions, Import and Loans routes returned HTTP 200.

Schema assessment: no schema change or migration is required. Use existing ACTIVE/ARCHIVED, archivedAt, updatedAt and owned dismissal-key fields. Stop if this changes.

No reminder behaviour is included. nextExpectedDate remains display context only. No push, email, SMS, due-status threshold, background schedule or external provider is authorised.

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Milestones 1 and 2 remain open pending deferred client retesting. Do not formally accept or close either milestone on the client's behalf.

Strict exclusions: no Preview or Production migration, changed recurring thresholds, fuzzy matching, changed budget formulas, rollover, automatic transaction linking, reminder infrastructure, new navigation, tax advice, Property/net-worth statistics, loan forecasting, Basiq, AI, payments, household mode, document storage, package/provider/secret/environment change or unrelated later module.

### Milestone 3 - Beginner-first UI Simplification and Product Polish

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed and technically verified; client retesting deferred. Not formally accepted or closed.

Objective: simplify presentation and wording across Home, Transactions, Import, regular payments, budgets, Loans, Property records and Settings while preserving all functionality, calculations, privacy and no-double-count rules.

Controlling documents: `docs/PHASE_4_MILESTONE_3_UI_CONTRACT.md`, `docs/PHASE_4_MILESTONE_3_INTERFACE_AUDIT.md`, `docs/PHASE_4_MILESTONE_3_SUMMARY.md` and `docs/DEFERRED_CLIENT_RETESTING.md`.

Completed sequence:

1. 4.12 contract/audit: PR #118, merge `344be702dea5cf82ae771d4d688cf2622a4b1e44`.
2. 4.13-4.16 coherent UI simplification batch: PR #119, merge `cc4d44d17d34ef9b86a064dfd25c536e5a2e6bd7`.
3. 4.17 accessibility/mobile QA and consolidated deferred client package.

Evidence:

- exact PR head `6ab45f6c18e1c0d1c1dcc1ec1bb7d108fa51a4b2`;
- 85 test files / 521 tests passed;
- TypeScript/lint validity and clean production build passed;
- Preview deployment `ESYj1tFsrxZuoPL9No9ZcEiyphZw` is Ready;
- main deployment `GsZrG1sSrzrsSe5nn9Gj4U5qpibr` is Ready;
- public Home, Transactions, Import and Loans routes returned HTTP 200.

Schema assessment: no Prisma schema change, Preview migration, Production migration, data rewrite or backfill occurred. No package, provider, secret, environment, navigation-tab, financial-rule, import-rule, Property-rule or report/export-rule change occurred.

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Phase 4 Milestones 1, 2 and 3 remain open pending explicit client retesting and acceptance. Stop before another milestone.


## Phase 5 — Production Readiness

Status: unapproved and not started.

Only begin after a separate client approval and documentation-first planning gate. The gate must define the exact objective, user value, PR sequence, data and financial rules, privacy/security boundaries, schema and migration assessment, deployment/client review points, exclusions and mandatory stop conditions. Phase 4 closure does not authorise Phase 5 implementation.

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

## Phase 4 Milestone 3 acceptance hardening (completed 13 July 2026)

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed and technically verified; Phase 4 Milestones 1-3 remain open pending consolidated client retesting.

- [x] Freeze rules in `docs/PHASE_4_MILESTONE_3_ACCEPTANCE_HARDENING_CONTRACT.md` (PR #121, merge `54ae6196ed12ff96495b7aed88beec893ddab1df`).
- [x] Deliver month-focused Transactions, searchable category choice and Property progressive disclosure.
- [x] Deliver conservative local category intelligence and stable recurring merchant grouping without changing thresholds.
- [x] Deliver reverse-order high-confidence repayment reconciliation using existing validation and no-double-count rules.
- [x] Deliver Delete wording over the existing recovery-safe lifecycle and category month comparisons.
- [x] Complete full QA, Preview/main Vercel verification, public route smoke checks and consolidated deferred client package.

Implementation: PR #122, merge `8bc4c6e4701554ec2cca0ce74e5aab2d38dcff15`.

Evidence:

- 86 test files / 536 tests passed;
- TypeScript and Next.js lint validity passed;
- clean optimized production build passed;
- Preview deployment `dpl_GrPrQu1QWys6JDfLquwbuW2eEeF5` is Ready;
- main deployment `dpl_AVVZqH2afjZNvPZJF5bp5R3No8sW` is Ready;
- canonical `/`, `/transactions` and `/loans` returned HTTP 200 without console or internal-page errors.

Schema and migration status: no Prisma schema or migration change, no Preview migration, no Production migration, no hard deletion, no data rewrite/backfill, and no package/provider/secret/environment change.

Mandatory next state: stop for client retesting; do not close any Phase 4 milestone or begin another milestone.



## Phase 4 Milestone 3 second client-review hardening (completed 13 July 2026)

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed and technically verified; Phase 4 Milestones 1-3 remain open pending consolidated client retesting.

- [x] Freeze presentation-only rules in `docs/PHASE_4_MILESTONE_3_SECOND_CLIENT_REVIEW_CONTRACT.md` (PR #124, merge `2e5e6f340bf00d41db04d27c9de55fe01021ea9b`).
- [x] Make the initial Transactions month prefer current when populated and otherwise the latest populated owned active month.
- [x] Limit Home to three regular-payment suggestions and reveal one editor/reason at a time.
- [x] Suppress only exact duplicate suggestion identities.
- [x] Replace inline Loan Account histories with compact cards, one selected account and three-item previews.
- [x] Hide budget creation until Add budget.
- [x] Complete focused regression coverage, full build verification, main deployment and consolidated deferred testing updates.

Implementation: PR #125, merge `b6d20c32ac682e36ff5f5f229b8db0846a84bb97`.

Evidence:

- 88 test files / 547 tests passed;
- TypeScript and Next.js lint validity passed;
- clean optimized production build passed;
- Preview deployment `dpl_gHKePj4zDjjWEC8HFZYueNtXhWWC` is Ready;
- main deployment `dpl_8vvdNFvXP2TqHbF5jZCTH2AAMMbu` is Ready;
- canonical `/`, `/transactions` and `/loans` returned HTTP 200.

Schema and migration status: no Prisma schema or migration change, no Preview migration, no Production migration, no hard deletion, no data rewrite/backfill, and no package/provider/secret/environment change.

Mandatory next state: stop for client retesting; do not close any Phase 4 milestone or begin another milestone.

## Phase 4 Milestone 3 third client-review Loans hardening (completed 14 July 2026)

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed and technically verified; Phase 4 Milestones 1-3 remain open pending consolidated client retesting.

- [x] Freeze canonical repayment, Property-transaction deduplication and report-placement rules in `docs/PHASE_4_MILESTONE_3_THIRD_CLIENT_REVIEW_LOANS_CONTRACT.md` (PR #127, merge `04e8099f8f2c6a41cbb3021c3b7efee2afdbff72`).
- [x] Replace the separate Repayment breakdown and Linked everyday transaction histories with one `Loan repayments` presentation.
- [x] Keep principal, interest, fees and balance-after details available only when present and requested.
- [x] Show other eligible Property transactions while excluding repayment cashflows already represented in Loan repayments.
- [x] Keep the accepted Property report/export behind `View property records` without changing its contents, formulas or columns.
- [x] Keep match, unlink, correction, recoverable Delete/Restore and Property management actions accessible.
- [x] Complete full tests, type/lint/build verification, Preview/main deployment and public `/loans` smoke check.

Implementation: PR #128, merge `87012a22bc029d2094ed19f5a8853ad4009f98f3`.

Evidence:

- 89 test files / 553 tests passed;
- TypeScript and Next.js lint validity passed;
- clean optimized production build passed;
- Preview deployment `dpl_71c3ULsevJBSLE427NjEwxtRRYFb` is Ready;
- main deployment `dpl_6U5SJiVuHhZSyZjr5LvLZxx1EPZ4` is Ready;
- canonical `/` and `/loans` returned HTTP 200.

Schema and migration status: no Prisma schema or migration change, no Preview migration, no Production migration, no hard deletion, no data rewrite/backfill, and no package/provider/secret/environment change.

Mandatory next state: stop for consolidated client retesting; do not close any Phase 4 milestone or begin another milestone.

## Phase 4 Milestone 3 final Loans simplicity hardening (completed 14 July 2026)

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed and technically verified; Phase 4 Milestones 1-3 remain open pending consolidated client retesting.

- [x] Freeze the selected-loan subview, repayment-first hierarchy, plain matching copy and separate report dialog in `docs/PHASE_4_MILESTONE_3_FINAL_LOANS_SIMPLICITY_CONTRACT.md` (PR #130, merge `5f907c52ac586e34cc83ffd869b8985a99fc0862`).
- [x] Replace inline Loan expansion with one focused selected-loan view and `Back to loans`.
- [x] Put Loan repayments before Property transactions and remove routine healthy status labels.
- [x] Allow only one repayment detail to be open while keeping edit, match, unlink, Delete and Restore available secondarily.
- [x] Replace technical matching explanations with plain review language without changing any matching rule.
- [x] Lead Property transaction rows with safe category/merchant identity.
- [x] Move the unchanged Property report/export into a focused accessible dialog.
- [x] Complete 90 test files / 558 tests, lint/type validation, optimized build, Preview, merged-main and public `/loans` verification.

Implementation: PR #131, merge `18d416e3ef5ea63f8b86081e11332f7a72634ffa`.

Evidence:

- Preview `dpl_C6onQZPd4U56sJNtgA2j5SGWsAaC` Ready;
- main `dpl_9mAuvoqGkSt9Cw1TqPUAW9zX7DKH` Ready;
- canonical `/` and `/loans` returned HTTP 200.

Schema and migration status: no Prisma schema or migration change, no Preview migration, no Production migration, no data rewrite/backfill, no hard deletion, and no package/provider/secret/environment change.

Mandatory next state: stop for consolidated client retesting; do not close any Phase 4 milestone or begin another milestone.


## Phase 4 Milestone 4 - Beginner-First Full UI Overhaul (approved 14 July 2026)

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed and technically verified. Phase 4 Milestones 1-4 remain open pending consolidated client testing.

Controlling contract: `docs/PHASE_4_MILESTONE_4_UI_OVERHAUL_CONTRACT.md`.

Objective: rebuild the presentation, responsive shell and shared interaction patterns so SpendGrove is calm, compact and obvious to first-time budgeting users without changing any accepted product behaviour.

- [x] Freeze the screen inventory, market-reference findings, approved logo use, visual tokens and progressive-disclosure contract in PR 4.18.
- [x] Add approved public brand assets, responsive mobile/desktop shell, tokens and shared primitives in PR 4.19.
- [x] Redesign Home and onboarding in PR 4.20.
- [x] Redesign Transactions and CSV Import in PR 4.21.
- [x] Redesign Budgets and regular payments in PR 4.22.
- [x] Redesign Loans and Property workflows in PR 4.23.
- [x] Redesign Settings and secondary management in PR 4.24.
- [x] Complete responsive, accessibility and consistency QA in PR 4.25.
- [x] Publish final evidence and consolidated Phase 4 Milestones 1-4 client package in PR 4.26.

Visual deployment gates:

1. responsive shell plus Home;
2. Transactions/Import/Budgets/regular payments;
3. completed app-wide overhaul.

Use local/GitHub-side checks before deployment and do not create documentation-only Vercel builds solely for evidence.

Schema and migration assessment: no Prisma schema change, Preview migration, Production migration, persistent data change, rewrite or backfill is expected or authorised.

Stop if work needs any schema/migration, financial/import/matching/report/privacy-rule change, essential recovery removal, sixth navigation destination, provider, material package, secret, environment variable or unresolved brand decision.

Completed delivery:

- PR #133 / 4.18: `2e6b194da5a20a1c7c66056f91801d4bbb905e03`;
- PR #134 / 4.19-4.20: `7896f28e6a7b954d5108b00127888ced4c58cdc0`;
- PR #135 / 4.21-4.22: `6c8822f7cfbdc1ed222d12ab7b96ba7022a94771`;
- PR #136 / 4.23-4.24: `41523ac25089e74778cf25eb17e195a0dc6caffa`;
- PR #137 / 4.25: `df6e6ef20046fe8dccb409178a3076cf28b87eea`;
- PR #138 / 4.26: evidence and consolidated client package.

Final evidence:

- 95 test files / 587 tests passed;
- TypeScript and Next.js lint validity passed;
- optimized production build passed;
- Preview `dpl_54EaJW6HPZDW5MbjBTACTUekJDxb` Ready;
- application main deployment `dpl_2QKHYxtx8dNBW7VacD4eTGbirpTn` Ready;
- canonical primary routes loaded without internal errors;
- desktop 1440 and mobile 390 route sweeps found no horizontal overflow.

Schema and migration status: no Prisma schema or migration change, no Preview migration, no Production migration, no data rewrite/backfill, no hard deletion, and no package/provider/secret/environment change.

Mandatory next state: stop for consolidated client retesting of Phase 4 Milestones 1-4; do not close any milestone or begin another milestone.


## Phase 4 Milestone 4 monthly category-spending enhancement (approved 14 July 2026)

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: in progress; Phase 4 Milestones 1-4 remain open pending consolidated client acceptance.

- [x] Assess existing Transactions month selection and everyday-spending aggregation compatibility.
- [x] Freeze the chart, full-breakdown, category-filter, privacy, accessibility and performance rules in `docs/PHASE_4_MILESTONE_4_CATEGORY_CHART_CONTRACT.md` (PR 4.27).
- [ ] Implement the accessible SVG donut, top-five-plus-Other summary, full real-category breakdown and selected-month category filter with focused regressions (PR 4.28).
- [ ] Complete full QA, meaningful Preview/main verification, documentation and consolidated deferred testing (PR 4.29).

Gate: no schema, migration, data rewrite/backfill, package/lockfile, provider, secret, environment, financial-formula, month-boundary, split, transfer, category, budget, import, Property, loan or primary-navigation change is authorised. Stop if existing monthly totals disagree.

## Phase 4 Milestone 4 monthly category-spending enhancement (completed 14 July 2026)

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed and technically verified; Phase 4 Milestones 1-4 remain open pending consolidated client acceptance.

- [x] PR #139 / 4.27 contract and aggregation assessment: `f858566fa38fb4755ae11985b09785d216cd72e5`.
- [x] PR #140 / 4.28 accessible selected-month SVG donut, exact top-five-plus-Other grouping, full real-category breakdown, removable same-month filter and focused regressions: `1e347102f9583b33c1b873a340c64c38c151e382`.
- [x] PR 4.29 QA, handoff, design guidance and consolidated deferred testing.
- [x] 97 test files / 597 tests, TypeScript, lint and optimized build passed.
- [x] Preview `dpl_FEx2aJUeSRNp7nZAPsgCNXMrSffH` and main `dpl_BV7bZ6LX8tth2iMs96q7QgGmKe3W` are Ready.
- [x] Public `/transactions` returned HTTP 200; responsive deployed-shell checks found no horizontal overflow at the required widths.

No schema, migration, package, provider, secret, environment, data rewrite, financial formula, import, budget, recurring, loan, Property, report/export or navigation change occurred. No Preview or Production migration ran.

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Mandatory next state: stop for consolidated client acceptance; do not close any Phase 4 milestone or begin another milestone.


## Phase 4 Milestone 4 chart correctness hardening (completed 14 July 2026)

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed and technically verified; Phase 4 Milestones 1-4 remain open pending consolidated client acceptance.

- [x] PR #142 / 4.30 audited the positive incoming record, import type/category path, chart, Home, category-comparison and budget impact; merge `6c2f9019d1476fe86a127d1ffd698e5bd3a68d7f`.
- [x] PR #143 / 4.31 introduced one sign-safe everyday-expense eligibility helper, exact aggregate/drilldown record parity, small-percentage formatting, deterministic colours and focused regressions; merge `d6ae6bfaee81d475fd18387ad5a57b17dff97ee6`.
- [x] PR 4.32 recorded QA, handoff and consolidated deferred testing.
- [x] 99 test files / 612 tests, TypeScript validity, Next.js lint and optimized build passed.
- [x] Preview `dpl_AgLcw4d35Z2WNU9yiGGLmZ7UEpCP` and main `dpl_Asvt3s72xB9grd9VSuyPWAk5fmst` are Ready.
- [x] Public `/transactions` returned HTTP 200; Preview console and 390 px overflow checks passed.

Canonical spending eligibility now requires a strictly negative signed `EXPENSE` in addition to the existing owner, active, split and date rules. This corrects an implementation defect without changing signed-money, refund, transfer, split, budget or import rules.

No schema, migration, data rewrite/backfill, historical reclassification, package/provider/secret/environment, Property, Loan, report/export or navigation change occurred. The inconsistent existing positive `EXPENSE` record is not rewritten and remains user-correctable; it is excluded from spending.

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Mandatory next state: stop for consolidated client acceptance; do not close any Phase 4 milestone or begin another milestone.

## Phase 4 Milestone 4 transaction sign/type integrity hardening (gated 14 July 2026)

Status: audit complete; implementation blocked pending client approval. Phase 4 Milestones 1-4 remain open.

- [x] Audit CSV Import/Skip/Merge, category review, merchant learning, manual create/edit, generic transaction validation, splits, Property links, reconciliation and production-like fixtures.
- [x] Confirm the CSV Import defect: durable type follows category while signed cents remain unchanged.
- [x] Confirm zero-value transactions are rejected and downstream calculations already exclude sign/type anomalies.
- [x] Confirm no schema, migration, backfill, manual SQL or Production access is required for the proposed implementation.
- [ ] Obtain explicit rules for positive refunds, negative income adjustments, signed internal transfers and mixed-direction split children.
- [ ] Only after approval, implement the shared invariant and focused regressions.
- [ ] Only after a green implementation, complete QA, Vercel verification and deferred-testing documentation.

Controlling audit: `docs/PHASE_4_MILESTONE_4_TRANSACTION_SIGN_TYPE_AUDIT.md`.

Mandatory gate: do not begin implementation while any listed edge rule is ambiguous. Do not rewrite existing records automatically, run a migration, access Production or close any Phase 4 milestone.

## Phase 4 Milestone 4 transaction sign/type integrity hardening (completed 14 July 2026)

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged and technically verified; Phase 4 Milestones 1-4 remain open pending consolidated client acceptance.

- [x] PR #145 / 4.33 audited every approved transaction write path and froze the edge-case contract; merge `53fadcbab4a009bbaec85e46f06f3a56602fc8f5`.
- [x] Client approved zero-value rejection, positive-refund Money in treatment, negative-adjustment Money out treatment, signed transfers and same-direction splits.
- [x] PR #146 / 4.34 added shared transfer/sign/category precedence, direction-compatible category and suggestion handling, Import/Merge validation, manual create/edit validation, split validation and contextual anomaly guidance; merge `78574362f07781a1181766a5ae68f663ee02d03f`.
- [x] PR 4.35 records QA and consolidated deferred client testing.
- [x] 101 test files / 633 tests, TypeScript validity, Next.js lint and optimized production build passed.
- [x] Final Preview `dpl_NgKKnxdaY1zKgwUaNyDSD66ALfBY` is Ready and its public Transactions route passed desktop and 390 px smoke checks.

Canonical direction order: confirmed transfer treatment, then signed integer cents, then compatible categorisation. Zero amounts and mixed-direction split children are rejected. Categories, learned merchant rules, keyword suggestions and Needs review cannot reverse direction.

No historical record was rewritten. Existing anomalies stay visible and user-correctable while remaining excluded from calculations.

No schema, migration, data rewrite/backfill, manual SQL, package/lockfile, provider, secret, environment, duplicate-scoring, financial-formula, Property, Loan, report/export or navigation change occurred. No Preview or Production migration ran and Production data was not accessed.

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Mandatory next state: stop for consolidated client acceptance; do not close any Phase 4 milestone or begin another milestone.

## Phase 4 formal closure (15 July 2026)

Status: client accepted, closed, technically verified and deployed to Production.

Client acceptance date: 15 July 2026.

Final accepted baseline:

- PR #146 implementation merge: `78574362f07781a1181766a5ae68f663ee02d03f`;
- PR #147 QA/handoff merge and accepted `main`: `a401d40275c4c63d5759a690dbc4830e45d46917`;
- Production deployment: `dpl_EYxdfCR5SdgAEdyDR2AZsX841wzJ`, Ready from the accepted `main` commit;
- 101 test files / 633 tests passed;
- TypeScript validity, Next.js lint and optimized production build passed;
- public `/`, `/transactions` and `/import` returned HTTP 200;
- desktop route smoke and 390 px horizontal-overflow verification passed.

The transaction sign/type invariant is accepted: confirmed transfer treatment takes precedence, otherwise signed integer cents determine direction, and categorisation must remain compatible with that direction. Existing inconsistent records were not rewritten, backfilled or silently reclassified; they remain user-correctable and excluded from incompatible calculations.

No unresolved blocker remains for Phase 4 Milestones 1-4. The complete deferred-client checklist and all historical QA evidence remain preserved as the acceptance record.

Phase 5 remains unapproved and not started. Progression requires a separate client approval and documentation-first planning gate covering objective, user value, PR sequence, data and financial rules, privacy/security boundaries, schema and migration assessment, deployment/client review points, exclusions and mandatory stop conditions.

No application, schema, migration, data, package, provider, secret, environment or financial-calculation change is part of this closure.


## Phase 5 repository delivery status — 17 July 2026

Phase 5 Milestones 1–6 have completed all currently authorised and implementable repository work. They are technically verified where connected tools permit and remain open pending consolidated client acceptance.

Completed scope:

- planning/audit and governance activation;
- patched Next.js 15 / React 19 upgrade;
- private-beta authenticated route posture and browser-local data separation;
- environment, migration and recovery readiness contract;
- complete account export and immediate account deletion;
- Privacy, Help and safe support surfaces;
- CSP/security headers, request limits, safe errors and operational runbooks;
- deterministic lockfile and production dependency gate;
- web-first native/App Store decision preparation;
- consolidated private-beta QA and client checklist.

Private-beta blockers:

1. replace Clerk development/test credentials in Production with a verified Clerk Production instance;
2. prove Vercel Preview/Production authentication and Neon database separation;
3. prove migration health without private-row inspection;
4. complete a non-Production restore rehearsal and accept current recovery/protection limits;
5. provide final Groveware support/contact facts and complete privacy/legal review;
6. pass `docs/PHASE_5_CLIENT_REVIEW_CHECKLIST.md`.

No Production migration is authorised. No provider/environment mutation, public launch, native packaging, App Store action or Phase 6 work is authorised.

Phase 5 may be formally closed only after explicit client acceptance. Current recommendation: conditionally ready for a controlled private beta after the listed operator actions.


## Phase 6 Preview migration gate — 17 July 2026

- [x] Bulk-operation contract and schema plan merged in PR #170.
- [x] Additive schema foundation merged in PR #171 as `796439f51a4f239adc9ec457feae87d66a14ab13`.
- [x] Migration-aware Preview checker merged in PR #172 as `25b6a717bac5fae9481b7bee9ba6aaa72d72bdad`.
- [x] Exact-head verification passed 113 test files / 697 tests, TypeScript, lint and optimized build.
- [x] One Preview-only workflow request was dispatched: run `29555735427`.
- [x] The run stopped at the secret-safe preflight with `DATABASE_CHECK_FAILED`; deploy and post-check steps were skipped.
- [ ] Create or confirm an isolated Neon Preview destination and update the two GitHub Preview-only secrets through the operator dashboard.
- [ ] Re-run the Preview workflow once only after the environment gate is proven.
- [ ] Implement/merge bulk actions only after Preview schema verification and a separate safe Production migration gate.

No Preview or Production migration, manual SQL, reset, migration resolution, data rewrite or backfill occurred. Independent no-schema Phase 6 work may continue. See `docs/PHASE_6_PREVIEW_MIGRATION_GATE.md`.


## Phase 6 current delivery status — 17 July 2026

Phase 6 remains active and partially delivered.

Completed and verified:

- contract/audit and desktop information architecture;
- Import Centre with New import and Past imports views;
- desktop monthly transaction ledger and transient direction/category filters;
- consolidated Settings administration for categories, merchant rules and saved mappings;
- concise access to existing monthly spending and Property report/export workflows;
- additive bulk-operation schema and migration checker files, unexecuted.

Latest exact-head evidence is 115 test files / 702 tests with TypeScript, lint and optimized build passing. The latest connected Ready Production application deployment is `dpl_4ymwWjiZdm5syDBiYwWXjgbsYcvy` for `c559d19d85b955dcb44e671374bd481f9c311f4c`.

Blocked:

- Preview migration run `29555735427` stopped safely at `DATABASE_CHECK_FAILED` before deploy;
- an isolated Preview Neon destination and corrected GitHub Preview-secret mapping must be proven;
- bulk operation implementation, Preview verification and any later Production migration remain gated.

No Preview or Production migration, data rewrite, backfill, provider purchase, secret change or Production private-data access occurred. See `docs/PHASE_6_PREVIEW_MIGRATION_GATE.md` and `docs/PHASE_6_DESKTOP_FOUNDATION_SUMMARY.md`.


## Phase 7 Milestone 7.0 — Import and data-quality contract

Phase 7 contract work may proceed independently while Phase 6 bulk operations remain blocked by the Preview environment gate.

Current bank matrix:

- 19 master-specification targets;
- 4 named profiles: CommBank, ANZ, NAB and Westpac;
- 15 generic-only targets pending exact safe format evidence;
- generic/manual mapping remains the required fallback.

Next PR: no-schema parser profile registry and quality manifest. New named profiles require safe layout evidence plus synthetic fixtures and false-positive tests. Durable transfer links, import undo and richer merchant history remain separate schema/migration gates.

See `docs/PHASE_7_IMPORT_DATA_QUALITY_CONTRACT.md` and `docs/PHASE_7_BANK_FORMAT_REGISTER.md`.


## Phase 7 Milestone 7.2 — Loan CSV format coverage

Current implemented support is structural rather than lender-branded:

- repayment component columns;
- row-event ledgers;
- browser-local review and private-field exclusion;
- accepted two-cent component tolerance;
- duplicate review and existing repayment reconciliation.

No named lender profile may be added without exact safe layout evidence and a synthetic fixture. Next safe PR: typed mode registry and Help guidance with no schema or financial-rule change. See `docs/PHASE_7_LOAN_CSV_FORMAT_MATRIX.md`.
