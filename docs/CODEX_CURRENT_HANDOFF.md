# Current Codex Handoff

Last updated: 21 June 2026

## Current state

- Active phase: Phase 3A — Persistence & Commit Foundation.
- Formal status: implementation complete; pending client acceptance and signed-in retesting.
- Current objective: stop implementation and support client retesting after PR #44.
- Do not start Phase 3B, Phase 4, Production migration or later modules without explicit client approval.

## Repository truth

- Latest functional PR: [#44](https://github.com/LatinMaestro/SpendGrove/pull/44), merged green on 21 June 2026.
- Merge commit: `6e7c15d59d5c6fedf1f18cf5a822e11fbb95a769`.
- PR commit: `b3b4e5dd36ff13826c4207a5c93c6b48ccc41e18`.
- PR deployment: https://vercel.com/latinmaestros-projects/spendgrove/BFKbsaUr5iH4sMRFyZ9CHniHi8vj
- PR preview: https://spendgrove-git-codex-phase-3a-pos-ac737d-latinmaestros-projects.vercel.app
- Post-merge main deployment: https://vercel.com/latinmaestros-projects/spendgrove/79GLPBGxHpnjsrNXPmi6xREUJhsF
- Production alias: https://spendgrove.vercel.app
- Full tests: 55 files / 313 tests passed.
- TypeScript type-check: passed.
- Next.js production build: passed.
- Main Vercel deployment: Ready / green.
- Production `/transactions` route: HTTP 200 from Vercel.

## PR #44 acceptance fixes

- Successful authenticated import now navigates to Transactions only after the commit succeeds.
- Transactions shows a safe completion message and imported count. A zero-import result says no new transactions were added.
- Duplicate review now checks active imported and manual account transactions, not only browser-local/manual rows.
- High-confidence existing matches default to Skip and retain a safe `LIKELY_EXISTING_DUPLICATE` warning code.
- A likely duplicate can still be deliberately changed to Import, but the final confirmation warns that another copy will be created.
- Files with at least two likely matches covering at least 30% of rows show an overlapping-import warning.
- Import remains disabled if the signed-in account duplicate check is loading or unavailable; the user can retry safely.
- Existing imported transactions are warning-only and cannot become Merge targets.
- Existing manual transactions remain the only eligible Merge targets.
- `MetLifeInsurance` rows containing changing `MetLifePN_...` references now group under the stable `metlifeinsurance` key.
- Direct-debit numbers and provider-specific reference fragments are excluded from merchant learning.
- Generic Payment, Transfer, Bank transfer and similar labels remain excluded from unsafe duplicate or merchant grouping.

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
2. Re-import the same synthetic CSV and confirm matching rows default to Skip with `Already in SpendGrove` duplicate guidance.
3. Change one likely duplicate from Skip to Import and confirm the final dialog warns that another copy will be created.
4. Import an overlapping CSV containing both previously imported and new synthetic rows; confirm only likely matches default to Skip and new rows remain Import.
5. Confirm an overlap warning appears when at least two likely matches cover 30% or more of the file.
6. Confirm imported existing rows are warning-only and cannot be selected as Merge targets.
7. Confirm a matching existing manual transaction can still be selected as the Merge target.
8. Temporarily interrupt the account transaction request and confirm import stays disabled with a safe Retry duplicate check action.
9. Review `Direct Debit ... MetLifeInsurance MetLifePN_...` variants and confirm they group together and reuse the Insurance choice.
10. Confirm a different named direct-debit merchant does not group with MetLifeInsurance.
11. Confirm generic Payment, Transfer and Bank transfer rows are not over-grouped or treated as duplicate matches on amount/date alone.
12. Reconfirm imported transaction edit/soft-delete, Settings import history, Ready/Needs review semantics, stable filtering, 600-row paging and safe idempotent retry behaviour.
13. Use synthetic data only and inspect account/history surfaces to confirm no raw CSV, filename, bank narration or private banking identifiers are persisted.

If the client reports a defect, fix only that Phase 3A acceptance issue. Otherwise wait for explicit Phase 3A closure or separately scoped next-phase approval.

## Resume instruction

Resume from repository truth: read `AGENTS.md`, `docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md` and this file; verify GitHub/Vercel; perform only the exact next action above.
