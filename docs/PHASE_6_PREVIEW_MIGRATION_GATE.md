# Phase 6 Preview Migration Gate

Status: blocked safely before migration  
Date: 17 July 2026  
Target migration: `20260717090000_phase_6_bulk_operation_foundation`

## Repository foundation

- PR #170 froze the bulk-operation and undo contract.
- PR #171 merged the additive Prisma schema and unexecuted migration as `796439f51a4f239adc9ec457feae87d66a14ab13`.
- PR #172 merged the migration-aware Preview integrity checker as `25b6a717bac5fae9481b7bee9ba6aaa72d72bdad`.
- The schema/checker exact-head verification passed 113 test files / 697 tests, TypeScript, lint and optimized build.

## Preview run evidence

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

## Confirmed environment blocker

Safe connected Neon metadata still shows one SpendGrove project with one visible primary branch named `production`. No separate Preview branch is visible. This matches the unresolved Phase 5 environment-readiness gate.

The repository cannot prove that the GitHub Preview secrets currently target a live, isolated non-Production destination. The generic preflight failure is consistent with an unavailable or stale Preview target, but the secret values were not inspected and the exact endpoint was not exposed.

## Operator action required

Before another migration request:

1. In Neon, create or confirm a dedicated non-Production Preview branch/database for SpendGrove.
2. Confirm it is not the primary `production` branch.
3. In GitHub Actions secrets, set:
   - `NEON_PREVIEW_DATABASE_URL` to the pooled Preview-only connection;
   - `NEON_PREVIEW_DIRECT_DATABASE_URL` to the direct Preview-only connection.
4. Do not copy either value into GitHub files, issues, PRs, chat or screenshots.
5. Confirm no Production URL or secret is mapped by the workflow.
6. Re-run the existing workflow once only after the operator gate is complete.
7. If preflight fails again, stop without retry, reset, manual SQL or migration-history resolution.

No provider plan purchase or upgrade is implied. If the current plan cannot provide an isolated Preview destination, record that limitation for a separate client decision.

## Delivery impact

- The Phase 6 bulk schema remains repository-only and unexecuted.
- Bulk-operation application code must not be merged into the Production-deployed branch while Production lacks the required tables.
- Independent no-schema Phase 6 and Phase 7 repository work may continue.
- No public launch, real-user invitation or App Store action is authorised.
