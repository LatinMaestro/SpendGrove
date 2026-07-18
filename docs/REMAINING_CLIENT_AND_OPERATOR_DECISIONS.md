# Remaining Client and Operator Decisions

## Phase 15 release and operations gates — 18 July 2026

Open client/operator decisions:

- complete GitHub Preview-secret reauthentication and preserve the retained isolated Neon Preview mapping;
- run the six ordered Preview migrations individually with synthetic-only evidence;
- prove Production Vercel, Clerk and Neon mapping without exposing values;
- confirm Neon Production plan, history retention, branch protection, RPO/RTO and restore authority;
- select incident owner, support contact, security contact and alert channel;
- decide whether existing Vercel/provider-native controls are sufficient for rate limiting and monitoring;
- provide Groveware legal/business and contact facts;
- obtain privacy/legal, tax/accounting and external security review;
- approve native dependency/bootstrap tooling, Apple Developer enrolment, signing and TestFlight only through later gates;
- decide free versus paid release, prices, limits, providers and Apple/web billing before commercial activation;
- explicitly approve any real-user invitation, TestFlight upload, App Store submission and public launch.

Prepared runbooks:

- `docs/SECURITY_INCIDENT_RESPONSE_RUNBOOK.md`;
- `docs/BACKUP_RESTORE_REHEARSAL_RUNBOOK.md`;
- `docs/MONITORING_AND_ALERTING_DESIGN.md`;
- `docs/PRIVACY_FACTUAL_DISCLOSURE_PACK.md`;
- `docs/APP_STORE_METADATA_AND_PRIVACY_WORKSHEET.md`;
- `docs/TESTFLIGHT_LAUNCH_ROLLBACK_RUNBOOK.md`;
- `docs/PRODUCTION_RELEASE_CHECKLIST.md`.

No provider, plan, secret, environment, migration, Apple action or release is activated by these documents.


## Phase 11 storage/operator decisions — 17 July 2026

Repository preparation is complete for owner-scoped document metadata and explicit evidence links. The following remain external gates:

- run the sixth Preview migration only after the preceding five ordered migrations pass;
- select a private object-storage provider and region/data-location posture;
- approve expected limits, costs and spend controls;
- approve any provider SDK/package and OIDC/secret/environment treatment;
- establish Preview/Production storage separation;
- approve malware scanning/quarantine controls;
- decide retention/recovery duration, backups and deletion propagation;
- complete privacy/legal review;
- approve focused runtime and real-upload activation.

No provider, store, package, secret, environment variable, upload, cost or Production migration is implied by the prepared service.


## Phase 10 operator and activation decisions — 17 July 2026

Repository preparation is complete for personal-by-default household sharing and separate read-only accountant access. The following remain external gates:

- execute the fifth Preview migration only after the preceding four ordered migrations pass;
- verify all five foundations with synthetic Preview regression;
- approve and configure an invitation-delivery provider before any real invitation is sent;
- decide the minimum identity/contact fields permitted for delivery;
- complete professional review of accountant-role wording where required;
- approve a focused runtime activation PR after Preview verification;
- separately approve any Production migration.

No provider, secret, environment mutation, real-user invitation, Production migration or runtime activation is implied by the prepared services.


## Phase 9 decision update — 17 July 2026

The merged Phase 9 financial contract resolves the repository implementation defaults for D-020 through D-023:

- budgets remain monthly with no rollover and unchanged refund treatment;
- savings goals use manual planning contributions only, with no inferred progress or forecast;
- net worth uses manual values and explicit snapshots only, with no live valuation provider;
- reminders are in-app only; remote push remains an activation/provider decision.

The fourth ordered Preview migration and runtime activation remain operator gates. These defaults do not approve remote push, live valuation, forecasting, provider spend or Production migration.


Prepared: 17 July 2026  
Scope: decisions that cannot be safely inferred or completed by repository work alone

## Decision classes

- Hard gate: implementation cannot begin safely.
- Activation gate: repository/sandbox work may proceed, but live use cannot.
- Release gate: implementation may complete, but release cannot proceed.
- Professional review: an appropriately qualified external reviewer is required.
- Operator action: requires dashboard, credential or legal-account access outside GitHub.

No secret value, connection string, private financial content or provider credential belongs in this document, GitHub, chat or test evidence.

# 1. Immediate roadmap decisions

## D-001 Complete-product release selection

Class: Release scope.

Decision needed:

- confirm which optional features are mandatory in the first App Store release versus complete but disabled/deferrable;
- specifically Basiq, AI, OCR, widgets, accountant access, savings goals and commercial subscriptions.

Current safe assumption:

- roadmap and contracts include every planned option;
- a provider-dependent option is not activated without a later approval;
- no dormant or misleading UI ships.

Needed by: before each optional phase activation and finally before Phase 15 scope freeze.

## D-002 Phase 6 bulk-operation persistence

Class: Hard schema gate.

Decision needed after Milestone 6.0 audit:

- whether saved filters are durable account preferences or browser-only;
- whether bulk changes require a durable operation journal;
- exact undo window and which subsequent edits/links make undo unavailable.

Needed by: Phase 6.2–6.3 schema contract.

# 2. Import, merchant and reporting decisions

## D-010 Target-bank format evidence

Class: Operator/client evidence.

Need:

- confirm priority order for the 15 named banks not yet backed by explicit named profiles;
- provide synthetic or fully de-identified format characteristics, never real customer CSVs;
- confirm account types and export variants to support.

Safe operator checklist:

1. In each bank’s export UI, note header names, date format and whether amount is signed or debit/credit columns.
2. Replace all rows with synthetic values.
3. Remove filenames, account numbers, BSBs, names and reference identifiers.
4. Commit only approved synthetic fixtures.

Needed by: Phase 7.1.

## D-011 Import undo semantics

Class: Hard financial gate.

Decide:

- time/state limit;
- treatment of merged rows;
- treatment after edit, split, Property link, merchant learning or Loan reconciliation;
- whether learned rules created during the import are undone;
- audit retention.

Needed by: Phase 7.4.

## D-012 Transfer-pair confidence

Class: Hard financial gate.

Decide exact one-to-one evidence, ambiguity rules, date window, account requirements, manual override and unlink behaviour. Duplicate scoring must remain separate.

Needed by: Phase 7.3.

## D-013 Tax and accountant terminology

Class: Professional review.

Need an Australian tax/accounting professional to review:

- EOFY boundaries and report labels;
- record-keeping versus advice wording;
- Property/loan report fields;
- evidence lists and accountant pack;
- deductible/tax-sensitive classifications;
- disclaimer placement.

No automatic deductibility, filing or tax conclusion is implied.

Needed by: Phase 8.0 before tax-sensitive implementation.

## D-014 Property metadata privacy

Class: Hard data-minimization gate.

Decide whether the product truly needs:

- exact address;
- ownership percentage;
- acquisition/disposal dates and values;
- agent/tenant information;
- loan-purpose metadata.

Prefer safe nicknames and minimum fields. Exact addresses require a separate privacy assessment.

Needed by: Phase 8.1.

# 3. Advanced finance decisions

## D-020 Budget periods and rollover

Class: Hard financial gate.

Decide:

- retain monthly-only/no rollover;
- add weekly/fortnightly/annual;
- rollover formula, edits and historical recalculation;
- treatment of refunds and adjustments.

Needed by: Phase 9.0.

## D-021 Savings goals and forecasting

Class: Hard financial/product gate.

Decide:

- whether savings goals are required at first release;
- manual target/contribution only versus inferred progress;
- forecast horizon and transparent assumptions;
- permitted wording and no-advice boundary.

Needed by: Phase 9.0–9.2.

## D-022 Net-worth valuation

Class: Hard financial gate.

Decide:

- manual values only versus external market data;
- valuation date and stale-value presentation;
- Property values, loan balances and ownership percentages;
- snapshot frequency and corrections;
- treatment of shared assets later.

Recommended safe first implementation: user-entered values with explicit “as at” dates and no valuation advice/provider.

Needed by: Phase 9.4.

## D-023 Reminder and notification semantics

Class: Hard privacy/product gate.

Decide:

- which events may create reminders;
- in-app versus local/push;
- timezone, quiet hours, snooze and opt-out;
- lock-screen content;
- notification provider/cost if remote push is required.

Needed by: Phase 9.5 and Phase 13.3.

# 4. Household and accountant decisions

## D-030 Household ownership model

Class: Major hard schema/privacy gate.

Decide:

- household administrator powers;
- member invitation and removal;
- which records can be private, shared or household-owned;
- whether sharing is per record, account or module;
- treatment of existing owner-only records;
- household export/deletion and member departure;
- age/minor eligibility if relevant.

Recommended: keep all existing records private to their owner; sharing is explicit and granular; no automatic conversion.

Needed by: Phase 10.0.

## D-031 Identity/organization implementation

Class: Provider/architecture gate.

Decide whether to use:

- application-owned household/membership models with Clerk identities; or
- an approved Clerk organization capability.

Assess plan availability, pricing, role flexibility, deletion/export and vendor dependency before choosing.

Needed by: Phase 10.0.

## D-032 Accountant access scope

Class: Hard privacy/professional gate.

Decide:

- selected reports only versus selected records;
- default access period;
- ability to download/export;
- whether comments/requests are allowed;
- invitation identity requirements;
- audit and revocation;
- professional disclaimers.

Recommended: read-only, selected scope, time-bounded and revocable.

Needed by: Phase 10.3.

# 5. Documents and OCR decisions

## D-040 Document storage provider

Class: Hard provider/cost/security gate.

Decide provider after comparing:

- region/data residency;
- encryption and access controls;
- signed URL/server proxy model;
- file-size/type limits;
- malware scanning;
- backups/versioning;
- deletion propagation;
- egress/storage cost;
- availability under current Vercel/Neon plans.

No storage provider, package, secret or environment variable is approved yet.

Needed by: Phase 11.0.

## D-041 Retention and deletion

Class: Legal/privacy gate.

Decide:

- default retention;
- deleted-item recovery period;
- permanent deletion schedule;
- backup propagation;
- household/accountant-linked document treatment;
- account deletion behaviour;
- export format.

Needed by: Phase 11.0.

## D-042 OCR provider and scope

Class: Optional provider/privacy/cost gate.

Decide:

- whether OCR is included at first release;
- on-device/local versus external extraction;
- supported document types;
- data region/retention;
- cost limit;
- user confirmation and correction;
- prohibition on automatic financial changes.

Needed by: Phase 11.3.

# 6. Basiq and AI decisions

## D-050 Basiq sandbox

Class: Optional provider/commercial activation gate.

Before sandbox work:

- approve developer/provider account;
- confirm current pricing and terms;
- approve exact cleaned-description payload;
- approve retention/cache rules and privacy disclosure;
- confirm sandbox credentials can be configured securely.

Before Production:

- separate explicit approval;
- Production pricing and contract;
- App privacy disclosure;
- fallback-only/local-first evidence.

Needed by: Phase 12.1/12.2.

## D-051 AI provider/model

Class: Optional provider/cost/privacy gate.

Decide:

- local/on-device/low-cost approach first;
- approved provider/model/region;
- payload fields;
- retention/training settings;
- monthly cost ceiling;
- opt-in and deletion/export;
- age/consumer disclosures;
- no-advice and user-confirmation rules.

No paid AI provider may be activated without approval.

Needed by: Phase 12.0/12.3.

## D-052 Natural-language search boundary

Class: Privacy/security gate.

Decide:

- local query parsing versus external model;
- whether transaction-level private text ever leaves SpendGrove;
- supported query types;
- authorization and result limits;
- no-answer/ambiguity behaviour;
- audit/log policy.

Needed by: Phase 12.3.

# 7. Native and Apple decisions

## D-060 Native framework — resolved 17 July 2026

Class: Resolved repository architecture decision.

Decision:

- React Native with Expo and Expo Router is selected.
- Keep Next.js web independently deployed.
- Use authenticated versioned server APIs and share only platform-neutral TypeScript.
- Capacitor remains a fallback; SwiftUI remains an escalation path for discrete Apple-only needs.
- Custom Clerk Expo flows are planned; beta prebuilt native views are not the sole release path.

Evidence: `docs/PHASE_13_NATIVE_ARCHITECTURE_DECISION.md`.

Still gated: deterministic package/lockfile bootstrap, native proof, EAS/provider configuration, Apple identity/payment, signing, TestFlight and App Store actions.

## D-061 Apple developer identity

Class: Operator/commercial gate.

Confirm:

- individual versus organization enrollment;
- Groveware legal entity;
- D-U-N-S status;
- legal address/contact;
- membership payment approval;
- App Store Connect account holder/admin roles;
- credential/signing custody.

Never place certificates, private keys or secrets in GitHub/chat.

Needed by: before signed native builds/App Store records.

## D-062 Bundle/product metadata

Class: Client/brand gate.

Approve:

- final app name/subtitle;
- bundle identifier;
- seller/developer display;
- categories, age rating and territories;
- support URL/privacy URL;
- screenshot copy and synthetic demo content.

Needed by: Phase 13.5.

## D-063 Device features

Class: Optional privacy/product gate.

Approve separately:

- biometrics/passcode;
- push notifications;
- widgets;
- deep links;
- share extension;
- App Intents/Shortcuts.

Needed by: Phase 13.3.

## D-064 TestFlight and submission

Class: Hard operator/release gates.

Separate approvals:

1. upload internal TestFlight build;
2. invite external testers/real users;
3. submit for App Review;
4. release publicly.

Current state: none authorised.

# 8. Commercial decisions

## D-070 Free versus paid first release

Class: Major commercial gate.

Decide:

- free complete product;
- free tier plus subscription;
- paid download;
- trial;
- which modules, if any, are entitled.

No price or paywall is authorised.

Needed by: before Phase 14 activation and App Store metadata.

## D-071 Pricing and entitlement matrix

Class: Commercial/legal gate.

Approve:

- AUD prices;
- monthly/annual plans;
- free/paid features;
- household/accountant entitlements;
- trial/introductory offers;
- existing-user treatment;
- restore purchases;
- refunds and cancellation support.

Needed by: Phase 14.

## D-072 Web billing provider

Class: Provider/cost/secret gate.

If web billing is required, compare providers, fees, Australian support, tax/GST, webhook security, refunds and App Store policy interaction.

Needed by: Phase 14.

## D-073 Commercial professional review

Class: Professional review.

Need accounting/legal review for:

- GST/tax invoicing;
- consumer law/refunds;
- subscription disclosures;
- Terms;
- support obligations.

Needed by: Phase 14/15.

# 9. Security, operations and support decisions

## D-080 Monitoring/error provider

Class: Provider/privacy/cost gate.

Decide:

- Vercel-native versus third-party;
- error/performance scope;
- data redaction;
- retention/region;
- alerts/on-call owner;
- cost and plan.

Prohibited event content includes raw CSV, narration, merchant financial history, amounts, balances, account references, Property/loan details, filenames and unnecessary email.

Needed by: Phase 15.3.

## D-081 Analytics

Class: Optional privacy gate.

Current state: off.

If later approved, decide:

- whether product analytics is needed;
- privacy-friendly provider;
- aggregate event catalogue;
- opt-out;
- retention;
- no financial content.

Needed by: optional Phase 15.3. It may remain off at launch.

## D-082 Firewall/rate-limit plan

Class: Provider/plan gate.

Decide based on available Vercel plan capabilities:

- platform rules versus application limits;
- CSV/import endpoint limits;
- auth/account lifecycle abuse;
- cost/upgrade implications;
- compensating controls if paid features are unavailable.

Needed by: Phase 15.1.

## D-083 Backup/restore capability

Class: Operator/provider gate.

Safely verify:

- Neon plan;
- point-in-time recovery window;
- branch protection;
- restore/branch rehearsal process;
- responsible operator and evidence retention.

No Production row inspection is required.

Needed by: Phase 15.0.

## D-084 Support contact and handling

Class: Client/legal/operator gate.

Approve:

- Groveware support identity and contact;
- response expectations;
- ticket provider or email workflow;
- retention and deletion;
- escalation/incident path;
- warning against real CSVs, statements and screenshots.

Needed by: Phase 15.2.

## D-085 Incident ownership

Class: Operator gate.

Name roles for:

- security/privacy incident;
- service outage;
- database recovery;
- compromised provider credentials;
- App Store issue;
- user data request.

Needed by: Phase 15.3.

# 10. Professional review register

| Review | Why required | Earliest gate |
|---|---|---|
| Australian tax/accounting | EOFY, Property/loan reports, accountant packs, no-advice wording | Phase 8.0 |
| Privacy/legal | Privacy Policy, Terms, retention, providers, household/documents/AI | Phases 10–15 |
| Consumer/commercial | pricing, subscriptions, refunds, GST and support | Phase 14 |
| Security/penetration | final authorization, documents, household, native and providers | Phase 15.1 |
| Accessibility | complete web/native/device experience | Phase 15.4 |
| App Store compliance | metadata, privacy, deletion, payment and review posture | Phase 13.5/15.5 |

Generated repository drafts are implementation inputs, not final professional advice.

# 11. Operator checklist pattern

For every unavailable dashboard action, record only:

- provider/dashboard name;
- field or setting to inspect;
- safe characteristic to compare;
- expected non-secret result;
- date and operator;
- evidence link that contains no secret/private value.

Never copy:

- secret values;
- connection strings;
- private keys;
- raw database rows;
- customer emails;
- financial records;
- real CSVs;
- account/BSB/card identifiers.

# 12. Current decision posture

Approved now:

- complete-product roadmap planning;
- merging a clean documentation planning PR;
- activating the first implementation phase after governance update;
- online repository implementation within the merged roadmap and safety gates.

Not approved now:

- provider purchase/upgrade;
- secrets/environment mutation;
- Production migration/data access/backfill;
- native framework commitment;
- Apple membership/App Store records/TestFlight/public submission;
- live Basiq/AI/payments;
- prices or real-user invitations.

This register must be updated when a decision is made; historical entries should be preserved rather than silently rewritten.

## Phase 8 delivery status — professional review remains

Repository-safe Phase 8 reporting is complete through PR #197. The Report Centre, Loan reporting, Property reporting and accountant preparation pack use existing owner-scoped records and neutral wording.

D-013 remains open for a qualified Australian tax/accounting professional to review:

- final EOFY and report labels;
- Property and Loan component presentation;
- evidence expectations;
- accountant-pack wording and disclaimer placement;
- any future tax-sensitive grouping.

Until that review, SpendGrove must not claim deductibility, tax-return readiness, claimable amounts or professional accounting conclusions. This is a professional-review gate, not a blocker to unrelated repository work.


## Phase 12 activation decisions remain open — 17 July 2026

Repository preparation is complete through PR #216, but no optional provider is selected or operational.

Before optional merchant enrichment can be activated, the client/operator must separately approve:

- exact provider and account;
- sandbox and Production commercial terms, quotas and cost ceiling;
- permitted cleaned-description payload and retention/cache rules;
- privacy and App Store disclosures;
- secure environment configuration;
- synthetic sandbox evidence and focused runtime-activation PR.

Before optional AI assistance can be activated, the client/operator must separately approve:

- exact provider/model and region;
- pricing and spend controls;
- request catalogue and minimum-data policy;
- retention, training, deletion/export and incident treatment;
- evaluation criteria and failure behaviour;
- secure environment configuration and focused runtime-activation PR.

The current runtime constants remain false. No provider credential should be entered and no service should be activated from this documentation state. These open decisions do not block unrelated repository preparation.


## Phase 14 contract status — 18 July 2026

Free, Plus, Pro and Household are now reserved as planning names only. This does not resolve D-070 through D-073.

Still required before any commercial activation:

- whether the first release is free or paid;
- exact feature matrix and numeric limits;
- AUD monthly/annual pricing, trials and grandfathering;
- App Store and web purchase equivalence;
- web billing provider, if any;
- StoreKit products and server reconciliation;
- cancellation, refunds, support and downgrade treatment;
- GST, consumer-law and subscription-disclosure review;
- secure provider/package/secret/environment and durable-schema approvals.

Until those decisions are complete, the accepted product remains unpaywalled and no price, checkout, provider call or billing record may exist.
