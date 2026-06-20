# Current Codex Handoff

Last updated: 20 June 2026

## Current state

- Active phase: Phase 3A — Persistence & Commit Foundation.
- Formal status: implementation complete; pending client acceptance and signed-in retesting.
- Current objective: stop implementation and support client retesting after PR #42.
- Do not start Phase 3B, Phase 4, Production migration or later modules without explicit client approval.

## Repository truth

- Latest functional PR: [#42](https://github.com/LatinMaestro/SpendGrove/pull/42), merged green on 20 June 2026.
- Merge commit: `483647b62b499f964688f89e1060e3e0486ea66a`.
- PR commit: `4ae5a7786120aac77b57442861a53e9361586bcf`.
- PR deployment: https://vercel.com/latinmaestros-projects/spendgrove/FzadChj22ECNippN9ErqxD9xm8xz
- Post-merge main deployment: https://vercel.com/latinmaestros-projects/spendgrove/F5NyN8gAeex1YVAtn6Utqumnj6bg
- Full tests: 55 files / 296 tests passed.
- Next.js production build: passed.
- Main Vercel deployment: Ready / green.

## PR #42 acceptance fixes

- Merchant grouping now removes or de-weights leading, trailing and embedded reference-like fragments, including long numbers and mixed alphanumeric invoice/transaction tokens, while preserving stable merchant words.
- Synthetic Kindred-like, MetLife-like and Superhero-like variants group safely.
- Generic labels such as Payment, Transfer, Bank transfer, Deposit, Withdrawal and CBA remain excluded from bulk grouping.
- `Apply to same merchant`, grouped category suggestions and automatic merchant/category learning use the safer canonical key.
- Automatic learning stores only the canonical cleaned merchant name and category ID, never transaction-specific references or raw bank narration.
- More options now contains only `Source details from this CSV` and the browser-memory privacy explanation.
- Duplicate/Merge guidance remains available outside More options.
- Previous, Next and page-number controls scroll to the top of the existing review list without remounting or resetting review state.
- Committed import history was removed from the active Import route and is now available in Settings when account persistence is configured.
- The active saved/reuse column mapping UI was removed. Each file is still automatically mapped, shown for confirmation and manually adjustable.
- The visible `Private account details hidden` panel was removed. Privacy scanning and private-column exclusion remain active.

## Preserved working behaviour

- Imported transactions remain visible, editable and soft-deletable in Transactions.
- ImportBatch, ImportRow and safe audit/history evidence remain after transaction deletion.
- Valid suggested, remembered and manually selected categories show Ready.
- Only explicit Needs review or true blockers affect the review filter.
- Stable filtered working sets, 600-row paging, mobile category controls and the simplified save flow remain.
- Needs Review remains a soft-warning import choice; true blockers remain strict.
- Batched, atomic and idempotent account commit remains.
- Source details remain browser-memory-only.

## Privacy and database status

- Raw CSV files, rows, original filenames, narration, balances, account identifiers, BSBs, card fragments, customer IDs, loan references, secrets and connection strings remain excluded from durable account data, merchant learning, history, audit metadata, logs and documentation.
- Source details never enter commit, transaction, mapping, merchant, history or audit payloads.
- No schema migration, package, provider, secret or environment change was included.
- No Preview database migration was required.
- No Production migration has been run.
- Home dashboard expense/income stats remain later-phase work and were not implemented.
- No Phase 4 or later work has started.

## Exact next action

Ask the client to retest with synthetic data:

1. Upload a CSV and confirm SpendGrove automatically attempts the column mapping.
2. Confirm the detected mapping can be accepted or manually changed, with no saved/reuse mapping controls shown.
3. Confirm the large private-details panel is absent while private columns still cannot be mapped or reviewed.
4. Review repeated merchant variants containing different leading, trailing and embedded reference tokens.
5. Confirm `Apply to same merchant` appears for safe Kindred-like, MetLife-like, Superhero-like and other stable merchant variants.
6. Confirm generic Payment, Transfer, Bank transfer, Deposit, Withdrawal and CBA rows are not over-grouped.
7. Open More options and confirm it shows only `Source details from this CSV` plus the browser-memory privacy copy.
8. Use Previous, Next and page-number controls and confirm each page change scrolls to the top without losing category, merchant, tax, action or Merge choices.
9. Confirm committed import history is absent from active mapping/review and available from Settings.
10. Complete a signed-in import and confirm imported transactions still appear in Transactions, remain editable and can be soft-deleted.
11. Reconfirm Ready/Needs review semantics, stable filtering, Needs Review warning import, 600-row paging and safe retry/idempotency behaviour.

If the client reports a defect, fix only that Phase 3A acceptance issue. Otherwise wait for explicit Phase 3A closure or separately scoped next-phase approval.

## Resume instruction

Resume from repository truth: read `AGENTS.md`, `docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md` and this file; verify GitHub/Vercel; perform only the exact next action above.
