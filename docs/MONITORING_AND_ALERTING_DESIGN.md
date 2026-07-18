# Privacy-safe Monitoring and Alerting Design

Status: design only; no provider, package, secret or alert is active  
Prepared: 18 July 2026

## Objective

Detect availability, authentication, import, database and deployment failures without collecting financial history or user behaviour analytics.

Analytics remains off. This design is operational monitoring, not product profiling.

## Minimum signals

### Deployment

- build status;
- deployment status;
- exact commit;
- rollback availability;
- route-level 5xx count.

### Application

- safe error reason code;
- route template;
- environment;
- release/deployment ID;
- timestamp;
- duration bucket;
- success/failure count.

### Authentication

- provider availability;
- signed-out 401/redirect rate by route class;
- provisioning failure reason code;
- session validation failure count.

Do not collect credentials, tokens or unnecessary email.

### Database

- connection availability;
- timeout count;
- pool saturation where provider exposes it;
- migration state;
- backup/history health;
- query-duration buckets by safe operation name.

Do not collect SQL text containing private values or row payloads.

### Import

- stage: parse / map / review / commit;
- supported profile identifier;
- safe error code;
- row-count bucket;
- duration bucket;
- success/failure count.

Do not collect filenames, raw rows, descriptions, amounts, account references or column contents.

### Account lifecycle

- export started/completed/failed;
- deletion started/completed/failed;
- provider stage;
- safe reason code;
- duration bucket.

Do not place exported/deleted data in logs.

## Explicitly prohibited fields

- raw CSV or document bytes;
- transaction description or narration;
- merchant-level financial history;
- amount, balance, principal, interest or fee;
- account, BSB, card, customer or loan identifier;
- filename;
- exact address or private Property detail;
- category history tied to a person;
- browser-local financial data;
- authentication secret or session token;
- provider secret;
- email unless strictly required for a specific account-operation communication.

## Alert candidates

### Page immediately

- cross-account authorization failure;
- confirmed secret exposure;
- sustained Production authentication bypass/failure;
- destructive data action;
- failed Production migration.

### Urgent business-hours alert

- sustained 5xx rate;
- database unavailable;
- repeated account deletion/export failure;
- import commit failure spike;
- backup/history capability unavailable;
- deployment failed with no healthy candidate.

### Review queue

- elevated safe validation failures;
- slow route buckets;
- parser-profile regression;
- repeated synthetic smoke failure;
- dependency-security gate warning.

## Threshold design

Before activation, record:

- normal baseline;
- time window;
- minimum event count;
- alert owner;
- notification channel;
- suppression/deduplication;
- retry/escalation;
- maintenance windows;
- privacy review.

Do not select thresholds from private user behaviour. Start from service reliability and synthetic tests.

## Provider decision

Preferred order:

1. use existing GitHub, Vercel, Clerk and Neon native operational signals where included;
2. use repository-owned safe health checks;
3. add an external provider only after privacy, cost, retention, region, DPA, deletion/export and secret review.

No provider is selected by this document.

## Safe event envelope

A future monitoring adapter may accept only:

- `eventName` from an approved allowlist;
- `reasonCode` from an approved allowlist;
- `environment`;
- `releaseId`;
- `routeClass`;
- `durationBucket`;
- `count`;
- `timestamp`.

It must reject arbitrary metadata and private values.

## Retention and access

Before activation decide:

- retention period;
- operator roles;
- export/deletion treatment;
- incident hold;
- region/international transfer;
- support/vendor access;
- audit of configuration changes.

## Verification before release

- alert owner and backup named;
- provider dashboards mapped without exposing secrets;
- synthetic alerts tested;
- no prohibited field appears;
- failure and recovery notifications tested;
- runbook links included;
- false-positive handling recorded;
- analytics opt-out is unaffected because analytics remains off;
- monitoring provider facts appear in the final Privacy Policy and Apple disclosures where required.

## Current blockers

- no monitoring/alert provider approved;
- no alert channel approved;
- provider plan capabilities unverified;
- no Production baseline;
- no incident exercise;
- no legal/privacy review of final provider configuration.

Repository work may continue; activation is an operator/client gate.
