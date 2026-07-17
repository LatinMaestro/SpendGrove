# Phase 5 Milestone 2 immediate account deletion contract

Status: approved implementation scope  
Release target: controlled Australian web private beta  
Date: 17 July 2026

## Objective

Allow a verified account owner to permanently remove their SpendGrove account data and Clerk identity through a deliberate, understandable and retry-safe workflow.

There is no grace period in this contract. Financial records are not hard-deleted through everyday product actions, but an explicit whole-account erasure permanently removes the account-owned database records.

## User flow

1. Settings keeps deletion inside a secondary danger area.
2. The user is prompted to download their account data first.
3. The user deliberately opens the delete flow.
4. Plain-English copy explains that transactions, imports, categories, budgets, regular payments, loans, Properties and settings will be permanently removed.
5. The user confirms the irreversible result and types `DELETE`.
6. Clerk strict reverification confirms the user's identity within the supported ten-minute window.
7. The server validates the typed confirmation, authenticated Clerk identity and durable SpendGrove owner.
8. SpendGrove deletes the owner's application records in one database transaction.
9. Only after application-data deletion commits does the server request deletion of the same Clerk identity.
10. The result truthfully distinguishes complete deletion from an external identity-deletion failure.

No browser-local prototype data is read, uploaded, merged or deleted.

## Why application data is deleted first

The finance database is the most sensitive store. Deleting it atomically first avoids leaving durable finance data behind if Clerk identity deletion succeeds but a later database operation fails.

If Clerk deletion then fails:

- the finance data has still been permanently removed;
- the Clerk identity may remain;
- the response says this clearly;
- the user can retry identity removal;
- a retry may provision and immediately remove an empty durable user shell before retrying Clerk;
- no deleted financial data is recreated.

The reverse order is rejected because deleting the Clerk identity first could strand inaccessible durable finance data.

## Owner-data deletion order

The database transaction removes owner-scoped rows in dependency-safe order:

1. audit events;
2. Property report reviews;
3. Property transaction links;
4. Loan reconciliation links;
5. Loan repayments;
6. category budgets;
7. recurring items and suggestion dismissals;
8. import rows;
9. merchant aliases and merchant rules;
10. transactions;
11. import batches;
12. Loan Accounts;
13. Properties;
14. merchant profiles;
15. bank import profiles;
16. categories;
17. user settings;
18. the durable user record.

Every delete filter contains the authenticated durable user ID. A final user delete uses both the durable ID and Clerk provider ID so a stale or cross-identity request fails closed.

The order preserves current restrictive foreign keys without changing schema or retention rules.

## Confirmation and reverification

- The accepted confirmation string is exactly `DELETE`.
- Client state is not trusted; the server validates it.
- Clerk strict reverification is required by the Route Handler.
- The client uses Clerk's supported `useReverification` flow.
- Cancellation performs no database or provider call.
- Duplicate clicks are disabled while a request is active.
- An unauthenticated, stale, cross-user or malformed request deletes nothing.

## Idempotency and failure states

### Complete

Application data and Clerk identity are deleted. The client returns to the public onboarding surface and no finance route remains accessible.

### Application transaction failed

The database transaction rolls back. Clerk deletion is not attempted. The response says no account deletion was completed and permits a safe retry.

### Clerk identity deletion failed after application deletion

The response sets:

- `appDataDeleted: true`;
- `identityDeleted: false`;
- a plain-English retry message.

The server does not claim full completion. It does not restore finance data, run manual SQL or conceal the provider failure.

### Retry

A retry remains safe. Owner-scoped `deleteMany` operations tolerate already-empty entity groups. The current durable user shell is removed before another same-identity Clerk deletion request.

## Privacy and logging

- No deleted record contents, counts, amounts, descriptions, filenames, banking identifiers or emails are returned or logged.
- No deletion payload is written to audit metadata.
- The response contains only safe boolean state and a plain message.
- Provider exceptions are converted to a safe internal reason code; private provider response bodies are not returned.
- The route uses private no-store response headers.

## Production readiness blocker

The repository workflow can be implemented and verified against mocks and Preview. A real private-beta deletion cannot be accepted until Production uses an approved Clerk Production instance and the operator confirms that self-deletion/Backend API deletion is enabled for that instance.

No Clerk configuration change is authorised by this PR.

## Schema and migration assessment

No Prisma schema change, Preview migration, Production migration, backfill, retention table or deletion queue is required.

## Exclusions

This implementation does not add:

- a grace or recovery period;
- automatic export before deletion;
- browser-local deletion;
- manual SQL or operator data tools;
- backup purge automation;
- legal-policy text;
- email notifications;
- monitoring, analytics or support providers.

Provider backup retention and deletion propagation remain policy and operator evidence items for later Phase 5 work.

## Required verification

- exact typed confirmation;
- strict server-side reverification;
- owner-scoped ordered deletion;
- database rollback prevents Clerk deletion;
- Clerk deletion happens only after database commit;
- partial provider failure is truthful and retry-safe;
- another user's data is untouched;
- all current owner-owned entity groups are covered;
- browser-local keys are untouched;
- no schema, migration, package or financial-rule changes;
- complete tests, TypeScript, lint and optimized online build pass.

## Stop conditions

Stop if implementation requires a schema/migration, background job, paid provider capability, environment mutation, Production data access, browser-local erasure, hidden partial failure, weakened reverification or a change to financial behaviour.
