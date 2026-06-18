# Phase 3A Summary — Persistence & Commit Foundation

Date prepared: 19 June 2026

## Phase status

**Implementation status: complete and ready for final client review.**

**Formal phase status: pending client acceptance.** Phase 3A should be marked closed only after the client completes the non-technical testing checklist and approves closure or records any requested follow-up fixes.

Phase 3A moved SpendGrove from a browser-local prototype toward secure account-backed persistence while preserving its privacy-first CSV workflow and review-before-commit model.

No Phase 4 or later work has started.

## Objective delivered

Phase 3A delivered:

- Clerk-backed authentication and lazy SpendGrove user provisioning;
- Neon Postgres and Prisma persistence foundations;
- server-only database access and authenticated ownership helpers;
- Preview-only Prisma migration files and a manual Preview migration workflow;
- durable manual transactions;
- durable custom categories;
- durable saved import profiles and mappings;
- durable merchant profiles, aliases and user-confirmed rules;
- authenticated Import / Skip / Merge commit execution;
- safe durable import history and aggregate audit presentation;
- explicit browser-local manual transaction migration into a signed-in account;
- browser-local fallbacks where account storage is unavailable or the user is signed out.

## Pull request and merge register

All listed PRs were merged with a green Vercel gate unless noted as documentation/workflow-only.

| PR | Purpose | Merge commit | Vercel / migration evidence | Notes |
|---|---|---|---|---|
| [#16](https://github.com/LatinMaestro/SpendGrove/pull/16) | Auth/database decision record | `011fa22a` | Green | Selected Clerk, Neon Postgres, Prisma and Vercel direction. |
| [#17](https://github.com/LatinMaestro/SpendGrove/pull/17) | Server persistence scaffolding | `dc6f1df1` | Green | Added server-only Prisma, safe env checks and ownership helpers. |
| [#18](https://github.com/LatinMaestro/SpendGrove/pull/18) | Clerk auth and user provisioning | `a9f977b4` | Green | Added Clerk identity mapping and lazy User/UserSettings provisioning. |
| [#19](https://github.com/LatinMaestro/SpendGrove/pull/19) | Autonomous delivery workflow | `53fc54be` | Green | Documentation/workflow control update. |
| [#20](https://github.com/LatinMaestro/SpendGrove/pull/20) | Clerk/Neon/Vercel setup guide | `39458fca` | Green | Documentation-only setup guide; no secrets committed. |
| [#21](https://github.com/LatinMaestro/SpendGrove/pull/21) | Initial Preview Prisma migration | `422f201d` | Green | Added schema-only initial migration for the new Preview database. |
| [#22](https://github.com/LatinMaestro/SpendGrove/pull/22) | Manual Preview migration workflow | `518ea6c0` | Green | Manual, confirmation-gated, Preview-only GitHub Actions workflow. |
| [#23](https://github.com/LatinMaestro/SpendGrove/pull/23) | Preview migration workflow install fix | `93f2fd5d` | Green | Removed lockfile dependency; Preview workflow was rerun successfully. |
| [#24](https://github.com/LatinMaestro/SpendGrove/pull/24) | Durable manual transactions | `cecbdd39` | [Ready](https://vercel.com/latinmaestros-projects/spendgrove/2YaW93SJbygCjo3tti7vVq2ZqRhg) | Account-backed create, edit and soft delete with local fallback. |
| [#25](https://github.com/LatinMaestro/SpendGrove/pull/25) | Durable custom categories | `42701761` | [Ready](https://vercel.com/latinmaestros-projects/spendgrove/9mBhYu1E1ZeENNN5tow3KcfNwr3g) | User-owned categories plus explicit local migration. |
| [#26](https://github.com/LatinMaestro/SpendGrove/pull/26) | Durable saved import profiles | `edb70012` | [Ready](https://vercel.com/latinmaestros-projects/spendgrove/AcqwNUViu3rcSexZTBnmnFRDFZuL) | Safe structural mapping metadata only. |
| [#27](https://github.com/LatinMaestro/SpendGrove/pull/27) | Merchant lifecycle schema migration | `a41922d8` | [Ready](https://vercel.com/latinmaestros-projects/spendgrove/8pGAD31woREC9titbGrh3CrnZsFt) | Preview migration applied successfully after merge; no Production migration. |
| [#28](https://github.com/LatinMaestro/SpendGrove/pull/28) | Durable merchant aliases and rules | `89501d57` | [Ready](https://vercel.com/latinmaestros-projects/spendgrove/AcTjHFWh9s5VN9yFqCLLGLx2VFQv) | User-owned lifecycle, conflicts and explicit local migration. |
| [#29](https://github.com/LatinMaestro/SpendGrove/pull/29) | Import commit execution | `96e918c3` | [Ready](https://vercel.com/latinmaestros-projects/spendgrove/2111iKyj8mfwXeSpc1EmyHKW491M) | Atomic, authenticated and idempotent Import / Skip / Merge commit. |
| [#30](https://github.com/LatinMaestro/SpendGrove/pull/30) | Audit and import history hardening | `861f8e45` | [Ready](https://vercel.com/latinmaestros-projects/spendgrove/CpEYWHQFRsYTgfLCXHkh5LeS7GPH) | Read-only safe account history and aggregate audit view. |
| [#31](https://github.com/LatinMaestro/SpendGrove/pull/31) | Manual transaction device-to-account migration | `9fc657d3` | [Ready](https://vercel.com/latinmaestros-projects/spendgrove/8vpp9qbYF3ej6ZZb8z2sp6rBk9ex) · [Preview](https://spendgrove-git-codex-phase-3a-qa-closure-latinmaestros-projects.vercel.app) | Explicit confirmation, deterministic retry protection and device-copy failure safety. |

A final documentation/QA close-out PR follows this register and should be added here when merged.

## User-facing features delivered

### Accounts and persistence

- Users can sign up and sign in through Clerk.
- The first authenticated server access lazily provisions a SpendGrove `User` and `UserSettings` record.
- Signed-in product records are scoped to the authenticated SpendGrove user.
- Signed-out or unconfigured environments retain the earlier browser-local experience where appropriate.

### Manual transactions

- Signed-in users can create, edit and soft-delete durable manual transactions.
- Amounts remain integer cents.
- Deleted transactions and split-parent containers are excluded from active transaction lists.
- Existing browser-local manual transactions can now be moved to the account after explicit confirmation.
- Migration retries use deterministic user-scoped identities and do not duplicate completed items.
- If migration fails, the device copy is not cleared.

### Categories, mappings and merchant choices

- Custom categories persist to the signed-in account with archive/restore and duplicate-name protections.
- Saved import profiles persist only safe structural mapping metadata.
- Merchant profiles, aliases and user-confirmed rules persist with account ownership, lifecycle controls and explicit conflict handling.
- Each browser-local migration requires confirmation and keeps the device copy after failure.

### Import commit and history

- CSV parsing, private-field scanning, mapping and row review remain browser-local.
- Users still review every row and choose Import, Skip or Merge before committing.
- The server receives only strict safe reviewed fields.
- Import commit is authenticated, atomic and idempotent.
- Merge targets must be active, user-owned, manual, non-deleted and not split parents.
- Safe account history shows aggregate counts, row outcomes, warning counts and link state without returning financial row content.

## Database, authentication and persistence changes

### Authentication

- Clerk is the authentication provider.
- Clerk provider user IDs are mapped to durable SpendGrove users.
- Email is not used as the sole durable identity key.
- Production code no longer silently falls back to the Phase 3A stub user.

### Database and Prisma

- Neon Postgres is the approved managed PostgreSQL target.
- `DATABASE_URL` is the pooled runtime connection.
- `DIRECT_DATABASE_URL` is reserved for migration/admin access.
- Prisma access remains server-only and lazily initialised for Vercel/serverless execution.
- The initial schema migration and merchant lifecycle migration were applied to Preview only.
- No Production migration was run.

### Durable models now used

Phase 3A actively uses user-owned records including:

- `User` and `UserSettings`;
- `Transaction`;
- `Category`;
- `BankImportProfile`;
- `MerchantProfile`, `MerchantAlias` and `MerchantRule`;
- `ImportBatch` and `ImportRow`;
- `AuditEvent`.

The implementation preserves soft-delete/lifecycle fields and user ownership boundaries.

## Privacy and security evidence

Phase 3A preserves the core privacy promise.

The implementation does not persist or expose:

- raw CSV files;
- raw CSV rows;
- original filenames;
- raw bank descriptions or narration;
- account identifiers;
- BSBs;
- card fragments;
- customer IDs;
- loan references;
- balances;
- private identifiers;
- secrets or connection strings.

Additional controls:

- client-facing source folders are tested to prevent direct Prisma/server database imports;
- product write paths are restricted to approved server services;
- authenticated user context supplies ownership; client-supplied `userId` values are not trusted;
- update/delete/merge operations check user ownership;
- strict Zod schemas reject unknown migration and import fields;
- audit/history responses use explicit safe projections and numeric metadata allowlists;
- database and provider errors are converted to safe user-facing messages;
- committed tests and examples use synthetic data only;
- no private CSVs or private financial screenshots were added.

## Test and build evidence

Every functional Phase 3A PR passed the Vercel project gate. The project build runs the synthetic Vitest suite before the Next.js production build.

Coverage added across Phase 3A includes:

- missing authentication and ownership mismatch rejection;
- cross-user read/write denial;
- lazy user provisioning and identity reuse;
- server-only Prisma boundaries and approved write-path scanning;
- manual transaction create/edit/soft-delete and split-parent exclusion;
- category/profile/merchant lifecycle and local migration behaviour;
- strict privacy-field rejection;
- integer-cent preservation;
- Import / Skip / Merge execution;
- merge-target ownership and eligibility;
- atomic rollback and idempotent import commit;
- safe audit metadata and history projection;
- manual transaction migration retry safety;
- device-copy retention after failed account migration.

No destructive migration/reset command was used. `npm audit fix --force` was not run. Any future dependency advisory should be reviewed separately rather than force-fixed during a phase close-out.

## Latest Vercel evidence

- PR #31 functional preview: https://spendgrove-git-codex-phase-3a-qa-closure-latinmaestros-projects.vercel.app
- PR #31 deployment details: https://vercel.com/latinmaestros-projects/spendgrove/8vpp9qbYF3ej6ZZb8z2sp6rBk9ex
- Latest merged functional main commit: `9fc657d37e0b652eee1b3da0a6c5e7ff2dcf2ab3`
- Latest main deployment details: https://vercel.com/latinmaestros-projects/spendgrove/EiuReZWZfuTzo29bfgQDej2APXpD

The final close-out PR must also pass the Vercel gate before merge. Its resulting `main` deployment becomes the final Phase 3A build evidence.

## Known limitations

- Phase 3A has not run a Production database migration.
- Preview and Production data must remain separate.
- Tax review flags remain transient where not represented by the approved commit model.
- Browser-local fallback remains device/browser-specific and can disappear if browser storage is cleared.
- Browser-local manual transaction migration covers the existing safe manual transaction model only.
- Manual transaction migration is resumable and idempotent rather than a single database-wide bulk transaction; the device copy remains intact until the server confirms success.
- Custom categories used by durable import commits must already exist in the signed-in account.
- Import history intentionally shows safe outcomes and aggregates, not original financial row content.
- Clerk webhook-based identity synchronisation remains deferred; lazy provisioning is the approved Phase 3A approach.
- No Production launch, App Store release or paid-service decision is included.

## Deferred items

The following remain outside Phase 3A:

- Production migration and release hardening;
- broader export/delete-account privacy controls;
- budgets and insights;
- recurring/subscription detection;
- loans, properties and tax reports;
- Basiq or enhanced merchant lookup;
- AI features;
- payments, subscriptions or paywalls;
- household mode and later modules.

## Non-technical client testing checklist

Use synthetic or fictional transaction data. Do not upload or share private CSVs or screenshots containing private transactions.

### 1. Account access

- Open the final Vercel build.
- Sign up with a test account or sign in.
- Confirm the app clearly shows the signed-in account state.
- Sign out and confirm the browser-local fallback remains understandable.

### 2. Manual transactions

- Create an expense, income and transfer using fictional values.
- Confirm the amounts and Australian dates display correctly.
- Edit one transaction.
- Duplicate one transaction and confirm the duplicate warning remains advisory.
- Delete one transaction and confirm it disappears from the active list.
- Refresh the page and confirm signed-in transactions remain available.

### 3. Manual transaction device migration

This prompt appears only when the current browser already contains safe browser-local manual transactions from the earlier prototype.

- Sign in on a browser that contains fictional local manual transactions.
- Confirm the migration panel explains that the entries are still only on the device.
- Choose the review/move action and read the confirmation prompt.
- Cancel once and confirm nothing changes.
- Confirm the migration.
- Check the migrated and skipped counts.
- Reload the account transaction list and confirm the migrated entries appear once.
- If practical, retry and confirm no duplicate durable entries are created.

### 4. Custom categories

- Create a fictional custom category during import review.
- Rename it, archive it and restore it.
- Confirm a duplicate name is rejected.
- If a device-to-account prompt appears, cancel once, then confirm it.

### 5. Saved import mapping

- Use a small synthetic CSV.
- Map its columns and confirm the preview.
- Save the mapping with a generic name.
- Import another synthetic file with the same structure and confirm the mapping can be reused and reviewed.
- Rename, disable/enable and delete the saved mapping.

### 6. Merchant choices

- Use fictional merchant names only.
- Create or confirm a merchant alias/rule.
- Test rename, disable/restore and conflict choices.
- Confirm suggestions remain reviewable and can be overridden.

### 7. Reviewed import commit

- Import a synthetic CSV.
- Confirm private-looking columns are excluded before review.
- Review every row.
- Choose a mixture of Import, Skip and Merge actions.
- For Merge, choose only an eligible existing manual transaction.
- Confirm the final commit summary before saving.
- Confirm the success message reports imported, skipped and merged counts.
- Retry the same completed request if the UI permits and confirm transactions are not duplicated.

### 8. Import history

- Open the Import page after a successful commit.
- Confirm the signed-in account history shows safe totals and row outcomes.
- Confirm it does not display CSV content, filenames, raw bank descriptions, amounts, account details or private identifiers.
- Sign out and confirm browser-local review summaries remain separate.

### 9. Mobile and beginner-friendliness

- Repeat the main manual transaction and import workflows on a phone-sized screen.
- Check that buttons are easy to tap, wording is plain English and no screen feels like a developer/admin tool.

## What the client should report back

Please report:

- whether every workflow could be completed;
- any confusing wording;
- any layout or mobile problems;
- any place where the browser-local versus account-backed distinction is unclear;
- any unexpected duplicate, missing or incorrectly categorised fictional transaction;
- whether the import confirmation and history views feel safe and understandable.

Do not paste real CSV rows, filenames, balances, descriptions, account details, screenshots containing private transactions, secrets or connection strings into feedback.

## Recommended next-phase options

Do not start any option until the client explicitly approves it.

1. **Phase 3B — Production migration and release hardening**
   - plan the Production migration;
   - add release, backup, recovery and environment-separation evidence;
   - complete export/delete and production privacy hardening where approved.

2. **Loans, properties and tax phase**
   - implement the existing roadmap’s loan reconciliation, property records and EOFY reporting only after financial-logic review.

3. **Recurring, budgets and insights phase**
   - add recurring/subscription detection, budgets and dashboard insights only after scope approval.

Recommended next step: complete client Phase 3A acceptance testing first, then choose between Production hardening and the next product module based on release priorities.

## Closure recommendation

Phase 3A implementation is ready for client acceptance. If the checklist passes without material defects, the client can formally close Phase 3A and approve a separately scoped next phase.
