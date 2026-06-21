# Current Codex Handoff

Last updated: 21 June 2026

## Current state

- Active phase: Phase 3A — Persistence & Commit Foundation.
- Formal status: implementation complete; pending client acceptance and signed-in retesting.
- Current objective: stop implementation and support client retesting after PR #46.
- Do not start Phase 3B, Phase 4, Production migration or later modules without explicit client approval.

## Repository truth

- Latest functional PR: [#46](https://github.com/LatinMaestro/SpendGrove/pull/46), merged green on 21 June 2026.
- Merge commit: `c4af1e4aa906b35f3d3803d0e7ff18e3237d7563`.
- PR commit: `47728b975ec6553a89d818a8949070b531766447`.
- PR deployment: https://vercel.com/latinmaestros-projects/spendgrove/Edc7uG93GEjfqDKbt49R3BoKMYtA
- PR preview: https://spendgrove-git-codex-phase-3a-ana-c2c6dc-latinmaestros-projects.vercel.app
- Post-merge main deployment: https://vercel.com/latinmaestros-projects/spendgrove/AzCUGVjQY4N3K4nxxtsrJTfQMbgF
- Production alias: https://spendgrove.vercel.app
- Full tests: 55 files / 316 tests passed.
- TypeScript type-check: passed.
- Next.js production build: passed.
- Main Vercel deployment: Ready / green.
- Production `/import` route: HTTP 200 from Vercel.

## PR #46 acceptance fix

- Root cause: the account transaction request ran inside the commit panel after the review summary and row cards had already rendered. Rows therefore appeared with initial Import actions before duplicate defaults arrived.
- Signed-in review now shows `Analysing CSV` while account access, existing transactions and duplicate outcomes are prepared.
- Review summaries, cards and Import/Skip/Merge actions are not rendered until the signed-in duplicate check succeeds.
- Likely duplicates therefore first appear as Skip / Already in SpendGrove, with the overlapping-file warning already calculated.
- A failed account duplicate check shows a safe error and `Retry duplicate check`; review cards remain hidden.
- Signed-out users retain browser-local review with an explicit notice that saved-account duplicate protection has not run.
- Signing out after an account-backed check drops the account projection and returns to browser-local transactions.
- Duplicate scoring, overlap thresholds, manual-only Merge targets and final commit behavior are unchanged.

## Preserved working behaviour

- Imported transactions remain visible, editable and soft-deletable in Transactions.
- ImportBatch, ImportRow and safe audit/history evidence remain after transaction deletion.
- Valid suggested, remembered and manually selected categories show Ready.
- Only explicit Needs review or true blockers affect the review filter.
- Stable filtered working sets, 600-row paging, mobile category controls and the simplified save flow remain.
- Needs Review remains a soft-warning import choice; true blockers remain strict.
- Batched, atomic and idempotent account commit remains.
- Source details remain browser-memory-only.
- Retrying the same commit request cannot create a second batch.

## Privacy and database status

- Duplicate comparison uses only user-owned, cleaned transaction fields already permitted in the account transaction projection.
- Duplicate warnings persist only safe outcome codes and aggregate counts; they do not persist compared descriptions or merchant candidates.
- Raw CSV files, rows, original filenames, raw bank narration, balances, account identifiers, BSBs, card fragments, customer IDs, loan references, secrets and connection strings remain excluded from durable account data, merchant learning, history, audit metadata, logs and documentation.
- Source details never enter commit, transaction, mapping, merchant, history or audit payloads.
- No schema migration, package, provider, secret or environment change was included.
- No Preview database migration was required or run.
- No Production migration has been run.
- Home dashboard expense/income stats remain later-phase work and were not implemented.
- No Phase 4 or later work has started.

## Exact next action

Ask the client to retest with synthetic data:

1. Upload and commit a small signed-in import, then confirm SpendGrove navigates to Transactions and shows the correct imported count.
2. Re-import the same synthetic CSV and confirm `Analysing CSV` appears after column confirmation instead of transaction cards.
3. Confirm the review list appears once, with likely duplicates already set to Skip / Already in SpendGrove and no all-Import flash.
4. Import a partly overlapping CSV and confirm the overlap warning is present on the first review render, duplicate rows are Skip and new rows remain Import.
5. Temporarily interrupt the account transaction request and confirm review cards stay hidden behind the safe error and `Retry duplicate check`.
6. Retry successfully and confirm the prepared review appears with duplicate outcomes already applied.
7. Test signed out and confirm browser-local review remains available while clearly stating saved-account duplicate protection has not run.
8. Confirm imported existing rows remain warning-only and cannot be Merge targets, while existing manual transactions remain valid Merge targets.
9. Change one likely duplicate from Skip to Import and confirm the final dialog warns that another copy will be created.
10. Reconfirm MetLifeInsurance / `MetLifePN_...` grouping and generic transfer/payment false-positive protection.
11. Reconfirm successful navigation, imported transaction edit/soft-delete, Settings history, stable filtering, 600-row paging and safe idempotent retry.
12. Use synthetic data only and confirm no raw CSV, filename, narration or private banking identifiers are persisted or exposed.

If the client reports a defect, fix only that Phase 3A acceptance issue. Otherwise wait for explicit Phase 3A closure or separately scoped next-phase approval.

## Resume instruction

Resume from repository truth: read `AGENTS.md`, `docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md` and this file; verify GitHub/Vercel; perform only the exact next action above.
