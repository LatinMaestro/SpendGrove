# Phase 3A Auth and Database Decision Record

Date: 2026-06-17
Status: Proposed for PR 3A.0 client review
Scope: Documentation-only decision record; no implementation approval by itself

## Decision summary

Phase 3A should introduce production account identity and runtime PostgreSQL persistence before loans, properties, tax reports, recurring/budgets or other later modules.

Recommended direction for implementation planning:

- Authentication: Clerk.
- Database: Neon Postgres with Prisma.
- Hosting: Vercel remains the application hosting target.
- Runtime data access: server-only Prisma access through authenticated server actions or API routes.
- Persistence posture: move safe reviewed/account data into durable user-owned records; keep raw CSV handling browser-local and transient.

This decision record does not install packages, create schema migrations, add environment variables, implement authentication, write to a database or start import commit execution.

## Requirements driving the decision

SpendGrove needs Phase 3A to support:

- secure account-based access;
- durable user-owned transactions;
- durable custom categories;
- durable saved import profiles;
- durable merchant aliases and rules;
- import commit execution for reviewed Import / Skip / Merge intentions;
- safe import batch/history persistence;
- audit events that do not leak private CSV or banking data;
- Vercel preview and production deployment compatibility;
- future iOS/iPad/web sync without live bank-login requirements.

The decision must preserve SpendGrove's existing privacy-first promise:

- no raw CSV files are persisted by default;
- no raw rows are persisted by default;
- no original filenames are persisted by default;
- no raw bank descriptions, account numbers, BSBs, card fragments, customer IDs, loan references, balances or private identifiers are persisted;
- commit payloads must contain only safe mapped/reviewed fields;
- all durable records must be user-owned;
- all server queries must filter by authenticated user;
- audit events must store safe metadata only.

## Sources reviewed

Official documentation reviewed for this record:

- Clerk Next.js App Router quickstart: https://clerk.com/docs/nextjs/getting-started/quickstart
- Supabase Auth SSR with Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
- Auth0 Next.js quickstart: https://auth0.com/docs/quickstart/webapp/nextjs
- Auth.js installation and provider/adapter model: https://authjs.dev/getting-started/installation
- Neon Prisma guide: https://neon.com/docs/guides/prisma
- Neon Vercel guide: https://neon.com/docs/guides/vercel-overview
- Supabase database overview: https://supabase.com/docs/guides/database/overview
- Prisma Postgres overview: https://www.prisma.io/docs/postgres
- Vercel Postgres/storage documentation: https://vercel.com/docs/postgres

## Authentication options considered

| Option | Fit for SpendGrove | Strengths | Trade-offs | Decision |
|---|---|---|---|---|
| Clerk | Strong fit for Next.js/Vercel account-ready apps | Purpose-built Next.js SDK, app-router support, session helpers, prebuilt account UI, fast implementation, supports future web/mobile identity direction | Additional third-party identity provider; requires careful PII and account-deletion policy review | Recommended |
| Supabase Auth | Good fit if Supabase Postgres is also chosen | Integrated auth/database platform, SSR helper package, can pair with PostgreSQL row-level security | Ties auth decision to database platform more tightly; less aligned with preferred Neon database direction | Alternative if client prefers one vendor for auth + database |
| Auth0 | Strong enterprise-grade auth | Mature identity platform, broad protocols and enterprise SSO capability | Heavier setup and configuration for the current MVP stage; may be more than SpendGrove needs initially | Not recommended for first Phase 3A implementation unless enterprise/SSO needs become immediate |
| Auth.js | Flexible self-managed/auth-framework approach | Open provider ecosystem, can use Prisma adapter, fewer hosted-auth dependencies | More implementation and security responsibility; account/session UX and hardening require more product work | Not recommended unless client prioritises maximum control over fastest secure delivery |

## Recommended authentication decision

Use Clerk for Phase 3A unless client review identifies a stronger reason to choose Supabase Auth, Auth0 or Auth.js.

Rationale:

- SpendGrove already uses Next.js on Vercel, and Clerk provides a direct Next.js/App Router path.
- Clerk minimises custom auth code in a phase where the main risk is secure persistence and user ownership.
- Clerk keeps auth separate from the database provider, allowing Neon Postgres to remain the recommended persistence layer.
- Clerk can provide account UI quickly while SpendGrove keeps financial data access behind server-only Prisma ownership checks.

Implementation must still add a SpendGrove-owned `User` record. Clerk identity must never replace application-level ownership checks.

## Database options considered

| Option | Fit for SpendGrove | Strengths | Trade-offs | Decision |
|---|---|---|---|---|
| Neon Postgres | Strong fit for Vercel + Prisma + serverless runtime | PostgreSQL-native, Prisma guidance, pooled and direct connection patterns, branching/preview workflows suitable for PR review | Requires separate auth provider if Clerk is chosen; preview branch automation needs explicit setup | Recommended |
| Supabase Postgres | Good fit, especially with Supabase Auth | Managed PostgreSQL plus auth/storage ecosystem, strong database feature set | More platform coupling if using Supabase Auth and database together; SpendGrove does not need storage for raw CSVs | Alternative if client prefers integrated platform |
| Prisma Postgres | Good Prisma-native candidate | Managed PostgreSQL designed around Prisma workflows and serverless access | Newer provider choice; operational maturity and project fit should be checked before production commitment | Alternative to review if client wants Prisma-managed database path |
| Other PostgreSQL provider, such as AWS RDS/Aurora or managed Postgres | Technically suitable | Mature production database options and enterprise controls | More infrastructure complexity than needed for current Vercel-first product stage | Not recommended for first Phase 3A unless organisational requirements demand it |

## Recommended database decision

Use Neon Postgres with Prisma for Phase 3A unless client review identifies a stronger reason to choose Supabase Postgres, Prisma Postgres or another PostgreSQL provider.

Rationale:

- SpendGrove already selected Prisma/PostgreSQL as the data model foundation.
- Neon supports serverless-friendly connection strategies and Prisma usage patterns.
- Neon preview/staging/production separation fits Vercel PR review and privacy review gates.
- PostgreSQL remains portable if provider choice needs to change later.

## Vercel environment strategy

Vercel remains the application hosting target.

Future setup should use environment variables only through Vercel/project settings and local `.env` files that are not committed.

Expected future variables, subject to provider approval:

- `DATABASE_URL` for pooled runtime database access.
- `DIRECT_DATABASE_URL` or provider-equivalent direct connection for migrations, if required.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` if Clerk is selected.
- `CLERK_SECRET_KEY` if Clerk is selected.
- `CLERK_WEBHOOK_SECRET` only if webhook-based user sync is approved.
- `NEXT_TELEMETRY_DISABLED=1` remains appropriate for privacy-first CI/Vercel builds.

No real secrets or credentials belong in the repository.

## Preview, staging and production database strategy

Recommended target strategy:

- Local development: local `.env` with a non-production database only.
- Preview deployments: isolated Neon branch or preview database with synthetic/safe data only.
- Staging: persistent non-production database for client acceptance and migration rehearsals.
- Production: dedicated production database with restricted access and backups.

Preview and staging must not use production data. Real client CSVs remain private-local test inputs only unless a separate secure handling policy is approved.

## User ownership model

All durable user-owned records must include `userId` and be scoped to the authenticated user.

Required model rules:

- Server code maps the authenticated provider user to a SpendGrove `User` record.
- Client requests must not be trusted to supply or override `userId`.
- Every Prisma query for user-owned data must filter by authenticated `userId`.
- Mutations must verify ownership of every referenced record, including categories, merchant profiles, import batches, import rows and merge targets.
- Future household/shared access must be a separate approved model and is not part of Phase 3A.

## Server-only runtime data access boundaries

Phase 3A implementation must keep Prisma and database access server-only.

Required boundaries:

- Prisma Client must not be imported into client components.
- Runtime writes must happen only through authenticated server actions or API routes.
- Server-side validation must re-check all payloads, even when the browser has already validated them.
- Import commit endpoints must accept safe mapped/reviewed fields only, not raw CSV rows.
- Logs must not include CSV rows, raw descriptions, filenames, account identifiers or private values.

## Browser-local to durable-account migration policy

Migration from browser-local prototype storage should be opt-in and user-reviewed.

Recommended policy:

1. Detect existing browser-local SpendGrove prototype data after sign-in.
2. Show a plain-English migration preview with safe counts only.
3. Let the user choose which safe data groups to migrate.
4. Validate and redaction-check all data on the server before writing.
5. Create durable user-owned records.
6. Record privacy-safe audit events.
7. Offer to keep or clear local prototype data after successful migration.

Do not automatically upload browser-local data after sign-in.

## Privacy and retention rules

Phase 3A must preserve the CSV-first privacy model.

Never persist by default:

- raw CSV files;
- raw CSV rows;
- original filenames;
- raw bank descriptions;
- account names;
- account numbers;
- BSBs;
- card fragments;
- customer IDs;
- loan references;
- balances;
- private identifiers;
- private screenshots or exports.

Persist only after user review:

- safe transaction date;
- integer-cent amount;
- cleaned merchant/counterparty label;
- user-facing description after private details are removed;
- category ID;
- transaction type/source/status;
- safe import action metadata;
- safe profile/rule metadata.

Audit events must use allowlisted metadata keys and redact or reject unsafe text.

## Data remaining browser-local after Phase 3A

The following should remain browser-local unless separately approved:

- selected CSV files;
- raw CSV text;
- raw parser rows;
- in-progress import mapping before commit;
- transient review state before commit;
- temporary UI state;
- optional local drafts for signed-out users, if signed-out use remains supported;
- local migration source data until the user migrates or clears it.

## Data becoming durable after Phase 3A

The following should become durable account-owned data after approved implementation:

- user account record and settings;
- manual transactions;
- durable custom categories;
- saved import profiles using safe structural metadata only;
- merchant profiles, aliases and rules using safe cleaned names only;
- committed import batches;
- safe import review rows/actions;
- committed Import / Skip / Merge outcomes;
- audit events with safe metadata only.

## Implementation PR sequence

Detailed implementation sequencing is maintained in `docs/PHASE_3A_PERSISTENCE_AND_AUTH_PLAN.md`.

High-level sequence:

1. PR 3A.0: auth/database decision record and implementation plan.
2. PR 3A.1: server data-access scaffolding and environment validation.
3. PR 3A.2: authentication and user provisioning.
4. PR 3A.3: durable manual transaction storage.
5. PR 3A.4: durable custom categories.
6. PR 3A.5: durable saved import profiles.
7. PR 3A.6: durable merchant aliases and rules.
8. PR 3A.7: import commit execution.
9. PR 3A.8: audit/history hardening.
10. PR 3A.9: migration assistant and Phase 3A QA closure.

## Risks

- Provider lock-in if auth/database choices are rushed.
- User-ownership bugs if server queries miss `userId` filters.
- Privacy leakage through logs, audit metadata or stored import details.
- Accidental raw CSV persistence during migration or import commit work.
- Vercel preview databases accidentally pointing at production.
- Double import commits if idempotency is not designed before writes begin.
- User confusion if browser-local data and cloud account data coexist without clear wording.

## Client decisions required before implementation

Before code is written for Phase 3A, the client must approve:

- final auth provider;
- final PostgreSQL provider;
- Vercel preview/staging/production database strategy;
- whether signed-out browser-local mode remains available after auth is introduced;
- browser-local migration behaviour and whether migration is one-time or repeatable;
- whether skipped import rows store safe row-level metadata or aggregate counts only;
- audit event retention policy;
- whether app-level encryption is required for selected sensitive text fields;
- whether Clerk webhooks are used for user sync or whether user records are created lazily on first app access;
- the first implementation branch after PR 3A.0 is approved.

## Explicit non-goals for PR 3A.0

This PR does not:

- install packages;
- add implementation code;
- add schema migrations;
- add database writes;
- implement production auth;
- add Vercel environment variables;
- implement import commits;
- persist transactions;
- start loans, property/tax reports, recurring, budgets, Basiq, AI, payments or later-phase modules.
