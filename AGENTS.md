# SpendGrove Agent Instructions

## Source of truth

The primary source of truth is:

- `docs/SpendGrove_v2_0_Master_Specification_Completeness_Checked.docx`

These repository files are operational companions and must remain aligned with the master specification:

- `docs/AUTONOMOUS_DELIVERY_MODE.md`
- `docs/MVP_SCOPE.md`
- `docs/BUILD_PLAN.md`
- `docs/REVIEW_GATES.md`
- `docs/DEFINITION_OF_DONE.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/UI_REVIEW_GUIDE.md`
- `docs/UI_FEEDBACK_PROCESS.md`
- `docs/VERCEL_VISUAL_REVIEW.md`
- `docs/CSV_TESTING_PROTOCOL.md`
- `docs/DECISION_LOG.md`

If this file conflicts with the master specification, preserve privacy/data-integrity requirements and raise the conflict in the PR review package.

## Product position

SpendGrove is a privacy-first Australian personal finance app. It helps users import their own bank transaction CSV exports, review every row, categorise spending, manage budgets, track loans/properties and prepare reports without requiring bank login credentials.

Core promise:

> Track your money without handing over your bank login.

## Non-negotiables

Always preserve the following:

- Do not require internet banking usernames, passwords, MFA codes or live bank linking.
- Do not store raw CSV files by default.
- Detect and exclude BSB, account number, account name, card number, customer ID and other private bank fields.
- Imported rows must be reviewed before commit.
- Import review must support Import, Skip and Merge.
- Store money as integer cents.
- Use Australian defaults: AUD, Australian dates and 1 July to 30 June financial year.
- Split parents are display containers only and must not count in financial totals.
- Split children carry category/property/tax meaning and count in totals.
- Loan repayment breakdowns must reconcile with cashflow transactions and must not double count repayments.
- Principal must not default as deductible.
- Basiq/enhanced lookup is future, optional, disabled by default, sandbox-first, local-first and fallback-only.
- Production payments/paywalls require explicit client approval.
- Production App Store release decisions require explicit client approval.

## Autonomous Phase Delivery Mode

SpendGrove now uses **Autonomous Phase Delivery Mode**. Once the client approves a phase objective and PR sequence, the agent may create focused PRs, run tests/build/Vercel checks, self-review, merge passing routine PRs and continue through the approved phase without waiting for PR-by-PR client approval.

The agent should:

- Confirm the active phase objective and approved PR sequence.
- Break the phase into logical PR-sized tasks.
- Make routine implementation decisions without over-questioning.
- Create components, services, utilities, schemas, tests and internal helpers as needed inside approved scope.
- Improve code quality, accessibility, validation and maintainability where it does not change approved scope.
- Keep PRs focused and include a clear review package.
- Self-review each PR against repository control docs, privacy/security gates and the master specification.
- Merge green, in-scope, privacy-safe routine PRs autonomously.
- Continue to the next approved PR in the active phase unless a stop condition is triggered.

The agent must pause for the client before:

- Starting a new phase or closing a phase.
- Expanding scope beyond the approved phase.
- Changing core navigation or major UX direction.
- Making material database/schema changes not already approved.
- Changing privacy, logging, retention or file-handling behaviour.
- Changing financial calculation rules.
- Introducing new third-party providers, packages or services beyond approval.
- Configuring real secrets, API keys, paid services or Vercel environment variables.
- Implementing Basiq/enhanced lookup beyond approved planning.
- Implementing payments, subscriptions or paywalls.
- Implementing loans, property/tax reports, recurring, budgets, AI or later-phase modules without explicit approval.
- Using real CSV samples beyond temporary private-local structural testing.
- Proceeding when Vercel/test/build status, PR diff, privacy posture or scope is unclear.
- Proceeding with production launch or App Store submission work.

## Active phase rule

Phase 3B Milestone 1 - Loans-First Foundations is formally accepted and closed.

Phase 3B Milestone 2 - Durable Loan Repayments and Reconciliation was formally accepted and closed by the client on 30 June 2026 after signed-in retesting completed with no further acceptance comments.

Completed Milestone 1 sequence:

- PR 3B.0 - financial rules and data-contract decision record;
- PR 3B.1 - schema foundation and Preview migration plan;
- PR 3B.2 - property and loan metadata management after the approved migration gate;
- PR 3B.3 - browser-local loan CSV mapping and review.

Completed Milestone 2 sequence:

- PR 3B.4 - durable reviewed loan repayment commit and safe aggregate history;
- PR 3B.5 - loan repayment history and repayment detail review;
- PR 3B.6 - reconciliation candidate suggestions;
- PR 3B.7 - manual link/unlink and no-double-count safeguards;
- PR 3B.8 - QA, Vercel review and client testing package.

The accepted Milestone 2 plan and closure evidence are in `docs/PHASE_3B_MILESTONE_2_PROPOSAL.md` and `docs/PHASE_3B_MILESTONE_2_SUMMARY.md`.

Phase 3B Milestone 3 - Repayment Corrections and Duplicate Re-import Safety was approved by the client on 30 June 2026 under Autonomous Phase Delivery Mode. The approved plan is `docs/PHASE_3B_MILESTONE_3_PROPOSAL.md` and the controlling rules are in `docs/PHASE_3B_MILESTONE_3_DATA_CONTRACT.md`.

Completed Milestone 3 sequence:

- PR 3B.9 - correction and duplicate-safety contract;
- PR 3B.10 - safe repayment correction;
- PR 3B.11 - deliberate duplicate loan re-import safeguards;
- PR 3B.12 - safer repayment cleanup flows;
- PR 3B.13 - QA, Vercel review and client testing package.

Phase 3B Milestone 3 was formally accepted and closed by the client on 1 July 2026.

Phase 3C Milestone 1 - Property-Linked Record-Keeping Foundations was formally accepted and closed by the client on 3 July 2026 after signed-in retesting completed with no further acceptance comments. Its accepted plan, contract and closure evidence are in `docs/PHASE_3C_MILESTONE_1_PROPOSAL.md`, `docs/PHASE_3C_MILESTONE_1_DATA_CONTRACT.md` and `docs/PHASE_3C_MILESTONE_1_SUMMARY.md`.

Phase 3C Milestone 2 - Property/EOFY Reporting Contract and Foundations was formally accepted and closed by the client on 7 July 2026 after Vercel retesting completed with no further acceptance comments. Its accepted rules, migration evidence, final PR chain and limitations are in `docs/PHASE_3C_MILESTONE_2_REPORTING_CONTRACT.md` and `docs/PHASE_3C_MILESTONE_2_SUMMARY.md`.

The accepted Phase 3C Milestone 2 workflow is a simple current-state Property record/export foundation: current eligible linked Property records feed summaries and exports automatically, without a report-only classification step. The Preview-only `PropertyReportReview` table remains dormant and untouched. No new Preview migration or Production migration has run after the accepted simplification.

Phase 3C Milestone 3 - Import-review Property Linking and Property-Record Workflow Polish was approved by the client on 8 July 2026 under Autonomous Phase Delivery Mode. The approved sequence is PR 3C.10 import-review Property-linking contract, PR 3C.11 schema and migration assessment, PR 3C.12 import-review Property link UI, PR 3C.13 commit integration and safety checks, PR 3C.14 manual transaction and workflow polish, and PR 3C.15 QA and client review package. PR 3C.10 is documentation-only and must freeze the contract in `docs/PHASE_3C_MILESTONE_3_IMPORT_PROPERTY_LINKING_CONTRACT.md` before implementation or schema assessment work.

For Phase 3C Milestone 3, preferred implementation uses the existing `PropertyTransactionLink` only after a transaction is committed and owned by the authenticated user. Stop before continuing if schema changes, migrations, durable staging state, Merge-row pre-commit linking, private source fields, automatic Property matching, tax wording, exact addresses, allocation/split logic, export/report calculation changes, new packages/providers/secrets, Production migration, navigation changes, Home dashboard statistics, Phase 4 or later modules are needed.

PR 3C.10 merged in #99 as `96262b347c5ae0d99366bd4d0ab73e2e54f45ef7`. PR 3C.11 merged in #100 as `b47adba443d6cd475e2011b234bb15c9d951476a`; its assessment in `docs/PHASE_3C_MILESTONE_3_SCHEMA_ASSESSMENT.md` concludes no Prisma schema change, migration, durable staging table, data rewrite, package, provider, secret or environment change is needed if implementation follows the contract. PR 3C.12 merged in #101 as `38572d6b8620ec7a82bc982092353b97d970a58a`; import-review rows may hold a transient `Include in property records` Property choice. PR 3C.13 merged in #102 as `be1234c37c6213e12abf1b8fb526828aa1728aa1`; durable Property links are created only after reviewed imported transactions are created and owned in the same atomic commit path. PR 3C.14 merged in #103 as `2c2d5608bb6707148d94fc810951f73b14e4d8f5`; neutral manual transaction create/edit Property-link polish was added within the accepted no-schema/no-migration contract. PR 3C.15 is the QA and client review package; after it is merged and main is verified, stop for client retesting.

Options B and C in `docs/NEXT_MILESTONE_OPTIONS.md` remain proposal-only. Do not implement Phase 4, Production readiness work or any other next module until the client explicitly approves it.

No Production migration, tax advice, automatic deductibility, ATO integration, Property profit/yield/equity/valuation/net-worth feature, Home dashboard statistics, recurring, budgets, insights, Basiq, AI, payments, household mode, Phase 4 or later module is authorised.

No Production migration is authorised.

The main user-facing area is Loans. Loan accounts are the primary records; properties are optional supporting metadata for relevant loans. The approved Loans-first clarification is in `docs/PHASE_3B_LOANS_FIRST_UI_CONTRACT.md`.

## UI flexibility

The agent may make first-pass UI decisions for buttons, cards, spacing, forms, empty states and page layout within the SpendGrove design direction:

- simple
- calm
- mobile-first
- beginner-friendly
- green/teal themed
- Apple-style polish
- plain-English copy

Client review is required at phase-level or major milestone user-testing checkpoints, and before finalising a major new UI pattern when the stop conditions require it.

## Testing expectations

Before merging routine PRs or requesting phase review, run all available checks relevant to the chosen stack, such as:

- typecheck
- lint
- unit tests
- parser tests
- smoke tests
- build check
- Vercel preview/build check
- mobile viewport check where practical

If a check cannot be run, explain why in the PR review package or phase summary.

## PR / review package requirements

Every PR or review package must include:

1. Plain-English summary.
2. Scope confirmation and phase alignment.
3. Screenshots or preview notes for UI work.
4. Vercel preview link when available for user-facing UI changes.
5. Data/privacy impact.
6. Security impact where relevant.
7. Testing evidence.
8. Specification compliance statement.
9. Known limitations.
10. Change-request log, including visual comments if applicable.
11. Next recommended task.

Routine PRs inside an approved phase may be merged by the agent when green, in scope and privacy-safe.

## Phase Summary Report requirement

At the end of every approved phase, the agent must create a complete plain-English Phase Summary Report before recommending formal phase closure. Prefer a committed Markdown file such as `docs/PHASE_3A_SUMMARY.md`.

The phase summary must include completed PRs, merge commits, features added, UI/workflow changes, schema/auth/database changes, privacy/security controls, testing/build/Vercel results, known limitations, deferred items, decisions made, client decisions required, final Vercel link, user-testing checklist, workflows to test, client questions and recommended next options.

## CSV sample handling

- Real client CSVs are sensitive private local test data only.
- Store temporary real samples only in `sample-data/private-local/` when needed.
- Never commit real CSVs or screenshots containing private transactions.
- Never upload real CSVs to third-party services.
- Never log raw rows.
- Never paste raw rows, filenames, balances, account identifiers, raw bank descriptions or private values into PRs, docs, comments or screenshots.
- Convert learnings into fictional synthetic fixtures only.

## Decision log

Update `docs/DECISION_LOG.md` when a material decision is approved. Include date, decision, reason, approved by and implementation impact.

## Visual preview workflow

When the repository is connected to Vercel and a PR preview deployment is available, include the preview link in the PR review package. For user-facing UI work, request client review at phase-level or major milestone checkpoints, and earlier only when a major UI pattern needs client feedback before proceeding.

Do not expose real CSV files, real financial data, private screenshots, provider secrets or production data in preview deployments. Use synthetic/demo data only unless a separate private local testing process is approved.

`PLAN.md` is a root-level pointer for agents. The active plan remains `docs/BUILD_PLAN.md`.
