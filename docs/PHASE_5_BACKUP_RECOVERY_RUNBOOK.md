# Phase 5 Backup and Recovery Runbook

Status: planning and operator-verification runbook  
Last reviewed: 17 July 2026

## Current proven posture

Safe connected metadata previously showed:

- one visible Neon project for SpendGrove;
- one default branch named `production`;
- the branch was not marked protected;
- six hours of point-in-time restore history was reported;
- the branch could auto-archive;
- a separate Preview database mapping was not proven;
- no non-Production restore drill has been completed.

These are capability observations, not proof that every Vercel environment maps correctly or that a Production restore will succeed.

## Required decisions

Before private beta the client must approve:

- Recovery Point Objective (RPO);
- Recovery Time Objective (RTO);
- operational owner;
- retention sufficiency;
- branch protection approach;
- separate Preview/Production database mapping;
- restore approval authority;
- whether current provider-plan capabilities are sufficient.

No plan purchase is authorised.

## Safe backup verification

Using Neon dashboard metadata only:

1. Confirm the intended Production project, branch and database by safe labels.
2. Confirm Preview does not share the same connection target; compare safe fingerprints or branch/database IDs without copying URLs.
3. Confirm PITR/history duration and current branch protection/auto-archive settings.
4. Confirm the latest restorable point exists.
5. Confirm role and network-access controls.
6. Record only safe labels, capabilities and timestamps.

Do not open tables, query user rows or print connection strings.

## Restore drill

A restore drill must use a newly approved non-Production target and explicit client approval because creating a Neon branch changes provider state.

1. Capture the source restore timestamp and expected migration-name inventory.
2. Create the isolated restore target only after approval.
3. Connect it only to a non-Production verification environment.
4. Verify migration names, schema objects and safe aggregate counts; do not inspect row content.
5. Run synthetic authenticated smoke tests.
6. Confirm no Production write or environment mutation occurred.
7. Delete the drill target only with explicit approval and retain safe evidence.

## Production recovery decision tree

- bad application deployment, database unchanged: roll back to a known schema-compatible deployment.
- additive migration defect, data intact: stop and prepare an approved forward-fix.
- destructive/corrupting event: freeze writes, identify the safe restore point, obtain client approval and follow Neon restore guidance.
- environment misrouting: fail closed; correct variables only through a separately approved environment change.
- unresolved migration: do not reset or mark resolved automatically.

## Verification after recovery

- expected migration names exactly once;
- no failed/unresolved migration state;
- safe aggregate counts reconcile to the approved restore point;
- authentication and two-user isolation pass;
- imports, transactions, budgets, recurring, Loans and Property paths pass;
- no private values appear in evidence;
- client accepts return to service.

## Prohibitions

No Production migration, manual SQL, `prisma migrate dev`, `prisma migrate reset`, automatic retry, manual migration resolve, Production row inspection, provider-plan purchase or Production restore is authorised by this runbook.
