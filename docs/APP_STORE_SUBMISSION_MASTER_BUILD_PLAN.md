# SpendGrove App Store Submission Master Build Plan

Prepared: 26 July 2026  
Status: controlling end-to-end plan proposed for autonomous delivery  
Target: a complete, polished, secure SpendGrove iPhone application with practical iPad support, a maintained web product, and all selected features ready for submission to Apple App Review  
Architecture: Next.js web/backend plus React Native with Expo and Expo Router native client  
Authority boundary: this plan authorises repository and synthetic non-Production work. It does not itself authorise Production migrations, paid providers, Apple Developer enrolment, signing, TestFlight upload, real-user invitations, App Store submission or public release.

## 1. Definition of “ready to submit for App Store review”

SpendGrove is submission-ready only when all of the following are true:

1. Every release-required feature is implemented end to end, available in the submitted build, documented accurately and free of placeholder or misleading UI.
2. The native iPhone application and supported iPad layouts use the accepted server-authoritative ownership, privacy and financial rules.
3. The web product remains supported and does not diverge financially or expose capabilities that the native product cannot safely access.
4. Preview and Production environments are explicitly separated across Vercel, Neon, Clerk, native configuration, storage, monitoring, invitation delivery, notifications and commercial providers.
5. All approved database migrations are proven in isolated Preview, proposed separately for Production, backed up, executed with exact evidence and verified after deployment.
6. All automated checks, browser checks, native simulator checks and required real-device checks pass on the exact release candidate.
7. Account creation, sign-in, recovery, session expiry, sign-out and in-app account deletion work for the App Review account.
8. Privacy Policy, Terms, support information, tax/financial disclaimers and App privacy disclosures are professionally reviewed and match actual provider and data practices.
9. App Store metadata, screenshots, age rating, review notes, privacy answers, support URL, privacy URL and synthetic review account are complete and match the submitted binary.
10. TestFlight internal testing is complete, all high-severity defects are resolved and the client has explicitly approved submission.

Apple currently requires a privacy-policy link in App Store Connect and inside the app, in-app account deletion for apps that support account creation, accurate metadata, accessible review functionality and a non-expiring review account when login is required. Required metadata and a processed build must be selected before the app can be added and submitted for review.

## 2. Current verified position — 26 July 2026

### 2.1 Completed foundations

The repository already contains mature, tested foundations for:

- authenticated responsive Next.js web and mobile-web product;
- manual transactions, transaction edit, signed direction, transfers and splits;
- privacy-first CSV parsing, mapping, review, Import/Skip/Merge, duplicate detection, saved profiles and import history;
- named everyday-bank support for CommBank, ANZ, NAB and Westpac plus generic/manual mapping;
- merchant cleanup, aliases, profiles, category rules and local suggestions;
- categories and category-management foundations;
- home and personal Loan Accounts, repayment imports, principal/interest/fee breakdown and reconciliation;
- Properties, Property links, Property records and exports;
- monthly budgets, recurring suggestions and everyday insights;
- Australian financial-year Loan and Property reporting and accountant-pack foundations;
- account export, account deletion, privacy/help surfaces, Clerk authentication and owner-scoped server authorization;
- Vercel, Neon Postgres, Prisma and privacy-safe deployment foundations;
- Phase 13 architecture selection: React Native with Expo and Expo Router.

### 2.2 Preview activation stack

PRs #231–#240 implement the ordered Preview-only activation of:

- desktop bulk transaction operations and undo;
- durable transfer linking;
- import undo and one-time restore;
- manual savings goals and contributions;
- manual assets, liabilities, valuations and net-worth snapshots;
- recurring lifecycle and existing-transaction instance links;
- in-app reminders;
- explicit household sharing;
- separate read-only accountant access;
- document metadata and evidence links.

PR #241 is the consolidated QA and governance handoff. Exact head `e07644efdd6363800e6a2ec3bc6c4f028af42556` has a READY Vercel Preview deployment and passed 156 test files / 962 tests, framework verification, optimized Next.js build, lint/type validation and deployment. Remaining blockers are authenticated synthetic Preview QA and GitHub Actions execution availability; the latest GitHub job failed before producing any step or log.

### 2.3 Major unfinished areas

- ordered merge of PRs #231–#241;
- Production migration proposal, backup/restore proof and approved execution;
- remaining Australian bank and lender format coverage;
- merchant merge/history and richer administration;
- complete tax/accounting professional review and report closure;
- active invitation delivery, secure document storage, malware controls and OCR;
- optional Basiq and AI provider activation;
- Expo native project, shared packages, native feature implementation and device QA;
- push notifications, biometrics, widgets, share extension, deep links and App Intents/Shortcuts;
- commercial pricing, StoreKit subscriptions and optional web billing;
- Production monitoring, security review, support and legal readiness;
- Apple Developer/App Store Connect setup, TestFlight, metadata and submission.

## 3. Release scope — all features

This plan includes every feature in the complete-product register. A feature may be excluded from the submitted binary only through an explicit later client decision. Provider-dependent capabilities must not appear as working or be advertised until their provider, privacy, cost, environment and operational gates are complete.

### 3.1 Transactions and imports

- manual transaction create/edit/delete/restore;
- income, expense and transfer direction integrity;
- split transactions and no-double-count rules;
- transaction ledger, search, filtering, saved views and accessible details;
- safe desktop bulk category, merchant, Property and status operations with audit and undo;
- durable transfer pairing, manual link/unlink and ambiguity handling;
- privacy scanning, mapping, row review, Import/Skip/Merge, duplicate detection and import history;
- import undo and one-time restore with later-edit/link/reconciliation guards;
- all accepted Australian everyday bank formats and accepted loan-account formats;
- generic/manual fallback and safe bank-format contribution guidance;
- large-file limits, parser diagnostics, performance and recovery.

### 3.2 Merchants and categories

- cleaned merchant names;
- merchant aliases and profiles;
- local deterministic category suggestions;
- user-confirmed merchant/category rules;
- apply-to-same-merchant/history workflows;
- reversible merchant merge and history;
- category and custom-category management;
- safe archive/restore and direction compatibility;
- approved default category/Property/tax-preparation fields without automatic tax conclusions.

### 3.3 Loans, Properties, reports and tax preparation

- home, investment and personal Loan Accounts;
- repayment CSV import, correction, duplicate protection and archive/recovery;
- principal, interest, fees and balance records;
- reconciliation regardless of import order and manual match/unlink;
- Properties, Loan relationships and minimum approved metadata;
- Property-linked transaction records;
- Australian financial-year Loan and Property reports;
- everyday cashflow/category reports and drilldowns;
- accountant-ready manifest, summaries and safe exports;
- user-controlled tax-preparation classification and evidence-needed states;
- professional Australian tax/accounting review of labels, evidence and disclaimers;
- no tax filing, automatic deductibility or regulated advice.

### 3.4 Everyday finance and planning

- monthly category budgets with accepted no-rollover rules unless later changed through a financial contract;
- recurring suggestions and confirmed regular-payment lifecycle;
- due dates, expected amounts/ranges, price-change review and transaction links;
- manual savings goals and contributions;
- manual assets, liabilities, dated valuations and net-worth snapshots;
- transparent insights, trends and drilldowns;
- in-app reminders, lifecycle and user controls;
- local/push notification delivery after permission and privacy gates;
- no inferred savings progress, live valuation, forecasting or advice unless separately approved.

### 3.5 Household and accountant collaboration

- personal-by-default records;
- household creation, invitations, administrators and members;
- last-administrator, removal and leave protections;
- explicit per-record/per-report sharing and immediate revocation;
- no automatic sharing or ownership conversion;
- separate time-bounded read-only accountant grants;
- selected records/reports only;
- audit, export, deletion and cross-user isolation;
- approved invitation-delivery provider and identity-minimised messages.

### 3.6 Documents and evidence

- private owner-scoped document metadata;
- secure private object storage outside PostgreSQL;
- supported PDF/JPEG/PNG policy and bounded size limits;
- explicit links to eligible Transactions, Properties, Loans, repayments, imports and reports;
- secure upload/download authorization;
- quarantine and malware controls;
- retention, recovery, deletion propagation and export;
- missing-evidence lists and accountant-pack inclusion;
- OCR/extraction with user review and no automatic financial mutation;
- exact provider, region, cost, privacy and support boundaries.

### 3.7 Optional intelligence, included in the delivery plan

- Basiq sandbox proof and optional enhanced merchant lookup;
- local-first precedence and cleaned-description-only provider payload;
- opt-in AI category suggestions;
- natural-language search;
- plain-English explanations and anomaly suggestions;
- minimum-data payloads, authorization, prompt-injection controls, retention and cost limits;
- no silent financial changes, no tax/financial advice and full functionality when providers are off.

### 3.8 Native device features

- genuinely native iPhone UI and practical iPad adaptation;
- custom Clerk authentication and secure session treatment;
- system document picker and temporary-file cleanup;
- system save/share for exports;
- deep links;
- biometric/passcode convenience lock;
- privacy-safe local/push notifications;
- widgets with locked-device privacy controls;
- share extension;
- App Intents/Shortcuts where technically verified;
- Dynamic Type, VoiceOver, reduced motion, contrast, keyboard and pointer support.

### 3.9 Commercial and support features

- final free-versus-paid decision;
- Free, Plus, Pro and Household entitlement design where approved;
- StoreKit/App Store subscription or paid-download implementation;
- restore purchases, renewals, cancellations, billing retry, refunds and account deletion;
- optional web billing with secure webhooks if approved;
- GST, consumer-law, Terms and support review;
- no dormant purchase UI if the first release is free.

## 4. Delivery governance and autonomous operating rules

Every run and PR must:

1. Read `AGENTS.md`, this plan, `docs/CODEX_CURRENT_HANDOFF.md`, the feature register, build plan, review gates and relevant contracts.
2. Inspect merged `main`, open PRs, review threads, exact-head checks, Vercel/EAS deployments, migration state and operator blockers.
3. Resume from the latest verified state without duplicating completed work.
4. Use focused PRs with one coherent objective.
5. Include plain-English scope, privacy, security, financial, schema/provider, testing and next-step evidence.
6. Keep Production fail-closed until separately approved.
7. Use only synthetic data in repository, Preview, native development and App Store screenshots/review accounts.
8. Never commit raw CSVs, financial rows, filenames, account identifiers, secrets, certificates or signing keys.
9. Preserve integer cents, Australian dates/financial years, review-before-commit, transfer/split rules and Loan no-double-count behaviour.
10. Stop only at a genuine client/operator/professional gate; continue with all independent safe work.

## 5. Ordered master delivery sequence

# Gate 0 — Lock this plan and reconcile current control documents

## Objectives

- adopt this document as the current end-to-end execution sequence;
- update `docs/BUILD_PLAN.md`, handoff and feature register as each phase progresses;
- create a release-requirements traceability matrix mapping every feature ID to web/native/backend/schema/tests/privacy/App Store evidence;
- create a consolidated risk, decision and external-gate register;
- define `submission-ready`, `TestFlight-ready`, `Production-ready` and `client-accepted` separately.

## Deliverables

- Master Plan PR;
- release traceability matrix;
- decision/gate dashboard in Markdown;
- permanent automated-delivery prompt referencing this plan.

## Exit criteria

- no feature is omitted or described ambiguously;
- optional/provider features have explicit activation gates rather than silent deferral;
- all future PRs identify their plan item and feature-register IDs.

# Phase A — Close the current Preview activation stack

## A1. Authenticated synthetic QA

Using synthetic Preview users only:

- verify activations A–J from `PREVIEW_FOUNDATION_ACTIVATION_QA.md`;
- test two-user and three-user isolation;
- test signed-out and direct-ID/API denial;
- test Australian date boundaries and integer cents;
- test transfer exclusion and Loan no-double-count;
- test account export and deletion for every activated model;
- test mobile 390 px, desktop, keyboard, focus and accessibility;
- verify no private values in logs, audit or errors.

## A2. CI execution recovery

- diagnose GitHub Actions account/runner capacity without blind reruns;
- run one exact-head Application Verification when jobs can execute;
- require tests, typecheck, lint and optimized build on the exact head;
- preserve the READY Vercel Preview evidence.

## A3. Ordered review and merge

- self-review each PR against its parent;
- confirm no unresolved threads or drift;
- merge #231 through #241 in exact order;
- after each merge, retarget/review the next diff;
- verify merged `main` and Vercel Production still fail closed for Preview-only tables and controls.

## Exit criteria

- activation stack is merged to `main`;
- merged-main checks pass;
- Preview capabilities work with synthetic data;
- Production has not migrated or activated the new tables.

# Phase B — Production database and environment readiness

## B1. Production mapping proof

- verify Vercel Production/Preview variables are separated without revealing values;
- verify Clerk Production and development instances;
- verify Neon Production project/branch/database identity;
- verify least-privilege credentials and secret custody;
- document native development/TestFlight/Production environment mapping.

## B2. Backup and restore proof

- confirm Neon plan and point-in-time recovery capability;
- define RPO/RTO and responsible operator;
- conduct a synthetic branch/restore rehearsal;
- prove migration rollback/recovery procedure without inspecting private Production rows;
- record incident and escalation paths.

## B3. Production migration proposal

- compare exact repository migrations with Production migration history;
- produce ordered preflight and postflight checks;
- include database identity pinning, expected objects, enums, indexes and row-count-safe evidence;
- define no-reset/no-manual-SQL/no-repeat stop conditions;
- obtain explicit client approval before execution.

## B4. Approved migration and activation

After approval:

- execute migrations in repository order;
- stop on any mismatch or unresolved state;
- verify all expected objects and migration records;
- merge focused Production runtime activation PRs;
- verify export/deletion and fail-closed behaviour during partial rollout;
- confirm no data rewrite/backfill unless separately approved.

## Exit criteria

- Production schema and app runtime are aligned;
- backups and recovery are proven;
- no migration-dependent feature queries a missing table;
- every activated model is owner-scoped, exportable and deletable.

# Phase C — Complete web and backend feature parity

## C1. Transactions, saved views and audit

PR sequence:

1. transaction/saved-view contract and no-schema/browser-preference assessment;
2. saved filters/views implementation;
3. richer safe audit-history presentation;
4. desktop/mobile ledger polish;
5. financial and accessibility regression package.

Exit:

- transaction search/filter/saved-view workflows are complete on web and ready for native API reuse;
- audit displays only safe metadata;
- bulk, split, transfer and delete/restore rules reconcile.

## C2. Complete bank and loan-format coverage

- freeze target matrix for all accepted Australian banks and account/export variants;
- obtain public or synthetic format evidence only;
- add remaining named parser profiles in small batches;
- expand loan account formats and mapping diagnostics;
- add date/sign/debit-credit/header/private-field fixtures;
- add malformed, duplicate, large-file and performance tests;
- maintain generic mapping for unknown formats;
- create a safe bank-format contribution workflow that never asks for a real CSV.

Exit:

- every supported format has synthetic fixtures and exact parser evidence;
- unknown files remain safely usable through manual mapping;
- supported-bank/help/App Store wording is truthful.

## C3. Merchant and category completion

- reversible merchant merge/history contract;
- apply-to-history preview and confirmation;
- alias/profile/category rule provenance;
- default category and approved Property/tax-preparation defaults;
- conflict/correction and undo behaviour;
- Settings administration and accessibility QA.

Exit:

- merchant intelligence is deterministic, local-first, reviewable and reversible;
- no merchant rule can reverse transaction direction or silently change unrelated records.

## C4. Loan, Property and report completion

- obtain tax/accounting professional review before tax-sensitive finalization;
- decide minimum Property metadata and avoid unnecessary exact addresses;
- complete loan/property metadata and correction/history;
- finish additional lender imports;
- complete tax-preparation classification and evidence-needed states;
- add advanced Loan, Property, everyday cashflow and category reports;
- reconcile report totals to accepted source records;
- complete accountant-ready pack and document-evidence list integration;
- complete formula-safe exports and report accessibility.

Exit:

- reports reconcile across transfers, splits, refunds, deleted rows, Loan repayments and Property links;
- terminology/disclaimers are professionally approved;
- no tax advice or automatic deductibility is produced.

## C5. Advanced finance completion

- recurring expected dates/amounts and price-change review;
- lifecycle correction, pause/resume/cancel/archive/recovery;
- transaction instance link/unlink and no predicted cashflow;
- savings goal edit/contribution/removal/lifecycle polish;
- net-worth valuation dates, archive/restore and snapshot trend polish;
- transparent insights and drilldowns;
- reminder settings, deduplication, due/upcoming/overdue wording, done/dismiss and optional snooze only after schema approval;
- accessibility, timezone and financial regression.

Exit:

- all calculations are explainable and source-reconciled;
- no inferred valuation, savings movement or advice;
- in-app reminders function independently of push.

# Phase D — Collaboration and invitations

## D1. Permission hardening

- refresh household/accountant threat model;
- test invitation token hashing, expiry and single use;
- test last-administrator, removal, leave and revocation;
- confirm every share is explicit and model-specific;
- add safe audit-history UI;
- complete export/deletion/member-departure behaviour;
- prove no browser-local sharing.

## D2. Invitation provider decision and implementation

- compare provider, data region, retention, cost, deliverability and abuse controls;
- approve minimum email payload and identity fields;
- implement provider-neutral templates and adapter;
- configure Preview/Production separation and secrets only after approval;
- add retries, expiry, revoke/resend and anti-enumeration controls;
- test synthetic invitations end to end.

## D3. Accountant completion

- confirm professional wording;
- finalize selected scope, expiration, download/export and revocation;
- verify read-only routes and direct-ID denial;
- create reviewer-friendly synthetic collaboration workflows.

Exit:

- household and accountant collaboration are explicit, least-privilege, revocable, audited and supportable;
- no real invitation is sent without approval.

# Phase E — Secure documents, evidence and OCR

## E1. Provider and privacy contract

- select private object storage, region and cost controls;
- define opaque keys, signed/proxied download strategy and ownership checks;
- define PDF/JPEG/PNG and size limits;
- define quarantine, malware scanning, timeout and failed-scan behaviour;
- define retention, recovery, versioning, backup and deletion propagation;
- complete privacy/legal review.

## E2. Storage implementation

- implement disabled provider adapter and tests;
- configure isolated Preview storage;
- add upload authorization, object creation, metadata finalization and failure cleanup;
- add secure download/view, link/unlink and metadata lifecycle;
- integrate account export/deletion and household/accountant permissions;
- ensure filenames, object keys and checksums are excluded from unsafe surfaces.

## E3. Malware and abuse controls

- quarantine before availability;
- scan result state machine;
- size/type/content validation;
- rate limits and storage quotas;
- no public URL or cross-owner object access;
- incident and cleanup procedures.

## E4. OCR/extraction

- select on-device or external OCR/provider;
- define exact fields, retention, region and cost limit;
- use extracted values only as reviewable suggestions;
- never create or modify financial records automatically;
- add low-confidence, correction and provider-failure handling;
- add prompt/document injection boundaries if AI extraction is used.

Exit:

- private objects are authorized, scanned, exportable and deletable;
- retention and provider disclosures are complete;
- OCR is optional, reviewable and cannot silently mutate finance data.

# Phase F — Optional Basiq and AI intelligence

## F1. Provider decisions

- compare current terms, pricing, region, retention and training use;
- set monthly cost ceilings and fail-closed spend controls;
- approve exact minimum payloads and consent language;
- update privacy disclosures and deletion/export treatment.

## F2. Basiq sandbox and enhanced lookup

- cleaned merchant descriptor only;
- never send raw CSV, account numbers, BSB, card/customer ID, names or balances;
- local deterministic result short-circuits provider use;
- provider is fallback-only and disabled by default;
- user confirms any applied change;
- cache and deletion policy tested.

## F3. AI assistance

- opt-in category suggestions;
- bounded natural-language search;
- plain-English explanations and anomaly suggestions;
- resource-level authorization and result limits;
- prompt-injection, data-exfiltration and tool-boundary tests;
- no silent changes, tax advice or regulated financial advice;
- useful offline/provider-off fallback.

Exit:

- every external disclosure is consented, minimal, tested and cost-controlled;
- SpendGrove remains fully usable when Basiq/AI are disabled.

# Phase G — Native bootstrap and shared architecture

At bootstrap, use the current stable Expo SDK supported by the chosen toolchain and pin exact versions. As of 26 July 2026, Expo documentation lists SDK 57 as latest, using React Native 0.86, React 19.2.3, Node 22.13+ and iOS 16.4+. The bootstrap PR must re-check current official requirements before pinning.

## G1. Repository bootstrap

- create `apps/native` with Expo Router;
- add deterministic workspace/lockfile only when generated atomically;
- create `packages/domain`, `packages/api-contracts` and `packages/test-fixtures` only for proven platform-neutral code;
- prevent Prisma, Clerk server code, Node-only modules and secrets from entering the native bundle;
- add development, Preview/TestFlight and Production configuration contracts;
- add EAS configuration without credentials or submission.

## G2. Shared-domain extraction

- integer-cent money utilities;
- Australian date and financial-year utilities;
- transaction direction/category compatibility;
- split, transfer and no-double-count predicates;
- budget/report calculation contracts;
- versioned request/response schemas;
- synthetic parity fixtures;
- web/server/native parity tests.

## G3. Native shell

- SpendGrove design tokens, typography and icons;
- native tabs/navigation and deep-link map;
- loading, empty, error and offline states;
- light/dark appearance where approved;
- iPhone compact and iPad regular layout baseline;
- accessibility baseline.

## G4. Clerk authentication proof

- custom sign-in, sign-up, email verification and recovery;
- secure token cache using approved platform storage;
- session renewal, expiry, sign-out and revoked/deleted account;
- two-user owner-boundary denial;
- native Sign in with Apple when configuration is approved and required;
- sign-out cleanup of temporary files and caches.

## G5. File and export proof

- system document picker;
- bounded synthetic CSV read;
- privacy scan and temporary cleanup on success/cancel/error/sign-out;
- authenticated import API request;
- export download and system share/save;
- interrupted-network recovery;
- no filename/private content in logs.

Exit:

- the bootstrap proof passes on iPhone and iPad simulator and at least one real iPhone before broad native implementation;
- no Apple signing/TestFlight/Production data is required for repository proof.

# Phase H — Native core product implementation

Implement screen groups in dependency order, using server-authoritative APIs and shared fixtures.

## H1. Home and navigation

- beginner-first Home summary and next actions;
- secure signed-out routing;
- recent transactions, budget, recurring, Loan and reminder summaries;
- no sensitive lock-screen caching.

## H2. Transactions

- ledger/list and search/filter;
- manual create/edit;
- splits, transfers and category/Property links;
- delete/restore;
- bulk operations adapted appropriately for touch/tablet;
- safe detail/audit views.

## H3. Import Centre

- document picker;
- bank-format detection and manual mapping;
- row review, Import/Skip/Merge, duplicates and category suggestions;
- import commit progress, cancellation/error recovery;
- import history, undo and restore;
- large synthetic file performance.

## H4. Budgets, recurring, goals, net worth and reminders

- budgets and lifecycle;
- recurring suggestions and advanced lifecycle;
- transaction-instance link/unlink;
- savings goals/contributions;
- assets/liabilities/valuations/snapshots;
- insights/trends;
- reminder settings and inbox.

## H5. Loans and Properties

- Loan Account list/detail/edit;
- repayment import/history/correction;
- reconciliation suggestions/manual links;
- Property list/detail/links/records;
- Loan/Property reports and exports.

## H6. Reports, collaboration, documents and account controls

- report centre and accountant pack;
- household membership/sharing;
- accountant access;
- document metadata/upload/evidence links where active;
- optional Basiq/AI surfaces where active;
- account export, privacy/help, support and deletion.

Exit:

- every release-required web workflow has native parity or an explicitly approved native-specific alternative;
- no native-only financial formula exists without shared parity evidence.

# Phase I — Native device capabilities

## I1. Deep links

- safe route catalogue;
- signed-out redirect/return;
- authorization revalidation;
- invitation, reminder and report links;
- malformed/expired link handling.

## I2. Biometrics/passcode

- local convenience lock only;
- server session remains authoritative;
- fallback/recovery and device-change behaviour;
- no finance data in biometric storage;
- sign-out/account deletion cleanup.

## I3. Notifications

- local and remote architecture decision;
- permission education and denial fallback;
- quiet hours and opt-out;
- privacy-safe generic lock-screen text;
- token lifecycle, device removal and account deletion;
- no amount, merchant, balance, Property or Loan detail by default.

## I4. Widgets

- separate privacy contract;
- default aggregate/non-sensitive content;
- locked-device redaction;
- stale/offline state;
- sign-out/account deletion cleanup;
- no widget unless App Review metadata and privacy answers match it.

## I5. Share extension

- approved document/CSV capture only;
- explicit user confirmation;
- no background financial commit;
- temporary lifecycle and authentication;
- unsupported content handling.

## I6. App Intents and Shortcuts

- safe non-financial or review-opening actions first;
- no unconfirmed money movement or record mutation;
- authorization and locked-device behaviour;
- privacy-safe Spotlight/Siri labels.

Exit:

- each capability passes permission allowed/denied/revoked, lock-screen, sign-out, account deletion and real-device QA.

# Phase J — iPad, accessibility and performance

## J1. Adaptive layout

- compact and regular widths;
- portrait/landscape where supported;
- split-view/multitasking;
- keyboard and pointer;
- large tables/forms without clipped currency or dates;
- no horizontal overflow.

## J2. Accessibility

- Dynamic Type through accessibility sizes;
- VoiceOver labels, order and announcements;
- accessible charts and data alternatives;
- contrast, focus, touch targets and reduced motion;
- authentication, file picker, errors and destructive confirmations;
- Australian date/currency pronunciation review.

## J3. Performance and resilience

- launch and navigation responsiveness;
- large CSV review and long lists;
- memory and temporary-file cleanup;
- offline and constrained network;
- interrupted upload/download/import;
- background/foreground and session expiry;
- crash-free smoke and privacy-safe diagnostics.

Exit:

- minimum iPhone/iPad matrix and accessibility checklist pass;
- no critical performance, memory, accessibility or privacy issue remains.

# Phase K — Commercial implementation

## K1. Scope and professional decision

- free, paid download or subscription decision;
- AUD prices, plans, limits and entitlements;
- household/accountant/document/AI inclusion;
- GST, Australian Consumer Law, refunds, cancellation and Terms review;
- no feature is accidentally hidden from existing users.

## K2. Entitlement backend

- server-authoritative plan and entitlement model;
- immutable baseline and migration treatment;
- receipt/subscription event handling;
- grace, billing retry, cancellation, refund and account deletion;
- export/deletion and support tools;
- failure defaults must not corrupt finance data.

## K3. App Store purchases

- App Store Connect products;
- StoreKit purchase and restore;
- clear price/period/trial disclosures;
- sandbox and TestFlight lifecycle tests;
- App Review access to relevant flows;
- no external purchase steering contrary to current Apple rules.

## K4. Optional web billing

- provider decision and secure webhooks;
- entitlement parity and conflict handling;
- invoices/GST/refunds/support;
- App Store policy and account-management compatibility.

Exit:

- commercial lifecycle is secure, supportable and professionally reviewed; or first release is explicitly free with all dormant purchase UI removed.

# Phase L — Security, privacy, operations and legal readiness

## L1. Threat model and authorization matrix

- web/native/API/provider attack surfaces;
- account, household, accountant and document permissions;
- direct-ID, mass assignment, replay, token abuse and enumeration;
- upload/file abuse and prompt injection;
- rate limits and denial-of-service controls;
- dependency and supply-chain review.

## L2. Independent security review

- external penetration/security assessment where appropriate;
- no unresolved critical/high issue;
- remediation PRs and re-test evidence;
- signing/build compromise response.

## L3. Monitoring and alerts

- select Vercel-native or approved third party;
- redact all financial/private fields;
- errors, availability, deployment, database, storage, invitation, notification, billing and backup signals;
- alert owner/channel/severity;
- retention/region/cost controls;
- no product analytics unless separately approved.

## L4. Legal and disclosures

- Groveware legal/business/contact details;
- professionally reviewed Privacy Policy and Terms;
- tax/accounting disclaimers;
- provider and data-practice inventory;
- retention/deletion and consent withdrawal;
- support and complaints process;
- age/territory/export-compliance responses.

## L5. Operational rehearsal

- backup/restore;
- incident response;
- deployment rollback;
- provider outage/fallback;
- support escalation;
- account deletion partial failure;
- App Store rejection response and release hold.

Exit:

- security, privacy, legal, support, monitoring and recovery are approved and factually match the release candidate.

# Phase M — Full release-candidate QA and private beta

## M1. Automated exact-head suite

- unit, integration, parser, financial, ownership, privacy and API tests;
- web and native parity fixtures;
- typecheck, lint and production/native builds;
- dependency/security audits;
- migration integrity and environment checks.

## M2. Supported-bank matrix

- every everyday and Loan format;
- file-provider variants;
- dates/signs/debit-credit/header/private-field boundaries;
- unknown-format manual mapping;
- large-file and malformed-file recovery.

## M3. Financial reconciliation matrix

- income/expense/transfer;
- refunds/adjustments;
- split parent/children;
- deleted/restored rows;
- bulk operations/undo;
- transfer links;
- import undo/restore;
- Loan repayment reconciliation;
- Property links;
- budgets, recurring, goals, net worth and reports.

## M4. Privacy and lifecycle matrix

- two-/three-user isolation;
- household/accountant permissions;
- document authorization;
- provider payload minimization;
- export/deletion;
- invitation/notification/device token cleanup;
- browser-local isolation;
- no private logs/screenshots.

## M5. Browser/device matrix

- supported desktop/mobile web;
- smallest supported iPhone, standard iPhone and large iPhone;
- supported iPad compact/regular and keyboard/pointer;
- current supported iOS/iPadOS versions;
- file picker local/iCloud/provider;
- light/dark, Dynamic Type, VoiceOver and constrained network.

## M6. Private beta

- synthetic/internal accounts first;
- internal TestFlight after explicit approval;
- approved private testers only;
- structured feedback, crash and support triage;
- no real financial CSV requested through support;
- resolve every critical/high and release-blocking medium defect;
- consolidated client acceptance.

Exit:

- a single exact build is accepted as the release candidate;
- complete evidence and known limitations are recorded;
- client approves store productisation.

# Phase N — App Store productisation

## N1. Apple/operator setup

- Apple Developer individual/organization decision;
- Groveware legal identity and D-U-N-S where needed;
- Account Holder/Admin/App Manager roles;
- bundle ID, App ID and capability configuration;
- certificate/profile/signing custody;
- agreements, tax and banking where commercial distribution requires them;
- no credential in GitHub/chat.

## N2. EAS build and submission configuration

- approved Expo/EAS account and project;
- development, Preview/TestFlight and Production profiles;
- remote version/build-number management;
- credentials through secure operator tooling;
- reproducible build provenance;
- production build uses only production publishable configuration;
- EAS Submit configuration without storing Apple passwords in the repository.

## N3. App Store Connect record

- name and subtitle within current Apple limits;
- bundle ID, SKU, primary language and categories;
- age rating, territories and availability;
- price/tax category;
- privacy policy URL and support URL;
- DSA/trader and export-compliance responses as applicable.

## N4. Metadata and assets

- app icon, launch assets and device screenshots;
- app name, subtitle, description, keywords and promotional text;
- synthetic realistic accounts and no private client data;
- supported-bank and limitation wording;
- account deletion, privacy and no-advice wording;
- metadata exactly matches enabled build features;
- no dormant/provider feature advertised.

## N5. App privacy disclosures

Inventory actual practices for:

- account/contact identifiers;
- Clerk authentication;
- Vercel hosting/functions;
- Neon database;
- storage/malware/OCR provider;
- invitation provider;
- notifications;
- Basiq/AI;
- monitoring/analytics;
- billing/StoreKit;
- support.

Complete Apple privacy answers only from the final provider inventory and professionally reviewed policy.

## N6. App Review information

- contact name, email and phone;
- non-expiring synthetic username/password;
- additional household/accountant accounts where needed;
- exact setup and navigation instructions;
- explain CSV import with provided synthetic file;
- describe every new or non-obvious feature specifically;
- explain account deletion, documents, permissions, subscriptions and provider-off behaviour;
- ensure all features are accessible to review and backend services remain available.

Exit:

- App Store Connect status is Ready for Review;
- the processed release-candidate build, metadata, privacy answers and review account are complete;
- no submission has occurred without explicit approval.

# Phase O — Final submission gate

Before clicking Submit for Review, verify:

- exact native build and commit SHA;
- build processing complete with no unresolved warning/error;
- complete feature traceability and no placeholder flow;
- Production backend, database, storage, invitations, notifications, monitoring and billing are operational as represented;
- account export and in-app deletion work;
- review account and synthetic CSV/document fixtures work;
- legal/privacy/tax/security review complete;
- supported-bank, device and financial matrices complete;
- TestFlight client acceptance complete;
- support, incident and rollback owners ready;
- release method selected: manual, automatic or phased where applicable;
- explicit client approval recorded.

Submission procedure:

1. select the processed build for the iOS version;
2. complete required metadata and review information;
3. add the app version to a draft submission;
4. inspect all items in the submission;
5. click Submit for Review only after explicit client authorization;
6. monitor App Store Connect status and respond factually to App Review;
7. do not publicly release until the separate release authorization.

## 6. Proposed focused PR programme

The exact numbering will follow repository state, but the preferred order is:

1. Master plan and traceability.
2. Preview activation QA closure.
3. Ordered activation-stack merges.
4. Production environment/backup/migration proposal.
5. Production migration execution and runtime activation.
6. Saved views/audit and ledger completion.
7. Everyday-bank parser batches.
8. Loan-format batches.
9. Merchant merge/history and category defaults.
10. Tax/accounting review integration and report completion.
11. Advanced finance workflow completion.
12. Collaboration hardening and invitation provider.
13. Document storage provider and upload lifecycle.
14. Malware/quarantine and document QA.
15. OCR/extraction.
16. Basiq sandbox/enhanced lookup.
17. AI assistance and natural-language search.
18. Expo native bootstrap and shared packages.
19. Native authentication/API/file proof.
20. Native Home/Transactions.
21. Native Import Centre.
22. Native budgets/recurring/goals/net worth/reminders.
23. Native Loans/Properties/reports.
24. Native collaboration/documents/account controls.
25. Deep links and biometrics.
26. Notifications.
27. Widgets/share extension/App Intents.
28. iPad/accessibility/performance.
29. Commercial decision and StoreKit/web billing if selected.
30. Security/monitoring/legal/support.
31. Full QA and private beta.
32. App Store metadata/privacy/review package.
33. Release-candidate build and TestFlight acceptance.
34. Submission-readiness package and explicit submission gate.

## 7. External decisions and hard stops

The automation must continue independent work but stop before these actions unless explicitly approved:

- Production migration or Production data access;
- provider purchase, paid plan or secret/environment activation;
- real invitation or notification delivery;
- real document upload/provider use;
- AI/Basiq/OCR Production activation;
- Apple Developer payment/enrolment;
- bundle/App Store record reservation;
- signing credentials/certificates;
- internal TestFlight upload;
- external TestFlight invitation;
- App Store submission;
- public release;
- financial/tax/legal wording presented as professionally approved without review;
- pricing/paywall activation.

When blocked, the automation must prepare contracts, tests, adapters, runbooks, metadata worksheets, synthetic fixtures and decision packages, then continue to the next independent plan item.

## 8. Hourly automation execution algorithm

At each hourly run:

1. Read the mandatory repository source-of-truth documents and this plan.
2. Inspect `main`, open PRs, review threads, CI, Vercel/EAS status, migrations and the latest handoff.
3. Identify the earliest incomplete plan item whose dependencies and approvals are satisfied.
4. Complete the next focused slice using GitHub and hosted services only.
5. Run all available exact-head checks and inspect safe logs.
6. Self-review privacy, security, ownership, financial integrity, accessibility and scope.
7. Update the feature register, build plan, decision log, handoff and evidence.
8. Merge routine green in-scope PRs when repository authority permits.
9. Continue to the next item without waiting for routine approval.
10. Report meaningful progress, blocker, evidence and next action; do not notify when no meaningful progress is possible.

## 9. Official-current references checked for this plan

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple submit-an-app process: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/
- Apple App Review information and review account requirements: https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/
- Apple account deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app
- Apple App Store information limits: https://developer.apple.com/help/app-store-connect/reference/app-information/app-information
- Expo current SDK reference: https://docs.expo.dev/versions/latest/
- Expo EAS iOS deployment: https://docs.expo.dev/deploy/submit-to-app-stores/

## 10. Final acceptance statement

SpendGrove may be described as ready to submit for App Store review only after Phases A–N are complete for the selected release scope, all release-required features are working in the exact binary, all remaining professional/operator gates are resolved, TestFlight is accepted and explicit submission authorization is recorded.
