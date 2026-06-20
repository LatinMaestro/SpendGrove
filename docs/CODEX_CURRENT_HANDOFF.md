# Current Codex Handoff

Last updated: 20 June 2026

## Current state

- Active phase: Phase 3A — Persistence & Commit Foundation.
- Formal status: implementation complete; pending client acceptance and signed-in retesting.
- Current objective: stop implementation and support client retesting of PR #40.
- Do not start Phase 3B, Phase 4, Production migration or later modules without explicit client approval.

## Repository truth

- Latest functional PR: [#40](https://github.com/LatinMaestro/SpendGrove/pull/40), merged green on 20 June 2026.
- Merge commit: `918863fdc8e35ea4c909db24fa20128881d1e8d1`.
- PR preview: https://spendgrove-git-codex-phase-3a-imp-d351d3-latinmaestros-projects.vercel.app
- PR deployment: https://vercel.com/latinmaestros-projects/spendgrove/6nMdDHPF2se4y3TLnHnYeVkhvofE
- Post-merge main deployment: https://vercel.com/latinmaestros-projects/spendgrove/5aUtBAokZWqU6oDZR9A9D5FPGNbw
- Full tests and Next.js production build passed; main is Ready / green.

## Sign-in finding

Email-code sign-in works and remains the recommended Phase 3A test path. Password failure remains consistent with the test account/password or Clerk rate limiting, not an identified app-side routing/provider defect. Do not request or share passwords, Clerk keys, secrets or environment values.

## PR #39 save-flow acceptance fixes

- `Only show items needing review` captures a stable working set. Rows stay visible after category selection until the user selects `Hide resolved items` or toggles the filter.
- The large transfer decision panel was removed. Transfer-like rows use normal category review with a small hint.
- More options shows mapped `Source details from this CSV` from active browser memory only.
- The active review ends with one primary `Import reviewed transactions` panel.
- The approved `Needs review` category is a soft warning with `Import anyway` / `Keep reviewing` confirmation.
- True date, amount, category and Merge-target blockers remain strict and display safe row-level diagnostics.
- The 99-row commit path now caches shared lookups and uses bulk transaction/import-row writes inside one bounded atomic, idempotent transaction.

## PR #40 visibility and management fixes

- Root cause of invisible imports: the Transactions service filtered list, edit and delete lookups to `source: MANUAL`, while its projection hardcoded every row as manual. Imported records existed durably but were excluded from the whole Transactions surface.
- The signed-in Transactions tab now lists active user-owned manual and imported transactions together.
- Imported rows display a clear `Imported` source badge; manual entries display `Manual`.
- Imported transactions use the existing safe account editor for type, amount, date, cleaned description, category, notes and CSV-match hint.
- Imported transactions can be soft-deleted. They disappear from the active list, while their ImportBatch, ImportRow and audit history remain intact.
- Safe import history reports a deleted linked transaction as `DELETED` without returning financial or source-row content.
- Manual creation remains manual-only. Import Merge candidates remain restricted to active manual transactions.

## Review badge root cause and fix

PR #39 counted every `categoryConfirmed === false` suggestion and every parser warning code as unresolved row state. Therefore valid suggested and remembered categories still showed the generic Needs review badge.

Readiness now depends only on true commit blockers or the explicit approved `Needs review` category. Valid keyword suggestions, remembered merchant rules and manual category choices show `Ready`. Non-critical parser warning codes remain safe metadata and do not create a stale row-level blocker. Global counts, badges and the filter use this same rule.

## Privacy and database status

- Source details remain browser-memory-only; private/ignored columns are excluded from the display projection.
- Raw CSV files, rows, filenames, narration, balances and private identifiers are absent from account transaction APIs, commit payloads, saved mappings, merchant rules, history and audit responses.
- Account transactions expose cleaned durable fields only and remain user-scoped.
- Soft deletion updates only the linked transaction; it does not delete import batches, import rows or audit evidence.
- No schema, package, provider, secret or environment change was included.
- No Production migration has been run.
- Automated signed-in browser retesting was not completed because previews are Vercel-authentication protected. Do not claim the full journey is manually verified.

## Exact next action

Ask the client to retest with synthetic data:

1. Sign in using an email code.
2. Commit a small reviewed CSV import, open Transactions and confirm imported rows appear beside manual entries after refresh.
3. Confirm each row has the correct `Imported` or `Manual` source badge.
4. Open an imported row, edit its cleaned description/category/date/amount or notes, save and confirm the edit survives refresh.
5. Soft-delete an imported row and confirm it leaves the active Transactions list.
6. Open committed import history and confirm the deleted linked row reports a safe deleted state while the batch/row history remains.
7. Attempt cross-user access only through existing synthetic automated coverage; do not share accounts or private credentials.
8. Review a CSV containing valid suggested, remembered and manually selected categories; confirm those rows show Ready rather than a generic Needs review badge.
9. Leave one row explicitly in the `Needs review` category and confirm only that row remains in the count/filter.
10. Reconfirm PR #39 stable filtering, source details, simplified save, Needs review import warning and successful 99-row commit.
11. Reconfirm 600-row paging, mobile picker clearance, merchant learning and retry idempotency.

If the client reports a defect, fix only that Phase 3A acceptance issue. Otherwise wait for explicit Phase 3A closure or separately scoped next-phase approval.

## Resume instruction

Resume from repository truth: read `AGENTS.md`, `docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md` and this file; verify GitHub/Vercel; perform only the exact next action above.
