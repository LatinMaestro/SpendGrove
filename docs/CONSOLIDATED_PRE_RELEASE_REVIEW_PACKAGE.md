# Consolidated Pre-release Review Package

Status: repository-side preparation package; mandatory external gates remain  
Prepared: 18 July 2026  
Client review: deferred  
Release authority: none

## Executive conclusion

SpendGrove has a mature authenticated responsive web product, completed reporting, privacy/account-lifecycle foundations, and guarded repository preparation for later advanced modules. It is not ready for TestFlight or public release.

The repository can no longer progress safely without a combination of operator, migration, native-tooling, provider, professional-review and client actions. No public rollout has begun.

## Governing evidence

- `docs/COMPLETE_PRODUCT_CURRENT_STATE_AUDIT.md`
- `docs/COMPLETE_PRODUCT_FEATURE_REGISTER.md`
- `docs/COMPLETE_PRODUCT_DELIVERY_ROADMAP.md`
- `docs/PHASE_15_PRE_RELEASE_CURRENT_STATE_AUDIT.md`
- `docs/PHASE_15_PRE_RELEASE_READINESS_CONTRACT.md`
- `docs/PHASE_15_REPOSITORY_PREPARATION_SUMMARY.md`
- `docs/PRODUCTION_RELEASE_CHECKLIST.md`
- `docs/DEFERRED_CLIENT_RETESTING.md`

Complete historical PR/merge evidence remains in `docs/CODEX_CURRENT_HANDOFF.md`, `docs/BUILD_PLAN.md`, milestone summaries and the GitHub repository. This package does not replace that record.

# Phase status

## Phases 1–4

- implemented, technically verified and historically accepted/closed where recorded;
- responsive beginner-first web product delivered;
- transaction, import, Loan, Property, recurring, budget and insight foundations delivered;
- accepted financial/privacy rules remain controlling.

## Phase 5

- repository delivery technically complete;
- Next.js 15 security baseline, account export/deletion, authenticated route posture and environment contracts delivered;
- client acceptance remains deferred; Phase 5 is not formally closed.

## Phase 6

- desktop and bulk-workflow repository preparation delivered;
- bulk execution/undo remains guarded and unavailable;
- first pending Preview migration required.

## Phase 7

- import/data-quality foundations delivered;
- durable transfer linking and import undo remain guarded and unavailable;
- second and third pending Preview migrations required.

## Phase 8

- Report Centre, Loan reporting, Property reporting and accountant-preparation downloads delivered using existing verified schema;
- final tax/accounting terminology requires professional review;
- client acceptance deferred.

## Phase 9

- financial contract and guarded recurring-instance, savings-goal, manual net-worth and in-app reminder services prepared;
- runtime disabled;
- fourth pending Preview migration required;
- push notifications and live valuations not active.

## Phase 10

- personal-by-default household/accountant privacy contract and guarded services prepared;
- runtime disabled;
- fifth pending Preview migration required;
- no email delivery, real invitation or shared browser-local data.

## Phase 11

- private-storage/privacy contract, metadata schema and guarded metadata/link services prepared;
- runtime disabled;
- sixth pending Preview migration required;
- no file bytes, provider, upload/download, malware service, OCR or AI.

## Phase 12

- local-first Basiq and AI contracts plus hard-disabled provider-neutral adapters prepared;
- no provider, credential, call, UI or data mutation;
- Production activation unapproved.

## Phase 13

- Expo/React Native with Expo Router selected;
- web remains an independent Next.js product;
- native bootstrap is not safely complete through the current online-only tool path;
- no native package, lockfile, device evidence, EAS, Apple signing or TestFlight.

## Phase 14

- commercial contract and hard-disabled immutable baseline entitlement boundary prepared;
- accepted features are not paywalled;
- no price, plan assignment, limit, provider, checkout, billing schema or App Store product.

## Phase 15

- audit, provider-free response safeguards, supported CI action runtimes and release runbooks delivered;
- 142 test files / 874 tests;
- application verification and Production dependency security gates green;
- exact-head security Preview Ready;
- not client accepted or closed.

# Implemented web product

The current web repository includes:

- Clerk account authentication and protected finance routes;
- owner-scoped durable records;
- manual transactions and correction;
- signed Money in/Money out/Transfer integrity;
- split transactions and no-double-count treatment;
- privacy-first browser-local CSV parsing;
- mapping, review, Import/Skip/Merge and duplicate handling;
- saved import profiles and import history;
- confirmed named everyday-bank profiles for CommBank, ANZ, NAB and Westpac;
- generic/manual CSV mapping;
- merchant cleanup, aliases, profiles and category rules;
- local deterministic category suggestions;
- Loan Accounts, Loan CSV review/import, repayment breakdowns and reconciliation;
- Properties and user-selected Property links;
- Australian financial-year Property/Loan reporting;
- recurring suggestions and confirmed regular payments;
- monthly budgets;
- Home insights, category chart and drilldowns;
- Report Centre and formula-safe exports;
- accountant-preparation manifest/readme workflow;
- complete current account export;
- account deletion;
- Help and Privacy surfaces;
- desktop/mobile responsive and accessibility foundations.

# Guarded or disabled capabilities

Not operational:

- Phase 6 bulk operation execution/undo;
- durable transfer links;
- import undo;
- advanced recurring instances;
- savings goals;
- manual net-worth records and snapshots;
- reminder persistence;
- household and accountant collaboration;
- document metadata and storage;
- Basiq;
- AI;
- commercial entitlements/payments;
- native iPhone/iPad application;
- push notifications;
- live monitoring/analytics.

No UI should claim these are available until their exact activation gates pass.

# Schema and migrations

Six additive migrations exist but remain unexecuted. They must run in the documented order against the retained isolated synthetic Preview database after operator reauthentication.

No Production migration is authorised. No Production history/content was inspected during the final preparation.

# Deployment evidence

- exact-head PR #223 Preview: `dpl_9RR2Z2PEMY4We8hECk2dwYUJVHDB`, Ready;
- latest safely inspected canonical Production: `dpl_5gkDyxoBKjZcGQSj6QAty4H2aA3h`, Ready at `e2479189c8b309bd41b501fddaf060205a1a9ee0`;
- canonical `/help`: HTTP 200 with established CSP/security headers;
- current-main Production deployment after the later header merge was not visible and remains an operator/release evidence gate;
- no no-op commit or redundant deployment was created.

# Verification baseline

Latest exact-head application evidence:

- 142 test files;
- 874 tests;
- TypeScript passed;
- lint passed with documented existing warnings;
- optimized Next.js 15.5.20 build passed;
- Production dependency gate passed;
- no high/critical Production advisory failed the gate;
- checkout/setup-node actions now use the supported Node 24-based v5 runtime;
- SpendGrove continues to verify on Node.js 20.

# Privacy and security

Confirmed:

- raw CSV is not durably retained;
- finance routes require authentication;
- resources are owner scoped;
- browser-local data is not silently migrated/shared/deleted;
- protected responses are private/no-store;
- strict nonce CSP and browser security headers exist;
- pre-release no-index is committed;
- audit/monitoring design prohibits private financial payloads;
- analytics is off;
- account export/deletion exists;
- no Production data access occurred.

Still required:

- Production Clerk/Neon/Vercel mapping proof;
- backup/restore proof;
- monitoring/incident ownership;
- support/security contacts;
- legal/privacy review;
- external security review;
- final native privacy manifest/SDK inventory.

# Financial reconciliation posture

Settled rules remain unchanged:

- integer cents;
- signed direction and transfer precedence;
- transfers excluded from spending;
- split children counted where eligible and parents excluded;
- everyday Transactions are sole cashflow records;
- LoanRepayment is analytical;
- reconciliation cannot double count;
- budgets use approved monthly rules;
- positive refunds do not reduce expense spending under the accepted limitation;
- reports are organisational aids, not tax/financial advice.

Final full-release reconciliation and professional terminology review remain required.

# Supported-bank and lender posture

Confirmed automatic everyday CSV column matching:

- Commonwealth Bank;
- ANZ;
- NAB;
- Westpac.

Generic/manual mapping remains available for other compatible CSV structures.

Loan imports support reviewed component-column and row-event ledger structures. This is structural support, not a claim of automatic named-lender coverage.

The final supported-format synthetic regression matrix remains a release gate.

# Provider status

Active repository/hosting providers:

- GitHub;
- Vercel;
- Clerk;
- Neon.

Not approved/active for additional functionality:

- monitoring/crash analytics;
- support/email delivery;
- document storage/malware scanning;
- Basiq;
- AI;
- payments/billing;
- push notifications;
- Apple build/signing services.

Any cost, plan upgrade, secret or provider activation requires a separate gate.

# Legal and professional review

Required before release:

- Groveware legal/business/contact facts;
- Australian privacy/legal review;
- Privacy Policy and Terms approval;
- provider/international-processing facts;
- tax/accounting review of Australian reporting language;
- security review/penetration assessment;
- GST/consumer/refund review if commercial activation proceeds;
- Apple privacy and review answers reconciled with the final binary.

Repository documents are factual inputs, not professional advice.

# Native/App Store status

Prepared:

- architecture decision;
- API/auth/file/privacy boundaries;
- App Store worksheet;
- TestFlight/launch/rollback runbook.

Missing/external:

- deterministic native project and lockfile;
- iPhone/iPad implementation;
- real-device/accessibility evidence;
- Apple Developer identity/payment;
- bundle ID/signing;
- privacy manifest;
- screenshots/metadata;
- review account;
- TestFlight;
- App Store submission.

# Exact blockers before TestFlight

1. GitHub Preview-secret reauthentication.
2. Six ordered synthetic Preview migrations and regression.
3. Focused runtime activations.
4. Production environment/history/backup proof.
5. Separate Production migration approvals and execution.
6. Current-main Production deployment verification.
7. Native project/bootstrap and iPhone/iPad QA.
8. Support, privacy and security operator ownership.
9. Legal/tax/security professional reviews.
10. Commercial and provider decisions.
11. Apple credentials, signing, metadata and privacy work.
12. Consolidated client acceptance.
13. Explicit TestFlight approval.

# Exact blockers before public release

All TestFlight blockers, plus:

- accepted TestFlight build;
- final no-index removal PR and verification;
- public support/privacy/terms URLs;
- monitoring and incident exercise;
- launch owner and rollback candidate;
- explicit App Store submission approval;
- explicit real-user/public-launch approval.

# Client testing plan

Preserve and execute `docs/DEFERRED_CLIENT_RETESTING.md` against:

- final authenticated web Production candidate;
- synthetic Preview with activated migrated features;
- final native TestFlight build;
- iPhone and iPad;
- desktop and mobile web;
- account export/deletion;
- imports and reporting;
- household/documents/optional features only if activated;
- accessibility and failure recovery;
- App Store metadata/privacy/support flows.

# Recommendation

Do not invite real users, upload to TestFlight, submit to Apple or publicly launch.

The next safe action is the existing operator gate: restore GitHub Preview credentials, run the six ordered migrations against the retained isolated synthetic Preview environment, and return each guarded feature through focused activation/QA PRs. Native bootstrap and professional/provider preparations may proceed only when their tooling and decisions are available.
