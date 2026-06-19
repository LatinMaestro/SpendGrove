# Phase 3A Summary — Persistence & Commit Foundation

Date updated: 19 June 2026

## Phase status

**Implementation status: complete.**

**Formal phase status: pending client acceptance and retesting.** Phase 3A is not closed until the client approves it or requests further Phase 3A fixes.

No Phase 4, Production migration or later module has started.

## Objective delivered

Phase 3A moved SpendGrove from a browser-local prototype toward secure account-backed persistence while preserving its privacy-first CSV workflow and review-before-commit model. It delivered:

- Clerk authentication and lazy SpendGrove user provisioning;
- Neon Postgres and server-only Prisma foundations;
- Preview-only migrations with a manual, confirmation-gated workflow;
- durable manual transactions and explicit device-to-account migration;
- durable custom categories, saved import profiles, merchant aliases and user-confirmed rules;
- authenticated, atomic and idempotent Import / Skip / Merge commit execution;
- safe aggregate import history without raw financial row content;
- browser-local fallbacks where account storage is unavailable or the user is signed out;
- Phase 3A acceptance fixes for large review performance, review state preservation, actionable readiness counts, mapping layout and mobile safe areas.

## Pull request and merge register

All functional PRs passed the Vercel project gate before merge.

| PR | Purpose | Merge commit |
|---|---|---|
| [#16](https://github.com/LatinMaestro/SpendGrove/pull/16) | Auth/database decision record | `011fa22a` |
| [#17](https://github.com/LatinMaestro/SpendGrove/pull/17) | Server persistence scaffolding | `dc6f1df1` |
| [#18](https://github.com/LatinMaestro/SpendGrove/pull/18) | Clerk auth and user provisioning | `a9f977b4` |
| [#19](https://github.com/LatinMaestro/SpendGrove/pull/19) | Autonomous delivery workflow | `53fc54be` |
| [#20](https://github.com/LatinMaestro/SpendGrove/pull/20) | Clerk/Neon/Vercel setup guide | `39458fca` |
| [#21](https://github.com/LatinMaestro/SpendGrove/pull/21) | Initial Preview Prisma migration | `422f201d` |
| [#22](https://github.com/LatinMaestro/SpendGrove/pull/22) | Manual Preview migration workflow | `518ea6c0` |
| [#23](https://github.com/LatinMaestro/SpendGrove/pull/23) | Preview migration workflow install fix | `93f2fd5d` |
| [#24](https://github.com/LatinMaestro/SpendGrove/pull/24) | Durable manual transactions | `cecbdd39` |
| [#25](https://github.com/LatinMaestro/SpendGrove/pull/25) | Durable custom categories | `42701761` |
| [#26](https://github.com/LatinMaestro/SpendGrove/pull/26) | Durable saved import profiles | `edb70012` |
| [#27](https://github.com/LatinMaestro/SpendGrove/pull/27) | Merchant lifecycle schema migration | `a41922d8` |
| [#28](https://github.com/LatinMaestro/SpendGrove/pull/28) | Durable merchant aliases and rules | `89501d57` |
| [#29](https://github.com/LatinMaestro/SpendGrove/pull/29) | Import commit execution | `96e918c3` |
| [#30](https://github.com/LatinMaestro/SpendGrove/pull/30) | Audit and import history hardening | `861f8e45` |
| [#31](https://github.com/LatinMaestro/SpendGrove/pull/31) | Manual transaction device-to-account migration | `9fc657d3` |
| [#32](https://github.com/LatinMaestro/SpendGrove/pull/32) | Phase 3A QA and client review package | `906e3042` |
| [#33](https://github.com/LatinMaestro/SpendGrove/pull/33) | Import-review acceptance fixes | `2f86fa7a` |

## Acceptance fixes delivered in PR #33

The client acceptance blockers were traced to specific implementation causes and fixed without changing the approved data model or privacy posture:

- Merchant alias/rule account synchronisation no longer calls `window.location.reload()`, so the selected CSV and active review remain in memory.
- Account merchant data is merged back into the active review while preserving row actions, categories, tax flags and Merge targets.
- Review rows are paginated at 25 rows per page. A 600-row import presents 24 bounded pages instead of 600 heavy interactive cards at once.
- Duplicate-candidate work is performed only for visible rows while the full row set remains available for summary and final commit.
- The ambiguous `Check` total was replaced by a live `Needs review` count covering unresolved fallback categories, invalid date/amount rows, parser warnings and Merge rows without a selected target.
- Account commit remains unavailable until the actionable `Needs review` count reaches zero.
- Saved mapping controls now appear after column matching and confirmation.
- Mapping changes no longer use a mapping-derived React key that could remount the review.
- Page navigation preserves review decisions and edits.
- Fixed navigation and app-shell spacing account for mobile safe areas.
- Synthetic tests cover 600-row paging, 25-row bounds, readiness counting, Merge readiness and source-level regression guards.

## Authentication, database and persistence

- Clerk provider user IDs map to durable SpendGrove users; email is not the sole durable identity key.
- Signed-in records are scoped to the authenticated user.
- Neon Postgres is the approved managed PostgreSQL target.
- `DATABASE_URL` is the pooled runtime connection; `DIRECT_DATABASE_URL` is reserved for migration/admin access.
- Prisma remains server-only and lazily initialised for Vercel/serverless execution.
- Preview migrations completed successfully.
- **No Production migration has been run.**

Durable Phase 3A records include `User`, `UserSettings`, `Transaction`, `Category`, `BankImportProfile`, `MerchantProfile`, `MerchantAlias`, `MerchantRule`, `ImportBatch`, `ImportRow` and `AuditEvent`.

## Privacy and security evidence

Phase 3A does not persist or expose raw CSV files, raw CSV rows, original filenames, raw bank descriptions, balances, account identifiers, BSBs, card fragments, customer IDs, loan references, private identifiers, secrets or connection strings.

Controls include:

- browser-local CSV parsing, private-field scanning, mapping and row review;
- strict safe reviewed fields at the server boundary;
- authenticated ownership checks for reads, writes, deletes and Merge targets;
- integer-cent money storage;
- strict schemas that reject unknown migration/import fields;
- safe aggregate history projections and numeric audit allowlists;
- no direct Prisma imports from client-facing source folders;
- synthetic committed tests and examples only;
- device copies retained after failed migration attempts.

## Test, build and deployment evidence

The project gate runs the synthetic Vitest suite before the Next.js production build. Coverage across Phase 3A includes authentication, ownership, server-only boundaries, persistence lifecycles, strict privacy-field rejection, integer-cent preservation, Import / Skip / Merge execution, merge eligibility, rollback/idempotency, safe history projections, migration retry safety, and the acceptance regressions listed above.

Latest acceptance-fix evidence:

- PR #33 deployment: https://vercel.com/latinmaestros-projects/spendgrove/GZA2Ga6KsiwdFwVqh13o8G5PBFMQ
- PR #33 preview: https://spendgrove-git-codex-phase-3a-acc-9c0995-latinmaestros-projects.vercel.app
- PR #33 merge commit: `2f86fa7a9e5528b654491f7993fd11ed0bf487d2`
- Post-merge `main` deployment: https://vercel.com/latinmaestros-projects/spendgrove/57XMMdwUANHvWZs8z666FrPqnmTg
- Post-merge `main` Vercel status: Ready / green.

Automated signed-in browser retesting was not completed because the approved browser run was unavailable. The implementation has passed committed synthetic tests and the production build, but the user journey must not be described as manually verified.

No destructive migration/reset command was used. No force dependency fix was run.

## Known limitations and exclusions

- Formal Phase 3A closure still requires client acceptance.
- Production database migration and release hardening remain unapproved.
- Preview and Production data remain separate.
- Browser-local fallbacks are device/browser-specific and can disappear if storage is cleared.
- Tax review flags remain transient where not represented by the approved commit model.
- Durable import categories must already exist in the signed-in account.
- Import history intentionally shows safe outcomes and aggregates rather than original financial row content.
- Clerk webhook synchronisation remains deferred; lazy provisioning is the approved Phase 3A approach.
- Loans, properties, tax reports, recurring detection, budgets, insights, Basiq, enhanced lookup, AI, payments, household mode and Phase 4 functionality remain outside scope.

## Client retesting checklist

Use synthetic or fictional data only. Do not upload or share private CSVs or screenshots containing private transactions.

1. Open the final Vercel build and sign in with a test account.
2. Import a synthetic CSV of roughly 600 rows.
3. Confirm review remains responsive, shows 25 rows per page and reports 24 pages.
4. Confirm saved mapping controls appear after column matching and confirmation.
5. Change categories/actions and confirm `Needs review` updates to match actionable unresolved rows.
6. Move between pages and confirm row actions, categories, tax flags and Merge targets persist.
7. Save or synchronise a fictional merchant alias/rule and confirm the active review remains open.
8. Use a smaller synthetic import, resolve all actionable rows and confirm commit becomes available.
9. Commit a mixture of Import, Skip and eligible Merge choices.
10. Confirm safe account history shows aggregate outcomes without CSV content, filenames, raw descriptions, amounts or account details.
11. Repeat the key flow at phone size and confirm bottom navigation does not obscure controls.

Please report confusing wording, layout/mobile issues, unexpected duplicates or missing fictional transactions, readiness-count errors, lost review choices, or any unclear browser-local versus account-backed behaviour. Do not paste private financial data into feedback.

## Exact next step

Stop implementation and wait for client retesting. Fix only reported Phase 3A acceptance defects. Do not close the phase or start a later phase without explicit client approval.
