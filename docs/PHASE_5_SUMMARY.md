# Phase 5 Production Readiness Summary

Status: repository implementation complete; technically verified where connected tools permit; pending consolidated client acceptance  
Release target: controlled Australian account-based web private beta  
Date: 17 July 2026

## Executive conclusion

SpendGrove has completed all repository-side Phase 5 work that is currently authorised and implementable without provider mutations, Production data access, native packaging or public launch.

Current recommendation:

> Conditionally ready for a controlled private beta after the mandatory operator, provider and legal actions in this document are completed and evidenced.

SpendGrove must not invite private-beta users yet because the current Production deployment still uses a Clerk development/test instance and the Preview/Production Vercel–Clerk–Neon mapping, Production migration history and recovery posture are not fully proven.

Phase 5 remains pending client acceptance and is not formally closed. Phase 6 has not started.

## Release posture

- Current product: responsive account-based Next.js web application.
- Intended audience: controlled Australian private beta.
- Canonical deployment: https://spendgrove.vercel.app
- Latest Ready Production deployment inspected: `dpl_8bfqT5DskyyaiLHAsgPwzNTLngMn`.
- Deployment commit: `1c048abf363b2c9d97818e6724d549725509eeda` (PR #161).
- No public launch occurred.
- No App Store record, native package, TestFlight build, build upload or submission occurred.
- Analytics remains off.
- No external monitoring, crash-reporting, support-ticket or analytics provider was added.

## Phase 5 PR chain

| PR | Scope | Merge commit | Status |
|---:|---|---|---|
| #149 | Production readiness proposal and current-state audit | `bb715af100b65c8c5d9b74c701d1e135d50e332f` | Accepted planning baseline |
| #150 | Phase 5 governance activation | `fa540176a5885103fd169c2ad7567bb840669e92` | Merged |
| #151 | Patched Next.js 15 / React 19 security upgrade | `a1b2c8269b6dc1b3091abd5595df683b9d065af5` | Merged and Production deployed |
| #152 | Private-beta authentication route posture | `6d09d59f50ab928c62674676ad2fea9e3af02466` | Merged |
| #153 | Environment, migration and recovery readiness | `b1c584d4cf827b98653dc964bdec354ed8306199` | Merged; external blockers recorded |
| #154 | Complete owner-scoped account export | `a42586f34cceb09e8b917c4fadf69ceebcf467cf` | Merged |
| #155 | In-product immediate account deletion | `371411ad8b3d99022248d799b387a901d1b3fdca` | Merged; live Clerk proof blocked |
| #156 | Privacy and data-lifecycle surfaces | `f142baa4263ff6023d609a13984f2ef03cc14604` | Merged and Production deployed |
| #157 | Help, FAQ and safe support guidance | `da5a12e285d69cad726a78388f0f9854c9d4af04` | Merged |
| #158 | Browser security headers and strict Clerk-compatible CSP | `e92ac200c50a8dff12edea366812cd43dc53a7e0` | Merged |
| #159 | Request-body limits and abuse-resistance safeguards | `8a8f829a9a0d6502953c42e73d139c91832d2d47` | Merged |
| #160 | Safe error surfaces and operational runbooks | `ae47e7cc2584df3e6fe126b78673d88ecc59a100` | Merged |
| #161 | Deterministic lockfile and production dependency security gate | `1c048abf363b2c9d97818e6724d549725509eeda` | Merged and Production deployed |
| #162 | Platform packaging and App Store readiness documents | `f545828dcd84575a9a6b51de8f12adedf5564f10` | Merged; documentation only |
| #163 | Private-beta QA and consolidated handoff | `668c09cae49ce1ff58021c95be1c199eb39c0127` | Merged; final client package |

## Milestone 1 — Readiness, authentication and environment gate

Delivered:

- Next.js upgraded from 14.x to patched `15.5.20`.
- React and React DOM upgraded to `19.1.8`.
- Next.js asynchronous route/request API compatibility changes completed.
- No affected Next.js 14 package remains.
- Finance routes, including `/`, Transactions, Import, Loans and Settings, require authentication.
- Public signed-out routes are limited to onboarding/authentication/provider-required surfaces plus Help and Privacy.
- Server Components, Route Handlers and Server Actions retain independent authentication and owner checks.
- internal return paths are sanitised.
- browser-local prototype data remains separate, is not uploaded, merged, rewritten or deleted.
- environment and migration operator checklists are permanent.

External blocker:

- Production visibly reports Clerk development mode. A Clerk Production instance and correctly scoped Vercel Production keys are mandatory before private beta.

## Milestone 2 — Account export and deletion

### Account export

A strictly reverified account owner can download one versioned UTF-8 JSON document:

- contract `spendgrove.account-export`;
- version `1`;
- AUD integer cents;
- Australian calendar dates as `YYYY-MM-DD`;
- lifecycle timestamps as UTC ISO 8601;
- stable record IDs and relationships.

Included:

- account profile/settings;
- categories, including archived/soft-deleted;
- transactions and splits;
- safe import-batch and import-row commit metadata;
- saved import profiles;
- merchant profiles, aliases and rules;
- Properties, Loan Accounts, repayments and reconciliation links;
- Property links and dormant report reviews;
- recurring items and dismissal keys;
- category budgets;
- safe audit-event summary.

Excluded:

- raw CSV files and raw rows;
- filenames and filename hashes;
- raw import descriptions/merchant text;
- private bank fields and duplicate fingerprints;
- free-form audit metadata;
- provider secrets, connection information and another user's data;
- browser-local prototype data.

The response is generated on demand, not stored by SpendGrove, strictly reverified, private/no-store and owner-scoped.

### Account deletion

The Settings flow:

1. recommends export first;
2. explains irreversible deletion;
3. requires exact `DELETE` confirmation;
4. requires Clerk strict reverification;
5. deletes owner-scoped application data in one dependency-safe database transaction;
6. requests Clerk identity deletion only after the finance-data transaction commits.

Failure handling:

- database failure rolls back and does not call Clerk;
- Clerk failure after database deletion is reported truthfully as partial completion;
- retry is idempotent and does not recreate deleted financial data;
- no deleted content or counts enter logs or responses;
- browser-local prototype data remains untouched.

Live end-to-end deletion is not accepted until the Clerk Production instance and its Backend API/self-deletion configuration are verified.

## Milestone 3 — Privacy, help and release disclosures

Delivered public surfaces:

- `/privacy`;
- `/help`;
- Settings links to privacy, help, export and deletion.

The privacy draft and UI explain:

- data users choose to store;
- CSV browser processing and raw-file non-retention;
- excluded bank identifiers;
- Clerk, Vercel and Neon roles;
- cookies and sessions;
- local prototype-data separation;
- account export and deletion;
- analytics-off status;
- no live bank connection by default;
- record-keeping, tax and financial-advice limits.

The Help surface covers manual transactions, CSV import, review-before-commit, safe screenshots, supported limits, export, deletion, local-versus-account data and private-beta limitations.

Outstanding:

- Groveware's real support/contact details;
- client factual review;
- Australian privacy/legal professional review;
- final public policy/support URLs.

## Milestone 4 — Security and operational hardening

### Browser protections

Implemented:

- strict nonce-based Clerk-compatible Content Security Policy;
- `frame-ancestors 'none'` and `X-Frame-Options: DENY`;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- restrictive Permissions Policy;
- COOP compatible with authentication popups;
- HSTS two-year expectation;
- DNS prefetch disabled;
- `X-Powered-By` disabled;
- private/no-store cache headers on protected routes and sensitive downloads.

### Request and abuse resistance

Implemented:

- raw CSV remains browser-local, limited to 5 MiB and 5,000 rows;
- reviewed everyday and Loan commit JSON limited to 4 MiB before parsing;
- deletion confirmation JSON limited to 1 KiB;
- declared and streamed byte counts enforced;
- malformed/oversized requests return safe 400/413 results;
- import idempotency and review-before-commit remain unchanged.

Not claimed:

- globally durable rate limiting. A reliable global rule needs approved Vercel Firewall configuration or a shared provider. No misleading in-memory limiter was added.

### Logging, failures and operations

Implemented:

- generic app, global and not-found error surfaces;
- source guard against direct application/server console logging;
- safe internal reason codes;
- no private financial detail in user-facing errors;
- incident-response runbook;
- backup/recovery runbook;
- provider-outage runbook;
- application rollback versus database forward-fix/restore rules.

No monitoring or crash-reporting provider was added.

### Dependency security

Locked versions:

- Next.js `15.5.20`;
- React `19.1.8`;
- React DOM `19.1.8`;
- `eslint-config-next` `15.5.20`.

A committed `package-lock.json` and `npm ci` gate now provide deterministic installs.

Production dependency audit:

- no high or critical production advisory;
- three moderate meta-findings from one PostCSS advisory path through Next.js/Clerk;
- npm reports no compatible fix on the approved Next.js 15 line.

Development tooling:

- Vitest/Vite/esbuild advisories remain in the non-Production test toolchain;
- npm proposes a breaking Vitest 4 upgrade through `--force`;
- no force or unrelated major modernization was performed;
- the Vite/Vitest development server is not deployed.

## Milestone 5 — Platform and App Store readiness

Permanent documents now provide:

- web-first packaging decision;
- future comparison of Capacitor, React Native/Expo and SwiftUI;
- authentication and CSV file-handling proof-of-concept gates;
- official Apple membership, account deletion, privacy, support, review-account, accessibility and screenshot requirements;
- draft copy, keyword, URL, screenshot and App Review inventories.

No native framework was selected or installed. No Apple account, fee, bundle ID, App Store Connect record, build, TestFlight package or submission was created.

## Milestone 6 — Final private-beta QA

### Automated evidence

Latest exact application verification before this handoff:

- GitHub Actions run `29550062039`;
- 110 test files / 677 tests passed;
- TypeScript passed;
- Next.js lint passed with pre-existing hook warnings only;
- optimized Next.js `15.5.20` Production build passed.

Dependency gate:

- GitHub Actions run `29550062020`;
- exact locked install passed;
- lockfile consistency passed;
- high/critical production advisory gate passed;
- framework tree matched the versions above.

Final handoff PR #163 exact-head verification:

- GitHub Actions run `29551103860`;
- exact head `65a022a54448d9d5b2f9116fc7c9fb2c6c2ad088`;
- 110 test files / 677 tests passed;
- TypeScript, Next.js lint and optimized Next.js `15.5.20` build passed;
- merged as `668c09cae49ce1ff58021c95be1c199eb39c0127`.

### Deployment evidence

Ready deployments include:

- PR #151 Preview: `dpl_FXWLNArR4Gww2GGp52Ebf3cGaywz`;
- PR #151 Production: `dpl_9CKVWTY7wz5GW8Ls5PEYNLUNm56X`;
- PR #156 Production: `dpl_9399x5KbMr5YmsTkzrr8bobLcqsw`;
- PR #158 Preview: `dpl_9F3h47zsCeD5s4WkVdD4Qre9yKob`;
- PR #159 Preview: `dpl_7uBz2LmA3U9YFDnVVBpouSHU52zg`;
- PR #161 Preview evidence: `dpl_Dz6Q5sDZFDx4nCKVxKWeztVUdjmW`;
- latest inspected Production: `dpl_8bfqT5DskyyaiLHAsgPwzNTLngMn`, Ready.

Some intermediate PRs had no dedicated usable Preview because of Vercel deployment-rate constraints. Exact-head GitHub verification was used, and their merged application state is included in later Ready Production deployments. No no-op deployment commit was created.

### Online route and runtime review

On the latest Ready Production deployment:

- signed-out `/` redirected to `/sign-in?redirect_url=%2F`;
- signed-out `/transactions`, `/import`, `/loans` and `/settings` redirected to sign-in with internal return paths;
- `/privacy` loaded publicly with the pre-release legal-review notice;
- `/help` loaded publicly with safe CSV/support guidance;
- sign-in rendered successfully;
- browser console exposed the known Clerk development-mode warning and no separate application error;
- Vercel Production runtime logs for the review window contained 27 HTTP 200 results and one HTTP 307 result;
- no error/fatal runtime log was found in the same review window.

The connected browser's requested 390 px viewport override was not applied by the current browser backend, so no new independent 390 px screenshot is claimed. Existing Phase 4 and PR #151 390 px evidence remains valid for unchanged surfaces, and automated responsive/overflow guards remain green. The consolidated client checklist retains a real-device 390 px review.

## Browser-local data treatment

Known local prototype keys remain browser-local and segregated. Phase 5 did not:

- delete them;
- upload them;
- merge them into durable records;
- rewrite them;
- include them in account totals;
- transfer them between users;
- describe them as synced or backed up.

A future local-to-account import requires a separate contract and approval.

## Public/protected route matrix

| Route/surface | Signed out | Signed in |
|---|---|---|
| `/onboarding`, sign-in, sign-up and provider-required auth | Public | Available |
| `/privacy`, `/help` | Public, no financial data | Available |
| `/` | Redirect to sign-in | Protected Home |
| `/transactions` and descendants | Redirect to sign-in | Owner-scoped |
| `/import` and descendants | Redirect to sign-in | Owner-scoped |
| `/loans` and Property/report descendants | Redirect to sign-in | Owner-scoped |
| `/settings`, export and deletion | Redirect/401 as appropriate | Protected and reverified where sensitive |
| Account APIs, Route Handlers and Server Actions | 401/unauthorised; no private response | Authenticated and owner-scoped |

## Schema, migration and Production-data status

Phase 5 introduced:

- no Prisma schema change;
- no migration file;
- no Preview migration;
- no Production migration;
- no data backfill or rewrite;
- no manual SQL;
- no Production financial-row inspection.

Repository migration inventory remains six migrations through `20260708090000_phase_4_recurring_budgets_foundation`.

Production migration history is not proven because `_prisma_migrations` was not queried. The exact Vercel-to-Neon environment mapping must be established first.

## Backup and recovery status

Connected Neon metadata previously established:

- one visible SpendGrove project in Sydney AWS;
- one visible primary branch named `production`;
- branch protection off;
- branch may archive after inactivity;
- six-hour point-in-time history;
- no separate Preview branch visible;
- no restore rehearsal evidence.

These are private-beta blockers until the operator accepts the recovery posture, proves environment separation and completes a non-Production restore drill. No plan upgrade is assumed.

## Mandatory operator actions before private beta

1. Create/confirm Clerk Production instance.
2. Map Vercel Production to Clerk live-key class; keep Preview on non-Production credentials.
3. Test Production sign-up, email verification, recovery, sign-out and account deletion with synthetic accounts.
4. Prove Vercel Production and Preview database variables target distinct intended Neon destinations.
5. Create/approve a separate Preview Neon branch or equivalent non-Production destination if one does not exist.
6. Prove migration histories have no failed/unresolved state using migration metadata only.
7. Decide whether six-hour recovery and unprotected Production branch are acceptable without a paid plan.
8. Complete a non-Production backup/restore rehearsal.
9. Confirm final Groveware contact details and public support/privacy URLs.
10. Complete client factual and professional privacy/legal review.
11. Decide whether Vercel Firewall global rate rules are required and available.
12. Approve any future Production migration separately; none is currently authorised.

Never copy provider keys, database URLs, connection hosts, private rows or dashboard screenshots containing them into GitHub or chat.

## Known limitations

- Clerk development/test credentials remain active in Production.
- Complete provider mapping and Production migration status remain unproven.
- Account deletion's final Clerk-provider step is mock/Preview verified but not accepted against Clerk Production.
- Large account export remains bounded by Vercel's 4.5 MB response ceiling; no ZIP/background provider was added.
- Positive refunds retain the accepted Phase 4 treatment and do not net against expense budgets.
- Global durable rate limiting is not implemented.
- No monitoring/crash-reporting provider exists.
- Support contact is a deliberate placeholder.
- Privacy draft is not final legal advice.
- PostCSS moderate advisory has no compatible fix on the approved Next.js 15 tree.
- Vitest/Vite development-tool advisories require a future breaking-toolchain decision.
- Native packaging is unselected and unimplemented.
- Final signed-in client review, disposable-account deletion and real-device mobile review remain required.

## Professional and external review dependencies

- Australian privacy/legal review;
- Groveware entity, contact and seller-identity confirmation;
- Apple enrolment/legal identity decision if native distribution is later pursued;
- provider-dashboard operator actions for Clerk, Vercel and Neon;
- recovery objectives and incident owner;
- future App Store metadata/privacy disclosure review after a native framework is selected.

## Final recommendation

SpendGrove is **conditionally ready after specified operator actions**, not ready to invite private-beta users today.

Once the Clerk Production, environment separation, migration-health, recovery, contact and legal gates are completed—and the consolidated client checklist passes—the repository state is a credible controlled Australian web private-beta candidate.

Phase 5 remains pending client acceptance. Do not formally close it or begin Phase 6 without a separate client decision.
