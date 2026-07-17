# Phase 5 Milestone 1 Environment, Migration and Recovery Readiness Contract

Status: read-only readiness evidence  
Date: 17 July 2026  
Release target: controlled Australian web private beta  
Implementation authority: documentation and safe connected metadata inspection only

## Decision summary

SpendGrove's application deployment is healthy, but the provider mapping is not yet safe enough for a database-backed private beta.

Confirmed:

- the connected Vercel project is `spendgrove`, using the Next.js preset;
- the current accepted Production application deployment is `dpl_9CKVWTY7wz5GW8Ls5PEYNLUNm56X`, Ready from `main` commit `a1b2c8269b6dc1b3091abd5595df683b9d065af5`;
- the connected Neon account exposes one SpendGrove project in the Sydney AWS region;
- that project exposes one default/primary branch named `production`;
- connected metadata reports that branch as unprotected and currently archived after inactivity;
- the project currently retains six hours of database history for point-in-time restore;
- no separate Preview Neon branch was visible through the connected metadata;
- permanent project records state that no Production migration has been authorised or run;
- no database row, connection string, secret value or private financial content was accessed during this audit.

Not proven:

- which Vercel Preview and Production variables point to which Neon branch/database;
- whether Preview and Production currently share a database;
- whether the Vercel Production environment uses a Clerk Production instance;
- the live Production `_prisma_migrations` history or whether any migration is failed or unresolved;
- whether a recovery operation has ever been rehearsed successfully.

These unproven items are mandatory private-beta gates. A Ready Vercel deployment does not prove database or authentication environment readiness.

## Scope and safety boundary

This contract did not:

- read or display environment-variable values;
- read or display database connection strings;
- query user, transaction, merchant, Property, loan or other financial rows;
- run Prisma against Preview or Production;
- run SQL;
- create, reset, restore, protect or delete a Neon branch;
- change Vercel, Clerk or Neon configuration;
- add a provider, package, secret or environment variable;
- run a migration;
- access or alter Production data.

Provider IDs, credential values, connection hosts and the connected account identity are intentionally omitted.

## Vercel mapping status

| Item | Status | Evidence / next gate |
| --- | --- | --- |
| Project | Confirmed | One connected Vercel project named `spendgrove`, using the Next.js preset. |
| Production source | Confirmed | Ready deployment `dpl_9CKVWTY7wz5GW8Ls5PEYNLUNm56X` targets Production and records `main` commit `a1b2c8269b6dc1b3091abd5595df683b9d065af5`. |
| Runtime | Confirmed | Connected project metadata currently reports Node.js 24.x. The application dependency floor remains the accepted Next.js 15.5.20 / React 19.1.8 baseline. |
| Preview deployments | Partially verified | Vercel creates branch Preview deployments. PR #152 Preview creation is currently blocked by the account deployment-rate limit, not by a completed application build. |
| Environment-variable names and scopes | Not proven | The connected read-only project tool does not expose a secret-safe name/scope inventory. Use the operator checklist below. |
| Preview/Production database separation | Not proven | Must be established by comparing safe destination characteristics inside Vercel without copying values. |
| Preview/Production Clerk separation | Not proven / likely blocked | Existing deployment evidence indicates a Clerk development/test instance is used by the current Production deployment. A Clerk Production instance and live-key mapping must be verified before private beta. |
| Environment mutation | Not authorised | Any variable, secret, domain or provider configuration change requires a separate client approval. |

Vercel officially supports separate Preview and Production variable scopes. That capability is not evidence that SpendGrove currently uses different values.

## Clerk environment status

The repository contains Clerk-backed authentication, provisioning, middleware and ownership checks. PR #152 separately hardens the private-beta route posture.

The provider mapping remains open:

- no connected Clerk administration tool was available for a secret-safe instance inventory;
- the current Production deployment has previously been identified as using a development/test Clerk instance;
- Clerk states that development instances are not suitable for Production workloads;
- Clerk Production deployment requires a Production instance, production keys, domain/DNS completion and relevant redirect/origin configuration;
- Preview environments on Vercel-provided domains normally use development keys, while Production must use production keys.

No Clerk setting or key was changed.

## Neon mapping and recovery status

Connected Neon metadata confirms:

| Item | Current safe finding | Readiness interpretation |
| --- | --- | --- |
| Project count | One SpendGrove project was visible. | A second project is not required, but environment isolation is not established. |
| Region | Sydney AWS region. | Appropriate geographic posture for the approved Australian private-beta target, subject to legal disclosure review. |
| Branches | One default/primary branch named `production`. | No distinct Preview branch was visible. |
| Branch protection | Off. | Deletion/reset protection is absent. Protected branches require a paid plan; no upgrade is approved. |
| Current branch state | Archived after inactivity. | Neon states archived branches unarchive automatically when accessed; first access may be slower. This is not a schema failure. |
| Restore history | Six hours. | Current maximum observed recovery-point window is six hours. This is insufficient for any promise of longer recovery. |
| Public connection posture | Public connections are not blocked; no IP allowlist was configured in connected metadata. | Strong credentials, scoped secrets and workflow controls are the current compensating controls. IP Allow and protected-branch controls are plan-dependent. |
| Restore rehearsal | No evidence. | A non-Production restore drill remains required before private beta. |
| Preview isolation | Not present in connected branch inventory. | Creating a Preview branch/project and changing Vercel variables are separate provider/environment mutations and are not authorised here. |

No Neon compute, branch, role, password or connection setting was changed.

## Repository migration inventory

The repository contains six ordered Prisma migrations:

1. `20260617130000_initial_schema`
2. `20260618033000_merchant_lifecycle`
3. `20260622124500_phase_3b_loan_property_foundation`
4. `20260702090000_phase_3c_property_transaction_link`
5. `20260703090000_phase_3c_property_reporting_review`
6. `20260708090000_phase_4_recurring_budgets_foundation`

Permanent evidence records Preview-only deployment and verification activity, including:

- Phase 3A/3B Preview workflow run `27958341458`;
- Phase 3C Property-link Preview run `28552337732`;
- Phase 3C reporting deploy run `28639135158` and verify-only run `28657045177`;
- Phase 4 deploy run `29060523217` and successful verify-only run `29072916307`.

The historical label “Preview” describes the approved workflow and secret names. The newly observed single-branch Neon inventory means the actual historical destination mapping must be verified by an operator before relying on that label.

No Production migration has been authorised. This audit did not query `_prisma_migrations`, so the live database migration history, exact applied count and failed/unresolved state remain unproven.

## Secret-safe operator checklist

Complete this checklist in the provider dashboards. Do not copy credential values, URLs, hostnames, account identifiers or screenshots containing them into GitHub, documentation or chat.

### Vercel

Dashboard: SpendGrove project → Settings → Environment Variables.

For each variable name below, record only whether it exists and its target scope:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`;
- `CLERK_SECRET_KEY`;
- `DATABASE_URL`;
- `DIRECT_DATABASE_URL`;
- any existing Clerk sign-in/sign-up URL variables;
- any existing application environment marker.

Expected result:

- Production Clerk variables resolve to the same Clerk Production instance;
- Preview Clerk variables resolve to a development or separately approved non-Production instance;
- Production database variables resolve to the intended Production Neon branch/database;
- Preview database variables resolve to a distinct non-Production Neon branch/database;
- `DATABASE_URL` is the approved runtime connection and `DIRECT_DATABASE_URL` is reserved for controlled migration administration;
- no variable is accidentally scoped to every environment when separation is required.

Safe comparison method:

- compare provider dashboard labels, instance/branch selection and environment target badges;
- if a fingerprint is needed, compare it inside a trusted operator session and record only “same” or “different”;
- never paste or hash a full secret in GitHub Actions, chat, documentation or application logs.

### Clerk

Dashboard: Clerk application → instance selector, Domains, API Keys and authentication settings.

Record only:

- Production instance exists: yes/no;
- Vercel Production uses live-key class: yes/no;
- Vercel Preview uses test/development-key class: yes/no;
- Production domain/certificates complete: yes/no;
- authorised origins/parties match the approved domains: yes/no;
- email verification and reset flow tested with synthetic accounts: yes/no;
- no user records are shared unintentionally between Preview and Production: yes/no.

Expected key characteristics are `pk_live_` / `sk_live_` for Production and test/development key classes for Preview. Do not copy the keys.

### Neon

Dashboard: SpendGrove project → Branches, Settings → Storage, Network Security and Billing/plan.

Record only:

- intended Production branch name;
- intended Preview branch name;
- branches are distinct: yes/no;
- Vercel Production destination matches Production branch: yes/no;
- Vercel Preview destination matches Preview branch: yes/no;
- current restore window;
- Production branch protected: yes/no/not available on plan;
- restore drill completed on non-Production data: yes/no;
- public network restrictions available and configured: yes/no/not available on plan.

Expected result: distinct Preview and Production destinations. The current connected inventory does not meet that expectation because only one branch is visible.

## Compensating controls without a paid branch-protection plan

No provider upgrade is authorised. Until a separate decision is made:

- keep Production migration workflow manual-only;
- keep Preview and Production secret names and scopes separate;
- require an exact confirmation phrase and exact `main` commit;
- require a named migration inventory and preflight before deploy;
- allow no automatic retries, reset, resolve or manual SQL;
- keep Production credentials out of local machines and normal application builds;
- use application ownership checks and Clerk authentication as independent resource boundaries;
- preserve GitHub review and immutable migration files;
- freeze database writes during a separately approved high-risk migration window if required;
- treat the six-hour restore window as the maximum currently evidenced recovery point;
- do not claim branch deletion/reset protection;
- schedule a non-Production restore rehearsal before private beta.

These controls reduce risk but do not equal Neon protected-branch guarantees.

## Proposed Production migration workflow

This is a proposal only. No workflow or migration run is authorised.

1. Use a new manual GitHub Actions workflow dedicated to Production.
2. Run only from `main`.
3. Require an exact confirmation phrase naming Production.
4. Map only separately approved Production secret names.
5. Preflight:
   - confirm exact `main` commit;
   - confirm the six migration folders and checksums expected for that release;
   - prove the destination is the intended Production branch/database using a secret-safe characteristic;
   - query only migration names/status and safe aggregate counts;
   - stop on failed/unresolved migration state;
   - confirm backup/restore readiness and maintenance owner.
6. Deploy only with `prisma migrate deploy`.
7. Postflight:
   - migration names recorded exactly once;
   - no failed/unresolved migration;
   - expected schema objects and constraints present;
   - safe aggregate counts unchanged unless an exact approved data operation says otherwise;
   - authenticated application smoke checks green.
8. Do not auto-retry.
9. Do not use `migrate dev`, `migrate reset`, `db push`, manual SQL or `migrate resolve`.
10. Record run ID, commit, migration names and safe verification result.

Every exact Production migration file and the workflow itself require separate client approval before dispatch.

## Failure, rollback and forward-fix rule

Prisma `migrate deploy` does not provide an automatic application-level rollback.

If a Production migration fails:

- stop immediately;
- do not rerun automatically;
- do not reset or mark history resolved;
- do not run rollback SQL;
- do not inspect or print private rows;
- preserve the failed run and safe error code;
- assess whether the safest response is an application rollback, a Neon point-in-time recovery, or an additive forward fix;
- obtain client approval for the exact recovery operation.

Application rollback is acceptable only when the old application remains compatible with the resulting schema. A point-in-time recovery can discard writes after the recovery point and therefore requires explicit impact review. Destructive reverse SQL is not the default.

## Mandatory remaining approvals

Before a database-backed private beta, the client must separately approve decisions for:

1. Clerk Production instance completion and Vercel Production key/environment changes.
2. A distinct Preview Neon destination and its Vercel variable mapping.
3. Whether the current six-hour restore window is acceptable, or whether a provider-plan change should be considered.
4. Whether paid protected-branch capability is required. No purchase is assumed.
5. A non-Production backup/restore rehearsal.
6. The exact Production migration workflow.
7. The exact Production migration files and one-time dispatch, if migration is required.
8. Private-beta operational owner, maintenance window, recovery-point objective and recovery-time objective.

## Release gate

Phase 5 Milestone 1 cannot be described as environment-ready until:

- Production uses a Clerk Production instance;
- signed-in route posture is accepted and deployed;
- Preview and Production authentication/data destinations are proven separate;
- no failed/unresolved migration state is proven for each intended database;
- Production schema history is established without private-row access;
- backup/restore capability is accepted and rehearsed outside Production;
- any required Production migration receives a separate exact approval and passes verification.

## Official source register

Accessed 17 July 2026:

- [Vercel environments](https://vercel.com/docs/deployments/environments) — Vercel — default Preview and Production environments and independent configuration.
- [Vercel environment variables](https://vercel.com/docs/environment-variables) — Vercel — environment-scoped encrypted variables and deployment timing.
- [Managing variables across environments](https://vercel.com/docs/environment-variables/manage-across-environments) — Vercel — safe environment inventory and branch-specific Preview scopes.
- [Clerk instances and environments](https://clerk.com/docs/guides/development/managing-environments) — Clerk — development instances are not suitable for Production; Preview and Production instance choices.
- [Deploy a Clerk app to Production](https://clerk.com/docs/guides/development/deployment/production) — Clerk — Production instance, live-key, DNS/domain and authorised-party requirements.
- [Neon protected branches](https://neon.com/docs/guides/protected-branches) — Neon — deletion/reset protections and paid-plan availability.
- [Neon security overview](https://neon.com/docs/security/security-overview) — Neon — recommended protection for sensitive branches.
- [Neon pricing](https://neon.com/pricing) — Neon — current Free-plan six-hour restore window and paid-plan recovery differences.
- [Neon branch archiving](https://neon.com/docs/changelog/2024-11-15) — Neon — archived branches automatically unarchive on access.
- [Prisma migrate deploy](https://docs.prisma.io/docs/cli/migrate/deploy) — Prisma — non-development migration command and behaviour.
- [Deploy migrations through CI/CD](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-migrations-from-a-local-environment) — Prisma — recommends CI/CD and warns against local Production URL handling.

## Final confirmation

This document changes no application behaviour. It contains no secret, database URL, private CSV content, user data or transaction data. No Production database was accessed, no migration ran, and no provider or environment was changed.
