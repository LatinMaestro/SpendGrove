# Preview Foundation Activation QA

Date: 19 July 2026  
Status: repository implementation complete; merge and runtime acceptance pending Vercel Preview capacity and synthetic-data QA

## Verified starting point

- baseline merge: `e99c0f756d40868777ff2d3f3091e5cff1fce770`;
- verify-only migration run: `29669320110`;
- all 12 expected Prisma migrations were healthy in the isolated Neon Preview database;
- the six controlled Phase 6–11 migration profiles were recorded exactly once;
- no failed or unresolved migration existed;
- the newly migrated tables were empty;
- no Production database, secret, migration or data was used.

The migration workflow must not be rerun for this activation sequence.

## Activation PR register

| Activation | PR | Exact head | GitHub verification | Result |
|---|---:|---|---:|---|
| A — bulk operations and undo | #231 | `078585220e7b5312849c7fb8d29a7f057cafe769` | `29671733540` | 146 files / 899 tests; types, lint and build passed |
| B — transfer linking | #232 | `7b7baf1f20f3179d5a751164eedbe7625cae9720` | `29672123119` | 147 files / 906 tests; types, lint and build passed |
| C — import undo | #233 | `bc30754035c4db18d846bf32111b2068bcbd5748` | `29672726252` | 149 files / 916 tests; types, lint and build passed |
| D — savings goals | #234 | `f7f051bc7e93d2996585f9f000b36a2c6a5ee4da` | `29673300731` | 150 files / 923 tests; types, lint and build passed |
| E — net worth | #235 | `664a6ef806ad7bc052b5bc75644520d2ae42ddf2` | `29673317616` | 151 files / 930 tests; types, lint and build passed |
| F — recurring lifecycle | #236 | `5caec0eb28618658b33519643b5e01b942b9037d` | `29673557293` | 152 files / 938 tests; types, lint and build passed |
| G — in-app reminders | #237 | `37a3e956c9d1968ce84f77aa3f5f81cb290c4557` | `29674012740` | 153 files / 944 tests; types, lint and build passed |
| H — household sharing | #238 | `e1554e004eca7532b4931e05c182b518832650bf` | `29674417058` | 154 files / 950 tests; types, lint and build passed |
| I — read-only accountant access | #239 | `425277fd3726c1dbf02200a839ace09be330b153` | `29674687193` | 155 files / 955 tests; types, lint and build passed |
| J — document metadata | #240 | `e5519769ea7fd07720144067104f3c897eb73d23` | `29674971283` | 156 files / 961 tests; types, lint and build passed |

All activation diffs were compared with their immediate parent. None changes Prisma schema, migration SQL, packages, lockfile, providers, secrets, environment configuration or Production runtime configuration.

## Current verification blocker

Every activation head received the same Vercel status:

- failed before an application build because of the Vercel account build-rate limit;
- target reported `upgradeToPro=build-rate-limit`;
- no exact-head Vercel Preview deployment exists for A–J;
- this is not an application, schema, migration, privacy or financial-rule failure.

The PRs remain open and unmerged. Do not merge them until one meaningful exact-head Vercel Preview is green and the stacked sequence is reviewed against that deployed code. Do not create no-op commits or repeatedly retrigger deployment.

## Production guard

All activated services use `isVerifiedPreviewRuntime()` and fail closed outside Vercel Preview. Production must continue to:

- avoid all migrated Preview-only tables;
- show none of the activation controls;
- run no Phase 6–11 migration;
- receive no provider, secret or environment mutation;
- receive no synthetic or private Preview data.

## Required synthetic Preview QA

Use only synthetic Preview accounts and synthetic records.

### A. Bulk operations

1. Select eligible ledger rows.
2. apply an allowed category, Property or status operation;
3. confirm stale/ineligible rows are skipped safely;
4. undo once;
5. confirm a second undo is blocked;
6. confirm no cross-owner record changes.

### B. Transfer linking

1. Link one exact compatible outgoing/incoming pair;
2. verify both remain transfers and excluded from spending/income;
3. unlink;
4. confirm ambiguous and cross-owner pairs are denied;
5. confirm no automatic link occurs.

### C. Import undo

1. Commit a synthetic import;
2. undo eligible imported rows;
3. confirm later-edited or linked rows are blocked;
4. restore once where supported;
5. confirm operation summaries contain no narration or private source values.

### D. Savings goals

1. Create and edit a goal;
2. add a manual contribution;
3. pause, resume and complete it;
4. delete and restore it;
5. confirm no Transaction or money movement is created.

### E. Net worth

1. Create manual assets and liabilities;
2. record dated valuations;
3. link only compatible owned Property/Loan references;
4. create a snapshot;
5. confirm archived items and snapshots remain recoverable;
6. confirm transaction cashflow is unaffected.

### F. Recurring lifecycle

1. Pause, resume, cancel and mark a confirmed payment for review;
2. link one exact compatible existing Transaction;
3. unlink it;
4. confirm only one transaction is presented as the actual cashflow;
5. confirm no predicted Transaction is created.

### G. In-app reminders

1. Confirm every family is opt-in;
2. enable recurring, budget, goal and unmatched-loan reminders;
3. create user-selected import and EOFY dates;
4. verify due, overdue and upcoming wording;
5. mark Done and Dismiss;
6. confirm duplicate source/event reminders are not created;
7. confirm no email, SMS or push delivery occurs.

### H. Household sharing

1. Create a household;
2. generate and accept a one-time synthetic invitation;
3. test administrator/member role changes, removal and leave;
4. verify the last-administrator safeguard;
5. explicitly share one selected record and one report;
6. verify no related or pre-existing record is shared automatically;
7. revoke sharing and confirm immediate denial;
8. verify direct-ID and cross-owner access fail.

### I. Accountant access

1. Create and accept a one-time synthetic access code;
2. share one selected record and one report;
3. verify the accountant view is read-only;
4. verify unrelated records and households are absent;
5. revoke one scope and then the grant;
6. confirm immediate denial and no source-record mutation;
7. confirm wording does not claim professional registration.

### J. Document metadata

1. Create a document record without selecting or uploading a file;
2. link it to an owned record and fixed report;
3. remove a link;
4. delete the metadata record;
5. confirm Upload file remains disabled;
6. confirm no file bytes, OCR, extraction, object key or public URL is created or exposed.

## Cross-feature regression

- two-user and three-user isolation;
- signed-out denial;
- direct API/URL denial;
- Australian date handling;
- integer-cent and no-double-count rules;
- transfers excluded from spending and income;
- account export includes only safe owned lifecycle records;
- account deletion covers each activated model without deleting another user's source records;
- browser-local prototype data is not shared or migrated;
- 390 px mobile overflow and keyboard/focus review;
- no raw CSV, narration, filenames, account identifiers, Property addresses or secrets in responses, logs or audit metadata.

## Remaining external and Production gates

- Vercel Preview build capacity and exact-head deployment;
- synthetic Preview QA evidence;
- ordered merge of PRs #231–#240 and this QA handoff;
- separate Production migration proposal, environment proof, backup proof and explicit client approval;
- email delivery provider for real invitations: not approved;
- push provider/credentials: not approved;
- private object storage and malware controls: not approved;
- OCR/AI extraction: not approved;
- real users, public launch and App Store actions: prohibited.

No activation is accepted for Production by this document.
