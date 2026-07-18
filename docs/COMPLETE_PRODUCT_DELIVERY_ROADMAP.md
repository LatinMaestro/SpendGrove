# Complete Product Delivery Roadmap

## Phase 15 active readiness sequence — 18 July 2026

The repository-safe Phase 15 sequence is active under `docs/PHASE_15_PRE_RELEASE_READINESS_CONTRACT.md`:

1. current-state audit and readiness contract;
2. provider-free security and pre-release indexing safeguards;
3. incident, recovery, monitoring-design, privacy-input, App Store and rollback runbooks;
4. exact-head QA and consolidated pre-release package.

This sequence does not authorise Preview or Production migrations, provider activation, native signing, TestFlight, App Store submission, real-user invitation or public launch. The six ordered migrations and every dependent runtime gate remain deferred and fail closed.


## Phase 12 contract status — 17 July 2026

The optional enrichment/AI contract is prepared in `docs/PHASE_12_OPTIONAL_ENRICHMENT_AI_CONTRACT.md`. Local rules remain first; Basiq and AI are separate opt-in fallbacks; no provider, package, credential, call, UI or financial mutation is active.


## Phase 11 repository preparation status — 17 July 2026

The storage/privacy contract, additive metadata schema, sixth unexecuted migration and guarded metadata/link service are prepared through PR #213. Runtime and provider gates remain off; no file storage, upload/download, OCR/AI or user-facing control is operational. Vercel Private Blob remains a later candidate only.


## Phase 11 contract status — 17 July 2026

The storage/privacy contract is prepared in `docs/PHASE_11_DOCUMENT_STORAGE_PRIVACY_CONTRACT.md`. It recommends Vercel Private Blob only as a later candidate, keeps file bytes out of PostgreSQL, requires private owner-authorised objects and malware/quarantine controls, and leaves all provider, upload and migration runtime disabled.


## Phase 10 repository preparation status — 17 July 2026

The contract, additive schema, fifth unexecuted migration, household service and separate read-only accountant service are prepared through PR #209. Personal ownership remains unchanged; sharing is explicit and revocable; accountant access is selected-scope and read-only. Runtime remains hard-disabled pending all five ordered Preview migrations and a later activation PR. Invitation delivery and real-user invitations remain externally gated. Phase 10 is not operational or client accepted.


## Phase 10 contract status — 17 July 2026

The privacy and permissions contract is prepared in `docs/PHASE_10_PRIVACY_PERMISSIONS_CONTRACT.md`. It freezes personal-by-default ownership, explicit selected sharing, application-owned roles, separate read-only accountant grants, hashed invitations and fail-closed migration/runtime treatment. No household/accountant capability is operational.


## Phase 9 implementation status — 17 July 2026

The financial contract, additive schema foundation and owner-scoped recurring-instance, savings-goal, manual-net-worth and in-app-reminder services are prepared through PR #204. All migration-dependent runtime remains disabled pending the four-migration isolated Preview operator gate. These foundations are not operational or client accepted. Existing budgets remain monthly/no-rollover and no forecasting, live valuation or push provider has been activated.


Status: planning baseline for review and activation  
Prepared: 17 July 2026  
Repository baseline: Phase 5 delivery through PR #164  
Release direction: complete, polished first public/App Store product; no public launch or App Store submission is authorised by this document

## Purpose

This roadmap replaces the former limited Phase 6–7 ending with a repository-truth sequence for completing SpendGrove across responsive web, desktop workflows, iPhone/iPad delivery, privacy, operations and release readiness.

It preserves completed Phase 1–5 work. Phase 5 repository delivery is technically complete but remains pending deferred client acceptance and is not formally closed.

## Delivery principles

1. Reuse the accepted shared financial and privacy rules.
2. Extend current owner-scoped models and server actions rather than rebuilding completed modules.
3. Contract financial, ownership, retention and migration rules before implementation.
4. Group related additive schema changes and prove them in Preview before any Production migration.
5. Keep browser-local prototype data isolated; never silently migrate, merge or delete it.
6. Keep local categorisation first. Basiq and AI remain optional, disabled by default and user-reviewed.
7. Keep web and native clients on shared domain rules and authenticated server boundaries.
8. Record provider cost, legal review and operator decisions before commitment.
9. Use exact-head automated verification, visual review and consolidated deferred client testing.
10. Do not publicly launch, invite real users or submit to Apple without the final release gate.

## Starting capability baseline

The repository already provides:

- responsive authenticated web shell and beginner-first visual system;
- manual transactions, split transactions and transfer-safe financial direction;
- privacy-first CSV upload, mapping, review, Import/Skip/Merge, duplicate handling, saved profiles and import history;
- named everyday-bank profiles for CommBank, ANZ, NAB and Westpac plus generic/manual mapping;
- merchant cleanup, aliases, profiles, category rules and local suggestions;
- home and personal Loan Accounts, repayment imports, breakdowns and reconciliation;
- Properties, transaction links, Property records and accepted exports;
- monthly budgets, recurring/subscription suggestions and everyday insights;
- account export, account deletion, privacy/help surfaces and authenticated route protection;
- Clerk authentication, Neon/PostgreSQL persistence, owner-scoped access and Vercel deployment;
- Next.js 15.5.20 / React 19.1.8 security baseline;
- 110 test files / 677 tests, TypeScript, lint and optimised build evidence.

## Dependency map

```text
Phase 6 desktop foundations
  -> Phase 7 import/data quality
  -> Phase 8 loans/property/reporting
  -> Phase 9 advanced personal finance

Phase 6 + stable ownership model
  -> Phase 10 household/roles/accountant access

Phase 8 reporting + Phase 10 permissions
  -> Phase 11 documents/evidence

Phase 7 local intelligence
  -> Phase 12 optional Basiq/AI

Stable web APIs and completed core modules
  -> Phase 13 native iPhone/iPad

Commercial decision + native platform decision
  -> Phase 14 commercial readiness (conditional)

All selected release features
  -> Phase 15 final security/legal/operations/TestFlight/release
```

Phases may overlap only where their schema, provider and financial dependencies are independent. A later phase must not bypass an unresolved gate from an earlier dependency.

# Phase 6 — Desktop Web Platform and Bulk Workflows

## Objective

Make the existing responsive product efficient on larger screens without weakening the mobile-first experience.

## Milestones

### 6.0 Desktop contract and interface inventory

- define desktop information density, navigation preservation and keyboard behaviour;
- inventory current responsive screens and duplicated mobile-only interaction costs;
- specify safe bulk-selection, partial-failure, audit and undo rules;
- assess schema needs for saved filters, operation history and undo.

### 6.1 Desktop shell and Import Centre

- improve wide-screen shell while retaining current destinations;
- create a coherent Import Centre from existing upload, mapping, review, profiles and history;
- add side-by-side mapping/review layouts where safe;
- preserve review-before-commit and CSV privacy scanning.

### 6.2 Transaction ledger and filters

- desktop table/ledger using existing transaction source of truth;
- sorting, month/date, category, direction, Property, Loan and review-state filters;
- keyboard-accessible row selection and details;
- saved-filter proposal only if durable state is justified.

### 6.3 Safe bulk actions

- bulk category updates;
- apply-to-same-merchant;
- safe Property linking/unlinking where cardinality allows;
- preflight counts, confirmation, per-record ownership revalidation and partial-failure reporting;
- operation audit and undo only after an exact contract.

### 6.4 Merchant, category and profile administration

- merchant profiles, aliases, rules and merge management;
- category/custom-category management;
- saved import-profile management;
- history and correction workflows.

### 6.5 Reports and account administration consolidation

- desktop access to existing Property reports, account export/deletion, privacy and advanced management;
- no new calculations in this milestone;
- prepare extension points for Phase 8 reports.

### 6.6 QA and client package

- mobile non-regression, desktop viewport matrix, keyboard/accessibility, ownership and financial-integrity checks.

## Schema expectation

6.1–6.2 should prefer no schema change. Saved filters, operation history or undo may require additive owner-scoped models and must pass a separate schema/migration contract before implementation.

## Exit criteria

Desktop users can import, review, find and safely update large record sets without losing mobile usability, ownership controls, auditability or review-before-commit.

# Phase 7 — Import Coverage, Merchant Intelligence and Data Quality

## Objective

Complete target-bank coverage and make imports faster, safer and more correct using deterministic local intelligence.

## Milestones

### 7.0 Import and data-quality contract

- publish target-bank/account matrix and fixture standard;
- define confidence, parser fallback, transfer-pair, undo and merchant-merge rules;
- document supported versus generic-only formats.

### 7.1 Everyday-bank parser coverage

- add tested profiles for the remaining accepted Australian target banks;
- maintain synthetic fixtures and boundary cases for dates, signs, debit/credit columns, headers and privacy fields;
- retain generic/manual mapping for unknown formats.

### 7.2 Loan and account-format coverage

- expand accepted loan formats and samples;
- improve mapping diagnostics without retaining raw files;
- add safe sample-template guidance.

### 7.3 Transfer detection and linking

- preserve current transfer financial treatment;
- propose owner-scoped transfer-pair/link model if durable pairing is required;
- require one-to-one high-confidence rules, ambiguity handling and unlink/correction paths.

### 7.4 Import undo and recovery

- define eligible time/state boundaries;
- reverse only records created by the target committed batch;
- protect merged, subsequently edited, linked or reconciled records;
- retain idempotency and audit evidence.

### 7.5 Merchant intelligence completion

- strengthen profiles, aliases, deterministic normalization and rule learning;
- add user-reviewed merge and apply-to-history workflows;
- support default category and, only after Phase 8 rules, optional Property/tax defaults;
- report rule provenance in safe plain language without raw narration.

### 7.6 Parser quality and QA

- bank regression matrix, mutation/fuzz boundaries, large-file limits, import performance and error recovery.

## Schema expectation

Parser profiles and fixtures need no schema. Durable transfer links, import undo, richer merchant defaults or merge history likely need additive schema and Preview migration gates.

## Exit criteria

Every supported bank format has synthetic regression evidence, unknown formats retain safe manual mapping, imports are recoverable under explicit rules, and merchant intelligence remains local-first and reviewable.

# Phase 8 — Loans, Properties, Tax and Accountant-Ready Reporting Completion

## Objective

Complete Australian record-keeping and accountant-ready workflows without providing tax advice.

## Milestones

### 8.0 Financial/reporting contract and professional review gate

- define Property/Loan source-of-truth, EOFY boundaries, allocation limits, disclaimer language and report reconciliation;
- obtain external Australian tax/accounting review for terminology and report requirements before tax-sensitive implementation.

### 8.1 Loan and Property data completeness

- assess remaining metadata for ownership, acquisition, account identifiers stored safely, loan purposes and Property management;
- complete correction/history workflows and additional supported loan imports.

### 8.2 Tax-preparation classifications

- user-controlled record-keeping categories/flags only;
- no automatic deductibility or tax conclusions;
- clear unresolved-review and evidence-needed states.

### 8.3 Advanced reports and exports

- EOFY Property reports;
- loan/interest summaries;
- category and cashflow reports;
- reconciled export totals and accepted columns;
- integer cents and Australian date/financial-year boundaries.

### 8.4 Accountant-ready packs

- selected-period export bundle;
- report manifest, reconciliation summary and document-evidence checklist;
- no accountant login yet.

### 8.5 Reporting QA

- independent reconciliation fixtures, split/refund/transfer/loan no-double-count evidence and export compatibility checks.

## Schema expectation

Likely additive Property, classification, report-review and evidence-reference fields/models. Exact changes require a contract and Preview migration. Existing PropertyReportReview structures should be reused where appropriate.

## Exit criteria

All reports reconcile to accepted transaction sources, disclaimers are professionally reviewed, exports are accountant-usable, and no tax advice or duplicate cashflow is introduced.

# Phase 9 — Advanced Personal Finance Experience

## Objective

Complete day-to-day planning, recurring management, reminders, trends and net-worth foundations.

## Milestones

### 9.0 Advanced-finance rules contract

- recurring lifecycle/cadence extensions;
- budget periods/rollover decision;
- forecasting and savings-goal boundaries;
- liability/account/net-worth valuation rules;
- notification and reminder semantics.

### 9.1 Recurring and subscription completion

- richer lifecycle such as paused/cancelled where approved;
- due-date review, price-change detection and correction;
- no payment movement or biller contact.

### 9.2 Budget refinement and goals

- approved periods and correction workflows;
- optional goals only after exact contribution/progress rules;
- preserve existing refund limitation unless separately changed.

### 9.3 Insights, trends and advanced reports

- transparent formulas, drilldowns and calm wording;
- no regulated financial advice;
- no hidden AI.

### 9.4 Net worth and liabilities

- explicit assets, accounts, liabilities and snapshots;
- user-entered values and clear valuation dates;
- Properties/Loans integrated without inventing valuations;
- no market-data provider unless separately approved.

### 9.5 Reminders and notifications foundation

- in-app reminders first;
- external/push delivery only after platform/provider/permission decisions;
- user control, quiet hours, opt-out and no private notification text.

### 9.6 QA

- formula reconciliation, timezone/date boundaries, notification privacy and accessibility.

## Schema expectation

Additive models are expected for goals, assets/liabilities/snapshots, reminder schedules and expanded recurring states. Migrations must be grouped and gated.

## Exit criteria

Every advanced metric is explainable and reconcilable, reminders are controlled and private, and net worth uses explicit user-owned values rather than inferred advice.

# Phase 10 — Household, Roles and Accountant Collaboration

## Objective

Add explicit, revocable sharing without leaking private records or browser-local data.

## Milestones

### 10.0 Ownership and sharing contract

- household membership, administrator/member roles, invitation lifecycle;
- private/shared record boundaries and migration treatment for existing owner records;
- accountant read-only scope and revocation.

### 10.1 Household foundation

- household/workspace models, invitations and role enforcement;
- existing records remain private until deliberately shared.

### 10.2 Shared finance workflows

- selected shared accounts, transactions, budgets, Properties and reports;
- conflict handling and clear ownership labels.

### 10.3 Accountant access

- read-only selected reports/records by default;
- time-bounded access, revocation and audit history;
- no access to unrelated private records or raw import data.

### 10.4 Permission QA

- multi-user isolation, invitation abuse, revocation, session expiry, export/deletion and audit tests.

## Schema expectation

Major additive ownership/permission migration. This is a high-risk gate requiring threat modelling, migration treatment for every existing model and explicit client decisions.

## Exit criteria

Sharing is explicit, least-privilege, revocable, audited and proven against cross-user leakage.

# Phase 11 — Documents, Receipts and Evidence Management

## Objective

Securely manage user evidence and report attachments.

## Milestones

### 11.0 Storage/privacy/provider contract

- provider and cost;
- ownership, encryption, file limits/types, malware controls;
- upload/download authorization;
- retention, deletion, backups and export;
- support-channel prohibition for real financial documents.

### 11.1 Document foundation

- owner-scoped metadata and secure object storage;
- receipts, Property documents, loan statements and report evidence.

### 11.2 Linking and evidence workflows

- link documents to eligible records without changing financial calculations;
- missing-evidence lists and accountant-pack inclusion.

### 11.3 Optional OCR assessment

- separate privacy, accuracy, provider/cost and user-confirmation gate;
- never silently change financial records from extraction.

### 11.4 QA

- file authorization, malicious-file controls, deletion/export and retention verification.

## Schema expectation

New document/link models plus a storage provider and secrets. No implementation until those decisions are approved.

## Exit criteria

Every object is owner-authorized, exportable and deletable; retention and provider disclosures are complete; OCR remains optional and reviewable.

# Phase 12 — Optional Merchant Enrichment and AI

## Objective

Add optional enhancement only after deterministic local workflows are complete.

## Milestones

### 12.0 Provider, cost and privacy decision

- compare local/low-cost approaches;
- approve exact providers, regions, retention, terms, pricing and disclosures;
- define opt-in/opt-out and deletion/export obligations.

### 12.1 Basiq sandbox proof

- cleaned descriptors only;
- no full CSV, account numbers, BSBs, card/customer IDs, names or balances;
- local suggestion always wins; fallback only; user review required.

### 12.2 Enhanced merchant lookup

- disabled by default;
- caching and retention contract;
- Production enablement requires a later explicit approval.

### 12.3 AI categorisation and assistance

- opt-in suggestions, natural-language search and explanations;
- minimum approved data;
- no silent financial changes, tax advice or regulated financial advice;
- clearly labelled output and user confirmation.

### 12.4 QA

- privacy payload tests, provider failure/offline fallback, prompt-injection boundaries, cost controls and deletion/export checks.

## Schema expectation

Provider result/cache/consent/audit models may be needed. Provider, package, secret and environment approvals are mandatory.

## Exit criteria

The product remains fully useful with enhancements off; every enhancement is opt-in, reviewable, privacy-bounded and cost-controlled.

# Phase 13 — Native iPhone/iPad Application and App Store Productisation

## Objective

Deliver a polished iPhone application and practical iPad experience using shared SpendGrove domain rules.

## Milestones

### 13.0 Platform decision and proof

- compare Capacitor, React Native/Expo and SwiftUI against reuse, performance, Clerk, CSV file access, exports, notifications, widgets, biometrics, accessibility, review risk, maintenance and cost;
- run only an approved proof after the decision gate;
- record the chosen architecture and shared-code boundary.

### 13.1 Native foundation

- account authentication and secure session storage;
- API/ownership boundary reuse;
- native navigation, theming, deep links and signed-out flows.

### 13.2 Native core modules

- Transactions, Import, Budgets, Regular payments, Loans, Properties, reports and account controls;
- secure file picker and export/share flows;
- no raw file retention beyond the approved temporary lifecycle.

### 13.3 Device capabilities

- notifications, biometrics/passcode, widgets or share extension only where approved;
- permission prompts and privacy-safe content.

### 13.4 iPad and accessibility

- adaptive layouts, keyboard/pointer support, Dynamic Type, VoiceOver, contrast and orientation checks.

### 13.5 Store productisation

- icons, launch assets, screenshots, metadata, privacy nutrition labels, support/privacy URLs, review account and account-deletion flow;
- no submission yet.

## Platform posture

The existing web investment makes Capacitor the highest-reuse candidate. Expo/React Native may offer a stronger long-term native component and device-feature model. SwiftUI offers maximum Apple-native control with the highest duplication cost. The platform must be chosen after an explicit proof-and-decision gate; this roadmap does not select a framework.

## Exit criteria

The release candidate works on supported iPhone/iPad devices, shares accepted server/domain rules, passes accessibility and privacy checks, and is ready for TestFlight without yet being publicly submitted.

# Phase 14 — Commercial and Subscription Readiness (conditional)

## Objective

Implement commercial access only if the client selects paid plans for the first release.

## Milestones

- pricing, entitlements and free/paid boundary contract;
- Apple in-app purchase and web billing policy decision;
- payment provider and cost decision;
- purchase, restore, renewal, cancellation and refund lifecycle;
- customer support, receipts, GST/tax professional review;
- entitlement security and failure recovery;
- sandbox/TestFlight verification.

## Schema/provider expectation

Entitlement/subscription models, Apple StoreKit/App Store Connect and possibly a web payment provider. Live prices, provider accounts, credentials and activation remain hard operator gates.

## Exit criteria

Only applicable if commercial launch is approved. Otherwise record a free first release and defer Phase 14 without leaving dormant purchase UI.

# Phase 15 — Final Security, Legal, Operational and Release QA

## Objective

Prove the complete selected product is safe, supportable and releasable.

## Milestones

### 15.0 Production environment and migration gate

- Clerk Production configuration;
- Preview/Production separation;
- safe migration history, backups and restore rehearsal;
- least-privilege database controls.

### 15.1 Security and privacy

- threat model, dependency review, authorization test matrix, rate limits, upload abuse controls, headers/CSP and safe logs;
- independent penetration/security review where appropriate.

### 15.2 Legal and support

- professionally reviewed Privacy Policy, Terms and financial/tax disclaimers;
- Groveware legal/contact details, support process, FAQ and safe feedback.

### 15.3 Monitoring and incident readiness

- approved privacy-safe provider/configuration;
- errors, availability, deployment, backup and incident alerts;
- runbooks, severity, response and rollback.

### 15.4 Complete QA and private beta

- full automated regression;
- supported-bank matrix;
- report reconciliation;
- account isolation, export/deletion, household permissions, documents and optional-provider tests;
- browser/device/accessibility matrix;
- client consolidated review.

### 15.5 TestFlight and release gate

- signed build, App Store metadata/privacy disclosures and review account;
- TestFlight acceptance;
- launch/rollback plans;
- explicit client approval before submission or public launch.

## Exit criteria

All selected release-required phases are complete; no high-severity security issue or placeholder core flow remains; migrations, backups, privacy/legal, support, accessibility, financial reconciliation and device evidence are approved.

# Cross-phase PR rules

Every implementation milestone uses:

1. contract and impact assessment;
2. schema/provider/environment gate where applicable;
3. focused implementation PRs;
4. exact-head automated checks;
5. meaningful Preview and visual/browser verification;
6. merged-main verification;
7. permanent evidence and deferred-client checklist update.

No PR may hide a financial-rule change inside presentation, migration or provider work.

# Mandatory hard stops

Stop before:

- provider purchase/upgrade or secret exposure;
- destructive Production schema work, reset or manual migration resolution;
- private Production financial-row access;
- Production backfill/rewrite without a separately approved contract;
- browser-local data deletion or automatic account migration;
- settled financial-rule changes without a new contract;
- live Basiq, paid AI, live payments or published prices;
- real-user invitations, public launch or App Store submission;
- implementation outside this merged roadmap.

# Complete-product release definition

The first App Store release is eligible for final approval only when:

- every selected release feature is complete and no placeholder core screen remains;
- supported imports pass the documented regression matrix;
- all financial reports reconcile;
- account export and deletion work;
- ownership, household/accountant permissions and document access are verified;
- Production authentication/environment separation, migrations, backups and recovery are proven;
- privacy/legal materials have professional review;
- accessibility and iPhone/iPad/browser/device testing are complete;
- selected optional providers are disclosed, controlled and tested;
- App Store assets, privacy disclosures and review account are complete;
- final client review and TestFlight acceptance are complete;
- launch and rollback plans are explicitly approved.

## Activation recommendation

After this planning baseline is merged, activate Phase 6 Milestone 6.0. Its first PR should be documentation and interface-contract work only, followed by no-schema desktop shell and Import Centre improvements. Durable saved filters, bulk-operation history and undo remain separate schema gates.

## Phase 8 delivery note — 17 July 2026

The independently safe existing-schema portion of Phase 8 is delivered through PR #197:

- responsive authenticated Report Centre;
- Loan financial-year summaries and CSV;
- Property financial-year summaries using the accepted linked-record source;
- versioned accountant preparation manifest/readme and individual existing exports.

No schema or migration was required. Tax-sensitive conclusions remain excluded pending qualified professional review. The separate Phase 6/7 Preview migration gate remains deferred and all affected runtime features remain disabled. Phase 9 may proceed only after its financial contract is merged.

## Phase 9 contract activation note — 17 July 2026

Phase 9 repository work is governed by `docs/PHASE_9_FINANCIAL_CONTRACT.md`.

The contract freezes:

- actual Transaction direction and no-double-count rules;
- existing recurring detector thresholds;
- monthly budgets with no rollover;
- manual-only savings contributions;
- manual-only net-worth values and explicit snapshots;
- deterministic non-advisory insights;
- in-app reminders with remote push disabled;
- additive schema and fail-closed runtime preparation behind the ordered Preview migration gate.

No Phase 9 migration or runtime activation is authorised by the contract itself.


## Phase 12 repository-preparation note — 17 July 2026

Phase 12 contract and disabled adapter preparation is delivered through PR #216.

Delivered repository boundaries:

- deterministic local merchant suggestions always short-circuit optional enrichment;
- optional enrichment receives only cleaned, bounded context and cannot determine transfers;
- optional assistance accepts only typed, bounded, read-only requests and allowlisted search plans;
- every categorisation result remains user-confirmed;
- both runtime gates are hard false;
- no provider, SDK, route, UI, persistence, package, secret, environment or financial mutation exists.

Exact-head verification passed 141 test files / 864 tests, TypeScript, lint and optimized production build. Vercel was blocked by the account build-rate limit rather than an application failure; no redundant deployment was triggered.

Phase 12 adds no schema or migration. Provider/model selection, commercial terms, privacy and retention review, secure configuration, sandbox/evaluation evidence and focused activation PRs remain later gates. Production activation is not authorised.


## Phase 13 architecture activation note — 17 July 2026

React Native with Expo and Expo Router is selected for SpendGrove's native iPhone/iPad client. The evidence, candidate comparison and safety boundary are in `docs/PHASE_13_NATIVE_ARCHITECTURE_DECISION.md`.

The Next.js web product remains independently deployed. Native work will consume authenticated versioned server endpoints and share only platform-neutral TypeScript contracts, calculations and synthetic parity fixtures. It will not import Prisma/server modules or silently migrate browser-local data.

The next Phase 13 milestone is a focused bootstrap proof. Apple enrolment/payment, bundle identifiers, signing, EAS/provider configuration, TestFlight, App Store records, real-user distribution and public launch remain hard gates. Capacitor remains a fallback and SwiftUI remains an escalation path if a mandatory Expo capability fails objective proof.


## Phase 14 commercial contract note — 17 July 2026

The provider-neutral commercial boundary is defined in `docs/PHASE_14_COMMERCIAL_READINESS_CONTRACT.md`.

Free, Plus, Pro and Household are planning names only. No price, numeric limit, provider, checkout, paywall, billing schema, App Store product or Production activation exists. Every currently accepted capability remains available under the current baseline.

The next independently safe work is a hard-disabled entitlement resolver with no provider implementation and tests proving that existing product behaviour is unchanged. Commercial activation still requires exact pricing, plan contents, Apple/web treatment, provider selection, legal/GST/refund/support review and separate schema/environment/Production gates.


## Phase 14 repository-preparation completion — 18 July 2026

Phase 14 contract and hard-disabled entitlement preparation is delivered through PR #220.

The authenticated immutable baseline preserves every accepted capability, keeps all limits undecided and describes guarded future capabilities as runtime unavailable rather than paywalled. Exact-head verification passed 142 test files / 873 tests, TypeScript, lint and optimized production build; the Vercel Preview was successful.

No user-facing commercial behaviour, provider, price, checkout, billing record, schema, migration, package, secret, environment or Production access exists. Commercial activation remains dependent on the unresolved decisions and external reviews in `docs/REMAINING_CLIENT_AND_OPERATOR_DECISIONS.md`.
