# SpendGrove current-to-App-Review delivery plan

Prepared: 27 July 2026  
Status: current execution companion to APP_STORE_SUBMISSION_MASTER_BUILD_PLAN.md and APP_STORE_RELEASE_TRACEABILITY_AND_GATE_DASHBOARD.md in PR #242  
Target: complete SpendGrove for submission to Apple App Review, including the selected web/backend scope, native iPhone and practical iPad application, release operations and submission evidence  
Delivery model: dependency-led; no arbitrary deadline; online development through GitHub and hosted services

## 1. Authority and scope

This plan refreshes execution order from the current repository state. It does not replace the full feature register, specification, financial rules, privacy controls, review gates or Definition of Done.

The release scope remains frozen. Preserve planned core and optional features unless the client explicitly changes scope. Manual CSV column mapping remains a first-class launch workflow, so launch does not depend on creating a dedicated parser for every Australian bank format.

This plan authorises safe repository work, synthetic testing and isolated hosted Preview work. It does not authorise Production migration or data access, paid provider activation, real invitations or documents, Apple Developer enrolment or payment, App Store record creation, signing, TestFlight upload, pricing, submission or public release.

## 2. Verified current position

### 2.1 Repository state

- Repository: LatinMaestro/SpendGrove.
- Default branch: main.
- Main remains the accepted pre-activation Production baseline.
- The active ordered delivery chain is open from PR #231 through PR #269.
- PR #242 contains the 1,064-line master build plan and release traceability dashboard.
- PRs #231–#241 contain the isolated Preview activation stack and consolidated QA handoff.
- PRs #243–#257 contain Production-readiness evidence, import-format evidence, transaction, merchant and Category completion work.
- PRs #259–#269 contain Loan, Property and everyday financial-year reporting completion work.
- Superseded parallel PRs are closed and must not be reintroduced.

### 2.2 Current exact head

- Immediate head: PR #269, bdb3c618fd303ee697c9b63f99895d084e8fe9f2.
- PR #269 adds only the deterministic everyday financial-year reconciliation JSON serializer.
- Executable source head 295986a0c077eaccbd3ee01400a9ca14db04724f passed Vercel deployment dpl_87CLnSkwbW55nsFmGhVkmkQci1mc.
- Verified baseline: 158 test files, 994 tests, TypeScript, lint, optimised Next.js build, route generation and serverless deployment.
- The final PR #269 commits add the matching Uncategorised regression assertion and evidence wording.
- One exact final-head execution remains required before PR #269 can be treated as green or route work begins.

### 2.3 Current blockers and gates

- Authenticated multi-user synthetic Preview QA remains outstanding because the connected browser tooling has not established the required Clerk sessions.
- GitHub Application Verification must execute successfully on exact heads after the dependency chain is retargeted to main. GitHub Actions capacity is expected to return on 1 August 2026.
- The deep PR stack must be reviewed, retargeted and merged in dependency order. No child PR may merge ahead of its base.
- Production remains fail-closed for migration-dependent features.
- Preview migration evidence already recorded must not be repeated without a new approved need.
- Production mapping, backup/restore, migration, providers, professional review, Apple and release actions remain separate gates.

## 3. Immediate execution queue

Complete the following in order unless an item is externally blocked, in which case continue only independent safe work.

1. Run one exact-head pipeline for PR #269 and inspect actual test, type, lint and build output.
2. If green, record permanent evidence without changing application behaviour.
3. Add the authenticated everyday financial-year report route and download-response boundary in one focused child PR.
4. Add the responsive Reports UI, source reconciliation presentation, accessible download controls and honest empty/error states in a separate child PR.
5. Upgrade the accountant pack to version 2 so the new everyday financial-year outputs are included through a deterministic manifest without weakening Property or Loan reconciliation.
6. Add a consolidated C4 regression and synthetic reconciliation package covering everyday cashflow, Loan analytical components, Property states, Category totals, formula-safe exports and owner isolation.
7. Update the current handoff, build plan, traceability dashboard and decision log with exact evidence.
8. When GitHub Actions capacity returns, execute—not repeatedly retry—the required Application Verification on the earliest dependency-ready exact head.
9. Complete authenticated synthetic Preview QA for activation areas A–J using fictional owner, household member and accountant accounts and synthetic financial data only.
10. Review, retarget and merge the open stack in strict dependency order after every required exact-head gate is satisfied.

## 4. Delivery workstreams to App Review submission

## Workstream A — Close and merge the current web/backend stack

### A1. Preview activation closure

Prove the complete PR #231–#241 activation set:

- bounded desktop bulk transaction operations and undo;
- explicit durable transfer linking and unlinking;
- future-import undo and one-time restore;
- savings goals and manual contributions;
- manual net-worth assets, liabilities, valuations and snapshots;
- recurring lifecycle and existing-transaction linking;
- in-app reminders;
- private-by-default household sharing;
- read-only accountant access;
- document metadata without file upload;
- account export and deletion coverage for every activated model;
- Production fail-closed behaviour.

Exit evidence:

- exact-head automated verification;
- authenticated synthetic cross-user, direct-ID, lifecycle and revocation QA;
- responsive and accessibility review;
- no unresolved review threads;
- ordered merge and post-merge main verification.

### A2. Planning and Production-readiness evidence

Close PRs #242–#245 after their dependencies:

- controlling App Store master plan and traceability dashboard;
- Preview/Production identity and secret-separation evidence;
- Neon backup, recovery and migration proposal evidence;
- Australian bank and Loan export format evidence;
- safe generic/manual mapping and diagnostic guidance.

No Production migration is permitted in this workstream.

### A3. Transactions, merchant and Category completion

Close PRs #246–#257:

- saved-view and audit-history contract;
- privacy-safe Activity history;
- responsive transaction search and filtering;
- mobile/desktop interaction parity;
- consolidated transaction financial and accessibility regression;
- reversible merchant merge/history contract;
- merchant suggestion provenance and conflict presentation;
- Category management archive/restore reliability;
- merchant and Category regression package.

Any durable saved-view or reversible-history schema change requires its separate migration gate. Do not infer authority from a documentation contract.

### A4. Loan, Property and reporting completion

Close PRs #259–#269 and the immediate queue in section 3:

- truthful Linked, Needs review and Unmatched reconciliation states;
- everyday Australian financial-year Money in/Money out and Category formulas;
- pure aggregation, owner-scoped service and formula-safe outputs;
- authenticated routes and download responses;
- responsive Reports UI and source drilldown boundaries;
- accountant-pack version 2;
- consolidated reporting regression evidence.

Exit criteria for Workstream A:

- all current stacked work is merged to main in order;
- post-merge main passes the full exact-head suite;
- consolidated Preview QA is accepted;
- every open limitation is mapped to a later workstream or explicit external gate;
- Production remains unchanged unless separately approved.

## Workstream B — Production environment and migration readiness

### B1. Environment mapping

Prove, without exposing secret values:

- Vercel Preview and Production project identities;
- Neon Preview and Production branches/databases;
- Clerk development and Production instances;
- release-domain mapping;
- native development, Preview and Production API configuration;
- storage, invitation, notifications, monitoring and commercial-provider separation.

### B2. Backup and recovery

- confirm available Neon backup/point-in-time recovery capability;
- agree RPO and RTO;
- perform a synthetic restore rehearsal outside Production;
- verify migration rollback or forward-repair steps;
- record owners, evidence and incident escalation.

### B3. Production migration proposal

Prepare an exact proposal containing:

- current Production schema and migration ledger evidence;
- ordered migrations and checksums;
- preflight queries and compatibility checks;
- expected lock/downtime behaviour;
- backup evidence;
- rollback or forward-repair plan;
- post-deploy smoke and reconciliation checks;
- exact approval and stop conditions.

### B4. Approved execution

Stop for explicit client approval. If approved, execute once, verify the exact Production result and preserve evidence. Do not inspect or alter real user financial content beyond approved operational checks.

Exit criteria:

- Production environments are isolated and documented;
- recovery capability is proven;
- approved migrations are applied and verified;
- migration-dependent runtime gates may be enabled only where expressly approved.

## Workstream C — Complete remaining responsive web/backend product

### C1. Everyday finance

Complete and verify:

- monthly Simple and Advanced budgets;
- budget lifecycle and truthful no-rollover behaviour unless separately approved;
- recurring/subscription management and detection;
- savings goals and contribution history;
- manual net worth and snapshots;
- reminders and notification preferences;
- dashboard, insights and Category drilldowns;
- responsive empty, loading, error and recovery states.

### C2. Transactions and imports

Complete and verify:

- manual transaction lifecycle;
- splits, transfers and no-double-count rules;
- bulk operations and undo;
- saved views if their approved persistence gate is satisfied;
- Activity history and safe audit presentation;
- generic/manual CSV mapping as launch baseline;
- CommBank, ANZ, NAB and Westpac profiles plus accepted additional evidence-backed formats;
- Loan CSV mapping and reconciliation;
- review-before-commit, Import/Skip/Merge, duplicate handling, history and undo;
- large-file, malformed-file, replay, concurrency and accessibility tests.

### C3. Merchants and categories

Complete and verify:

- merchant cleanup, aliases and profiles;
- user-confirmed categorisation rules;
- direction-compatible suggestions;
- apply-to-history preview, confirmation and reversible operation;
- merchant merge/history lifecycle;
- seeded/custom Category administration, archive and restore;
- safe Property and tax metadata only after professional wording approval.

### C4. Loans, Properties, reports and tax preparation

Complete and verify:

- Loan Accounts, repayments, principal, interest, fees and balances;
- import-first and everyday-transaction-first reconciliation;
- manual match, correction and unlink;
- Property records and Loan/Transaction links;
- Australian financial-year everyday, Loan and Property reports;
- accountant-ready export packs and reconciliation manifests;
- neutral record-keeping language;
- no unsupported deductible, taxable, yield, valuation, equity or advice claims.

### C5. Collaboration

Complete and verify:

- household creation, roles, membership and revocation;
- explicit per-record/per-report sharing;
- accountant grants, scope, expiry and read-only enforcement;
- invitation delivery only after provider approval;
- owner export/deletion and provider propagation;
- no automatic sharing or ownership conversion.

### C6. Documents and evidence

After provider approval:

- private object storage with owner-scoped authorisation;
- upload validation, malware controls, size/type limits and quarantine;
- document-to-record links and safe previews;
- retention, deletion and export propagation;
- OCR/extraction only with explicit review-before-save;
- original-source access for payment details rather than independent transcription.

### C7. Optional intelligence retained in scope

After separate provider/privacy/cost decisions:

- optional Basiq sandbox/enhanced merchant lookup without changing CSV-first operation;
- optional AI categorisation, explanations or assistance with explicit uncertainty and confirmation;
- no autonomous financial advice or silent financial-record mutation;
- complete fallback when a provider is unavailable or not selected.

Exit criteria for Workstream C:

- every release-scope feature is operational end to end or explicitly removed by client decision with no dormant UI;
- web/backend Definition of Done and traceability evidence are complete;
- owner isolation, integer cents, Australian dates/FYs, transfer/split/Loan no-double-count and privacy rules remain green.

## Workstream D — Native Expo iPhone/iPad application

### D1. Online bootstrap and architecture

- create the Expo Router project through the approved online workflow;
- establish deterministic install, lint, typecheck, test and build commands;
- configure development/Preview/Production API environments without native database or server secrets;
- extract or share domain contracts and synthetic fixtures;
- implement accessible navigation, design tokens, error boundaries and offline-aware states;
- prove Clerk native authentication, deep links, file selection and safe export sharing.

### D2. Core native parity

Implement in dependency order:

1. authentication, account controls and session lifecycle;
2. Home dashboard and navigation;
3. transaction ledger, details, create/edit/delete/restore, splits and transfers;
4. CSV Import Centre with mapping, review and commit;
5. budgets, recurring items, goals, net worth and reminders;
6. Loan Accounts, repayments and reconciliation;
7. Properties and links;
8. reports and accountant packs;
9. household/accountant collaboration;
10. documents/evidence where the provider gate is complete;
11. settings, export and in-app account deletion.

Every native screen must use server-authoritative APIs and shared financial fixtures. No Prisma, Neon credential, provider secret or signing secret may be embedded in the app.

### D3. Device capabilities

Implement and verify:

- universal/deep links;
- optional passcode and Face ID/Touch ID re-entry controls;
- local and approved remote notifications;
- privacy-safe widgets;
- share extension for approved document/import capture;
- App Intents and Shortcuts where useful;
- safe file import/export and document sharing.

### D4. iPad, accessibility and resilience

- adaptive iPhone and iPad layouts;
- keyboard and pointer support where appropriate;
- VoiceOver labels, focus order, Dynamic Type and contrast;
- minimum touch targets and reduced-motion handling;
- poor-network, expired-session, retry and conflict behaviour;
- bounded memory and launch/runtime performance;
- no sensitive content in notifications, widgets, logs or app-switcher captures.

Exit criteria:

- native feature parity is traceable to web/backend rules;
- simulator and required real-device matrices pass;
- iPhone and practical iPad support are release-ready;
- no placeholder or web-only promise appears in the submitted build.

## Workstream E — Commercial, security, legal and operations readiness

### E1. Commercial decision

Stop for the client’s free-versus-paid decision. If paid features are selected:

- define the exact entitlement model;
- implement server-authoritative entitlement checks;
- configure StoreKit/App Store purchases and restore-purchases;
- ensure required functionality is not improperly routed around Apple purchasing rules;
- add web billing only if separately approved;
- verify cancellation, grace, refund and loss-of-entitlement behaviour.

If the release is free, remove dormant paywall and purchase surfaces.

### E2. Security and privacy

- complete threat model and route/model authorisation matrix;
- scan dependencies, secrets and logs;
- test direct-ID, cross-user, privilege, upload, invitation and deletion attacks;
- obtain independent security review for release-critical surfaces;
- close or formally accept findings;
- prove encryption, retention and deletion statements.

### E3. Legal and professional review

Obtain appropriate Australian review for:

- privacy policy and collection notices;
- terms and support/refund wording;
- tax/accounting terminology and disclaimers;
- financial-information boundaries;
- collaboration and document-sharing explanations;
- App Store privacy disclosures.

### E4. Operations

- monitoring, privacy-safe alerts and incident response;
- backup/restore and disaster-recovery rehearsal;
- support, account recovery and deletion procedures;
- provider outage and credential-rotation procedures;
- release rollback/forward-fix process;
- data-retention and deletion-propagation evidence.

Exit criteria:

- no critical/high release blocker remains;
- legal, privacy, accounting and operational materials match actual behaviour;
- every provider and commercial dependency has an owner, cost, fallback and approved release state.

## Workstream F — Release candidate and private beta

### F1. Exact release-candidate suite

Run on one immutable RC:

- all unit, integration, contract, accessibility and security tests;
- TypeScript, lint and production builds;
- database migration and compatibility checks;
- browser matrix;
- iPhone/iPad simulator and real-device matrix;
- supported bank/Loan import matrix;
- financial reconciliation and no-double-count matrix;
- authentication, sharing, export and deletion lifecycle matrix;
- privacy, secret and log scans;
- provider failure and offline/poor-network tests.

### F2. Private beta

After explicit approval:

- build and upload an internal TestFlight candidate;
- invite only approved testers;
- use synthetic or deliberately authorised test data;
- triage crashes, accessibility issues and financial mismatches;
- fix findings in focused PRs and rebuild a new immutable RC;
- obtain formal release-candidate acceptance.

Exit criteria:

- exact RC evidence is complete;
- all blocking findings are closed;
- App Store metadata and review instructions describe that exact build.

## Workstream G — App Store productisation and submission

### G1. Apple operator setup

Stop for explicit client action/approval for:

- Groveware seller/legal entity decision and Apple Developer enrolment;
- App Store Connect access and roles;
- bundle identifier and capability reservation;
- certificate, signing and EAS credential custody;
- agreements, tax and banking setup where required.

### G2. App Store Connect package

Prepare and verify:

- final app name, subtitle, description, keywords and categories;
- support, marketing and privacy-policy URLs;
- age rating and content-rights answers;
- iPhone and required iPad screenshots from the exact RC;
- app icon and approved promotional assets;
- app privacy nutrition-label answers matching the data-flow inventory;
- encryption/export-compliance answers;
- pricing/availability and in-app purchase records if applicable;
- review contact, synthetic review account and precise review notes;
- account-deletion navigation instructions;
- explanation of CSV-first operation and any gated collaboration/provider features.

### G3. Submission gate

Before submission, confirm:

- exact RC build and commit are immutable and traceable;
- all automated, device, financial, privacy and lifecycle evidence is green;
- Production smoke checks pass;
- URLs, policies, screenshots, disclosures and review credentials are current;
- no placeholder, disabled promise or inaccessible feature is listed;
- no unresolved critical/high issue or professional-review condition remains;
- rollback/forward-fix and support coverage are ready.

Stop for explicit client approval to submit. Submission approval does not authorise public release after review.

Exit criteria:

- the approved RC is submitted to Apple App Review;
- submission timestamp, build number, commit, metadata version and review notes are recorded;
- review communications and any required remediation are tracked separately;
- public release remains a later explicit approval.

## 5. Cross-cutting non-negotiable rules

Every workstream must preserve:

- integer cents and checked arithmetic;
- Australian date-only and financial-year rules;
- signed transaction direction invariants;
- review-before-commit for imports and extracted information;
- transfer precedence and split-parent no-double-count;
- Loan repayment analytical components adding no duplicate everyday cashflow;
- exact owner isolation and least-data responses;
- privacy-safe logs, exports, audit history and notifications;
- complete account export and dependency-ordered deletion coverage;
- synthetic fixtures only in Git and routine hosted QA;
- online-only development; no requirement to install or run development tools on the client’s computer;
- evidence on the exact head or release candidate;
- no claim that Vercel success substitutes for every required GitHub, browser, native, professional or client gate.

## 6. Hourly automation algorithm

Each run must:

1. read AGENTS.md and mandatory repository source-of-truth documents, including the PR #242 master plan and this current-status companion until merged;
2. inspect main, the ordered open PR stack, review threads, exact-head checks, Vercel/EAS state and prior handoff;
3. identify the earliest dependency-ready item in sections 3–4;
4. complete the largest safe focused slice that fits the run without duplicating completed work;
5. test, self-review and record exact evidence;
6. merge only when the exact head and all dependency gates pass;
7. continue independent repository work around external blockers;
8. stop before any Production, provider, real-user, Apple, signing, TestFlight, pricing, submission or public-release action requiring explicit approval;
9. update handoff and plan status when the verified state materially changes;
10. report only meaningful progress, blocker and next action.

## 7. Current next action

Obtain one exact final-head execution for PR #269. If green, record the evidence and implement only the authenticated everyday financial-year report route and download-response boundary in a focused child PR. Do not start the Reports UI, accountant-pack v2 or merge work in the same slice.