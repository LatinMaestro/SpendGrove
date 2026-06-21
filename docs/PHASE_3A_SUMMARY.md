# Phase 3A Summary — Persistence & Commit Foundation

Date updated: 21 June 2026

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
| [#44](https://github.com/LatinMaestro/SpendGrove/pull/44) | Post-import navigation, imported-row duplicate protection, overlapping CSV warnings and MetLifePN grouping | `6e7c15d5` |
| [#46](https://github.com/LatinMaestro/SpendGrove/pull/46) | Analyse account duplicates before revealing review rows; add loading, retry and honest signed-out fallback states | `c4af1e4a` |

Earlier functional PRs #16–#32 remain part of the complete Phase 3A persistence, commit, migration, history and QA record.

## PR #44: post-import navigation and duplicate hardening

### Successful import navigation

- A successful authenticated import commit navigates to Transactions.
- The Transactions page shows a safe completion status and imported count.
- Failed commits preserve the review and do not navigate.
- Idempotent retries continue to avoid duplicate import batches.

### Existing and overlapping import detection

- Duplicate review now includes active imported and manual account transactions.
- Exact high-confidence existing matches default to Skip.
- Skipped duplicate outcomes store only the safe `LIKELY_EXISTING_DUPLICATE` warning code and no reviewed financial content.
- The user can deliberately override Skip to Import, with an explicit another-copy warning at final confirmation.
- A file is described as overlapping when at least two likely matches cover at least 30% of its rows.
- New rows in an overlapping file remain available to import.
- Existing imported rows are warning-only. Manual transactions remain the only Merge targets.
- Account-backed import stays disabled until duplicate protection has loaded successfully; unavailable checks can be retried.
- Duplicate comparison remains user-scoped and excludes deleted and split-parent records.
- Generic transfer/payment text is filtered to reduce false positives.

### MetLife-style merchant grouping

- Narration such as `Direct Debit 507156 MetLifeInsurance MetLifePN_UGDn1Zzs` canonicalises to `metlifeinsurance`.
- Changing `MetLifePN_...` references no longer split the merchant group.
- Provider reference fragments, direct-debit numbers and transfer noise are excluded from learned merchant data.
- Other named direct-debit merchants remain separate.
- Generic Payment, Transfer, Bank transfer, Deposit, Withdrawal and CBA labels remain excluded from bulk grouping.

## PR #46: analyse CSV before showing review rows

### Root cause

The signed-in account transaction request lived in the commit panel below the review summary and transaction cards. The parser-created rows were therefore visible with initial Import actions before the later account request applied duplicate Skip defaults and warnings.

### Fix

- The import review foundation now owns account duplicate preparation before the review UI is revealed.
- Signed-in users see `Analysing CSV` while account access, existing active transactions and duplicate outcomes are prepared.
- Review summaries, cards and row actions remain absent until the duplicate check succeeds.
- Likely duplicates first appear as Skip / Already in SpendGrove; overlapping-file warnings are present on the first review render.
- Failed account checks keep cards hidden and show a safe `Retry duplicate check` action.
- Signed-out browser-local review remains available and explicitly states that saved-account duplicate protection has not run.
- Signing out after an account-backed check removes the account projection from component state and restores browser-local transactions.
- Duplicate weights, thresholds, overlap rules, imported-row warning-only behavior, manual-only Merge eligibility and commit logic did not change.

## Preserved Phase 3A behaviour

- Imported transactions remain visible, editable and soft-deletable.
- ImportBatch, ImportRow and safe audit/history links remain after soft deletion.
- Valid suggested, remembered and manual categories show Ready.
- Needs Review remains a soft-warning import choice; date, amount, category and Merge-target blockers remain strict.
- Stable filtered working sets, 600-row paging, mobile controls, browser-local source details and the simplified save flow remain.
- Batched atomic commit, rollback safety and request-ID idempotency remain.

## Privacy and security

- Raw CSV files/rows, original filenames, raw bank narration, balances, account identifiers, BSBs, card fragments, customer IDs, loan references, secrets and connection strings remain excluded.
- Browser-local source details never enter commit, transaction, mapping, merchant, history or audit payloads.
- Duplicate candidates are computed from user-owned cleaned account transaction projections.
- Durable duplicate outcomes contain safe action/status/warning metadata only, not candidate descriptions or merchant text.
- Imported rows cannot be used as Merge targets; manual-only Merge eligibility remains enforced.
- Authenticated ownership, strict category/date/amount validation, split-parent exclusion and soft deletion remain intact.
- No schema migration, package, provider, paid service, secret or environment change was included.
- No Preview migration was required or run.
- No Production migration was run.
- No Phase 4 work started.

## Test and deployment evidence

PR #44 evidence:

- PR: https://github.com/LatinMaestro/SpendGrove/pull/44
- PR commit: `b3b4e5dd36ff13826c4207a5c93c6b48ccc41e18`
- Merge: `6e7c15d59d5c6fedf1f18cf5a822e11fbb95a769`
- PR deployment: https://vercel.com/latinmaestros-projects/spendgrove/BFKbsaUr5iH4sMRFyZ9CHniHi8vj
- PR preview: https://spendgrove-git-codex-phase-3a-pos-ac737d-latinmaestros-projects.vercel.app
- Post-merge main: https://vercel.com/latinmaestros-projects/spendgrove/79GLPBGxHpnjsrNXPmi6xREUJhsF
- Production alias: https://spendgrove.vercel.app
- Full tests: 55 files / 313 tests passed.
- TypeScript type-check: passed.
- Next.js production build: passed.
- `git diff --check`: passed.
- Vercel preview and merged-main deployment: Ready / green.
- Production `/transactions`: HTTP 200, matched route `/transactions`, served by Vercel.

PR #46 evidence:

- PR: https://github.com/LatinMaestro/SpendGrove/pull/46
- PR commit: `47728b975ec6553a89d818a8949070b531766447`
- Merge: `c4af1e4aa906b35f3d3803d0e7ff18e3237d7563`
- PR deployment: https://vercel.com/latinmaestros-projects/spendgrove/Edc7uG93GEjfqDKbt49R3BoKMYtA
- PR preview: https://spendgrove-git-codex-phase-3a-ana-c2c6dc-latinmaestros-projects.vercel.app
- Post-merge main: https://vercel.com/latinmaestros-projects/spendgrove/AzCUGVjQY4N3K4nxxtsrJTfQMbgF
- Production alias: https://spendgrove.vercel.app
- Focused tests: 3 files / 49 tests passed.
- Full tests: 55 files / 316 tests passed.
- TypeScript type-check: passed.
- Next.js production build: passed.
- `git diff --check`: passed.
- Vercel preview and merged-main deployment: Ready / green.
- Production `/import`: HTTP 200, matched route `/import`, served by Vercel.
- Standalone `next lint` remains unconfigured for non-interactive use and opens Next.js’s first-time setup prompt; the production build’s lint/type validity phase passed.

Synthetic coverage includes:

- success-only navigation and safe imported-count display;
- imported and manual account transaction duplicate comparison;
- likely duplicate default-Skip and deliberate Import override;
- overlapping files containing duplicate and new rows;
- imported rows excluded from Merge targets;
- manual Merge target rules preserved;
- user ownership, deleted-row and split-parent filtering;
- generic transfer/payment false-positive resistance;
- privacy-safe skipped duplicate outcomes;
- MetLifeInsurance / `MetLifePN_...` canonical grouping and learning;
- different named direct-debit merchants remaining separate;
- no provider references or direct-debit numbers in learned merchant storage.

Automated signed-in browser retesting remains unavailable because the account-backed flow requires the client’s authenticated test session. The production route and deployment health are verified; the complete signed-in import path is the client retest boundary.

## Client retesting checklist

Use synthetic data only:

1. Commit a signed-in import and confirm navigation to Transactions with the correct imported count.
2. Re-import the same CSV and confirm `Analysing CSV` appears before any transaction cards.
3. Confirm the list appears once with likely duplicates already set to Skip and no all-Import flash.
4. Import a partly overlapping CSV and confirm duplicate/new-row outcomes and the overlap warning are correct on first render.
5. Simulate an unavailable duplicate check and confirm cards stay hidden with a safe retry action.
6. Retry and confirm the prepared rows appear only after success.
7. Test signed out and confirm local review works without claiming saved-account duplicate protection.
8. Confirm imported existing rows cannot be Merge targets and manual transactions remain eligible.
9. Override one likely duplicate to Import and confirm the final another-copy warning.
10. Reconfirm MetLifeInsurance grouping, generic transfer/payment protection, successful navigation and imported edit/soft-delete.
11. Reconfirm Settings history, Ready/Needs review semantics, stable filtering, 600-row paging and idempotent retry.
12. Confirm no raw CSV, original filename, raw narration or private banking identifiers appear in account/history surfaces.

## Exact next step

Stop implementation and wait for client retesting. Fix only reported Phase 3A defects. Home dashboard stats remain later-phase work. Do not close Phase 3A or start a later phase without explicit approval.
