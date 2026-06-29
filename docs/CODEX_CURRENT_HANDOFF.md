# Current Codex Handoff

Last updated: 29 June 2026

## Current phase and status

- Phase 3A is formally accepted and closed.
- Phase 3B Milestone 1 - Loans-First Foundations is formally accepted and closed.
- Phase 3B Milestone 2 - Durable Loan Repayments and Reconciliation completed its approved implementation sequence and is awaiting client retesting/acceptance. It is not formally closed.
- Stop at client retesting. No Milestone 3, Phase 4 or later-module implementation is authorised.

## Milestone 2 completed work

| Work | PR | Merge commit |
|---|---|---|
| 3B.4 durable reviewed repayment commit and safe aggregate history | [#62](https://github.com/LatinMaestro/SpendGrove/pull/62) | `1cedad415bc4d0f12687b98ac83741174d2808ff` |
| 3B.5 repayment history and detail review | [#63](https://github.com/LatinMaestro/SpendGrove/pull/63) | `f92e7f56a28b75a0c8b5c6a6f7bc1dfb4b04a1d1` |
| 3B.6 reconciliation candidate suggestions | [#64](https://github.com/LatinMaestro/SpendGrove/pull/64) | `17fb6abe9e536186ea1ec8c035ed2dd71a047774` |
| 3B.7 manual link/unlink and no-double-count safeguards | [#65](https://github.com/LatinMaestro/SpendGrove/pull/65) | `7ab14bee38193de0e587971b0f21a3600446b99c` |
| 3B.8 QA, Vercel review and client testing package | [#66](https://github.com/LatinMaestro/SpendGrove/pull/66) | pending merge |

Delivered behaviour:

- Browser-local loan CSV review can save only explicitly selected, warning-free structured repayment breakdowns after user confirmation.
- A frozen request ID and atomic batch write make network retries idempotent without adding a private fingerprint or schema field.
- Loan Account cards show structured repayment history and detail, including archive/restore for unmatched records.
- Candidate suggestions follow the approved high, medium and manual bands and never link automatically.
- Explicit exact-date override search is available for out-of-band manual selection; it is never labelled a likely match and requires mismatch confirmation.
- Link, unlink and relink are user-confirmed and reversible. Split-loan allocation allows multiple repayment breakdowns to share one everyday transaction.
- Everyday transactions remain the only cashflow/spending records. Reconciliation never creates, changes or duplicates a transaction.

## Verification and deployment

- Full regression suite: 65 test files / 375 tests passed.
- TypeScript type-check: passed.
- Next.js production build: passed.
- PR #65 Vercel preview: https://vercel.com/latinmaestros-projects/spendgrove/3MynVjB5Re4shdQ4p8BdDELAzhDw
- Final functional Milestone 2 main deployment: https://vercel.com/latinmaestros-projects/spendgrove/H19jmvDTo34LpD31hjASNEsTKy6u
- Production alias: https://spendgrove.vercel.app
- Mobile signed-out verification at 390×844: `/loans` and `/loans/import` rendered without horizontal overflow or console errors and retained all five primary navigation items.
- Signed-in end-to-end verification requires the client's protected account session and is the current acceptance task.

## Schema, migration, privacy and security status

- Milestone 2 used the existing `LoanRepayment`, `LoanReconciliationLink` and `ImportBatch.type = LOAN_CSV` foundation unchanged.
- No Prisma schema or migration file changed in Milestone 2.
- No Preview migration was required or run for Milestone 2.
- The earlier Phase 3B foundation migration remains Preview-only.
- No Production migration has been run.
- Loan CSV files, raw rows, original filenames, raw event text and narration remain browser-local and are not persisted or logged.
- Durable repayment payloads contain only the owned Loan Account ID, reviewed date, integer-cent components, optional balance-after value, safe source and import lineage.
- Reconciliation persists only the approved IDs, confidence/method/reason codes, signed amount variance, date difference and unlink timestamp.
- Audit metadata contains aggregate counts or safe state/reason codes only, not amounts, balances, nicknames, lender names or source text.
- Exact addresses, account numbers, lender references, customer IDs, masked references, BSBs, card fragments, secrets and connection strings are neither requested nor persisted.

## Known limitations

- Client signed-in retesting is required for the complete save/history/suggestion/link flow.
- Retry idempotency covers the same frozen save request. Deliberately starting a new import of the same source later is a new request and is not content-fingerprinted.
- Repayment rows can be archived/restored but are not edited after commit in this milestone.
- Reconciliation is deterministic and user-driven; no link is automatic.
- Manual override search uses an exact transaction date and safe date/amount context only; there is no narration search.
- Loan repayment breakdowns do not feed spending, income, property, loan, net-worth or Home dashboard statistics.
- No tax/EOFY/property/accountant report, deductibility conclusion, property profile or everyday-transaction-to-property tax link exists.

## Exact next action

Client retests Phase 3B Milestone 2 using `docs/PHASE_3B_MILESTONE_2_SUMMARY.md` and reports acceptance comments. Do not begin implementation after Milestone 2 until the client separately approves a plan.

## Resume instruction

Resume from repository truth: read `AGENTS.md`, `docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md`, this file, `docs/PHASE_3B_MILESTONE_2_SUMMARY.md`, `docs/PHASE_3B_MILESTONE_2_PROPOSAL.md` and `docs/PHASE_3B_FINANCIAL_DATA_CONTRACT.md`. Verify GitHub/Vercel state. Milestone 2 implementation is complete but not formally accepted/closed; the only authorised next action is client acceptance hardening arising from retesting.
