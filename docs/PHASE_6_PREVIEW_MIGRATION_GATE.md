# Phase 6 Preview Migration Gate

## Controlled all-pending workflow correction — 18 July 2026

The retained isolated target is pinned before database access by its safe Neon metadata:

- project: `cold-field-54187673`;
- branch: `br-sweet-flower-aj2ng7ix`;
- database: `neondb`;
- direct compute: `ep-shy-mud-aj7fpz5c`;
- pooled and direct host forms must match that compute exactly.

The corrected workflow does **not** claim to apply the six migrations individually. Prisma `migrate deploy` applies every pending repository migration.

The approved deterministic design is one controlled all-pending run:

1. require `main`, explicit `migrate-all` mode and `RUN ISOLATED PREVIEW MIGRATIONS`;
2. require only the two Preview secrets and reject any mapped Production database variable;
3. parse both secret URLs without printing them and require the pinned pooled host, direct host, database, matching role/credential and TLS;
4. inventory every repository migration and require the six controlled migrations to be the exact final ordered tail;
5. connect only after identity passes;
6. accept either:
   - a genuinely empty public schema with no `_prisma_migrations` table, tables or enums; or
   - the exact complete set of repository migrations preceding the six controlled migrations;
7. reject partial, extra, duplicated, failed, unresolved or rolled-back history and reject pre-existing controlled objects;
8. run one suppressed `prisma migrate deploy`;
9. require the complete repository migration set exactly once with no failed/unresolved state;
10. validate the exact enums, columns, indexes, primary/foreign keys and empty new tables for all six controlled profiles;
11. compare safe aggregate counts only and print no row content or connection value.

For the retained empty project, preflight is expected to report that zero earlier migrations are applied. The single deploy will therefore build the complete repository schema in timestamp order, including the six controlled migrations as the final six. If the database is not actually empty, only the exact earlier repository baseline is accepted.

Any failure stops the run. There is no automatic retry, reset, manual SQL, history resolution or Production fallback. Runtime activation remains a later focused gate.

## Ordered prepared migration inventory — 17 July 2026

The repository now contains six additive migrations, all unexecuted against the retained isolated Preview project:

1. `20260717090000_phase_6_bulk_operation_foundation`
2. `20260717100000_phase_7_transfer_link_foundation`
3. `20260717110000_phase_7_import_undo_foundation`
4. `20260717120000_phase_9_advanced_personal_finance_foundation`
5. `20260717130000_phase_10_household_accountant_foundation`
6. `20260717140000_phase_11_document_metadata_foundation`

The migration-aware integrity checker contains a separate exact profile for each migration. Later profiles protect aggregate counts for earlier foundation tables and the import-undo profile verifies the nullable `ImportRow.committedTransactionUpdatedAt` column without reading row content.

The workflow remains intentionally set to the first pending migration. Do not change it to a later profile until the preceding migration has run once and passed post-migration verification.

Repository preparation evidence:

- PR #188 bulk services: exact-head GitHub verification green, runtime disabled.
- PR #189 transfer schema: exact-head GitHub verification green; Vercel was blocked only by account build-rate limiting.
- PR #190 import-undo schema: 122 test files / 744 tests, TypeScript, lint, optimized build and Vercel Preview green.
- no migration was dispatched from any of these PRs.

Status: isolated database established; GitHub credential gate remains before migration  
Date: 17 July 2026  
Target migration: `20260717090000_phase_6_bulk_operation_foundation`

## Repository foundation

- PR #170 froze the bulk-operation and undo contract.
- PR #171 merged the additive Prisma schema and unexecuted migration as `796439f51a4f239adc9ec457feae87d66a14ab13`.
- PR #172 merged the migration-aware Preview integrity checker as `25b6a717bac5fae9481b7bee9ba6aaa72d72bdad`.
- The schema/checker exact-head verification passed 113 test files / 697 tests, TypeScript, lint and optimized build.

## Earlier failed Preview run

GitHub Actions run [29555735427](https://github.com/LatinMaestro/SpendGrove/actions/runs/29555735427) was dispatched once from `main` in `migrate` mode.

Safe result:

- branch/commit gate passed;
- Preview-only secret-presence gate passed;
- no Production secret was mapped;
- dependency install, Prisma Client generation and Prisma schema validation passed;
- secret-safe pre-migration integrity check failed with `DATABASE_CHECK_FAILED`;
- `prisma migrate deploy` was skipped;
- post-migration checks were skipped;
- no retry was run.

No Preview migration, Production migration, manual SQL, reset, history resolution, rewrite or backfill occurred.

## Isolated Preview destination established

A separate empty Neon project was created on the existing Free organization through the connected Neon workflow:

- project: `SpendGrove Preview Isolated`;
- safe project ID: `cold-field-54187673`;
- safe branch ID: `br-sweet-flower-aj2ng7ix`;
- branch: `main`;
- database: `neondb`;
- plan: Free;
- declaration: new empty project, not a child branch of the SpendGrove Production project, with no copied Production users, identities, financial records or other rows.

Neon Free officially permits multiple projects; no provider purchase, plan change or payment detail was required. Two transient empty setup projects were deleted immediately after their generated credentials appeared in connector/browser output. Their credentials were thereby invalidated. The retained project's credential was not recorded in repository content, issues, PRs or documentation.

## Vercel Preview mapping

On 17 July 2026:

- the SpendGrove project's Preview-only `DATABASE_URL` was replaced with the retained isolated project's pooled connection;
- Preview-only `DIRECT_DATABASE_URL` was replaced with the retained isolated project's direct connection;
- both variables remain Sensitive and Preview-scoped;
- Production `DATABASE_URL` and `DIRECT_DATABASE_URL` entries were not opened or edited and retained their prior metadata;
- no redeployment was triggered solely for this environment update.

No Clerk, Production Neon, provider-plan, package, source, schema or data setting changed.

## Remaining GitHub credential gate

The connected GitHub session reached the existing Actions secret update form, but GitHub required fresh account reauthentication before accepting the secret. That credential step is unavailable to the autonomous connected session and must not be bypassed.

The existing secrets therefore have **not** been proven to contain the retained isolated project's credentials:

- `NEON_PREVIEW_DATABASE_URL`;
- `NEON_PREVIEW_DIRECT_DATABASE_URL`.

Do not dispatch the migration until the operator completes the checklist below.

## Exact operator checklist

1. Open Neon Console and select project `SpendGrove Preview Isolated` with safe ID `cold-field-54187673`.
2. Select branch `main` / `br-sweet-flower-aj2ng7ix` and database `neondb`.
3. Obtain the pooled connection for `NEON_PREVIEW_DATABASE_URL` and the direct, non-pooler connection for `NEON_PREVIEW_DIRECT_DATABASE_URL`.
4. Open [SpendGrove Actions secrets](https://github.com/LatinMaestro/SpendGrove/settings/secrets/actions).
5. Update the two existing repository secrets with the corresponding Preview-only values.
6. Complete GitHub's fresh account confirmation. Do not paste either value into source files, documentation, issues, PRs, chat, screenshots or logs.
7. Confirm the Vercel Preview entries remain Preview-only and the Production entries remain unchanged.
8. Dispatch the existing `Preview Prisma Migration` workflow once from `main` in `migrate` mode with confirmation `RUN PREVIEW MIGRATION`.
9. If any preflight or migration step fails, stop. Do not retry automatically, reset, use `migrate dev`, run manual SQL or resolve history.
10. If green, verify all committed migrations are recorded chronologically, the expected Phase 6 schema exists, no failed state exists and only synthetic/empty data is present.
11. Record the workflow run ID and post-migration evidence before enabling migration-dependent application work.

## Delivery impact

- The isolated Neon and Vercel Preview parts of the environment gate are complete.
- GitHub Actions secret reauthentication and the migration run remain operator-blocked.
- The Phase 6 bulk schema remains repository-only and unexecuted.
- Production-facing bulk-operation code must not be deployed while Production lacks the required tables.
- Repository-side bulk, transfer-link and import-undo work may be prepared and exact-head verified, but migration-dependent runtime activation remains blocked.
- No Production migration, Production database access, data copy, rewrite or backfill is authorised.
- No public launch, real-user invitation or App Store action is authorised.

## Consolidated deferred operator action — retained during Phase 8

The client has deferred GitHub reauthentication and migration execution. Treat this as one later operator action, not an autonomous-development blocker.

The operator must later:

1. reauthenticate in GitHub repository settings;
2. update `NEON_PREVIEW_DATABASE_URL` and `NEON_PREVIEW_DIRECT_DATABASE_URL` to the retained isolated Preview project without recording either value;
3. run individually, stopping on any failure:
   1. `20260717090000_phase_6_bulk_operation_foundation`;
   2. `20260717100000_phase_7_transfer_link_foundation`;
   3. `20260717110000_phase_7_import_undo_foundation`;
   4. `20260717120000_phase_9_advanced_personal_finance_foundation`;
   5. `20260717130000_phase_10_household_accountant_foundation`;
   6. `20260717140000_phase_11_document_metadata_foundation`;
4. inspect secret-safe preflight and post-migration evidence;
5. confirm the Preview database contains only synthetic test data;
6. run full Preview regression;
7. activate each guarded runtime only in a later focused PR.

Until then, bulk-operation execution/undo, durable transfer linking, import undo, Phase 9 advanced-finance runtime, Phase 10 collaboration runtime and Phase 11 document runtime remain disabled and must perform no missing-table query. Phase 8 reports and the existing account export remain independent of these unexecuted tables.


## Phase 9 addition — 17 July 2026

PR #200 merged the exact additive Phase 9 profile and unexecuted migration. PRs #201–#204 prepared owner-scoped services behind `PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED = false`. The operator must run the Phase 9 migration only after the preceding three migrations have each succeeded and passed exact post-migration verification. No guarded feature may be activated from this document.


## Phase 10 addition — 17 July 2026

PR #207 added the exact fifth migration and integrity profile. PRs #208–#209 prepared owner-scoped household and separate read-only accountant services behind `PHASE_10_COLLABORATION_RUNTIME_ENABLED = false`. The operator must run the Phase 10 migration only after the preceding four migrations have each succeeded and passed exact post-migration verification. No invitation delivery, real-user invitation or guarded runtime activation is authorised by this document.


## Phase 11 addition — 17 July 2026

PR #212 added the exact sixth migration and integrity profile. PR #213 prepared owner-scoped document metadata/link services behind `PHASE_11_DOCUMENTS_RUNTIME_ENABLED = false` and a separate provider-enabled check. The operator must run the Phase 11 migration only after the preceding five migrations each pass exact post-verification. Schema activation does not authorise a provider, storage object, upload/download, OCR/AI or user-facing activation.


## Post-verification activation register — 19 July 2026

The isolated Preview migration is complete and must not be rerun. Verify-only run `29669320110` proved the expected 12-migration history and all six controlled profiles.

Activation PRs #231–#240 contain no schema or migration changes. Their services remain guarded by `isVerifiedPreviewRuntime()`. GitHub verification is green, but merge and runtime QA remain blocked by Vercel account build-rate capacity. See `docs/PREVIEW_FOUNDATION_ACTIVATION_QA.md`.

Production migration remains unapproved and unexecuted.
