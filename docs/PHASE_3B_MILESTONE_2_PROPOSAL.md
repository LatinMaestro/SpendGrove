# Phase 3B Milestone 2 Proposal - Durable Loan Repayments and Reconciliation

Status: approved on 28 June 2026; implemented on 29 June 2026; formally accepted and closed on 30 June 2026

Date prepared: 26 June 2026

## Approval boundary

The client approved this exact Milestone 2 objective and PR sequence under Autonomous Phase Delivery Mode on 28 June 2026. PRs 3B.4 through 3B.8 and focused acceptance hardening are delivered, client retesting is complete and Milestone 2 is formally closed. This closure does not authorise Milestone 3, Phase 4, Home dashboard statistics, tax/EOFY reporting, Basiq, AI, payments or later modules.

## Approved Milestone 2 objective

Turn the accepted Milestone 1 loan CSV review into a durable, privacy-safe loan repayment workflow:

- commit only reviewed loan repayment breakdowns;
- show safe repayment history;
- suggest links between loan repayments and existing everyday-account transactions;
- allow manual link and unlink where safe;
- prevent double counting so everyday transactions remain the single cashflow/spending source.

Milestone 2 should make reviewed loan repayments useful while staying inside the approved financial contract and avoiding tax/reporting conclusions.

## Recommended PR-sized task breakdown

### PR 3B.4 - Durable reviewed loan repayment commit and safe history

Goal: save reviewed loan repayment breakdowns after explicit user confirmation.

Scope:

- Add a signed-in commit action after browser-local loan CSV review.
- Commit only safe reviewed fields:
  - loan account ID;
  - repayment date;
  - total payment;
  - principal;
  - interest;
  - fees;
  - optional balance after;
  - source value `LOAN_CSV`;
  - safe import lineage where available.
- Create safe aggregate loan import history for successful commits.
- Preserve atomic, batched and retry-safe behaviour.
- Reject ambiguous or blocking review rows until the user corrects or excludes them.
- Keep source file, raw rows, original filename, raw event text and raw narration browser-local only.
- Add tests for validation, ownership, idempotency/retry behaviour, safe history and privacy exclusions.

Stop condition:

- Stop if retry-safe/idempotent commit cannot be achieved using the existing safe schema without adding a new durable field.

### PR 3B.5 - Loan repayment history and repayment detail review

Goal: let the user see saved repayments without implying extra spending or tax conclusions.

Scope:

- Add a Loan Account repayment history view.
- Show repayment date, total repayment, principal, interest, fees, optional balance after and reconciliation status.
- Show linked everyday transaction context only when a reconciliation link exists.
- Allow archive/restore of loan repayment records if safe.
- Keep repayment history separate from transaction spending totals.
- Use neutral wording for investment loan interest, such as future property record-keeping context, without tax advice.
- Add tests for listing, user ownership, archived/deleted filtering and no raw source display.

Stop condition:

- Stop if the UI would need property/tax report concepts, Home dashboard totals or automated deductibility wording.

### PR 3B.6 - Reconciliation candidate suggestions

Goal: suggest possible links between saved loan repayments and eligible everyday-account transactions.

Scope:

- Implement deterministic candidate scoring from the approved contract:
  - high confidence: exact amount and 0-1 day date difference;
  - medium confidence: 0-2 cents and 0-3 days, or exact amount and 2-7 days;
  - manual candidates: no more than 100 cents and no more than 7 days, shown only in manual search/open matching flow.
- Use absolute everyday-account transaction amount compared with loan repayment total.
- Exclude deleted transactions, split parents, incompatible records and already-linked repayments.
- Show confidence, amount variance and date difference before any link.
- Do not create links automatically.
- Add tests for high, medium, manual and excluded candidates.

Stop condition:

- Stop if reconciliation tolerance, confidence bands or double-count rules need to differ from the approved financial contract.

### PR 3B.7 - Manual link/unlink and no-double-count safeguards

Goal: let the user confirm, remove or manually create safe reconciliation links.

Scope:

- Allow the user to link one loan repayment to one eligible everyday transaction.
- Allow one everyday transaction to link to multiple loan repayments for split-loan payments.
- Store safe link method, confidence, variance, date difference and reason code only.
- Support unlinking without deleting either repayment or transaction.
- Re-run ownership, active-state and compatibility checks on every link/relink.
- Show clear no-double-count copy:
  - the everyday transaction is the spending/cashflow record;
  - the loan repayment is a breakdown record;
  - linking does not create or duplicate a transaction.
- Add tests for ownership, link, unlink, relink, split-loan links and no-double-count rules.

Stop condition:

- Stop if the existing `LoanReconciliationLink` model cannot safely represent a required approved link case.

### PR 3B.8 - Milestone 2 QA, Vercel review and client testing package

Goal: stabilise Milestone 2 and stop for client retesting.

Scope:

- Run full tests, type-check and production build.
- Verify Vercel preview and merged-main deployments.
- Verify core flows:
  - commit reviewed repayments;
  - view repayment history;
  - see reconciliation suggestions;
  - link and unlink;
  - split-loan transaction linking;
  - no-double-count messaging.
- Update handoff, summary and decision log if material decisions are made.
- Provide a non-technical client testing checklist.
- Stop for client retesting before any Phase 3B Milestone 3, Phase 4 or later work.

## Scope inclusions

- Durable commit of reviewed loan repayment rows.
- Safe aggregate loan import history.
- Repayment history by Loan Account.
- Reconciliation suggestions based on amount/date rules.
- Manual link and unlink.
- Split-loan support where one everyday transaction can link to multiple loan repayments.
- No-double-count safeguards and user-facing explanation.
- User ownership, soft deletion/archive behaviour and active-record filtering.
- Synthetic fixtures and tests only.

## Scope exclusions

- Production migration.
- Tax reports, EOFY reports, accountant reports or property reports.
- Automated deductibility decisions or tax advice.
- Home dashboard expense, income, property, loan or net-worth statistics.
- Property profiles or property-level financial statistics.
- Everyday-transaction-to-property tax linking.
- Recurring, subscriptions, budgets, insights or reminders.
- Basiq or live bank connection.
- AI.
- Payments, billing or subscriptions.
- Household mode, accountant workspace or document storage.
- New package, provider or paid service unless separately approved.
- Raw CSV persistence.
- Raw row persistence.
- Original filename persistence.
- Raw bank narration or raw loan event text persistence.
- Account identifiers, BSBs, card fragments, customer IDs, loan references, masked account references, exact property addresses, secrets or connection strings.

## Expected schema and migration needs

No new schema or migration is expected at proposal time.

Milestone 1 already added and Preview-applied the intended foundation:

- `LoanRepayment`;
- `LoanReconciliationLink`;
- `ImportBatch.type = LOAN_CSV`;
- loan repayment source and reconciliation enums;
- ownership, status and relationship indexes;
- non-negative money constraints;
- component reconciliation constraints.

Milestone 2 should first attempt to use the existing foundation. A schema or migration stop gate is triggered if implementation requires any new durable field, relationship, enum value, uniqueness rule, idempotency key or constraint change.

If a schema amendment becomes necessary:

- stop before editing the schema;
- present the exact minimal amendment;
- explain why existing fields are insufficient;
- confirm whether a Preview-only migration is required;
- do not run any migration until explicitly approved;
- do not run any Production migration.

## Privacy and data risks

Key risks:

- accidentally saving raw CSV rows, filenames, event text or narration;
- storing private account identifiers through loan metadata, safe history or reconciliation evidence;
- logging amounts, balances, private row values or source text;
- creating duplicate repayment records on retry;
- linking the wrong everyday transaction and overstating spending;
- presenting investment interest as deductible or tax advice;
- exposing another user's loans, repayments, transactions or links.

Controls:

- browser-memory-only CSV parsing remains the source-detail boundary;
- commit payload contains reviewed structured fields only;
- server validates ownership for loan account, repayment, transaction and link records;
- no free-text reconciliation evidence copied from CSV or bank files;
- errors and logs use safe codes and aggregate counts only;
- idempotency/retry behaviour must be tested before merge;
- reconciliation links are user-confirmed and reversible;
- loan repayments never feed transaction, spending, income or Home dashboard totals;
- tax wording remains neutral and non-advice.

## Reconciliation and no-double-count approach

The everyday-account transaction remains the only cashflow/spending record.

Loan repayments are analytical breakdown records. They may show total, principal, interest, fees and balance-after context, but they must not create additional spending.

Candidate suggestions:

- compare the absolute everyday transaction amount with the loan repayment total;
- show confidence and mismatch reasons;
- never create a link automatically;
- require explicit user confirmation.

Manual link/unlink:

- one loan repayment can link to at most one everyday transaction;
- one everyday transaction can link to multiple loan repayments for split-loan payments;
- unlinking clears the active relationship without deleting either side;
- relinking re-runs all eligibility checks.

No-double-count safeguards:

- transaction totals count the everyday transaction once;
- loan repayment totals are excluded from spending and income totals;
- linked repayment cards display as breakdowns, not extra payments;
- split loan links explain that one cashflow transaction may support multiple loan breakdowns.

## Vercel and client review points

- PR 3B.4: client reviews commit flow, confirmation copy, safe history and retry/idempotency behaviour.
- PR 3B.5: client reviews repayment history wording and confirms it does not look like extra spending or tax advice.
- PR 3B.6: client reviews reconciliation suggestion confidence labels and mismatch explanations.
- PR 3B.7: client reviews link/unlink, split-loan handling and no-double-count copy.
- PR 3B.8: client receives final Milestone 2 Vercel link, evidence, known limitations and a retesting checklist.

## Stop conditions requiring client approval

Stop before continuing if any of the following occurs:

- the client has not explicitly approved this Milestone 2 plan;
- a schema or migration amendment is needed;
- any Preview migration is required;
- any Production migration is proposed;
- idempotent commit cannot be implemented safely with existing fields;
- reconciliation tolerances or confidence bands need to change;
- split-loan linking cannot be represented safely with the existing model;
- any durable field could contain a loan account number, lender reference, customer ID, masked account reference, exact property address, raw narration, filename, raw CSV row or other private identifier;
- any tax/EOFY/property/accountant report, deductibility conclusion or tax advice is requested;
- any Home dashboard statistic is introduced;
- any recurring, budgets, Basiq, AI, payments, household, accountant workspace, document storage, Phase 4 or later module work appears;
- Vercel, tests, type-check or build fail and the fix is not clearly inside Milestone 2 scope.

## Approval record

The client approved Phase 3B Milestone 2 under Autonomous Phase Delivery Mode following this document on 28 June 2026, completed signed-in retesting with no further comments and formally closed the milestone on 30 June 2026.
