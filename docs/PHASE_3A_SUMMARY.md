# Phase 3A Summary — Persistence & Commit Foundation

Date updated: 20 June 2026

## Phase status

**Implementation status: complete.**

**Formal status: pending client acceptance and signed-in retesting.** Phase 3A is not closed until the client approves it or requests further in-scope fixes.

No Phase 4, Production migration or later module has started.

## Phase 3A delivery

Phase 3A delivered Clerk authentication, Neon/Postgres and server-only Prisma foundations, Preview-only migrations, durable account transactions/categories/import profiles/merchant suggestions, authenticated atomic and idempotent Import / Skip / Merge commit, safe aggregate history, explicit device-to-account migration and browser-local fallbacks. CSV parsing, private-field scanning, mapping and source-detail review remain browser-local.

## Acceptance-hardening register

| PR | Purpose | Merge commit |
|---|---|---|
| [#33](https://github.com/LatinMaestro/SpendGrove/pull/33) | 25-row paging, readiness count, review state preservation, mapping order and safe-area fixes | `2f86fa7a` |
| [#34](https://github.com/LatinMaestro/SpendGrove/pull/34) | Permanent Codex context/handoff protocol | `590c0390` |
| [#35](https://github.com/LatinMaestro/SpendGrove/pull/35) | Automatic merchant learning, mobile category picker, styled Merge guidance and early account status | `79cc223a` |
| [#36](https://github.com/LatinMaestro/SpendGrove/pull/36) | Phase 3A handoff update after PR #35 | `e6fa5a4c` |
| [#37](https://github.com/LatinMaestro/SpendGrove/pull/37) | Review filtering/readiness, safe merchant grouping, transfer assistance and zero-value save blocker fix | `7d971519` |
| [#38](https://github.com/LatinMaestro/SpendGrove/pull/38) | Phase 3A handoff update after PR #37 | `456b2eb6` |
| [#39](https://github.com/LatinMaestro/SpendGrove/pull/39) | Stable filtered rows, browser-local source details, simplified save, Needs review soft warning and batched commit | `0a8583ed` |
| [#40](https://github.com/LatinMaestro/SpendGrove/pull/40) | Imported transaction visibility/edit/delete and corrected Needs review badges | `918863fd` |

Earlier functional PRs #16–#32 remain part of the complete Phase 3A persistence, commit, migration, history and QA record.

## PR #39: review and save flow

- Captures a stable working set for `Only show items needing review`; resolved rows stay visible for follow-up edits until intentional refresh.
- Removes the large transfer decision panel and uses normal category review.
- Shows mapped source date/amount/narration in More options from active browser memory only.
- Simplifies the active review footer to one primary import action.
- Allows the approved `Needs review` category after a styled warning confirmation.
- Keeps true date, amount, category and Merge-target blockers strict with safe row-level reasons.
- Replaces hundreds of sequential 99-row database operations with cached category/profile lookups and bulk transaction/import-row writes inside one bounded atomic transaction.
- Preserves request-ID idempotency and rollback safety.

## PR #40: imported transaction visibility and management

### Root cause

The durable Transactions service filtered active list, edit and delete lookups to `source: MANUAL`. Its projection also hardcoded the source as manual. Imported transactions were successfully created by import commit but excluded from the Transactions tab and its mutation routes.

### Fix

- Active user-owned manual and imported transactions are returned by the same account transaction list.
- Soft-deleted records and split-parent/container records remain excluded.
- Imported rows show an `Imported` badge and remain visible after refresh.
- User-owned imported transactions can be safely edited through the existing account editor.
- Imported transactions can be soft-deleted without deleting ImportBatch, ImportRow or audit history.
- Safe import history distinguishes active and later-deleted links without returning descriptions, amounts or raw row data.
- Manual creation and Merge-target eligibility remain restricted to manual transactions.

## Corrected Needs review semantics

Root cause: readiness treated every unconfirmed suggestion and every row warning code as unresolved. Suggested and remembered categories therefore showed a stale generic Needs review badge even when the date, amount and category were valid.

Fix: a row now needs attention only when it has a true commit blocker or is explicitly assigned to the approved `Needs review` placeholder category. Valid keyword suggestions, remembered rules and manual selections show Ready. Non-critical parser warnings remain safe metadata rather than stale row-level blockers. Badges, global counts and the working-set filter use the same rule.

## Sign-in finding

Email-code sign-in works and is the recommended client testing path. Password failure appears account/password/rate-limit specific; no app-side Clerk provider, middleware, route or signed-state defect was identified. Passwords, keys and environment values must not be shared.

## Privacy and security

- Raw CSV files/rows, filenames, bank narration, balances, account identifiers, BSBs, card fragments, customer IDs, loan references, secrets and connection strings remain excluded.
- Browser-local source details never enter commit, transaction, mapping, merchant, history or audit payloads.
- Account transaction list/edit/delete paths return and accept cleaned validated fields only.
- Authenticated ownership, strict category/date/amount validation, split-parent exclusion and soft deletion remain intact.
- Import history survives linked transaction deletion and returns aggregate/link state only.
- No schema migration, package, provider, paid service, secret or environment change was included.
- No Production migration was run.

## Test and deployment evidence

Synthetic coverage now includes:

- 600-row paging and stable filtered working sets;
- valid suggested/remembered/manual category readiness;
- explicit Needs review soft warnings and hard blocker enforcement;
- browser-local source-detail privacy boundaries;
- batched atomic import and retry idempotency;
- imported/manual transaction list projection and source labels;
- imported transaction edit and soft delete;
- cross-user edit/delete rejection;
- retained ImportBatch/ImportRow links and safe deleted history state;
- signed-out browser-local fallback;
- no raw/private values in account or history responses.

PR #40 evidence:

- Preview: https://spendgrove-git-codex-phase-3a-imp-d351d3-latinmaestros-projects.vercel.app
- Deployment: https://vercel.com/latinmaestros-projects/spendgrove/6nMdDHPF2se4y3TLnHnYeVkhvofE
- Merge: `918863fdc8e35ea4c909db24fa20128881d1e8d1`
- Post-merge main: https://vercel.com/latinmaestros-projects/spendgrove/5aUtBAokZWqU6oDZR9A9D5FPGNbw
- Full tests and Next.js production build: Ready / green.

Automated signed-in browser retesting remains unavailable because previews are Vercel-authentication protected. The client must verify the complete account-backed flow.

## Client retesting checklist

Use synthetic data only:

1. Sign in via email code and commit a reviewed CSV.
2. Open Transactions and confirm imported rows appear with `Imported` labels beside manual rows.
3. Refresh and confirm imported rows remain.
4. Edit an imported row and confirm the changed value survives refresh.
5. Soft-delete an imported row and confirm it leaves the active list.
6. Confirm committed import history remains and reports the linked row as deleted.
7. Confirm valid suggested, remembered and manually selected categories show Ready.
8. Confirm only explicit Needs review or true blockers appear in the Needs review count/filter.
9. Recheck PR #39 stable filtering, source details, simplified save and 99-row commit.
10. Recheck 600-row paging, mobile controls, merchant learning and safe retries.

## Exact next step

Stop implementation and wait for client retesting. Fix only reported Phase 3A defects. Do not close Phase 3A or start a later phase without explicit approval.
