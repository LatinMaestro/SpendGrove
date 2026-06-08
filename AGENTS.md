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

## Autonomous delivery mode

The client authorises supervised autonomous development within the active approved phase.

The agent should:

- Break the active phase into logical PR-sized tasks.
- Make routine implementation decisions without over-questioning.
- Create components, services, utilities, schemas, tests and internal helpers as needed.
- Improve code quality, accessibility, validation and maintainability where it does not change approved scope.
- Continue to the next task in the active phase after approval unless instructed otherwise.
- Keep the client involved at review gates and material decision points only.

The agent must pause for approval before:

- Starting a new phase.
- Closing a milestone.
- Changing core navigation or major UX direction.
- Making material database/schema changes.
- Changing privacy, logging or file-handling behaviour.
- Changing financial calculation rules.
- Introducing third-party services.
- Implementing Basiq/enhanced lookup beyond sandbox planning.
- Implementing payments, subscriptions or paywalls.
- Using real CSV samples beyond temporary local testing.
- Proceeding with production launch or App Store submission work.

## Active phase rule

The default active phase is **Phase 1 - MVP Foundation** until the client approves another phase.

Do not implement Phase 2+ functionality except for harmless placeholders, disabled feature flags, route stubs or data-model foresight that directly supports Phase 1 and does not create incomplete user-facing functionality.

## UI flexibility

The agent may make first-pass UI decisions for buttons, cards, spacing, forms, empty states and page layout within the SpendGrove design direction:

- simple
- calm
- mobile-first
- beginner-friendly
- green/teal themed
- Apple-style polish
- plain-English copy

The UI is not final until the client reviews screenshots or a working preview and approves it.

## Testing expectations

Before requesting review, run all available checks relevant to the chosen stack, such as:

- typecheck
- lint
- unit tests
- parser tests
- smoke tests
- build check
- mobile viewport check

If a check cannot be run, explain why in the review package.

## PR / review package requirements

Every PR or review package must include:

1. Plain-English summary.
2. Scope confirmation and phase alignment.
3. Screenshots or preview notes for UI work.
4. Vercel preview link when available for user-facing UI changes.
5. Data/privacy impact.
6. Testing evidence.
7. Specification compliance statement.
8. Known limitations.
9. Change-request log, including visual comments if applicable.
10. Next recommended task.

## CSV sample handling

- Real client CSVs are sensitive.
- Store temporary real samples only in `sample-data/private-local/`.
- Never commit real CSVs or screenshots containing private transactions.
- Never upload real CSVs to third-party services.
- Never log raw rows.
- Convert learnings into synthetic or redacted fixtures.

## Decision log

Update `docs/DECISION_LOG.md` when a material decision is approved. Include date, decision, reason, approved by and implementation impact.


## Visual preview workflow

When the repository is connected to Vercel and a PR preview deployment is available, include the preview link in the PR review package. For user-facing UI work, request client review through the preview and address visual comments in the same PR where practical.

Do not expose real CSV files, real financial data, private screenshots, provider secrets or production data in preview deployments. Use synthetic/demo data only unless a separate private local testing process is approved.

`PLAN.md` is a root-level pointer for agents. The active plan remains `docs/BUILD_PLAN.md`.
