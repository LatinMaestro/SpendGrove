# Phase 5 Milestone 1 — Private-beta authentication route contract

Status: implementation prepared for PR 5.1B client review.

## Objective

The controlled Australian web private-beta release candidate is account-based. Operational finance screens require a Clerk-authenticated SpendGrove account. Only onboarding and Clerk authentication surfaces remain deliberately public.

This contract does not change financial calculations, transaction ownership, database schema, migrations, provider configuration or browser-local prototype records.

## Access matrix

| Surface | Signed out | Signed in |
| --- | --- | --- |
| `/onboarding` | Public | Public |
| `/sign-in`, `/sign-up` | Public | Clerk-managed |
| `/` | Redirect to sign-in | Available |
| `/transactions` | Redirect to sign-in | Available |
| `/import` | Redirect to sign-in | Available |
| `/loans`, `/loans/import` | Redirect to sign-in | Available |
| `/budgets` | Redirect to sign-in | Available |
| `/regular-payments` | Redirect to sign-in | Available |
| `/settings` | Redirect to sign-in | Available |
| `/account/**` | Redirect to sign-in | Available subject to resource ownership |
| `/api/account/**`, `/api/server/**` | HTTP 401 with safe copy | Available subject to route and resource checks |

The middleware provides the early navigation response. The server-rendered application shell independently invokes Clerk's server-side protection for every operational page. Durable Route Handlers continue resolving `getCurrentUserContext()`, and server stores continue enforcing owner-scoped queries.

The sign-in return path accepts only an internal path. Absolute, protocol-relative, backslash and authentication-loop targets fall back to Home.

## Signed-out and expired-session behaviour

- Direct protected URLs redirect to `/sign-in`.
- A safe internal return path is preserved so successful sign-in can return to the intended screen.
- Protected APIs return a safe unauthenticated response and never return durable account data.
- Sign-out returns to the public sign-in surface.
- If Clerk is missing at runtime, protected routes fail closed; finance screens are not exposed as a browser-only fallback.
- If a session expires during an import review, account duplicate analysis stops and asks the user to sign in again.

## Browser-local prototype inventory

The following existing keys were found:

- `spendgrove.phase1.settings`;
- `spendgrove.phase1.transactions.v1`;
- `spendgrove.phase1.import-history.v1`;
- `spendgrove.phase1.merchant-rules.v1`;
- `spendgrove.phase2.custom-categories.v2`;
- `spendgrove.phase2.import-profiles.v1`;
- `spendgrove.phase2.merchant-rules.v2`.

Treatment:

- no key is deleted, rewritten, uploaded, merged or cleared;
- no local record count, description, merchant, amount or other value is sent to the server;
- detection checks key presence only so a plain-English notice can be shown;
- local manual transactions are not rendered as signed-in account transactions;
- local categories, merchant rules, saved mappings and duplicate candidates are not loaded into a signed-in account workflow;
- account data is not copied into shared browser-local prototype stores;
- dormant historical migration endpoints and helpers may remain in the repository, but the normal private-beta UI does not expose or call them;
- a future local-to-account import flow requires its own contract and approval.

The settings key contains browser preferences rather than financial records. It remains a browser preference in this milestone and is not uploaded. Account-scoped settings are a later lifecycle decision.

## Ownership and trust boundaries

Client-side Clerk state is a display aid only. It is not the data security boundary.

- middleware denies unauthenticated document and API requests early;
- operational server-rendered pages protect themselves through Clerk;
- Route Handlers resolve an authenticated current-user context;
- database reads and writes remain owner-scoped;
- cross-user identifiers supplied by clients are rejected by resource ownership checks;
- no browser-local finance record is treated as account-owned data.

## Verification requirements

- signed-out direct URL matrix;
- signed-in route matrix;
- API and resource negative tests;
- two-user ownership tests;
- sign-out and expired-session behaviour;
- internal return-path safety;
- browser-local preservation and separation;
- full regression suite, TypeScript, lint and optimized build;
- desktop and 390px review;
- exact-head Vercel Preview.

## Official source

Accessed 17 July 2026:

- [Protect content from unauthenticated users](https://clerk.com/docs/nextjs/guides/secure/protect-content), Clerk. It requires each page, Route Handler, Server Action and external endpoint that reads or mutates protected data to perform its own authentication check; client checks are not a security boundary.

## Boundaries

No schema or migration change. No Production database access. No Clerk, Neon or Vercel configuration mutation. No package, provider, secret or environment change. No automatic local-data migration. No Phase 5 Milestone 2 work.
