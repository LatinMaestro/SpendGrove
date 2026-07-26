# Backup and Restore Rehearsal Runbook

Status: procedure and evidence controls prepared; operator authority and rehearsal remain outstanding  
Prepared: 18 July 2026  
Updated: 26 July 2026  
Provider context: Neon PostgreSQL  
Controlling evidence package: `PHASE_B_PRODUCTION_ENVIRONMENT_AND_RECOVERY_READINESS.md`

## Purpose

Prove that SpendGrove can recover safely without experimenting on Production or exposing private financial data.

This runbook is for a synthetic, non-Production rehearsal. It does not authorise a Production restore, provider mutation, branch creation, plan upgrade, temporary environment-variable change, migration, private-row query or data inspection.

## Current state

Confirmed repository/Preview evidence:

- the retained isolated Preview destination is safe project `cold-field-54187673`, branch `br-sweet-flower-aj2ng7ix`, database `neondb`;
- verify-only migration run `29669320110` recorded all 12 expected repository migrations healthy;
- the six Phase 6–11 controlled migrations were recorded exactly once;
- no failed or unresolved migration existed;
- the new tables were empty when verified;
- no Production database, secret, migration or data was used;
- the migration workflow must not be rerun for the current activation sequence.

Unproven:

- current Production Neon destination and plan;
- current Production history-retention window;
- point-in-time restore and snapshot capability for the actual plan;
- branch protection and network-security posture;
- approved RPO and RTO;
- named restore, verification and cleanup authorities;
- completed synthetic restore rehearsal;
- Production recovery readiness.

## Official capability boundary

Neon supports branch history and point-in-time restore within the configured history-retention window. Actual retention, snapshots, scheduling and protection capabilities depend on the current project configuration and plan and must be verified in the provider dashboard.

Official references reviewed 26 July 2026:

- https://neon.com/blog/announcing-point-in-time-restore
- https://neon.com/docs/changelog/2024-02-23
- https://neon.com/docs/changelog/2025-10-31

These references establish platform capability only; they do not prove SpendGrove’s current configuration.

## Required decisions before rehearsal

- approved synthetic source project/branch;
- approved non-destructive restore target type;
- current Neon plan and history-retention capability;
- target recovery point objective (RPO);
- target recovery time objective (RTO);
- authorised rehearsal operator;
- independent verifier;
- incident communications owner;
- cleanup authority;
- safe synthetic dataset;
- restore target naming and deletion policy;
- approval for any provider action, temporary deployment mapping or cost.

Until exact values are approved, planning may use:

- proposed RPO: within the proven retention window and no greater than six hours unless a longer current capability is proven and approved;
- proposed RTO: restore target plus core synthetic verification within two hours.

These are planning targets, not user commitments.

## Safe evidence

Record only:

- safe project, branch and database labels;
- provider operation/event ID;
- requested and achieved restore timestamps;
- migration names and states;
- schema-object counts;
- synthetic aggregate row counts;
- application health outcomes;
- start/end times;
- RPO/RTO result;
- named operator/verifier roles;
- cleanup completion.

Never record:

- connection strings;
- passwords, tokens or cookies;
- provider secret values;
- private row contents;
- transaction descriptions or amounts;
- user emails;
- banking identifiers;
- exact Property/Loan details;
- filenames or document contents;
- hashes or fragments derived from complete secrets.

## Synthetic dataset

The source must contain synthetic records only, including at minimum:

- two synthetic account owners;
- manual Transactions;
- one reviewed import batch;
- one split Transaction;
- one transfer pair;
- one Loan Account and repayment;
- one Property relationship;
- one budget and recurring item;
- advanced-finance records when the schema includes them;
- synthetic household/accountant permission records when activated;
- document metadata only unless a storage provider is separately approved.

Record model counts only. Do not copy row values into evidence.

## Rehearsal prerequisites

- source and target are proven non-Production;
- no Production data was copied into the source;
- only synthetic identities and records exist;
- current migration inventory is captured;
- safe aggregate counts are captured;
- runtime gates match the source schema;
- exact recovery point is identified;
- target naming and cleanup are approved;
- any temporary verification deployment/configuration action is approved;
- no provider payment or upgrade is implied.

## Rehearsal procedure

1. Record safe source identity, current timestamp, migration inventory and aggregate synthetic counts.
2. Create a known synthetic recovery point.
3. Perform one approved disposable synthetic change after that point.
4. Through the approved Neon dashboard/API, create a new isolated restore/branch target from the selected timestamp.
5. Do not overwrite, reset or restore the source branch in place.
6. Record safe operation ID, requested restore time and start time.
7. Confirm restored migration history using metadata-only checks.
8. Confirm every expected migration appears exactly once and none is failed or unresolved.
9. Confirm expected schema-object profiles.
10. Confirm aggregate synthetic counts match the selected recovery point.
11. Point only a disposable verification deployment at the restored target after an approved temporary secret/configuration action.
12. Run connection health, synthetic authentication, two-user isolation, transaction/import history, transfer/split and Loan no-double-count checks, account export, disposable-account deletion, guarded runtime/schema alignment, privacy-safe log review and full automated regression when capacity is available.
13. Record achieved RPO and RTO.
14. Remove or restore the temporary verification mapping.
15. Delete the restore target only after evidence is retained and cleanup is authorised.
16. Record cleanup and confirm the source environment remained unchanged.

## Failure handling

Stop if:

- the target may be Production;
- source or target identity is uncertain;
- the source contains non-synthetic data;
- migration history is failed, unresolved or unexpected;
- the restore point is outside available history;
- safe counts do not reconcile;
- authentication or owner isolation fails;
- a financial invariant fails;
- private data appears in evidence;
- a provider upgrade or payment is required;
- a destructive overwrite is the only offered path;
- application validation would require unapproved Production activation;
- temporary configuration cannot be cleaned up safely.

Do not reset a database, restore Production, resolve migrations manually, run rollback SQL, retry destructive actions automatically, substitute Production for Preview, copy rows between environments, expose a connection value or use a real user/financial record.

## Aggregate failure codes

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

## Production recovery decision tree

This decision tree is preparation only. A real Production recovery requires incident authority and an exact approval.

1. Application-only problem: prefer deployment rollback.
2. Forward-compatible schema with intact data: prefer a focused additive forward fix.
3. Failed/unresolved migration: stop and preserve state; do not rerun or resolve manually.
4. Confirmed data loss/corruption: evaluate point-in-time recovery under incident authority.
5. Recovery may discard legitimate writes: quantify the window and obtain explicit approval.
6. Confidentiality affected: engage incident, privacy and legal processes.
7. Old application incompatible with current schema: do not roll back until compatibility is proven.

## Success criteria

- source and target are isolated and synthetic;
- requested restore point is achieved within the approved RPO;
- core validation finishes within the approved RTO;
- migration history is exact and healthy;
- schema profiles and aggregate counts reconcile;
- authentication and owner isolation pass;
- transfer, split and Loan no-double-count invariants pass;
- export and disposable-account deletion pass;
- no secret/private data enters evidence;
- original environment is unchanged;
- temporary configuration and restore targets are cleaned up;
- provider operation and evidence IDs are retained safely.

## Evidence record

| Field | Value |
|---|---|
| source environment | pending |
| restore target | pending |
| restore point | pending |
| provider operation ID | pending |
| operator | pending |
| verifier | pending |
| approved RPO | pending |
| approved RTO | pending |
| achieved RPO | pending |
| achieved RTO | pending |
| migration result | pending |
| schema profile result | pending |
| synthetic count result | pending |
| auth/isolation result | pending |
| financial invariant result | pending |
| export/deletion result | pending |
| privacy review result | pending |
| cleanup completed | pending |
| overall outcome | not started |

Production backup/history retention, branch protection, recovery authority and completed restore rehearsal remain unproven. Do not use this runbook to bypass the activation, Production migration or client approval gates.