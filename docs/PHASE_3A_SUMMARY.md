# Phase 3A Summary — Persistence & Commit Foundation

Date updated: 19 June 2026

## Phase status

**Implementation status: complete.**

**Formal status: pending client acceptance and signed-in retesting.** Phase 3A is not closed until the client approves it or requests further in-scope fixes.

No Phase 4, Production migration or later module has started.

## Phase 3A delivery

Phase 3A delivered Clerk authentication, Neon/Postgres and server-only Prisma foundations, Preview-only migrations, durable manual transactions/categories/import profiles/merchant suggestions, authenticated atomic and idempotent Import / Skip / Merge commit, safe aggregate history, explicit device-to-account migration and browser-local fallbacks. CSV parsing, private-field scanning, mapping and review remain browser-local.

## Acceptance-hardening register

| PR | Purpose | Merge commit |
|---|---|---|
| [#33](https://github.com/LatinMaestro/SpendGrove/pull/33) | 25-row paging, readiness count, review state preservation, mapping order and safe-area fixes | `2f86fa7a` |
| [#34](https://github.com/LatinMaestro/SpendGrove/pull/34) | Permanent Codex context/handoff protocol | `590c0390` |
| [#35](https://github.com/LatinMaestro/SpendGrove/pull/35) | Automatic merchant learning, mobile category picker, styled Merge guidance and early account status | `79cc223a` |
| [#36](https://github.com/LatinMaestro/SpendGrove/pull/36) | Phase 3A handoff update after PR #35 | `e6fa5a4c` |
| [#37](https://github.com/LatinMaestro/SpendGrove/pull/37) | Review filtering/readiness, safe merchant grouping, transfer assistance and save blocker fix | `7d971519` |

Earlier functional PRs #16–#32 remain part of the complete Phase 3A persistence, commit, migration, history and QA record.

## PR #37 changes

### Review summary and filtering

- Replaced redundant Import with Ready to import.
- Summary now communicates Transactions, Needs review, Ready to import, Skip and Merge.
- Row badges derive from date, non-zero amount, category, warning and Merge-target blockers.
- The stale generic Needs review badge disappears after all blockers are resolved.
- Added `Only show items needing review`; paging applies to filtered results without resetting row state.
- Added a friendly complete-review empty state.

### Merchant grouping

- Safe canonical grouping removes reference/invoice-style tokens and preserved store/branch cleanup.
- Kindred Early/MetLife-style variants can share category application and future suggestions.
- Generic Payment/Transfer descriptions and ambiguous transfer rows are deliberately excluded from bulk grouping.
- Durable learning still stores only cleaned names, safe aliases/normalised keys and category IDs.

### Ambiguous transfers

- Transfer-like rows ask whether the movement is between the user’s accounts, an external payment, money received or not sure.
- Own-account transfers use a Transfer category and are not treated as income/spending.
- External payment/income choices require an appropriate category; Not sure remains blocked.
- Nearby opposite-amount transfer-like rows show a cautious possible-pair suggestion, never automatic classification.

### Import-save error

Root cause: review allowed zero-value rows to appear ready, while the strict commit schema correctly requires non-zero integer cents. The client could complete review and encounter validation only at final save.

Fix: shared readiness rules now mark null and zero amounts as blockers before commit. Row messaging, global counts, filtered review and commit availability use the same blocker model. Server validation remains strict, atomic and idempotent.

The final save confirmation is now SpendGrove UI instead of `window.confirm`. Failures preserve review state and provide safe retry guidance.

## Sign-in finding

Email-code sign-in works and is the recommended client testing path. Password failure appears account/password/rate-limit specific; no app-side Clerk provider, middleware, route or signed-state defect was identified. Passwords, keys and environment values must not be shared.

## Privacy and security

- No raw CSV files/rows, filenames, raw bank narration, balances, account identifiers, BSBs, card fragments, customer IDs, loan references, private identifiers, secrets or connection strings are added.
- Authenticated ownership, Merge eligibility, strict schemas, integer cents and safe aggregate history remain intact.
- No schema, migration, package, provider, paid service, secret or environment change was included.
- No Production migration was run.

## Test and deployment evidence

Synthetic coverage includes 600-row paging, readiness counts, zero-amount blocking, filtered paging/state identity, Merge readiness, Kindred/MetLife grouping, generic-transfer non-grouping, transfer choices/pair suggestions, native-confirm removal, atomic rollback, retry idempotency, ownership and privacy rejection.

- PR #37 preview: https://spendgrove-git-codex-phase-3a-rev-0f19bc-latinmaestros-projects.vercel.app
- PR #37 deployment: https://vercel.com/latinmaestros-projects/spendgrove/CebNGpW8yKkxsqa34BWeAbqqUisn
- PR #37 merge: `7d9715195e6da07ab93672760c0d53ee5bf2a102`
- Post-merge main: https://vercel.com/latinmaestros-projects/spendgrove/4y2Xj8MwfUvtkXJihsH8wPqDdeTP
- Full tests and Next.js production build: Ready / green.

Automated signed-in browser retesting remains unavailable. The client must verify the complete account-backed flow.

## Client retesting checklist

Use synthetic data only:

1. Sign in via email code.
2. Test summary counts and unresolved-only filtering.
3. Confirm resolved rows lose the Needs review badge.
4. Test fictional reference-bearing Kindred/MetLife variants.
5. Confirm generic Payment/Transfer rows do not bulk-group.
6. Test all transfer choices and a possible opposite-amount pair.
7. Confirm zero-dollar rows cannot reach save readiness.
8. Complete a styled account save and verify safe import history.
9. Retry safely and confirm no duplicates.
10. Recheck 600-row paging, mobile controls and preserved review state.

## Exact next step

Stop implementation and wait for client retesting. Fix only reported Phase 3A defects. Do not close Phase 3A or start a later phase without explicit approval.
