# Phase 3A Summary — Persistence & Commit Foundation

Date updated: 19 June 2026

## Phase status

**Implementation status: complete.**

**Formal phase status: pending client acceptance and signed-in retesting.** Phase 3A is not closed until the client approves it or requests further Phase 3A fixes.

No Phase 4, Production migration or later module has started.

## Objective delivered

Phase 3A moved SpendGrove from a browser-local prototype toward secure account-backed persistence while preserving privacy-first CSV review. It delivered Clerk authentication, Neon/Postgres and server-only Prisma foundations, Preview-only migrations, durable manual transactions/categories/import profiles/merchant suggestions, authenticated atomic Import / Skip / Merge commit, safe aggregate history, explicit device-to-account migration and browser-local fallbacks.

## Pull request register

All functional PRs passed the Vercel project gate before merge.

| PR | Purpose | Merge commit |
|---|---|---|
| [#16](https://github.com/LatinMaestro/SpendGrove/pull/16) | Auth/database decision record | `011fa22a` |
| [#17](https://github.com/LatinMaestro/SpendGrove/pull/17) | Server persistence scaffolding | `dc6f1df1` |
| [#18](https://github.com/LatinMaestro/SpendGrove/pull/18) | Clerk auth and provisioning | `a9f977b4` |
| [#19–#23](https://github.com/LatinMaestro/SpendGrove/pulls?q=is%3Apr+is%3Amerged+16..23) | Delivery controls, setup and Preview migration workflow | `53fc54be`–`93f2fd5d` |
| [#24](https://github.com/LatinMaestro/SpendGrove/pull/24) | Durable manual transactions | `cecbdd39` |
| [#25](https://github.com/LatinMaestro/SpendGrove/pull/25) | Durable custom categories | `42701761` |
| [#26](https://github.com/LatinMaestro/SpendGrove/pull/26) | Durable import profiles | `edb70012` |
| [#27–#28](https://github.com/LatinMaestro/SpendGrove/pulls?q=is%3Apr+is%3Amerged+27..28) | Merchant schema, aliases and rules | `a41922d8`, `89501d57` |
| [#29](https://github.com/LatinMaestro/SpendGrove/pull/29) | Import commit execution | `96e918c3` |
| [#30](https://github.com/LatinMaestro/SpendGrove/pull/30) | Safe audit/import history | `861f8e45` |
| [#31](https://github.com/LatinMaestro/SpendGrove/pull/31) | Manual transaction migration | `9fc657d3` |
| [#32](https://github.com/LatinMaestro/SpendGrove/pull/32) | QA/client review package | `906e3042` |
| [#33](https://github.com/LatinMaestro/SpendGrove/pull/33) | Paging, readiness and review-state acceptance fixes | `2f86fa7a` |
| [#34](https://github.com/LatinMaestro/SpendGrove/pull/34) | Permanent Codex handoff protocol | `590c0390` |
| [#35](https://github.com/LatinMaestro/SpendGrove/pull/35) | Sign-in finding, automatic merchant learning and review UX fixes | `79cc223a` |

## Acceptance hardening

PR #33 delivered bounded 25-row paging, visible-page duplicate calculations, a live actionable Needs review count, preserved review state, mapping controls after column confirmation, removal of reload-based merchant sync and mobile safe-area spacing.

PR #35 delivered:

- automatic safe merchant/category learning when a user manually chooses a category;
- automatic safe alias/profile learning when a cleaned merchant name edit finishes;
- browser-local fallback plus the existing signed-in account synchronisation path;
- explicit Replace / Keep existing / Cancel handling for conflicts;
- one-click undo for the latest automatic merchant save;
- plain-English “Saved for next time” confirmation;
- a mobile-safe in-app category sheet above fixed navigation;
- SpendGrove inline Merge guidance instead of native browser confirmation prompts;
- unchanged Merge eligibility: only an existing active user-owned manual transaction can be targeted;
- early signed-out/signed-in account-save status near the review summary.

## Sign-in investigation

The client video reached Clerk’s password step, showed an incorrect-password response, then showed provider rate limiting after repeated attempts. Code inspection found the Clerk provider, middleware, modal controls, route policy and signed-in state handling present and consistent. No app-side auth defect was identified, so authentication code was not changed.

Client verification remains required after the rate limit clears. The safe path is to use Clerk’s password-reset flow or create a fresh synthetic test account. Passwords, Clerk keys, environment values and secrets must never be shared with Codex or placed in repository material.

## Database, privacy and security

- Preview migrations completed successfully; **no Production migration has been run**.
- Signed-in records remain scoped to the authenticated user.
- Money remains integer cents.
- CSV parsing, private-field scanning, mapping and review remain browser-local.
- Merchant learning stores only cleaned merchant names, safe aliases/normalised keys and category IDs.
- Strict validators reject private identifiers and raw banking narration.
- Raw CSV files/rows, filenames, amounts, descriptions, account identifiers, BSBs, card fragments, customer IDs, loan references, balances, private identifiers, secrets and connection strings are not added to merchant storage.
- PR #35 added no schema, package, provider, service, secret or environment changes.

## Test and deployment evidence

Synthetic coverage includes authentication/ownership boundaries, persistence lifecycles, strict privacy rejection, Import / Skip / Merge execution, merge eligibility, rollback/idempotency, safe history, migration retry safety, 600-row paging, readiness counting, automatic merchant learning, conflicts, private-field rejection, mobile-safe picker guards, account-status placement and removal of Merge browser prompts.

Latest evidence:

- PR #35 preview: https://spendgrove-git-codex-phase-3a-mer-745726-latinmaestros-projects.vercel.app
- PR #35 deployment: https://vercel.com/latinmaestros-projects/spendgrove/GJNsxAKJ9UtvTMBcjn5RyLqnEbLB
- PR #35 merge: `79cc223af8de322ca92d766890d570ed11a358e4`
- Post-merge `main`: https://vercel.com/latinmaestros-projects/spendgrove/HB39xGzb8LujrqvUpEXTxkU6iCDZ
- Vercel tests and Next.js production build: Ready / green.

Automated signed-in browser retesting was unavailable. Do not describe the account-backed workflow as manually verified.

## Known limitations and exclusions

- Formal Phase 3A closure still requires client acceptance.
- Signed-in commit/history testing remains blocked until the client can access a test Clerk account.
- Production migration/release hardening remains unapproved.
- Browser-local fallback remains device/browser-specific.
- Import history intentionally exposes safe outcomes and aggregates, not financial row content.
- Clerk webhook synchronisation remains deferred; lazy provisioning remains approved.
- Loans, properties, tax reports, recurring, budgets, insights, Basiq, enhanced lookup, AI, payments, household mode and Phase 4 remain outside scope.

## Client retesting checklist

Use synthetic data only.

1. Wait for Clerk rate limiting to clear; reset the test password or create a new test account and sign in.
2. Confirm signed-in state and account-save status are obvious.
3. Choose a merchant category without More options; confirm automatic save and future suggestion.
4. Edit a cleaned merchant name without More options; confirm it is remembered.
5. Test conflict choices and Undo with fictional merchants.
6. Test the category sheet at phone size and ensure bottom navigation hides no controls.
7. Select Merge and confirm styled guidance; choose only an eligible manual target.
8. Resolve and commit a small signed-in import; confirm safe account history.
9. Reconfirm 600-row paging, readiness counts and cross-page state preservation.

Do not share passwords, secrets, real CSVs, private screenshots or financial data in feedback.

## Exact next step

Stop implementation and wait for client retesting. Fix only reported Phase 3A acceptance defects. Do not close Phase 3A or start a later phase without explicit client approval.
