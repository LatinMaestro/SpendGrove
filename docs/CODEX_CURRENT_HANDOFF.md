# Current Codex Handoff

Last updated: 1 July 2026

## Current phase and status

- Phase 3A is formally accepted and closed.
- Phase 3B Milestone 1 - Loans-First Foundations is formally accepted and closed.
- Phase 3B Milestone 2 - Durable Loan Repayments and Reconciliation was formally accepted and closed by the client on 30 June 2026 after signed-in retesting completed with no further acceptance comments.
- Phase 3B Milestone 3 - Repayment Corrections and Duplicate Re-import Safety was approved by the client on 30 June 2026 under Autonomous Phase Delivery Mode. PR 3B.11 is the active implementation slice.
- No Phase 4 or later-module implementation is authorised.

## Milestone 3 progress

- PR 3B.9 correction and duplicate-safety contract merged in [#71](https://github.com/LatinMaestro/SpendGrove/pull/71) as `8c4b9123f0e07cd1a602cb1dcad1c7b30b60c36f`.
- PR 3B.10 safe repayment correction merged in [#72](https://github.com/LatinMaestro/SpendGrove/pull/72) as `d79bc24b2bebe277b39729d655e995d8c7d1253d`.
- PR 3B.11 deliberate duplicate loan re-import safeguards are implemented and under verification/review.
- No Prisma schema or migration amendment has been needed.

## Milestone 2 completed work

| Work | PR | Merge commit |
|---|---|---|
| 3B.4 durable reviewed repayment commit and safe aggregate history | [#62](https://github.com/LatinMaestro/SpendGrove/pull/62) | `1cedad415bc4d0f12687b98ac83741174d2808ff` |
| 3B.5 repayment history and detail review | [#63](https://github.com/LatinMaestro/SpendGrove/pull/63) | `f92e7f56a28b75a0c8b5c6a6f7bc1dfb4b04a1d1` |
| 3B.6 reconciliation candidate suggestions | [#64](https://github.com/LatinMaestro/SpendGrove/pull/64) | `17fb6abe9e536186ea1ec8c035ed2dd71a047774` |
| 3B.7 manual link/unlink and no-double-count safeguards | [#65](https://github.com/LatinMaestro/SpendGrove/pull/65) | `7ab14bee38193de0e587971b0f21a3600446b99c` |
| 3B.8 QA, Vercel review and client testing package | [#66](https://github.com/LatinMaestro/SpendGrove/pull/66) | `bdddcfb2cb5e161ff6894864e4963a16ac263b34` |
| Milestone 2 acceptance hardening | [#68](https://github.com/LatinMaestro/SpendGrove/pull/68) | `54ee17b4436578a922d3b4c1d2b08e3e1e214d1a` |

Delivered behaviour:

- Browser-local loan CSV review can save only explicitly selected, warning-free structured repayment breakdowns after user confirmation.
- Warning and non-repayment rows now show a plain `Excluded automatically` status instead of a disabled checkbox; clear rows remain selectable and counts remain deterministic.
- A frozen request ID and atomic batch write make network retries idempotent without adding a private fingerprint or schema field.
- Loan Account cards show structured repayment history and detail, including archive/restore for unmatched records.
- Candidate suggestions follow the approved high, medium and manual bands and never link automatically.
- `Search wider manually` visibly shows the approved no-more-than-$1/no-more-than-seven-day band, while exact-date manual override remains a separate labelled path.
- Explicit exact-date override search is available for out-of-band manual selection; it is never labelled a likely match and requires mismatch confirmation.
- Link, unlink and relink are user-confirmed and reversible. Split-loan allocation allows multiple repayment breakdowns to share one everyday transaction.
- Archive/restore and link/unlink audit validation now accepts the already-approved Phase 3B entity values. Audit payloads remain limited to safe state, method, confidence and reason codes.
- Everyday transactions remain the only cashflow/spending records. Reconciliation never creates, changes or duplicates a transaction.

## Verification and deployment

- Full regression suite after acceptance hardening: 65 test files / 380 tests passed.
- TypeScript type-check: passed.
- Next.js production build: passed.
- PR #65 Vercel preview: https://vercel.com/latinmaestros-projects/spendgrove/3MynVjB5Re4shdQ4p8BdDELAzhDw
- Final functional Milestone 2 main deployment: https://vercel.com/latinmaestros-projects/spendgrove/H19jmvDTo34LpD31hjASNEsTKy6u
- Merged PR 3B.8 review-package main deployment: https://vercel.com/latinmaestros-projects/spendgrove/FB3oxwArid1Hzj3PhWGAi4pkvMCm
- PR #68 acceptance-hardening preview: https://spendgrove-git-codex-phase-3b-m2-9bf9a4-latinmaestros-projects.vercel.app
- Final acceptance-hardening main deployment: https://vercel.com/latinmaestros-projects/spendgrove/Gb2Bs2AveMSiiShDnZkJq3DgocFs
- Latest pre-closure documentation main deployment: https://vercel.com/latinmaestros-projects/spendgrove/HjXJeqXkFAkbn47nvgMJ1vh6WHUB
- Production alias: https://spendgrove.vercel.app
- Public main smoke verification passed for `/`, `/loans` and `/loans/import`; both loan routes remained signed-in/account gated with no horizontal overflow.
- Mobile signed-out verification at 390×844: `/loans` and `/loans/import` rendered without horizontal overflow or console errors and retained all five primary navigation items.
- Client signed-in end-to-end retesting completed on 30 June 2026 with no further acceptance comments.

## Schema, migration, privacy and security status

- Milestone 2 used the existing `LoanRepayment`, `LoanReconciliationLink` and `ImportBatch.type = LOAN_CSV` foundation unchanged.
- No Prisma schema or migration file changed in Milestone 2.
- No Preview migration was required or run for Milestone 2.
- The earlier Phase 3B foundation migration remains Preview-only.
- No Production migration has been run.
- Acceptance hardening required no Prisma schema or migration amendment because the existing Phase 3B database enum already contained the loan audit entity values.
- Loan CSV files, raw rows, original filenames, raw event text and narration remain browser-local and are not persisted or logged.
- Durable repayment payloads contain only the owned Loan Account ID, reviewed date, integer-cent components, optional balance-after value, safe source and import lineage.
- Reconciliation persists only the approved IDs, confidence/method/reason codes, signed amount variance, date difference and unlink timestamp.
- Audit metadata contains aggregate counts or safe state/reason codes only, not amounts, balances, nicknames, lender names or source text.
- Exact addresses, account numbers, lender references, customer IDs, masked references, BSBs, card fragments, secrets and connection strings are neither requested nor persisted.

## Known limitations

- Retry idempotency covers the same frozen save request. A later import uses structured duplicate warnings rather than a persisted content fingerprint.
- Structured correction is available only for active, unmatched, unlinked repayments; linked repayments must be unlinked and archived repayments restored before editing.
- Reconciliation is deterministic and user-driven; no link is automatic.
- Manual override search uses an exact transaction date and safe date/amount context only; there is no narration search.
- Loan repayment breakdowns do not feed spending, income, property, loan, net-worth or Home dashboard statistics.
- No tax/EOFY/property/accountant report, deductibility conclusion, property profile or everyday-transaction-to-property tax link exists.

## Exact next action

Complete and merge PR 3B.11, then continue autonomously through PRs 3B.12-3B.13 while all schema, migration, privacy, reconciliation and later-module stop gates remain satisfied.

## Resume instruction

Resume from repository truth: read `AGENTS.md`, `docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md`, this file, `docs/PHASE_3B_MILESTONE_3_PROPOSAL.md`, `docs/PHASE_3B_MILESTONE_3_DATA_CONTRACT.md` and `docs/PHASE_3B_FINANCIAL_DATA_CONTRACT.md`. Verify GitHub/Vercel state and continue the exact approved Milestone 3 PR sequence. Stop on any documented schema, migration, privacy, financial-rule or later-module gate.
