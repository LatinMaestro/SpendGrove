# Phase 3B — Loans-First Foundations

Status: Milestone 1 formally accepted and closed by the client on 26 June 2026. Milestone 2 was approved on 28 June 2026, delivered through PRs #62-#65 plus the PR 3B.8 review package, and is awaiting client retesting/acceptance.

Milestone 1 covered PRs 3B.0 through 3B.3 plus acceptance-hardening PRs #57 and #59. Milestone 2 delivered durable repayment commit, safe repayment history, reconciliation suggestions, manual link/unlink and no-double-count safeguards without a schema change or migration.

## Phase objective

Establish privacy-safe property and loan account foundations and a reviewable loan repayment reconciliation workflow. The phase should let a user describe a property and loan, import reviewed loan repayment data, and link repayments to everyday-account transactions without double counting.

Phase 3B should stop before EOFY/property reports, automated tax conclusions, Home dashboard statistics or any Phase 4 feature.

## Recommended PR-sized task breakdown

### PR 3B.0 — Financial rules and data-contract decision record

Status: merged in PR #49.

- Define repayment, principal, interest, fee and balance semantics.
- Define reconciliation eligibility, tolerances, confidence bands and manual override rules.
- Define how linked everyday-account and loan-side records avoid double counting.
- Define owner-occupier, investment and personal-loan purpose metadata without making tax claims.
- Confirm the minimum safe persisted fields and forbidden private fields.
- Documentation only; no schema or code.

### PR 3B.1 — Schema foundation

Status: merged in PR #50. The approved amended migration ran successfully against Preview only in workflow run 27958341458.

- Add user-owned property, loan account, loan repayment and reconciliation-link foundations.
- Store monetary values as integer cents.
- Add soft deletion, timestamps and safe source/import lineage.
- Add uniqueness and ownership constraints needed for idempotent import and reconciliation.
- Include a Preview migration plan and rollback notes.
- Do not run a Production migration.

### PR 3B.2 — Loans-first metadata management

Status: merged in PR #54.

- Add authenticated create/edit/archive flows with Loan Accounts as the main entry point.
- Prefer user-selected nicknames and optional broad purpose/type fields.
- Link a loan to a property only when the user chooses.
- Support owner-occupier home, investment property, car, personal and other loan choices.
- Do not require a property for car, personal or other loans.
- Do not add account numbers, masked references or lender references.
- Preserve an honest browser/local or unavailable state where appropriate.

### PR 3B.3 — Browser-local loan CSV mapping and review

Status: merged in PR #55 and accepted after Milestone 1 client retesting.

- Treat loan CSV as a first-class import type.
- Require the user to choose the owning Loan Account before row review.
- Show optional linked-property context only when the selected loan has one.
- Parse and scan the selected file in browser memory.
- Map date, total repayment, principal, interest, fees and balance-after-payment where supplied.
- Show review-before-commit, validation and safe correction.
- Do not persist raw CSV, raw rows, filename, raw narration, balances outside the approved repayment model or private account identifiers.

### PR 3B.4 — Durable loan repayment commit and safe history

Status: merged in PR #62.

- Commit only reviewed, validated loan repayment fields.
- Add atomic, batched and idempotent commit.
- Record safe aggregate import history and lineage.
- Keep retry and rollback behaviour explicit.
- Do not create tax reports or dashboard totals.

### PR 3B.5 — Loan repayment history and detail review

Status: merged in PR #63.

- Show structured repayment history by Loan Account.
- Show linked everyday context only when an active reconciliation link exists.
- Keep repayment history separate from spending and cashflow totals.
- Support safe archive/restore, while blocking archive of an active linked repayment.

### PR 3B.6 — Reconciliation candidate suggestions

Status: merged in PR #64.

- Suggest links between loan repayments and eligible everyday-account transactions.
- Show confidence and mismatch reasons.
- Exclude deleted, split-parent, already-linked and incompatible records.
- Never create a link automatically.

### PR 3B.7 — Manual link/unlink and no-double-count safeguards

Status: merged in PR #65.

- Require explicit user confirmation before linking.
- Support link, unlink, relink and split-loan allocation.
- Preserve the everyday transaction as the only cashflow/spending record.
- Re-run ownership, active-state, tolerance and allocation checks atomically.

### PR 3B.8 — Milestone 2 QA and client acceptance package

Status: completed for client retesting; formal acceptance is pending.

- Test ownership, idempotency, reconciliation, unlink/relink and double-count prevention.
- Test synthetic home, investment and personal-loan cases without providing tax advice.
- Verify privacy exclusions in payloads, history, logs and UI.
- Verify Vercel preview and merged-main deployments.
- Produce the Phase 3B summary, limitations and non-technical client checklist.
- Stop for formal client acceptance.

## Scope inclusions

- Minimal user-owned property records.
- Minimal user-owned loan account records.
- Home, investment and personal-loan purpose/type metadata.
- Optional user-controlled property-to-loan link.
- Browser-local loan CSV parsing, private-field scanning, mapping and review.
- Reviewed repayment fields: date, total, principal, interest, eligible fee field and balance after payment when present.
- Durable reviewed repayment import with safe aggregate history.
- Reconciliation suggestions and manual link/unlink.
- Explicit no-double-count behaviour.
- Soft deletion, ownership, idempotency and audit-safe lineage.
- Synthetic test fixtures only.

## Scope exclusions

- EOFY, property, accountant or tax reports.
- Automated deductibility decisions or tax advice.
- Depreciation, capital gains, rental schedules or document storage.
- Home dashboard expense/income/net-worth statistics.
- Recurring detection, subscriptions, budgets, insights or reminders.
- Basiq or any live bank connection.
- AI, payments, billing, household mode or accountant workspace.
- Phase 4 or later modules.
- New package, provider or paid service unless separately approved.
- Raw CSV, raw row, original filename or raw bank narration persistence.

## Expected schema and migration needs

A schema change is expected if Phase 3B is approved. The likely minimum is:

- `Property`;
- `LoanAccount`;
- `LoanRepayment`;
- a reconciliation link or equivalent constrained relationship;
- safe import lineage fields and ownership indexes.

The exact model names and relationships must be settled in PR 3B.0/3B.1. Any migration must:

- be reviewed before execution;
- run against Preview only during implementation;
- include rollback and data-integrity checks;
- avoid destructive changes to Phase 3A data;
- not run against Production without a separate, explicit client approval.

## Privacy and data risks

Key risks:

- accidentally persisting loan account numbers, lender references, customer IDs or property addresses;
- retaining raw CSV, raw narration, filenames or unreviewed rows;
- exposing balances or repayment details across users;
- learning merchant aliases from loan references;
- logging financial values or rejected private fields;
- incorrect reconciliation causing duplicate financial totals;
- presenting purpose metadata as tax advice.

Required controls:

- browser-memory-only raw file processing;
- strict user ownership on every durable record and query;
- minimal reviewed fields only;
- no account identifiers or references by default;
- no raw narration or source-detail persistence;
- safe aggregate history and structured warning codes;
- redacted errors and logs;
- deterministic reconciliation with visible reasons and manual control;
- clear non-tax-advice language.

## Vercel and client review points

- PR 3B.0: client approves financial rules, data contract and privacy boundaries before schema work.
- PR 3B.1: client reviews schema and Preview migration plan; no Production migration.
- PR 3B.2: Vercel preview review of property/loan setup, mobile layout and privacy copy.
- PR 3B.3: client tests synthetic loan CSV mapping, rejected private fields and review-before-commit.
- PR 3B.4: client tests import success, retry/idempotency and safe history.
- PR 3B.5: client reviews repayment history and detail wording.
- PR 3B.6: client tests exact, uncertain and manual candidate suggestions.
- PR 3B.7: client tests link/unlink/relink, split-loan allocation and no-double-count behaviour.
- PR 3B.8: full automated checks, final Vercel deployment and a non-technical acceptance checklist.

## Stop conditions requiring client approval

Stop before proceeding if any of the following arises:

- any new implementation after the completed Milestone 2 sequence;
- a financial rule is ambiguous, including principal/interest/fee treatment or reconciliation tolerance;
- a new durable field could contain an account identifier, property address, lender reference, balance history or other private data outside the approved minimum;
- a schema design materially differs from the approved data contract;
- any Preview migration is destructive or affects existing Phase 3A records;
- any Production migration is proposed;
- any tax calculation, deductibility rule, report or advice-like output is proposed;
- any new package, provider, paid service, secret or environment change is needed;
- any Home dashboard statistic, Phase 4 feature or later module is requested;
- client testing identifies a scope-changing requirement.

## Approval boundary

The client approved Milestones 1 and 2 through separate gates. Milestone 2 implementation is complete and awaiting client acceptance. No approval granted for Phase 3B authorises a Production migration, Milestone 3, Phase 4, Home dashboard statistics, tax reporting or any excluded feature.
