# Backup and Restore Rehearsal Runbook

Status: procedure prepared; Production capability and rehearsal unproven  
Prepared: 18 July 2026  
Provider context: Neon PostgreSQL

## Purpose

Prove that SpendGrove can recover safely without experimenting on Production or exposing private financial data.

This runbook is for a synthetic, non-Production rehearsal. It does not authorise a Production restore, branch creation, plan upgrade, migration or data inspection.

## Required decisions before rehearsal

- confirmed Preview and Production project/branch mapping;
- current Neon plan and history-retention capability;
- target recovery point objective (RPO);
- target recovery time objective (RTO);
- authorised operator;
- incident communications owner;
- safe synthetic dataset;
- restore target naming and deletion policy;
- approval for any provider action or cost.

## Safe evidence

Record only:

- safe project and branch identifiers;
- provider operation/event ID;
- requested and achieved restore timestamps;
- migration names and states;
- schema-object counts;
- synthetic aggregate row counts;
- application health outcomes;
- start/end times;
- RPO/RTO result.

Never record:

- connection strings;
- passwords or tokens;
- private row contents;
- transaction descriptions or amounts;
- user emails;
- banking identifiers;
- exact Property/Loan details.

## Rehearsal prerequisites

- use a Neon project/branch with synthetic data only;
- confirm it is not Production;
- confirm no Production data was copied;
- capture current migration inventory;
- capture safe aggregate synthetic counts;
- confirm all runtime gates match the schema;
- identify the exact restore point before the synthetic failure;
- confirm the application deployment used for validation.

## Rehearsal procedure

1. Create a rehearsal branch or point-in-time restore target through the approved Neon dashboard/API.
2. Do not overwrite the source branch.
3. Record the safe operation identifier and requested restore time.
4. Confirm the restored schema and migration history using metadata-only checks.
5. Confirm no migration is failed or unresolved.
6. Compare safe aggregate synthetic counts with the expected recovery point.
7. Point only a temporary isolated verification environment at the restored target, after an approved secret/configuration action.
8. Run:
   - connection health;
   - authentication using synthetic accounts;
   - owner isolation;
   - transactions and import history;
   - account export;
   - account deletion on disposable synthetic data;
   - guarded-feature fail-closed checks;
   - full automated regression.
9. Record achieved RPO and RTO.
10. Remove the temporary environment/branch only after evidence is retained and deletion is authorised.

## Failure handling

Stop if:

- the target may be Production;
- connection identity is uncertain;
- migration history is failed/unresolved;
- restore point is outside available history;
- private data appears;
- a provider upgrade or payment is required;
- a destructive overwrite is the only offered path;
- application validation would require enabling a guarded feature.

Do not:

- reset a database;
- resolve migrations manually;
- run rollback SQL;
- retry destructive actions automatically;
- substitute Production for Preview;
- copy rows between environments.

## Production recovery decision tree

1. Is the problem application-only?
   - Prefer deployment rollback.
2. Is schema forward-compatible and data intact?
   - Prefer focused forward fix.
3. Is a migration failed?
   - Stop, preserve state and obtain a migration-specific decision.
4. Is data loss/corruption confirmed?
   - Evaluate point-in-time recovery under incident authority.
5. Would recovery discard legitimate writes?
   - Quantify the recovery window and obtain explicit client approval.
6. Is confidentiality affected?
   - Engage the incident and privacy/legal process.

## Success criteria

- restored target is isolated and synthetic;
- requested restore point is within the achieved RPO;
- service validation finishes within the RTO;
- migration history is healthy;
- aggregate synthetic counts reconcile;
- owner isolation and account lifecycle pass;
- no secret/private data enters evidence;
- original environment is unchanged;
- cleanup is completed and recorded.

## Current SpendGrove gate

The retained isolated Preview project is `cold-field-54187673`, branch `br-sweet-flower-aj2ng7ix`. GitHub Preview credentials and all six ordered Preview migrations remain deferred. Do not use this runbook to bypass that gate.

Production backup/history retention, branch protection and completed restore rehearsal remain unproven.
