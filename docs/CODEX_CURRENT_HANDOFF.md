# Current Codex Handoff

Last updated: 2 July 2026

## Current phase and status

- Phase 3A is formally accepted and closed.
- Phase 3B Milestone 1 - Loans-First Foundations is formally accepted and closed.
- Phase 3B Milestone 2 - Durable Loan Repayments and Reconciliation was formally accepted and closed by the client on 30 June 2026 after signed-in retesting completed with no further acceptance comments.
- Phase 3B Milestone 3 - Repayment Corrections and Duplicate Re-import Safety was formally accepted and closed by the client on 1 July 2026 after signed-in retesting completed with no further acceptance comments.
- All approved Phase 3B Milestones 1-3 are accepted and closed. No further Phase 3B implementation is authorised.
- Phase 3C Milestone 1 - Property-Linked Record-Keeping Foundations was approved by the client on 2 July 2026 under Autonomous Phase Delivery Mode. PR 3C.0 is active and documentation-only.
- No Phase 4 or later-module implementation is authorised.

## Phase 3C Milestone 1 progress

- Approved sequence: PRs 3C.0-3C.4.
- PR 3C.0 freezes one optional Property per eligible transaction, explicit unlink-before-relink, normal/split-child eligibility, no copied financial/source fields, safe state/reason-code auditing and the existing transaction as the only cashflow record.
- PR 3C.1 may add only the matching `PropertyTransactionLink` foundation and an unexecuted additive migration plan.
- No Phase 3C Preview migration has run. Stop after PR 3C.1 for explicit client approval. No Production migration is authorised.

## Milestone 3 progress

- PR 3B.9 correction and duplicate-safety contract merged in [#71](https://github.com/LatinMaestro/SpendGrove/pull/71) as `8c4b9123f0e07cd1a602cb1dcad1c7b30b60c36f`.
- PR 3B.10 safe repayment correction merged in [#72](https://github.com/LatinMaestro/SpendGrove/pull/72) as `d79bc24b2bebe277b39729d655e995d8c7d1253d`.
- PR 3B.11 deliberate duplicate loan re-import safeguards merged in [#73](https://github.com/LatinMaestro/SpendGrove/pull/73) as `3ea74c685bef3076aadae801ec421b270233622c`.
- PR 3B.12 safer repayment cleanup merged in [#74](https://github.com/LatinMaestro/SpendGrove/pull/74) as `e608a6af37c1f10b298f3d0536484cdbffbd40cd`.
- PR 3B.13 final QA, Vercel review and client testing package merged in [#75](https://github.com/LatinMaestro/SpendGrove/pull/75) as `d962136313ea6b00adb729428fe0deddadd0bb5e`.
- Focused client acceptance hardening for loan CSV post-save navigation merged in [#76](https://github.com/LatinMaestro/SpendGrove/pull/76) as `d47e3b2f26c18639c77f3083a1b4b37489a134a3`. A successful durable save now returns to `/loans` with safe aggregate completion copy; a failed save remains in review with its selections and warnings intact.
- No Prisma schema or migration amendment has been needed.

Delivered Milestone 3 behaviour:

- Safe correction is limited to structured repayment date/amount fields on active, unmatched and unlinked repayments, with `updatedAt` stale-edit protection and changed-field-code-only audit metadata.
- Exact structured duplicate rows for the owning Loan Account are warnings and default-excluded; same-date/same-total non-exact rows are possible overlaps; exact rows require a visible per-row `Save anyway` confirmation.
- Duplicate checks include archived non-deleted repayments and repeat atomically at commit without fingerprints, narration, filenames or private identifiers.
- Repayment history has active/archived filters plus confirmed archive/restore selection capped at 100; stale, newly linked or already-updated selections are skipped and reported as aggregate counts.
- Cleanup remains non-destructive and never changes, unlinks or deletes an everyday transaction.

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

- Acceptance-hardening regression suite: 66 test files / 398 tests passed.
- Acceptance-hardening TypeScript type-check: passed.
- Acceptance-hardening Next.js production build: passed.
- Final accepted Milestone 3 main deployment: https://vercel.com/latinmaestros-projects/spendgrove/47tZxLxacyMGS814n9Dhbb2r8p4k
- Final public smoke checks returned HTTP 200 for `/`, `/loans` and `/loans/import` with no internal server error.
- PR #75 merged-main deployment: https://vercel.com/latinmaestros-projects/spendgrove/4rEpVMNznLD32KFbeQ4YYejwvBT2
- Final Milestone 3 regression suite: 65 test files / 394 tests passed.
- Final Milestone 3 TypeScript type-check: passed.
- Final Milestone 3 Next.js production build: passed.
- PR #71 preview: https://vercel.com/latinmaestros-projects/spendgrove/7W3hc1rC91FTp8isDwFioKW1PKT4
- PR #72 preview: https://vercel.com/latinmaestros-projects/spendgrove/Ac1zQC8spzLfASuik7QucFoWRfco
- PR #73 preview: https://vercel.com/latinmaestros-projects/spendgrove/Beajmh9g5bEisTj2Ze28L6MLt7A1
- PR #74 preview: https://vercel.com/latinmaestros-projects/spendgrove/5acWb392SBigHakoMW7iHurSuAvL
- Main after PR #74: https://vercel.com/latinmaestros-projects/spendgrove/8bsg1jYHMBtMkE1YWJS9u9rR1Vag
- Live public smoke checks returned HTTP 200 for `/`, `/loans` and `/loans/import`; both loan routes rendered their account-session shell and neither returned an internal server error.

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

- Milestone 3 changed no Prisma schema or migration file and required no Preview migration.
- No Production migration has been run.
- No durable old/new correction values, duplicate fingerprints, candidate snapshots, filenames, narration, raw rows or private identifiers were introduced.

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

- Retry idempotency covers the same frozen save request. A later import uses exact structured duplicate warnings rather than a persisted content fingerprint.
- Structured correction is available only for active, unmatched, unlinked repayments; linked repayments must be unlinked and archived repayments restored before editing.
- Correction has no durable financial revision history; safe audit metadata records changed-field codes only.
- Duplicate checks are exact and structured; they intentionally do not use fuzzy text or date/amount tolerances.
- Cleanup is archive/restore only and bulk actions are capped at 100 selected repayments.
- Reconciliation is deterministic and user-driven; no link is automatic.
- Manual override search uses an exact transaction date and safe date/amount context only; there is no narration search.
- Loan repayment breakdowns do not feed spending, income, property, loan, net-worth or Home dashboard statistics.
- No tax/EOFY/property/accountant report, deductibility conclusion, property profile or everyday-transaction-to-property tax link exists.

## Exact next action

Complete and merge PR 3C.0, then prepare PR 3C.1 with the exact matching schema and unexecuted Preview migration plan. Stop after PR 3C.1 before running any Preview migration. Do not begin PR 3C.2, Phase 4, Home dashboard statistics, tax/EOFY reporting or later modules.

## Resume instruction

Resume from repository truth: read `AGENTS.md`, `docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md`, this file, `docs/PHASE_3C_MILESTONE_1_PROPOSAL.md`, `docs/PHASE_3C_MILESTONE_1_DATA_CONTRACT.md` when present and `docs/DECISION_LOG.md`. Continue only the approved PR 3C.0-3C.1 sequence and stop before any Preview migration or PR 3C.2.
