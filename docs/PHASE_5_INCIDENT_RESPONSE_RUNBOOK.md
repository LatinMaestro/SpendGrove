# Phase 5 Incident Response Runbook

Status: pre-private-beta operational runbook  
Last reviewed: 17 July 2026

## Purpose

Provide a calm, privacy-safe response path for security, availability, authentication, database, import and account-lifecycle incidents. This runbook does not appoint a legal incident responder or replace professional advice.

## Severity

| Severity | Example | Initial target |
|---|---|---|
| SEV-1 | suspected cross-user access, secret exposure, destructive data loss, compromised authentication | contain immediately; client decision required |
| SEV-2 | authenticated finance screens unavailable, widespread failed imports, account export/deletion failure | investigate promptly; pause beta invitations |
| SEV-3 | isolated recoverable error or degraded non-critical workflow | record safe facts and schedule focused correction |
| SEV-4 | cosmetic/documentation issue with no data or access impact | normal maintenance |

Final response times and named owners require client approval.

## First response

1. Stop deployments and migrations related to the suspected cause.
2. Do not reset, resolve, rewrite, backfill or manually edit Production data.
3. Record only safe facts: time, environment, deployment ID, route template, HTTP class and safe error code.
4. Check GitHub Actions, Vercel deployment state/runtime error groups, Clerk service status and Neon service status.
5. If cross-user exposure or secret compromise is suspected, classify SEV-1 and stop autonomous changes.
6. Preserve evidence without copying request bodies, financial data, emails, tokens, URLs with private query values or database content.
7. Decide whether a code rollback is safe. Database changes use forward-fix or an approved restore plan; never assume application rollback reverses data state.

## Containment

- Vercel/application fault: pause new release work; roll back only to a known compatible deployment.
- Clerk fault: keep finance routes fail-closed; do not bypass authentication.
- Neon fault: stop writes if integrity is uncertain; do not switch database URLs or branches without approval.
- import fault: preserve review-before-commit; do not auto-retry commits or relax validation.
- account deletion fault: honour the truthful app-data/identity completion state; do not claim full deletion prematurely.
- suspected secret: client rotates it in the provider dashboard under a separately approved environment-change procedure.

## Communication

User copy must avoid financial details and unverified claims. State:

- what capability is unavailable;
- whether the user should stop retrying;
- whether data is known to be safe, unknown or affected;
- when the next update is expected.

Security/privacy notifications, legal deadlines and regulator contact require professional/client review.

## Recovery and verification

- exact commit and deployment identified;
- authenticated and signed-out access retested;
- two-user isolation retested for security incidents;
- affected mutation replayed only with synthetic data;
- no-double-count and idempotency verified for import incidents;
- provider status healthy;
- runtime logs inspected for private-data leakage;
- follow-up regression added;
- client authorises reopening beta invitations.

## Closure

Create a private incident record containing only safe operational facts, cause, containment, corrective PR, verification and prevention. Do not store user financial evidence in GitHub issues or chat.

## Mandatory escalation

Stop for client approval before environment/secret changes, provider-plan changes, Production migration/data access, deletion/backfill, branch restore, public incident statement or legal notification.
