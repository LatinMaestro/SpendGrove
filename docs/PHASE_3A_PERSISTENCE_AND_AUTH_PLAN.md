# Phase 3A Persistence and Auth Plan

Date: 2026-06-17
Status: Proposed for PR 3A.0 client review
Scope: Planning and decision record only; no implementation in this PR

## Phase 3A objective

Phase 3A sits before the existing loans/properties/tax Phase 3 scope.

Objective:

Move SpendGrove from browser-local prototype storage toward secure account-based persistence, durable transactions, durable imports and safe audit history while preserving the CSV-first, no-bank-login, review-before-commit privacy model.

Phase 3A must not start loans, property/tax reports, recurring, budgets, Basiq, AI, payments or other later modules.

## Recommended architecture

Recommended stack direction:

- Frontend and app hosting: Next.js on Vercel.
- Authentication: Clerk, pending final client approval.
- Database: Neon Postgres with Prisma, pending final client approval.
- Runtime access: server-only Prisma access behind authenticated server actions or API routes.
- CSV processing: browser-only parsing, scanning, mapping and review until the user confirms commit.
- Durable storage: safe reviewed fields only, always owned by a user.

### Runtime data flow

```text
Signed-in user
  -> Clerk session
  -> SpendGrove server action/API route
  -> authenticated user lookup
  -> user-owned Prisma query/mutation
  -> Neon Postgres durable record
```

### CSV/import data flow

```text
CSV file selected in browser
  -> browser-only parser and privacy scan
  -> match columns
  -> review transactions
  -> user selects Import / Skip / Merge
  -> safe commit payload only
  -> authenticated server commit
  -> Prisma database transaction
  -> Transaction / ImportBatch / ImportRow / AuditEvent records
```

### Browser-local migration flow

```text
Existing browser-local prototype data
  -> migration detector
  -> safe count/summary preview
  -> user chooses what to migrate
  -> server validates and rejects unsafe fields
  -> durable user-owned records
  -> user can clear local prototype copy
```

## Recommended PR sequence

### PR 3A.0 — Auth/database decision record

Scope:

- Documentation-only decision record.
- Confirm recommended auth provider.
- Confirm recommended database provider.
- Confirm environment, ownership, privacy and migration policies.
- Confirm Phase 3A implementation PR sequence.

Validation:

- Documentation review only.
- Confirm no code, package, schema or environment changes.

Review gate:

- Client must approve provider choices and implementation sequence before PR 3A.1 begins.

### PR 3A.1 — Server persistence scaffolding

Scope:

- Add approved environment validation structure.
- Add server-only Prisma access module boundary.
- Add no-op or read-only data-access guard patterns.
- Confirm Prisma never reaches client bundles.
- Confirm build does not require live production data.

Non-goals:

- No product database writes.
- No auth UI if PR 3A.2 handles auth separately.
- No transaction/import persistence.

Review gate:

- Data/privacy review for server-only database boundaries.

### PR 3A.2 — Production auth and user provisioning

Scope:

- Add approved auth provider.
- Add sign-in/sign-out/account shell.
- Map provider identity to SpendGrove `User`.
- Add user settings persistence where safe.
- Protect account-owned routes.
- Keep privacy-first onboarding language.

Key decision inside PR:

- Lazy user creation on first authenticated app access is preferred unless webhook sync is explicitly approved.

Review gate:

- Security/privacy review for auth flows, user mapping and logs.

### PR 3A.3 — Durable manual transactions

Scope:

- Persist manual transactions to authenticated user-owned database records.
- Preserve integer cents.
- Preserve Australian dates and AUD formatting.
- Preserve soft delete and exclusion from active totals.
- Migrate or offer migration for safe browser-local manual transactions.

Non-goals:

- No import commit execution yet.
- No loans/property/tax/recurring/budgets.

Review gate:

- Financial logic review for transaction totals, soft delete and split-parent exclusions.

### PR 3A.4 — Durable custom categories

Scope:

- Persist custom categories per user.
- Keep seeded categories immutable.
- Support rename/archive/restore for user categories.
- Migrate safe browser-local custom categories after user confirmation.
- Prevent duplicate names using trimmed, Unicode-normalised, case-insensitive checks.

Review gate:

- Privacy review for category-name rejection and migration behaviour.

### PR 3A.5 — Durable saved import profiles

Scope:

- Persist saved profiles per user.
- Store only safe structural mapping metadata.
- Exclude filenames, sample values, raw rows, balances and private identifiers.
- Allow profile rename/disable/enable/delete.
- Migrate safe browser-local profiles after review.

Review gate:

- CSV parser/data privacy review.

### PR 3A.6 — Durable merchant aliases and rules

Scope:

- Persist safe cleaned merchant profiles, aliases and rules per user.
- Preserve user-rule priority over aliases and keyword suggestions.
- Preserve conflict handling and safe storage rejection.
- Migrate safe browser-local merchant data after review.

Non-goals:

- No Basiq.
- No enhanced merchant lookup.
- No AI categorisation.

Review gate:

- Privacy review for merchant names, alias keys and stored metadata.

### PR 3A.7 — Import commit execution

Scope:

- Add authenticated commit flow for reviewed Import / Skip / Merge intentions.
- Create safe `ImportBatch` and `ImportRow` records.
- Create transactions for Import actions.
- Link selected user-owned manual transactions for Merge actions.
- Record Skip actions as safe metadata only.
- Use idempotency to prevent double commits.
- Use one database transaction per commit.

Non-goals:

- No raw CSV persistence.
- No automatic merge.
- No same-import rows as merge targets.

Review gate:

- Financial logic and CSV parser review gates both required.

### PR 3A.8 — Audit and history hardening

Scope:

- Add audit-event allowlist and redaction policy.
- Add import history views backed by safe database metadata.
- Add transaction/category/profile/rule audit entries where useful.
- Confirm audit metadata does not store private CSV data.

Review gate:

- Security/privacy review for audit retention and metadata shape.

### PR 3A.9 — Migration assistant and Phase 3A QA closure

Scope:

- Provide guided browser-local to durable account migration.
- Run full Phase 3A QA.
- Produce Phase 3A QA report.
- Confirm known limitations and deferred items.
- Recommend whether Phase 3A can close.

Non-goals:

- No Phase 3B/loans/properties/tax module implementation.

Review gate:

- Milestone closure gate.

## Schema impacts to review before implementation

The existing Prisma foundation should be used where possible. Material schema changes require client approval before implementation.

Likely schema review areas:

- `User`: provider identity fields, status, country/timezone, timestamps.
- `UserSettings`: durable preferences and privacy settings.
- `Transaction`: durable manual/imported transaction persistence, soft delete, split-parent exclusion rules, source/provenance preservation.
- `Category`: seeded vs user custom category distinction, archive/restore support.
- `ImportBatch`: safe committed import summary and status.
- `ImportRow`: safe reviewed mapped row values and Import / Skip / Merge outcome.
- `BankImportProfile`: durable saved profile metadata only.
- `MerchantProfile`, `MerchantAlias`, `MerchantRule`: safe cleaned merchant/rule persistence.
- `AuditEvent`: allowlisted action/entity metadata and private-data rejection.

Potential additions to consider:

- auth provider ID uniqueness on `User`;
- import commit idempotency key;
- migration batch tracking, if migration needs resumability;
- audit action/entity enums if current string conventions are not strict enough.

## Import commit strategy

Import commit must preserve review-before-commit.

Required approach:

1. Browser parses CSV locally and shows review rows.
2. User reviews categories, merchant labels, tax flag and action intentions.
3. User confirms commit.
4. Browser sends only safe mapped/reviewed fields to the server.
5. Server authenticates the user.
6. Server validates all fields again.
7. Server verifies ownership of selected categories, merchant rules and merge targets.
8. Server writes import batch, rows, transactions and audit events in one database transaction.
9. Server returns safe summary counts.
10. Browser clears transient import state only after success.

Action behaviour:

- Import: creates a durable transaction.
- Skip: records safe action metadata without creating a transaction.
- Merge: links the row to a selected existing user-owned transaction and preserves transaction provenance.

Hard safety rules:

- Same-import duplicates are warnings only and cannot be merge targets.
- Deleted transactions cannot be merge targets.
- Split parent transactions cannot be merge targets.
- Merge targets must belong to the authenticated user.
- Raw CSV rows, filenames and private identifiers are never part of the commit payload.

## Browser-local migration strategy

Migration should be explicit and reversible from the user's perspective.

Recommended migration groups:

- manual transactions;
- custom categories;
- saved import profiles;
- merchant aliases/rules;
- safe settings/preferences where appropriate.

Migration screen should show safe counts, not raw details:

- number of local transactions;
- number of custom categories;
- number of saved mappings;
- number of merchant rules/aliases.

Migration must reject:

- unsafe category names;
- unsafe merchant names;
- private identifiers;
- raw descriptions;
- raw CSV data;
- filenames;
- balances;
- malformed records.

After migration:

- keep local data until the user explicitly clears it; or
- mark it as migrated and offer a clear local data action.

The final policy requires client approval before implementation.

## Privacy and security controls

Required controls:

- Server-only Prisma access.
- Authenticated user lookup before every durable query.
- No client-supplied `userId` trust.
- Zod/server validation for every write payload.
- Safe-text validation for descriptions, merchant names, category names, aliases and profile names.
- Audit-event metadata allowlist.
- No raw CSV, row or filename logging.
- Separate preview/staging/production databases.
- No production data in preview deployments.
- No real secrets in the repo.
- Data deletion/export policy to be planned before production launch.

Optional control requiring client decision:

- Application-level encryption for selected sensitive text fields.

## Data retained in browser-local storage after Phase 3A

Browser-local storage may still hold:

- transient selected-file processing state;
- in-progress review state before commit;
- signed-out local drafts, if signed-out mode remains approved;
- UI-only preferences where cloud sync is not required;
- local migration source copy until the user clears it.

Browser-local storage must not be treated as production account storage after durable persistence is introduced.

## Data persisted durably after Phase 3A

Durable user-owned storage should include:

- user account record;
- user settings;
- manual transactions;
- imported transactions created through commit;
- custom categories;
- saved import profiles;
- merchant profiles, aliases and rules;
- import batches and safe import row/action metadata;
- audit events.

## Testing plan

Required tests before Phase 3A closure:

- auth guard tests;
- user provisioning tests;
- every user-owned query filters by authenticated user;
- cross-user access denial tests;
- transaction create/edit/delete/totals tests against durable storage;
- category persistence and seeded immutability tests;
- saved import profile privacy tests;
- merchant alias/rule privacy tests;
- import commit Import / Skip / Merge tests;
- import commit rollback/idempotency tests;
- same-import duplicate remains warning-only tests;
- browser-local migration tests;
- audit metadata redaction/rejection tests;
- synthetic CSV regression tests;
- no raw CSV, raw row, filename or private-value persistence tests;
- build, lint, typecheck and Prisma validation/generation checks.

## Vercel preview/check plan

Recommended deployment approach:

- PR 3A.0: docs-only preview/build; no runtime secrets required.
- PR 3A.1 onward: preview environment variables configured before runtime persistence checks.
- Preview databases must be separate from production.
- Staging database should be used for client acceptance once auth and persistence exist.
- Production database should not be connected to preview deployments.
- Migrations should run through an explicit deploy/migration step, not accidentally through normal static build.

Every implementation PR should report:

- Vercel preview link;
- database environment used, without secrets;
- whether migrations were run;
- privacy/storage impact;
- tests/checks run;
- known limitations.

## Known risks

- Incorrect auth/provider selection could require rework.
- Database preview setup can become complex if branch-per-PR automation is rushed.
- Missing `userId` filters can create cross-user privacy defects.
- Import commit introduces double-write and idempotency risks.
- Migration from browser-local data can accidentally upload unsafe data if validation is incomplete.
- Audit logs can become a privacy leak if metadata is too flexible.
- Users may be confused by local-only vs cloud-backed data during transition.

## Client decisions required before implementation

The client must approve:

1. Final auth provider.
2. Final PostgreSQL provider.
3. Whether Clerk lazy user creation or webhook user sync is preferred.
4. Preview/staging/production database strategy.
5. Whether signed-out browser-local mode remains available after production auth.
6. Browser-local migration policy and clear-local-data behaviour.
7. Whether skipped import rows store safe row-level metadata or aggregate counts only.
8. Audit event retention policy.
9. Whether app-level encryption is required for selected fields.
10. Whether import commit should preserve safe reviewed descriptions durably or store only cleaned merchant/category/amount/date.
11. Approval to create the first Phase 3A implementation branch after PR 3A.0.

## Explicit non-goals

Phase 3A planning and PR 3A.0 do not start:

- loans;
- property/tax reports;
- recurring detection;
- budgets;
- Basiq or enhanced merchant lookup;
- AI features;
- payments or paywalls;
- production App Store release workflow;
- any Phase 3+ feature module outside persistence/auth foundations.
