# Phase B Production Environment and Recovery Readiness

Prepared: 26 July 2026  
Status: repository-only evidence package; operator verification and all provider actions remain outstanding  
Master-plan alignment: `APP_STORE_SUBMISSION_MASTER_BUILD_PLAN.md` Phase B1–B3  
Release authority: none

## 1. Purpose

This package converts the Phase B requirements into one secret-safe operator and review workflow for proving:

1. Vercel Preview and Production configuration are separated;
2. Clerk development/Preview and Production identities are separated;
3. Neon Preview and Production destinations are distinct and correctly mapped;
4. backup/history capability, RPO, RTO and recovery authority are understood;
5. a synthetic non-Production restore rehearsal can be completed safely;
6. the later Production migration proposal can be prepared without inspecting private financial rows;
7. no Production migration, environment change or guarded runtime activation occurs without a separate exact approval.

This document does not authorise access to Production rows, secret values, connection strings, provider mutation, plan upgrades, branch creation, restore execution, migration execution or application activation.

## 2. Current verified repository position

### 2.1 Application and Preview activation

- `main` remains at `e99c0f756d40868777ff2d3f3091e5cff1fce770`.
- PRs #231–#241 remain open and unmerged.
- Integrated activation head `e07644efdd6363800e6a2ec3bc6c4f028af42556` has a READY Vercel Preview deployment.
- That integrated Preview build passed 156 test files / 962 tests, framework dependency verification, optimized Next.js compilation, lint/type validation and deployment.
- Authenticated synthetic Preview QA remains outstanding.
- GitHub Application Verification remains unable to execute job steps or produce logs.
- The Preview migration workflow must not be rerun for this activation sequence.

### 2.2 Preview database evidence

The isolated Preview destination previously passed verify-only migration run `29669320110`:

- all 12 expected repository migrations were healthy;
- the six controlled Phase 6–11 migrations were recorded exactly once;
- no failed or unresolved migration existed;
- the migrated tables were empty when verified;
- no Production database, secret, migration or data was used.

The retained isolated Preview project is recorded as safe project `cold-field-54187673`, branch `br-sweet-flower-aj2ng7ix`, database `neondb`. These identifiers are safe operational labels only and are not connection credentials.

### 2.3 Production status

Production remains deliberately unproven for the new migration-dependent foundations:

- no Production migration has been authorised;
- no Production migration history has been inspected in this phase;
- no Production database row has been accessed;
- no Production runtime gate has been enabled;
- no Production Clerk or Neon mapping is claimed as ready;
- no backup/restore rehearsal has been completed against an approved synthetic target;
- no RPO or RTO has been approved.

## 3. Current official platform facts

The following platform facts were reviewed from official documentation on 26 July 2026. They guide the evidence process but do not prove the current SpendGrove configuration.

### 3.1 Vercel

Vercel has separate Preview and Production environments and supports environment-scoped variables. Environment-variable changes apply only to later deployments, so mapping corrections require a new deployment before verification.

Official references:

- https://vercel.com/docs/deployments/environments
- https://vercel.com/docs/environment-variables
- https://vercel.com/docs/environment-variables/manage-across-environments

### 3.2 Clerk

Clerk development and Production instances use different key classes and session/domain behaviour. Production deployment requires a Production instance and production keys; current official formats are `pk_live_` / `sk_live_` for Production and `pk_test_` / `sk_test_` for development. Development user data cannot be transferred to a Production instance.

Official references:

- https://clerk.com/docs/guides/development/deployment/production
- https://clerk.com/docs/guides/development/managing-environments

### 3.3 Neon

Neon retains branch history for point-in-time restore within the configured history-retention window. Restore capability and available retention depend on the actual project configuration and plan. Snapshot scheduling and longer retention may be plan-dependent and must not be assumed.

Official references:

- https://neon.com/blog/announcing-point-in-time-restore
- https://neon.com/docs/changelog/2024-02-23
- https://neon.com/docs/changelog/2025-10-31

## 4. Evidence handling rules

### 4.1 Permitted evidence

Record only:

- provider project/application names or approved safe IDs;
- environment names and target scopes;
- key class only: development/test or live;
- same/different destination result;
- branch/database names approved as safe operational labels;
- region;
- plan name or capability outcome;
- history-retention duration;
- branch protection available/enabled: yes/no/not available;
- migration names and statuses;
- schema object counts;
- synthetic aggregate counts;
- deployment, workflow and provider operation IDs;
- pass/fail outcomes and timestamps;
- named operational roles.

### 4.2 Prohibited evidence

Never place in GitHub, chat, screenshots or application logs:

- environment-variable values;
- connection strings, hosts, passwords or role credentials;
- Clerk secret or publishable key values;
- API tokens, cookies or session tokens;
- Production user IDs or emails;
- private transaction, merchant, Property, Loan or document data;
- row-level amounts, balances, descriptions or identifiers;
- screenshots that expose provider values or private records;
- hashes or partial fragments of full secrets;
- signing keys or certificates.

### 4.3 Safe comparison method

When destinations must be compared:

1. compare them inside the trusted provider dashboard or approved operator session;
2. record only `same`, `different` or `unproven`;
3. record a safe destination label if already approved for repository use;
4. do not calculate or publish a hash of a complete secret or URL;
5. do not pull Production secrets into a local machine for comparison.

## 5. B1 Production mapping proof

Complete each section through provider dashboards or approved read-only metadata tooling. Any mutation requires a separate exact approval.

### 5.1 Vercel project and environment attestation

| Check | Expected | Result | Safe evidence |
|---|---|---|---|
| Project is `spendgrove` | yes | unproven this run | project label only |
| Production branch is the approved branch | `main` unless changed by decision | unproven | branch name |
| `DATABASE_URL` exists in Production scope | yes | unproven | exists yes/no |
| `DIRECT_DATABASE_URL` exists in Production scope | only if approved for controlled migration use | unproven | exists yes/no |
| Production database variables target the intended Production Neon destination | yes | unproven | match yes/no |
| Preview database variables target the retained isolated Preview destination | yes | previously operational; dashboard scope reconfirmation outstanding | match yes/no |
| Preview and Production database destinations differ | yes | unproven | different yes/no |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` exists in Production scope | yes | unproven | key class only |
| `CLERK_SECRET_KEY` exists in Production scope | yes | unproven | key class only |
| Production Clerk variables use the same Clerk Production instance | yes | unproven | match yes/no |
| Preview Clerk variables use the approved non-Production instance | yes | observed development sign-in surface; dashboard scope reconfirmation outstanding | class only |
| Preview and Production Clerk instances differ | yes | unproven | different yes/no |
| branch-specific Preview overrides are understood | yes | unproven | branches listed without values |
| sensitive values are marked/managed appropriately | yes | unproven | yes/no |
| latest Production deployment was created after any environment change | required after change | not applicable until approved mutation | deployment ID |

#### Vercel stop conditions

Stop if:

- a variable is scoped to both Preview and Production where separation is required;
- Preview and Production resolve to the same database destination;
- Production uses a Clerk development key class;
- a missing variable would require immediate mutation without approval;
- a value must be exposed to continue;
- Production deployment would be forced without approval.

### 5.2 Clerk instance attestation

| Check | Expected | Result | Safe evidence |
|---|---|---|---|
| Production instance exists | yes | unproven | yes/no |
| Production keys use live class | yes | unproven | `live` only |
| Preview keys use development/test class or separately approved staging instance | yes | development surface observed; dashboard proof outstanding | class only |
| Preview and Production user stores are separate | yes | unproven | separate yes/no |
| Production domain configuration is complete | yes before private beta | unproven | yes/no |
| authorised parties/origins are restricted to approved domains | yes | unproven | yes/no |
| email verification works with a synthetic Production-review account | yes before release | not run | pass/fail |
| password recovery works with a synthetic account | yes before release | not run | pass/fail |
| session renewal and expiry are verified | yes | not run | pass/fail |
| deleted/revoked account behaviour is verified | yes | not run | pass/fail |
| native iOS application registration is planned but not configured early | yes | repository plan only | pending |

#### Clerk stop conditions

Stop if:

- Production uses development keys;
- Preview and Production unintentionally share users;
- a real user is needed for testing;
- DNS, domain, certificate or key changes are required without approval;
- the authentication provider configuration conflicts with the App Store review plan.

### 5.3 Neon destination attestation

| Check | Expected | Result | Safe evidence |
|---|---|---|---|
| Production project is identified | yes | historical metadata exists; current proof outstanding | safe project label/ID |
| Production branch/database are identified | yes | historical branch label `production`; current proof outstanding | safe labels |
| Preview project/branch/database are identified | yes | `cold-field-54187673` / `br-sweet-flower-aj2ng7ix` / `neondb` recorded | safe labels |
| Preview and Production projects or branches differ | yes | expected; current dashboard proof outstanding | different yes/no |
| Production region is recorded | Australian region preferred subject to legal review | historical Sydney AWS finding; current proof outstanding | region only |
| Production plan is recorded | yes | unproven | plan name only |
| history-retention window is recorded | yes | historical six-hour finding; current proof outstanding | duration only |
| point-in-time restore is available for the configured plan/project | yes before release | unproven | yes/no |
| snapshot capability/scheduling is understood | yes | unproven | available yes/no/plan-dependent |
| branch protection is available/enabled | decision required | historical unprotected finding; current proof outstanding | yes/no/not available |
| public network restrictions are understood | yes | historical public posture; current proof outstanding | yes/no/not available |
| migration role is separate from normal runtime use where supported | preferred | unproven | yes/no |
| restore authority and cleanup authority are named | yes | unassigned | role names |

#### Neon stop conditions

Stop if:

- destination identity is ambiguous;
- Preview and Production are the same destination;
- restore capability is absent or shorter than the approved RPO without accepted risk;
- a paid upgrade is required without approval;
- a Production branch would be created, restored, reset or deleted;
- private rows would need to be inspected;
- credentials would need to leave the trusted provider session.

### 5.4 GitHub and migration-secret attestation

| Check | Expected | Result | Safe evidence |
|---|---|---|---|
| Preview migration secrets target only the isolated Preview destination | yes | migration run succeeded previously; current secret-scope attestation outstanding | match yes/no |
| Production migration secrets are absent or separately scoped | fail closed | unproven | exists/scoped yes/no |
| Production migration workflow is manual-only | required | proposal only; no active dispatch authorised | yes/no |
| workflow can run only from exact approved `main` | required | proposal | yes/no |
| exact confirmation phrase is required | required | proposal | phrase name, not secret |
| no automatic retry/reset/resolve/manual SQL path exists | required | proposal | yes/no |
| GitHub Actions execution capacity is available | required for exact checks | currently unavailable | run/job status only |

### 5.5 Native environment map

The native client is not yet bootstrapped. Before TestFlight, record this mapping without secret values:

| Native environment | Backend | Clerk | Database access | Provider posture |
|---|---|---|---|---|
| development | approved Preview API | approved non-Production Clerk instance | server-side only through Preview API | synthetic only |
| internal/TestFlight candidate | approved pre-release or Production API decision | approved production-class instance for signed review build | server-side only | no dormant provider UI |
| App Store Production | Production API/domain | Clerk Production instance | server-side only | only approved Production providers |

The native bundle must never contain Neon credentials, Prisma, Clerk secret keys, provider secrets or migration credentials.

## 6. B2 backup and restore readiness

### 6.1 Decisions required before rehearsal

Record each decision explicitly:

| Decision | Required value | Status |
|---|---|---|
| approved synthetic source environment | safe project/branch label | pending |
| approved restore target type | new branch or other non-destructive target | pending |
| RPO | duration | pending |
| RTO | duration | pending |
| history-retention window | duration | pending current provider proof |
| rehearsal operator | role/name | pending |
| independent verifier | role/name | pending |
| incident owner | role/name | pending |
| cleanup authority | role/name | pending |
| provider cost/plan impact | none or approved exact cost | pending |
| evidence-retention location | repository-safe aggregate record | pending |

### 6.2 Recommended initial objectives

Until the client approves exact values, use these as planning targets only:

- proposed RPO: within the confirmed provider history-retention window and no greater than six hours unless a longer current capability is proven and approved;
- proposed RTO: restore target created and core synthetic validation completed within two hours;
- no promise is made to users until provider capability and the rehearsal demonstrate the approved objectives.

### 6.3 Synthetic rehearsal dataset

Use only a disposable synthetic account set containing:

- at least two synthetic owners;
- synthetic manual Transactions;
- one reviewed synthetic import batch;
- one split Transaction;
- one transfer pair;
- one Loan Account and synthetic repayment;
- one Property link;
- one budget and recurring item;
- synthetic advanced-finance records if the target schema includes them;
- one synthetic household/accountant permission path if activated;
- document metadata only unless a storage provider has separately been approved.

Record counts by model, never row values.

### 6.4 Rehearsal sequence

1. Confirm source and target are non-Production and contain synthetic data only.
2. Capture safe source identity, current timestamp, migration inventory and aggregate counts.
3. Create a known synthetic recovery point.
4. Make an approved disposable synthetic change after that point.
5. Create a new isolated restore/branch target from the selected timestamp; do not overwrite the source.
6. Record provider operation/event ID and start time.
7. Confirm restored migration history contains every expected migration exactly once and no failed/unresolved record.
8. Confirm safe schema object counts.
9. Confirm aggregate synthetic counts match the selected recovery point.
10. Point only a disposable verification deployment at the restored target through an approved temporary secret action.
11. Verify:
    - connection health;
    - synthetic authentication;
    - two-user ownership isolation;
    - transaction and import history access;
    - transfer/split and Loan no-double-count invariants;
    - account export;
    - account deletion on a disposable synthetic owner;
    - Preview-only runtime/schema alignment;
    - no private data in logs or errors.
12. Record achieved RPO and RTO.
13. Restore the verification deployment to its previous safe destination or remove it.
14. Delete the temporary restore target only after evidence is retained and cleanup is authorised.
15. Record cleanup completion and confirm the source environment was unchanged.

### 6.5 Rehearsal failure codes

Use these aggregate codes:

- `DESTINATION_IDENTITY_UNPROVEN`
- `SOURCE_NOT_SYNTHETIC`
- `RESTORE_POINT_UNAVAILABLE`
- `RESTORE_OPERATION_FAILED`
- `MIGRATION_HISTORY_MISMATCH`
- `SCHEMA_PROFILE_MISMATCH`
- `SYNTHETIC_COUNT_MISMATCH`
- `AUTHENTICATION_FAILED`
- `OWNERSHIP_ISOLATION_FAILED`
- `FINANCIAL_INVARIANT_FAILED`
- `EXPORT_FAILED`
- `DELETION_FAILED`
- `PRIVATE_DATA_IN_EVIDENCE`
- `RPO_MISSED`
- `RTO_MISSED`
- `CLEANUP_INCOMPLETE`
- `PROVIDER_UPGRADE_REQUIRED`

Do not include row contents or secret values in failure evidence.

### 6.6 Success criteria

The rehearsal is successful only when:

- source and target identities are proven non-Production;
- only synthetic data is involved;
- the source remains unchanged;
- the selected recovery point is available;
- migration history and schema profiles are exact;
- safe aggregate counts reconcile;
- authentication and owner isolation pass;
- financial invariants pass;
- export and disposable-account deletion pass;
- RPO and RTO meet approved targets;
- no secret/private data is exposed;
- temporary configuration and restore targets are cleaned up.

## 7. B3 Production migration proposal preparation

This section prepares the proposal only. It does not authorise Production history inspection or migration execution.

### 7.1 Repository migration batch

The six controlled migration-dependent foundations are fixed in this order:

1. `20260717090000_phase_6_bulk_operation_foundation`
2. `20260717100000_phase_7_transfer_link_foundation`
3. `20260717110000_phase_7_import_undo_foundation`
4. `20260717120000_phase_9_advanced_personal_finance_foundation`
5. `20260717130000_phase_10_household_accountant_foundation`
6. `20260717140000_phase_11_document_metadata_foundation`

Pinned Git blob identities are maintained in `scripts/preview-migration-batch-core.mjs`. The later Production proposal must use the repository exact head and revalidate those identities; this document intentionally does not duplicate them as mutable prose authority.

### 7.2 Required Production preflight evidence

Before any dispatch, a separately approved workflow must prove:

- exact approved `main` commit;
- exact repository migration inventory;
- exact migration file identities;
- intended Production destination identity;
- `_prisma_migrations` exists or the baseline is otherwise explicitly understood;
- no failed or unresolved migration;
- applied migration names match the expected earlier repository baseline;
- the six controlled migrations are all pending or already exact as expected by the proposal;
- expected public schema object counts are within the approved profile;
- safe aggregate counts are recorded without row inspection;
- backup/history capability and recovery authority are confirmed;
- current application remains compatible during the migration window;
- Production runtime gates remain off until postflight is green.

### 7.3 Execution rules for a later approved workflow

- manual dispatch only;
- approved exact confirmation phrase;
- exact approved `main` commit only;
- separately scoped Production migration credentials;
- `prisma migrate deploy` only;
- no `migrate dev`, `migrate reset`, `db push`, manual SQL or `migrate resolve`;
- no auto-retry;
- no backfill or rewrite unless separately approved;
- stop on the first mismatch or failed/unresolved state;
- suppress connection strings and private query output;
- retain run ID, commit, migration names and aggregate result only.

### 7.4 Required postflight evidence

- every expected migration appears exactly once;
- no failed or unresolved migration exists;
- exact expected tables, columns, constraints, enums and indexes exist;
- safe aggregate counts remain unchanged unless an approved data action says otherwise;
- owner isolation remains intact;
- export/deletion are registered for each model;
- Production app remains fail-closed until focused runtime activation;
- no missing-table query is possible during partial rollout;
- deployment and rollback candidates are identified.

### 7.5 Failure response

If any migration or postflight check fails:

1. stop immediately;
2. preserve the run and aggregate error code;
3. do not rerun automatically;
4. do not reset or resolve migration history;
5. do not run reverse SQL;
6. do not inspect private rows;
7. determine whether application rollback, approved point-in-time recovery or an additive forward fix is safest;
8. assess write-loss impact before any recovery point is selected;
9. obtain explicit approval for the exact recovery action.

## 8. Evidence ledger template

| Evidence ID | Date/time | Environment | Operator | Verifier | Action | Safe provider/run ID | Result | RPO | RTO | Cleanup | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B1-VERCEL | | Production/Preview | | | mapping attestation | | pending | n/a | n/a | n/a | no values |
| B1-CLERK | | Production/Preview | | | instance attestation | | pending | n/a | n/a | n/a | key class only |
| B1-NEON | | Production/Preview | | | destination/recovery attestation | | pending | | | n/a | no connection strings |
| B1-GITHUB | | migration environments | | | secret/workflow scope attestation | | pending | n/a | n/a | n/a | no secret values |
| B2-RESTORE | | synthetic non-Production | | | restore rehearsal | | pending | | | pending | aggregate counts only |
| B3-PREFLIGHT | | Production | | | read-only migration preflight | | not authorised | n/a | n/a | n/a | separate approval required |
| B3-DEPLOY | | Production | | | migration dispatch | | not authorised | | | | separate approval required |

## 9. Readiness result classes

Use one result only:

- `NOT_STARTED` — no current evidence;
- `PARTIAL` — some safe evidence exists but mandatory checks remain;
- `BLOCKED_OPERATOR` — provider/dashboard or credential action is required;
- `BLOCKED_DECISION` — RPO/RTO, plan, cost or authority decision is required;
- `FAILED_SAFE` — a safe check failed and no mutation was attempted;
- `READY_FOR_PROPOSAL` — B1/B2 evidence is complete and B3 may be presented for approval;
- `APPROVED_FOR_EXECUTION` — the client approved the exact Production workflow, commit and migrations;
- `VERIFIED_COMPLETE` — approved execution and postflight completed successfully.

Current result: `BLOCKED_OPERATOR`.

## 10. Current blockers

- authenticated synthetic Preview QA for PRs #231–#241;
- GitHub Actions execution capacity;
- current secret-safe Vercel environment mapping attestation;
- Clerk Production-instance and domain attestation;
- current Neon Production plan, destination, protection and history-retention attestation;
- named RPO, RTO, rehearsal operator and recovery authority;
- approval for a synthetic Neon restore rehearsal and any temporary environment-variable action;
- separate approval before Production migration-history access or migration execution.

## 11. Next safe sequence

1. Merge PR #242 after its repository gates pass.
2. Complete B1 provider mapping attestations without exposing values.
3. Record current Neon recovery capability and approve RPO/RTO.
4. Obtain exact authority for a synthetic non-Production restore rehearsal.
5. Complete and record the rehearsal.
6. Prepare the exact Production migration proposal using the verified `main` migration inventory.
7. Stop for explicit approval before any Production preflight that uses credentials, migration dispatch or runtime activation.

No item in this package changes Production or authorises release.