# Security Incident Response Runbook

Status: repository-ready; operator ownership and alert channels unconfirmed  
Prepared: 18 July 2026  
Scope: SpendGrove web, future native client, GitHub, Vercel, Clerk, Neon and later approved providers

## Purpose

Provide a privacy-safe, repeatable response to suspected security, privacy, data-integrity or availability incidents. This runbook does not grant access to Production data or permission to change provider configuration.

## Non-negotiable rules

- Never paste secrets, connection strings, tokens, raw CSV, transaction descriptions, amounts, balances, filenames, bank identifiers, exact addresses or private Loan/Property details into tickets, chat or incident notes.
- Use provider event IDs, deployment IDs, request IDs, timestamps, route names and safe reason codes.
- Do not inspect Production financial rows unless separately authorised for a specific incident.
- Do not reset, rewrite or manually resolve Production migrations.
- Preserve evidence before changing state.
- Rotate or revoke a credential only through an authorised operator action.
- A suspected breach involving personal information requires prompt legal/privacy assessment.

## Severity

### SEV-1 — Critical

Examples:

- confirmed cross-account data exposure;
- confirmed secret compromise with Production access;
- destructive or uncontrolled Production data change;
- widespread authentication bypass;
- active payment/provider compromise if later enabled.

Target: immediate containment by the authorised operator; client and privacy/legal contact engaged.

### SEV-2 — High

Examples:

- credible but unconfirmed cross-account access;
- account deletion/export failure affecting privacy rights;
- major outage of authenticated finance routes;
- migration failure that leaves Production availability or integrity uncertain.

Target: same-day ownership, containment plan and client notification.

### SEV-3 — Moderate

Examples:

- repeated safe import failures;
- isolated route regression without data exposure;
- degraded provider availability with a safe fallback;
- suspicious activity blocked by existing controls.

Target: triage within one business day.

### SEV-4 — Low

Examples:

- documentation defect;
- non-sensitive cosmetic issue;
- low-risk operational warning.

Target: normal backlog.

## First 15 minutes

1. Record UTC and Australian local time.
2. Assign an incident lead and scribe.
3. Record only safe identifiers:
   - environment;
   - deployment or commit;
   - affected route/service;
   - provider event/request ID;
   - first/last observed time;
   - safe error code;
   - estimated account count, without identities.
4. Decide whether the report is credible and whether exposure is continuing.
5. Preserve provider and deployment evidence.
6. If continuing harm is likely, choose the least destructive containment:
   - disable an already approved runtime flag;
   - roll back to a known-good deployment;
   - revoke a compromised credential through the operator;
   - temporarily block an affected route through an approved provider control.
7. Do not modify data to make symptoms disappear.

## Investigation checklist

- confirm exact commit and deployment;
- identify Preview versus Production;
- verify authentication and owner-scope path;
- identify the first failing boundary;
- compare with the last known-good deployment;
- inspect safe aggregate error counts;
- review relevant code and audit reason codes;
- determine whether financial calculations, data integrity or confidentiality changed;
- determine whether a provider, package, migration or operator action contributed;
- identify every affected user only through an authorised, privacy-safe process.

## Containment choices

Preferred order:

1. stop the affected action;
2. disable the narrow feature;
3. roll back application deployment;
4. revoke/rotate the narrow credential;
5. apply a focused forward fix;
6. use database recovery only under the approved recovery runbook.

Never:

- use Production as a development environment;
- run `prisma migrate reset`;
- use `prisma migrate dev` against shared environments;
- delete migration history;
- run ad-hoc rollback SQL;
- copy Production data into Preview;
- expose a private row in an incident record.

## Communication template fields

- incident ID;
- severity;
- current status;
- affected environment and capability;
- user impact in plain English;
- data-exposure status: none / suspected / confirmed / unknown;
- containment completed;
- next update time;
- client/operator action needed;
- legal/privacy review needed.

Do not include private financial content.

## Recovery and validation

Before declaring service restored:

- exact fix or rollback is identified;
- tests, TypeScript, lint and optimized build passed where code changed;
- authenticated and signed-out route checks passed;
- two-user isolation checks passed for an ownership incident;
- financial reconciliation passed for a calculation incident;
- migration history is healthy if a migration was involved;
- public and protected response headers are correct;
- error rate returned to baseline;
- no missing-table query is possible for guarded features.

## Post-incident review

Within five business days for SEV-1/2:

- timeline;
- root cause;
- affected boundary;
- containment effectiveness;
- data and user impact;
- why existing controls did or did not prevent it;
- corrective actions with owners and dates;
- tests/runbooks changed;
- legal/privacy notifications and rationale;
- provider follow-up;
- evidence-retention period.

## Operator gates still open

- named incident lead and backup;
- approved security contact;
- approved alert channel;
- provider-native alert configuration;
- external legal/privacy contact;
- external penetration/security review;
- final evidence-retention policy.

No alerting or incident provider is activated by this document.
