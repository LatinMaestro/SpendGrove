# Current Codex Handoff

Last updated: 19 June 2026

## Current state

- Active phase: Phase 3A — Persistence & Commit Foundation.
- Formal status: implementation complete; pending client acceptance and signed-in retesting.
- Current objective: stop implementation and support client retesting of PR #37.
- Do not start Phase 3B, Phase 4, Production migration or later modules without explicit client approval.

## Repository truth

- Latest functional PR: [#37](https://github.com/LatinMaestro/SpendGrove/pull/37), merged green on 19 June 2026.
- Merge commit: `7d9715195e6da07ab93672760c0d53ee5bf2a102`.
- PR preview: https://spendgrove-git-codex-phase-3a-rev-0f19bc-latinmaestros-projects.vercel.app
- PR deployment: https://vercel.com/latinmaestros-projects/spendgrove/CebNGpW8yKkxsqa34BWeAbqqUisn
- Post-merge main deployment: https://vercel.com/latinmaestros-projects/spendgrove/4y2Xj8MwfUvtkXJihsH8wPqDdeTP
- Tests and Next.js production build passed; main is Ready / green.

## Sign-in finding

Email-code sign-in works and is the recommended Phase 3A test path. Password failure remains consistent with the test account/password or Clerk rate limiting, not an identified app-side routing/provider defect. Do not request or share passwords, Clerk keys, secrets or environment values.

## PR #37 acceptance fixes

- Review summary now shows Transactions, Needs review, Ready to import, Skip and Merge; the redundant Import card is removed.
- Row readiness badges use actual blockers. A valid category removes the generic Needs review badge when no other blocker remains.
- `Only show items needing review` filters the paged list without changing row state; an empty state confirms when review is complete.
- Kindred Early/MetLife-style names can group when only safe reference/invoice tokens differ.
- Grouped identity powers apply-to-same-merchant, saved learning and future suggestions.
- Generic Payment/Transfer descriptions and ambiguous transfers are excluded from bulk merchant grouping.
- Ambiguous transfers offer: own-account transfer, payment to someone else, money received, or not sure.
- Nearby opposite-amount transfer-like rows produce a cautious possible-pair suggestion but are never auto-classified.
- The final save uses SpendGrove confirmation UI; no native confirm/alert remains in normal import review.
- Failed saves preserve the full review and show safe retry guidance.

## Import-save root cause and fix

Review previously allowed `amountCents === 0` to appear ready, while the strict commit schema correctly rejects zero-value transactions. A completed-looking review could therefore fail at final save. Readiness now treats null or zero amounts as blockers before commit. Atomic/idempotent server validation was not weakened.

## Privacy and database status

- Canonical merchant grouping uses cleaned merchant text only.
- Raw CSVs, rows, filenames, narration, balances, account identifiers, BSBs, card fragments, customer IDs, loan references and private identifiers remain excluded.
- No schema, package, provider, secret or environment change was included.
- Preview migrations previously completed successfully.
- No Production migration has been run.
- Automated signed-in browser retesting was not completed; do not claim the full journey is manually verified.

## Exact next action

Ask the client to retest with synthetic data:

1. Sign in using an email code and confirm account state is visible.
2. Confirm the new summary and `Only show items needing review` filter work across pages.
3. Select a valid category and confirm the row’s Needs review badge disappears when ready.
4. Test fictional Kindred Early and MetLife variants and confirm one category can apply across safely grouped rows.
5. Confirm generic Payment/Transfer rows are not bulk-grouped.
6. Resolve an ambiguous bank transfer through each choice; confirm Not sure remains blocked and own-account transfer uses a Transfer category.
7. Include a synthetic zero-dollar row and confirm it is blocked before save.
8. Complete a small reviewed import through the styled confirmation and confirm safe account import history.
9. Retry if needed and confirm no duplicate durable transactions are created.
10. Reconfirm 600-row paging, mobile picker clearance and cross-page state preservation.

If the client reports a defect, fix only that Phase 3A acceptance issue. Otherwise wait for explicit Phase 3A closure or separately scoped next-phase approval.

## Resume instruction

Resume from repository truth: read `AGENTS.md`, `docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md` and this file; verify GitHub/Vercel; perform only the exact next action above.
