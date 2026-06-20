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
| [#42](https://github.com/LatinMaestro/SpendGrove/pull/42) | Broader safe merchant grouping, simpler mapping/review UI, pagination scroll and Settings import history | `483647b6` |

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

## PR #42: merchant grouping and import-flow simplification

- Canonical merchant grouping removes leading, trailing and embedded reference-like fragments, long number sequences and mixed alphanumeric transaction tokens while preserving stable merchant words.
- Synthetic Kindred-like, MetLife-like and Superhero-like variants group safely.
- Generic Payment, Transfer, Bank transfer, Deposit, Withdrawal and CBA labels remain excluded from bulk grouping.
- Apply-to-same, grouped suggestions and automatic learning use the safer canonical key.
- Automatic learning persists only the canonical cleaned merchant name and category ID.
- More options now shows only `Source details from this CSV`; duplicate/Merge guidance remains outside it.
- Review pagination scrolls to the top for Previous, Next and page-number navigation without remounting the review state.
- Committed import history moved from the active Import route to Settings.
- Saved/reuse mapping controls were removed from the active flow; per-file automatic mapping, confirmation and manual changes remain.
- The visible private-details panel was removed while privacy scanning and exclusion remain active.
- Home dashboard expense/income stats were not implemented and remain later-phase work.

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
- leading, trailing and embedded merchant references;
- mixed alphanumeric invoice/transaction tokens;
- Kindred-like, MetLife-like and Superhero-like grouping;
- generic transfer/payment/deposit/withdrawal labels not being over-grouped;
- canonical merchant learning without reference persistence;
- source-only More options;
- mapping/privacy panel simplification;
- pagination scroll-to-top without review remount;
- committed import history placement in Settings.

PR #40 evidence:

- Preview: https://spendgrove-git-codex-phase-3a-imp-d351d3-latinmaestros-projects.vercel.app
- Deployment: https://vercel.com/latinmaestros-projects/spendgrove/6nMdDHPF2se4y3TLnHnYeVkhvofE
- Merge: `918863fdc8e35ea4c909db24fa20128881d1e8d1`
- Post-merge main: https://vercel.com/latinmaestros-projects/spendgrove/5aUtBAokZWqU6oDZR9A9D5FPGNbw
- Full tests and Next.js production build: Ready / green.

PR #42 evidence:

- PR: https://github.com/LatinMaestro/SpendGrove/pull/42
- PR commit: `4ae5a7786120aac77b57442861a53e9361586bcf`
- Merge: `483647b62b499f964688f89e1060e3e0486ea66a`
- PR deployment: https://vercel.com/latinmaestros-projects/spendgrove/FzadChj22ECNippN9ErqxD9xm8xz
- Post-merge main: https://vercel.com/latinmaestros-projects/spendgrove/F5NyN8gAeex1YVAtn6Utqumnj6bg
- Focused tests: 73 passed.
- Full tests: 55 files / 296 tests passed.
- Next.js production build: passed.
- Vercel preview and main deployment: Ready / green.

Automated signed-in browser retesting remains unavailable because previews are Vercel-authentication protected. The client must verify the complete account-backed flow.

## Client retesting checklist

Use synthetic data only:

1. Upload a CSV and confirm automatic column mapping runs on every file.
2. Confirm mappings can be accepted or manually changed without saved/reuse mapping controls.
3. Confirm the large private-details panel is absent while private columns remain excluded.
4. Confirm safe repeated merchant variants with different reference tokens group together.
5. Confirm generic transfer/payment/deposit/withdrawal labels are not over-grouped.
6. Confirm More options contains only source CSV details and browser-memory privacy copy.
7. Confirm Previous, Next and page-number navigation scrolls to the review top without losing choices.
8. Confirm committed import history is absent from active import/review and available in Settings.
9. Sign in via email code, commit an import and confirm imported rows appear with `Imported` labels.
10. Edit and soft-delete an imported row, then confirm safe committed history remains.
11. Confirm valid suggested, remembered and manually selected categories show Ready.
12. Recheck stable filtering, Needs Review warning import, 600-row paging, mobile controls and safe retries.

## Exact next step

Stop implementation and wait for client retesting. Fix only reported Phase 3A defects. Home dashboard stats remain later-phase work. Do not close Phase 3A or start a later phase without explicit approval.
