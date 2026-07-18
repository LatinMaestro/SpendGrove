# TestFlight, Launch and Rollback Runbook

Status: planning only; no Apple action or public release authorised  
Prepared: 18 July 2026

## Gates

### Gate 1 — Repository release candidate

Required:

- selected release features complete;
- no placeholder core screen;
- all guarded features either activated with proof or clearly unavailable;
- exact commit frozen;
- full tests, TypeScript, lint and optimized builds green;
- production dependency gate green;
- financial reconciliation complete;
- account export/deletion complete;
- privacy/security/accessibility evidence complete.

### Gate 2 — Environment and data safety

Required:

- Preview/Production Vercel, Clerk and Neon mapping proven;
- six ordered migrations proven in synthetic Preview;
- separate Production migration approval and execution evidence;
- backups/history retention verified;
- restore rehearsal passed;
- no failed/unresolved migration;
- secrets scoped correctly;
- Production authentication configured;
- runtime flags match Production schema.

### Gate 3 — Native and Apple

Required:

- deterministic native project and lockfile;
- Clerk native auth;
- secure CSV temporary-file cleanup;
- export/share;
- account deletion;
- iPhone/iPad/device/accessibility QA;
- privacy manifest and SDK inventory;
- Apple developer identity, signing and bundle ID;
- metadata, screenshots, support/privacy URLs;
- review account;
- explicit approval to upload TestFlight.

### Gate 4 — Client and professional acceptance

Required:

- final consolidated client review;
- legal/privacy review;
- tax/accounting wording review;
- external security review;
- commercial/provider decisions;
- support and incident ownership;
- explicit TestFlight/public-release decision.

## TestFlight procedure

Only after approval:

1. freeze release commit and version;
2. verify clean build provenance;
3. generate signed archive through approved credentials;
4. upload to TestFlight;
5. record build number and processing status;
6. complete internal tester matrix with synthetic data;
7. review crashes, privacy, account lifecycle and finance reconciliation;
8. fix through a new reviewed commit/build;
9. obtain final client acceptance;
10. do not automatically promote to App Store review.

## Public launch procedure

Only after separate approval:

1. confirm App Store record and final binary;
2. confirm Production deployment and database;
3. confirm monitoring/incident owners;
4. confirm support/privacy/terms URLs;
5. confirm backup and rollback readiness;
6. capture last known-good web and native releases;
7. approve phased/manual release strategy;
8. submit/release through the authorised operator;
9. monitor safe service signals;
10. retain launch evidence without private user data.

## Web rollback

Preferred sequence:

1. identify last known-good Production deployment;
2. verify it is schema-compatible with current Production;
3. use Vercel rollback/promote controls through the authorised operator;
4. confirm authentication, owner isolation, core routes, headers and finance calculations;
5. do not roll back across an incompatible migration;
6. use a forward fix when schema compatibility is uncertain.

## Native rollback

An App Store binary cannot be instantly replaced for every installed user.

Controls:

- keep server APIs backward compatible;
- use hard-false runtime gates for incomplete features;
- stop phased release where available;
- remove a harmful server capability safely;
- submit an expedited focused build only under Apple/operator authority;
- never strand users behind a schema/API change;
- preserve export and deletion access.

## Database incident

- application rollback is not database rollback;
- do not reset, run manual SQL or resolve migrations manually;
- preserve failure state;
- identify whether forward fix or point-in-time recovery is safer;
- quantify writes at risk;
- require a migration/recovery-specific client decision;
- use the backup/restore and incident runbooks.

## Rollback triggers

- cross-account exposure;
- authentication bypass;
- data corruption;
- incorrect financial totals;
- broken export/deletion;
- widespread import failure;
- unrecoverable crash/launch loop;
- serious privacy disclosure mismatch;
- critical runtime dependency advisory with credible exposure.

## Go/no-go record

Record:

- release commit;
- web deployment;
- native build;
- schema/migration state;
- test totals;
- open defects by severity;
- security/privacy/legal sign-offs;
- operator ownership;
- rollback candidate;
- decision and approver;
- timestamp.

## Current status

No TestFlight or public-launch gate is satisfied. Native implementation, migrations, Production mapping/recovery, professional review, Apple credentials and final client acceptance remain incomplete.
