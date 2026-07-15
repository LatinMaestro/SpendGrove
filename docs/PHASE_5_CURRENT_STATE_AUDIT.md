# Phase 5 Current-State Audit

Status: read-only planning audit — implementation is not authorised  
Audit date: 15 July 2026  
Repository: LatinMaestro/SpendGrove  
Audited baseline: main at 7bee32e484ce0f0dea74762ade75e832f9fa2199  
Observed Ready Production deployment: dpl_E7mtF7tM7NA82eaukRruJVn2Vh5B

## Audit constraints

This audit used repository contents, permanent delivery records, safe GitHub metadata, safe Vercel deployment/project metadata, safe Neon project/branch metadata and current official provider documentation.

It did not:

- run local development, installation, tests or builds;
- connect to a database or inspect row contents;
- inspect or print connection strings, secrets or environment values;
- access Production data;
- change code, schema, migrations, packages, providers, secrets or environments;
- start Phase 5 implementation;
- create App Store records or trigger a deployment.

## Status classifications

Every finding uses one of these classifications:

- Implemented and apparently adequate
- Implemented but needs verification
- Partially implemented
- Missing
- Intentionally deferred
- Requires client decision
- Requires external professional review

“Apparently adequate” means adequate from repository evidence, not a substitute for penetration testing, legal advice, provider-dashboard verification or live account-lifecycle testing.

## Baseline confirmation

| Item | Status | Evidence |
| --- | --- | --- |
| Phase 4 closure | Implemented and apparently adequate | Main commit 7bee32e484ce0f0dea74762ade75e832f9fa2199 is “Formally close Phase 4 milestones 1–4 (#148)”. |
| Phase 4 implementation and QA history | Implemented and apparently adequate | Permanent handoff, build plan, decision log, Phase 4 summaries and preserved deferred-testing evidence record accepted delivery through PRs #146 and #147. |
| Phase 4 milestone state | Implemented and apparently adequate | Milestones 1–4 are recorded client accepted, closed, technically verified and deployed. |
| Production deployment | Implemented and apparently adequate | Vercel deployment dpl_E7mtF7tM7NA82eaukRruJVn2Vh5B is Ready, targets Production and is associated with closure commit 7bee32e. |
| Accepted automated evidence | Implemented and apparently adequate | 101 test files / 633 tests; TypeScript, lint and optimized build passed. |
| Accepted route/visual evidence | Implemented and apparently adequate | HTTP 200 for /, /transactions and /import; desktop smoke and 390px overflow checks passed. |
| Phase 5 authority | Intentionally deferred | Current permanent records explicitly say Phase 5 is unapproved and not started. |

## Repository governance observations

| Item | Status | Finding |
| --- | --- | --- |
| Master specification | Implemented and apparently adequate | docs/SpendGrove_v2_0_Master_Specification_Completeness_Checked.docx is identified as the source of truth through docs/SPECIFICATION_SOURCE_OF_TRUTH.md. |
| Current handoff/build/decision records | Implemented and apparently adequate | These correctly record Phase 4 closure and the Phase 5 approval gate. |
| Deferred testing history | Implemented and apparently adequate | docs/DEFERRED_CLIENT_RETESTING.md preserves prior QA and final acceptance evidence. It should be retained and extended, not replaced. |
| Root PLAN.md | Partially implemented | It still describes Phase 3A as active. This is governance drift, not application behaviour. This proposal is not authorised to change it. |
| README.md | Partially implemented | It still describes the initial active phase as Phase 1. |
| AGENTS.md active-phase wording | Partially implemented | Its active-status section predates the formal Phase 4 closure. Current handoff/build/decision records are the reliable status evidence. |
| Phase 5 activation | Intentionally deferred | BUILD_PLAN and DECISION_LOG must not be changed to approved/active until client approval. |

## Current architecture and data inventory

### Application and platform

- Next.js App Router web application.
- React 18.
- Clerk authentication.
- Prisma ORM with PostgreSQL on Neon.
- Vercel deployment.
- Browser-first CSV parsing/review with server commit after authenticated review.
- No native iOS package, Capacitor, React Native, Expo or SwiftUI project was found.
- No monitoring, analytics, crash-reporting, payments, Basiq or AI provider package was found.

### User-owned durable entities

The Prisma schema contains:

- User
- UserSettings
- Category
- Transaction
- ImportBatch
- ImportRow
- BankImportProfile
- MerchantProfile
- MerchantAlias
- MerchantRule
- AuditEvent
- Property
- LoanAccount
- LoanRepayment
- LoanReconciliationLink
- PropertyTransactionLink
- PropertyReportReview
- RecurringItem
- RecurringSuggestionDismissal
- CategoryBudget

Direct User relations use owner fields and predominantly cascade on User deletion. Internal relations also use Restrict, Cascade or SetNull according to their role. This makes complete export and ordered deletion feasible, but not automatically proven safe.

### Data representation

- Money is stored as integer cents.
- Transaction and operational timestamps use database timestamps.
- Product contracts treat everyday dates and monthly periods using Australian calendar rules.
- Raw CSV files are not retained.
- Import records retain reviewed/safe structured fields and aggregate metadata, not the original file.
- Audit metadata is guarded by a safe metadata validator.
- Archived/soft-deleted lifecycle states exist across several entity types.

## Executive readiness summary

SpendGrove has a strong product foundation: accepted financial behaviour, durable owner-scoped persistence, Clerk-backed server identity, conservative CSV privacy limits, validation, safe audit conventions and substantial automated coverage.

It is not yet ready for public launch or App Store submission.

Material gaps:

1. All Next.js 14 versions are listed as affected by Vercel’s 7 May 2026 security release. The repository must move to a patched supported release before release readiness can be claimed.
2. Account export is missing.
3. In-product account deletion is missing.
4. Production database migration/schema state is not proven; permanent records say all migrations were Preview-only.
5. Vercel/Neon Preview-versus-Production database mapping needs operator verification.
6. The connected Neon branch named production was not marked protected in safe metadata.
7. Signed-out public prototype routes/browser-local behaviour require an explicit release decision.
8. Formal privacy policy, help/support safety, retention and business contact facts are not complete.
9. Security headers/CSP, rate limiting, dependency remediation, monitoring, alerting, incident response and backup-restore evidence are incomplete.
10. No iOS delivery path is selected or implemented.

Recommended release order: critical security/environment gate, account lifecycle, disclosures/support, operations, optional packaging, then private-beta QA.

# A. Release target and platform strategy

| Area | Status | Current evidence and assessment | Required next gate |
| --- | --- | --- | --- |
| Responsive web product | Implemented and apparently adequate | Phase 4 includes desktop/mobile visual work and accepted 390px overflow evidence. | Repeat against Phase 5 release candidate and browser/device matrix. |
| PWA capability | Partially implemented | A responsive web app exists, but the audit did not find a complete release-grade installability/offline/update contract. | Decide whether PWA installation is a release requirement. |
| Private-beta suitability | Partially implemented | Product behaviour is accepted, but security dependency, account lifecycle, disclosures and Production DB/operations blockers remain. | Complete Milestones 1–4 before inviting users. |
| Public web release | Intentionally deferred | No public launch approval exists. | Separate client launch approval after private-beta evidence. |
| Native iOS package | Missing | No native wrapper or app project was found. | Client selects whether Phase 5 includes packaging. |
| Packaging framework | Requires client decision | Capacitor could reuse the web UI; React Native/Expo or SwiftUI would require greater UI/platform work. Repository truth does not justify choosing one. | Decision record comparing security, auth, CSV file access, accessibility, App Store maintenance and cost. |
| iPhone/iPad | Implemented but needs verification | Web responsive evidence exists; native device behaviour, file picker, safe-area, keyboard and App Store presentation are untested. | Test only after platform decision. |
| Web-first recommendation | Requires client decision | Safest sequence is web private beta first, native packaging second. | Client approval. |

Conclusion: Phase 5 should prepare the existing web product for a controlled private beta first. iOS packaging should be a gated subprogramme, not assumed scope.

# B. Authentication and account lifecycle

| Area | Status | Current evidence and assessment | Gap or verification |
| --- | --- | --- | --- |
| Clerk integration | Implemented and apparently adequate | ClerkProvider, Clerk sign-in/sign-up components, clerkMiddleware and server auth helpers exist. | Verify Production instance/domain configuration. |
| Sign-in/sign-up | Implemented but needs verification | Prebuilt Clerk flows are wired. | Live synthetic account tests across Production-like environment. |
| Email verification | Implemented but needs verification | Clerk generally requires verification by default, but instance settings are external to the repository. | Verify “Verify at sign-up”, email domain, SPF/DKIM/DMARC and delivery. |
| Password reset/provider equivalent | Implemented but needs verification | Prebuilt Clerk flows can provide reset; no custom reset path was found. | Verify configured strategy and end-to-end delivery. |
| Session handling | Implemented but needs verification | Clerk session helpers are used. | Test expiry, revocation, multiple devices, pending session tasks and sensitive-action reverification. |
| Authenticated mutation boundary | Implemented and apparently adequate | Durable server actions call current-user context and ownership helpers. | Extend account-isolation and negative tests. |
| Server-side ownership | Implemented and apparently adequate | User ID scoping and ownership assertions are reused across product write paths. | Independent security review before beta. |
| User provisioning | Implemented and apparently adequate | Clerk identity is lazily upserted into User/UserSettings by provider user ID. | Verify duplicate/race behaviour and disabled/deleted account handling. |
| Demo/stub production identity | Implemented and apparently adequate | Current user helper is Clerk-backed; no production demo user path was found. | Continue boundary tests. |
| Signed-out public routes | Requires client decision | /, /import, /loans, /onboarding, /settings, /sign-in, /sign-up and /transactions are intentionally treated as public prototype routes. Browser-local experiences can remain visible while durable server data stays protected. | Decide whether private beta requires sign-in for finance screens or deliberately retains local-only use. |
| Resource-level route protection | Implemented but needs verification | Clerk’s current official guidance favours checks at each protected resource. SpendGrove does this for durable actions, while page routes can be public. | Verify every Server Component, Route Handler and Server Action that touches durable data. |
| Account status enforcement | Partially implemented | User has ACTIVE/DISABLED/DELETED state, but a complete release account-state contract was not found. | Define sign-in/access behaviour for disabled, deletion-pending and deleted users. |
| Strong reauthentication | Missing | No SpendGrove account export/deletion action exists. | Use Clerk reverification for sensitive lifecycle actions. |
| Account export | Missing | No user-facing complete-account export path exists. | Phase 5 Milestone 2. |
| Account deletion | Missing | No in-app deletion orchestration exists. | Phase 5 Milestone 2. |
| Clerk identity deletion coordination | Missing | Clerk supports programmatic user deletion, but SpendGrove does not coordinate it with database deletion. | Contract ordering, idempotency and partial-failure recovery. |

Clerk is not to be rebuilt. Genuine gaps are release configuration verification, route posture, account lifecycle and sensitive-action safeguards.

# C. Account data export

## Readiness classification

| Area | Status | Finding |
| --- | --- | --- |
| Complete export feature | Missing | No route/action/UI was found. |
| Owner-scoped query foundation | Implemented and apparently adequate | All durable entities have user ownership or a safe relationship path. |
| Data-format conventions | Implemented but needs verification | Integer cents and Australian date contracts exist; export schema must standardise representation. |
| Raw CSV exclusion | Implemented and apparently adequate | Original CSV bytes/files are not stored and therefore cannot be exported. |
| Safe export delivery | Missing | No generation, download, expiry or audit contract exists. |
| Schema need | Implemented but needs verification | Export is expected not to require schema changes, subject to final entity/version contract. |

## Proposed complete export scope

Include:

- User and UserSettings;
- user-owned Categories, including archived/custom state;
- Transactions, split relationships, active/deleted state, categories and safe user-visible notes/descriptions already stored;
- ImportBatch and ImportRow safe reviewed metadata;
- saved import profiles;
- merchant profiles, aliases and rules;
- Properties, LoanAccounts, LoanRepayments and reconciliation/property links;
- PropertyReportReview rows as dormant historical user data if present;
- recurring items and suggestion dismissals;
- category budgets;
- relationship IDs needed to reconstruct connections.

Formats:

- versioned JSON manifest for completeness and relations;
- CSV per suitable tabular entity;
- UTF-8;
- no formulas, hidden columns or totals;
- integer cents in JSON;
- explicitly labelled AUD decimal strings in human-readable CSV;
- ISO calendar dates and UTC ISO timestamps with an explanatory readme.

Archived/soft-deleted records:

- recommended: include them with explicit lifecycle status so “complete export” is complete;
- client must decide whether permanently erased content can ever remain in an export.

AuditEvent:

- Requires client decision and possibly legal review.
- Recommended: separate safe activity history with timestamp, event/action code and entity type; omit internal debugging details.
- Never export secrets, database identifiers not meaningful to the user, stack traces or unsafe metadata.

Privacy controls:

- strong reverification;
- fresh owner check;
- no export content in logs or audit metadata;
- no raw transaction rows passed to external services;
- content-disposition and cache controls;
- rate limit and one active export;
- synthetic isolation tests;
- clear deletion of any temporary generated artifact.

# D. Account deletion, retention and recovery

| Area | Status | Finding |
| --- | --- | --- |
| User-visible deletion | Missing | Apple requires apps that create accounts to let users initiate deletion in-app. |
| Database cascade foundation | Implemented but needs verification | Direct owner relations generally cascade, but internal constraints and external identity coordination need injected-failure testing. |
| Clerk deletion API | Implemented but needs verification | Clerk provides programmatic deletion; not integrated. |
| Reauthentication | Missing | Required for the future destructive action. |
| Grace/recovery policy | Requires client decision | No approved duration or recovery semantics. |
| Retention policy | Requires client decision and external professional review | Audit, support and legal retention facts are unsettled. |
| Backup deletion propagation | Implemented but needs verification | Neon retention/settings were not inspected. Product wording cannot promise immediate backup erasure. |
| Partial-failure recovery | Missing | No durable or operational orchestration contract exists. |
| Export-before-delete | Missing | Should be offered before final confirmation. |
| Completion confirmation | Missing | Channel, timing and safe receipt require decision. |

## Entity deletion considerations

- Clerk identity: delete or disable according to the approved order.
- User and UserSettings: root database account records.
- Transactions, splits and categories: preserve relational ordering or rely on verified cascades.
- Imports: delete safe ImportBatch/ImportRow/profile history.
- Merchants: delete profiles, aliases and rules.
- Loans/Properties: delete accounts, repayments, reconciliation and property links/reviews.
- Recurring/budgets: delete active, archived and dismissed state.
- Audit events: retain only if legally/policy justified; otherwise erase with the account.
- Backups: disclose actual provider retention and when deletion propagates.

## Required policy decisions

- immediate permanent erasure versus recoverable grace period;
- account access during grace;
- cancellation/recovery method;
- whether deletion is synchronous or queued;
- deletion order between Clerk and database;
- retention exceptions;
- deletion receipt;
- support/admin intervention;
- handling failures after one system succeeds;
- response and completion time.

Schema assessment:

- immediate synchronous deletion might use existing schema;
- pending deletion, grace period, job ledger or resumable workflow may require additive schema;
- stop before any schema/migration.

# E. Privacy policy and product disclosures

| Area | Status | Finding |
| --- | --- | --- |
| Product privacy engineering | Implemented and apparently adequate | Browser-first CSV handling, size/row limits, privacy scanning, raw-file non-retention and safe audit metadata are established. |
| Public Privacy Policy | Missing | No final policy URL/text was identified. |
| In-app privacy explanation | Partially implemented | Settings/onboarding contain plain-language privacy copy, but not a complete policy. |
| Third-party processor register | Partially implemented | Clerk, Vercel and Neon are evident; contractual regions, subprocessors and legal roles need confirmation. |
| Cookies/session disclosure | Missing | Clerk/Vercel cookie/session facts need policy input. |
| Retention/deletion disclosure | Missing | Depends on Milestone 2 decisions. |
| Analytics disclosure | Partially implemented | Settings has a non-essential analytics preference, but no analytics provider is implemented. Wording and future behaviour must reconcile. |
| Financial/tax disclaimer | Implemented and apparently adequate | Product contracts consistently avoid tax advice and retain record-keeping disclaimers where relevant. |
| Final legal wording | Requires external professional review | Development output should be a factual input pack, not legal advice. |

## Product-specific policy input checklist

Information collected or stored:

- Clerk identity data used for account authentication, including provider user ID and account email/name fields copied for provisioning;
- user settings and country/timezone defaults;
- categories and transaction records;
- reviewed/sanitised transaction description and merchant fields retained by the accepted product;
- import batch/row review metadata and safe hashes;
- merchant aliases/rules;
- Property, Loan and repayment/reconciliation records;
- recurring and budget records;
- safe audit-event codes and metadata.

Information deliberately not retained:

- original CSV file bytes;
- uploaded filenames as a durable user record;
- raw CSV rows;
- BSB, account numbers, card/customer identifiers and other fields rejected by privacy scanning;
- live-bank credentials or feeds;
- documents/receipts;
- AI prompts or financial-advice profiles;
- payment data.

Facts requiring confirmation:

- Groveware legal/controller identity, ABN/company registration, public address and contact;
- countries served and age eligibility;
- Vercel, Neon and Clerk processing locations and contractual choices;
- cookie/session list;
- log retention;
- database backup/history retention;
- export temporary storage;
- deletion times;
- support-ticket provider and retention;
- security incident contact;
- analytics decision and opt-out;
- legal basis and cross-border disclosure wording.

Apple requires a Privacy Policy URL for all apps and App Store privacy answers that include third-party partners. These disclosures must remain accurate as provider choices change.

# F. Security hardening

| Control | Status | Current evidence | Required action |
| --- | --- | --- | --- |
| User ownership/authorisation | Implemented and apparently adequate | Shared current-user and ownership helpers; owner-scoped Prisma calls; boundary tests. | Independent negative-path audit. |
| Server/client trust boundary | Implemented and apparently adequate | CSV review is client-side, but durable commit is server validated. | Verify every mutation and export/delete additions. |
| Mutation validation | Implemented and apparently adequate | Zod and server-side checks are widespread. | Extend fuzz/limit tests. |
| CSRF | Implemented but needs verification | Clerk/Next session and same-origin server-action protections may help, but no explicit project CSRF assessment exists. | Test current framework/Clerk posture; document cross-origin policy. |
| Authentication middleware | Implemented but needs verification | Clerk middleware is configured, but page routes are intentionally public and current Clerk guidance emphasises resource-level checks. | Verify all protected resources; decide public route posture. |
| Security headers/CSP | Missing | next.config.mjs only enables React strict mode; no explicit CSP/header policy was found. | Contract and add compatible headers after approval. |
| Rate limiting | Missing | No application limiter or documented Vercel WAF rules were found. | Decide Vercel WAF vs app controls; protect imports and sensitive actions. |
| CSV size/DoS controls | Implemented and apparently adequate | Browser parser enforces 5 MB and 5,000-row limits; server commit has bounded validated input. | Add abuse/concurrency tests and request-body limits. |
| Temporary file handling | Implemented and apparently adequate | CSV is read in-browser; no server temporary-file path was found. | Verify future export temp handling separately. |
| Private-field logging | Implemented and apparently adequate | Safe audit validator and privacy contracts reject raw/private content. | Inspect all error/log paths in release candidate. |
| Error response safety | Implemented but needs verification | Product actions use safe messages; no formal production error-leak audit. | Negative tests and runtime log inspection using synthetic data. |
| Secrets handling | Implemented but needs verification | Env validation and server-only DB client exist; no values are in the audit. | Dashboard scope/rotation/access review. |
| Preview/Production separation | Partially implemented | Distinct workflow secret names exist in docs, but connected Neon metadata did not prove separate branches/databases. | Operator mapping verification. |
| Prisma connection controls | Implemented but needs verification | A shared Prisma client exists. | Confirm pooled runtime URL/direct migration URL, limits and concurrency. |
| Least-privilege DB access | Implemented but needs verification | No safe metadata proved role privileges. | Verify roles without printing credentials. |
| Dependency security | Missing | Repository is on Next.js 14; Vercel states all 14.x versions are affected by May 2026 advisories and patching is the complete mitigation. | Approved upgrade to Next.js 15.5.18+ or 16.2.6+ compatible path, with full regression. |
| Lockfile posture | Implemented but needs verification | Lockfile is committed. No current vulnerability report was generated in this read-only audit. | Run approved GitHub-side dependency audit and triage. |
| Audit-event safety | Implemented and apparently adequate | Strict action/entity types and safe metadata validation. | Verify new Phase 5 actions use codes only. |
| Backup/recovery controls | Partially implemented | Neon supports PITR/snapshots, but project settings and a tested restore runbook were not verified. | Define RPO/RTO and test non-Production recovery. |
| Incident response | Missing | No complete severity/contact/runbook evidence found. | Phase 5 operations contract. |

Critical dependency finding:

Vercel’s official 7 May 2026 notice lists all Next.js 13.x and 14.x versions as affected and says patching is the only complete mitigation. SpendGrove’s accepted build used Next.js 14.2.35. This is a release blocker, not a reason to modify dependencies in this proposal PR.

# G. Monitoring, analytics and operations

| Area | Status | Finding |
| --- | --- | --- |
| Deployment status visibility | Implemented and apparently adequate | GitHub/Vercel deployment checks are used. |
| Runtime logs | Partially implemented | Vercel provides runtime logs, but retention/alerting and safe-log review are not operationally defined. |
| Application error monitoring | Missing | No approved error/crash provider or complete native alternative is configured. |
| Failed import monitoring | Partially implemented | Safe audit/import outcomes exist, but no operational alert/dashboard contract. |
| Authentication failure monitoring | Missing | Clerk dashboard capability may exist; no SpendGrove alert/runbook evidence. |
| Database availability monitoring | Partially implemented | Neon platform has monitoring, but alert ownership/settings are unverified. |
| Performance monitoring | Missing | No approved product monitoring setup. |
| Deployment failure alerts | Implemented but needs verification | GitHub/Vercel surface failures; owner and response expectations are undocumented. |
| Incident severity/response | Missing | No severity matrix, on-call owner, communications or post-incident process. |
| Backup verification | Missing | No tested recovery evidence. |
| Safe audit metadata | Implemented and apparently adequate | Existing validator is a good telemetry boundary. |
| Product analytics | Intentionally deferred | No provider is approved. |
| Analytics opt-out | Partially implemented | A preference exists, but no actual analytics integration. |
| Operational alert recipients | Requires client decision | No named operational owner or channel was approved. |

## Minimum privacy-safe operations proposal

Before beta, monitor only safe operational signals such as:

- route/action name from an allowlist;
- outcome code;
- HTTP class;
- duration bucket;
- deployment/environment ID;
- database availability category;
- import stage and aggregate row-count bucket;
- synthetic correlation ID;
- app version/commit;
- error reason code with no user content.

Never emit:

- CSV rows;
- narration;
- descriptions;
- merchant financial history;
- amount or balance values;
- filenames;
- account/BSB/card/customer identifiers;
- emails except where strictly required for an account operation;
- Loan or Property private detail;
- exact addresses;
- secrets.

Recommended initial posture:

- operational error/availability monitoring before product analytics;
- no product analytics by default until a data dictionary, retention, provider and opt-out are approved;
- use provider-native signals where sufficient to minimise data sharing;
- separate operational necessity from usage analytics.

Any provider/package/secret/environment choice is a client stop gate.

# H. Support, help and safe feedback

| Area | Status | Finding |
| --- | --- | --- |
| Support contact | Missing | No final public support contact/URL identified. |
| FAQ/help centre | Missing or partial | Product guidance exists in flows/docs, not a release-grade user help area. |
| Privacy/CSV guidance | Partially implemented | Strong internal contracts and some UI copy exist. |
| Supported-bank guidance | Partially implemented | CSV testing protocols exist internally; public supported-format guidance is incomplete. |
| Bug-report flow | Missing | No approved safe support channel. |
| Feature suggestions | Missing | No approved channel or retention policy. |
| Safe bank-format contribution | Missing | Must require synthetic samples and prohibit real statements. |
| User limitations/disclaimers | Partially implemented | No-tax-advice wording is strong; release limitations need a central help page. |
| Support ticket handling | Requires client decision | Provider, access, retention, redaction and escalation owner are unset. |

Recommended Phase 5 support scope:

- stable support URL and email/contact route;
- concise FAQ;
- CSV privacy and supported-format guidance;
- explicit “do not send real CSV files, screenshots, account numbers or transaction history” warning;
- synthetic template for bank-format issues;
- bug-report fields limited to safe app version, route, action and error code;
- published response expectations;
- escalation path for account deletion and security incidents.

Defer:

- in-app live chat;
- user-generated support attachments;
- community forums;
- external feature-voting systems;
- document uploads.

# I. App Store and release readiness

Official Apple material was reviewed on 15 July 2026.

| Area | Status | Assessment |
| --- | --- | --- |
| Packageable product | Partially implemented | Responsive web UI is strong, but no iOS package exists and native CSV/auth/file flows are unverified. |
| Delivery framework | Requires client decision | No framework is selected. |
| Apple developer identity | Requires client decision | Individual versus Groveware organisation affects identity, D‑U‑N‑S and authority requirements. |
| Privacy Policy URL | Missing | Apple requires it for all apps. |
| Support URL | Missing | App version metadata requires a support URL leading to actual contact information. |
| Account deletion | Missing | Apple requires in-app initiation for apps supporting account creation. |
| App privacy disclosures | Missing | Must cover SpendGrove and third-party partners. |
| Financial/tax claims | Implemented and apparently adequate | Current product avoids tax advice and automatic deductibility. Final listing copy still needs review. |
| Screenshots/copy | Missing | No App Store asset package; screenshots must reflect actual app. |
| Review account | Missing | Apple may require a non-expiring demo/review account and live backend. |
| Sign in with Apple | Implemented but needs verification | SpendGrove currently uses Clerk email/password, not a third-party social login in repository evidence. Apple’s own-account exception may apply. If social login is added, Guideline 4.8 must be reassessed. |
| Payments/subscriptions | Intentionally deferred | No payments are in scope. |
| iPhone/iPad presentation | Partially implemented | Responsive evidence exists; native packaging tests do not. |
| Accessibility | Implemented but needs verification | Phase 4 added accessibility coverage; App Store release requires device/assistive-technology review. |
| Placeholder/incomplete flows | Implemented but needs verification | Account export/deletion/help/privacy are definite release gaps; signed-out prototype posture also needs decision. |
| App Store submission | Intentionally deferred | Not authorised. |

Apple requirement summary:

- app creation implies in-app account deletion initiation;
- full deletion, not only deactivation, must be offered;
- reauthentication and confirmation may protect deletion but must not make it unnecessarily difficult;
- Privacy Policy URL is required;
- App privacy disclosures must include third-party partners and remain accurate;
- support URL and review information are required;
- review build must be complete, with backend available and review access;
- app metadata/screenshots must accurately reflect the product;
- organisation enrollment may require D‑U‑N‑S and authority verification.

# J. Production database and migration posture

## Repository migration inventory

1. 20260617130000_initial_schema
2. 20260622124500_phase_3b_loan_property_foundation
3. 20260702090000_phase_3c_property_transaction_link
4. 20260703090000_phase_3c_property_reporting_review
5. 20260708090000_phase_4_recurring_budgets_foundation

## Findings

| Area | Status | Finding |
| --- | --- | --- |
| Preview migration history | Implemented and apparently adequate | Permanent records document approved Preview migrations and verification, including Phase 4 foundation. |
| Production migration history | Missing | Permanent records consistently state that no Production migration has run. |
| Production schema equivalence | Implemented but needs verification | Not inspectable from a Ready deployment. No Production database connection was made. |
| Preview/Production DB mapping | Partially implemented | Workflow names distinguish Preview secrets, but safe connected metadata did not prove separate Neon branches/databases. |
| Neon branch inventory | Implemented but needs verification | Safe metadata exposed one branch named production. This does not prove Vercel mapping or actual schema. |
| Branch protection | Missing | The connected branch was reported unprotected. Client/operator should confirm plan capabilities and intended protection. |
| Dormant PropertyReportReview | Intentionally deferred | Preview-only table may remain dormant. No cleanup/drop is justified. |
| Accepted product schema | Implemented and apparently adequate | Prisma schema supports accepted Phase 3A–4 product. |
| Phase 5 schema need | Requires client decision | Deletion grace/idempotency and support/monitoring architecture may affect schema. Export likely does not. |

Critical conclusion:

The current Production schema cannot be declared sufficient from repository and deployment evidence. A Production-labelled Vercel deployment can be Ready while database-backed paths are unavailable or mapped differently.

Before any Production migration:

- verify Vercel Production and Preview environment-to-database mapping without printing URLs;
- verify Clerk environment mapping;
- capture safe migration names/status only;
- confirm no failed/unresolved migration;
- compare expected migration history;
- verify backup/restore readiness;
- review exact SQL and locking risk;
- capture safe aggregate counts only;
- use a manual GitHub Actions Production workflow with separate Production secrets and explicit confirmation;
- use prisma migrate deploy, not migrate dev/reset;
- stop on failure; no automatic retry or manual resolve;
- verify migration exactly once, constraints and safe aggregate counts;
- retain rollback/forward-fix runbook.

Prisma’s official guidance recommends migrate deploy through CI/CD for Production and warns against local Production URLs. This aligns with SpendGrove’s established online-only/manual workflow boundary.

# K. QA and private-beta readiness

| Gate | Status | Required evidence |
| --- | --- | --- |
| Full automated regression | Implemented and apparently adequate | Existing 101/633 baseline; repeat after every Phase 5 implementation PR. |
| Type/lint/build | Implemented and apparently adequate | Existing baseline; repeat. |
| Authenticated route smoke | Partially implemented | Public route HTTP checks exist; add signed-in durable route checks. |
| Mobile visual checks | Implemented and apparently adequate | 390px evidence exists; expand device/browser matrix. |
| Accessibility | Implemented but needs verification | Automated labels/overflow are not a complete assistive-technology audit. |
| Account isolation | Implemented but needs verification | Ownership tests exist; add two-user export/deletion/route tests. |
| Export testing | Missing | Complete entity, archived/deleted, format, formula, privacy and isolation tests. |
| Deletion testing | Missing | Reauth, idempotency, partial failure, recovery, Clerk/database and backup disclosure. |
| Privacy/log inspection | Partially implemented | Safe audit tests exist; inspect release telemetry and failures. |
| Failed-import testing | Implemented and apparently adequate | Strong CSV regression exists; add beta operational outcomes. |
| Backup/recovery evidence | Missing | Non-Production restore drill and runbook. |
| Browser/device support | Missing | Define Safari iOS/iPadOS, Chrome, Edge and supported versions. |
| Private-beta checklist | Missing | Audience, invitation, support, consent/disclosures, rollback and incident contacts. |
| Launch rollback plan | Missing | Deployment rollback plus database forward-fix/restore decision tree. |
| Client acceptance | Missing | Required after complete Phase 5 package. |

## Proposed private-beta QA package

- synthetic Clerk account creation, verification, reset, sign-in/out and revocation;
- signed-out route posture;
- two-user owner isolation;
- complete export reconciliation for every entity;
- archived/deleted export treatment;
- deletion from request through completion;
- injected failures before/after Clerk/database steps;
- CSV privacy scan and supported bank fixtures;
- import failure and retry;
- spending/budget/recurring/loan/Property no-regression suite;
- runtime log inspection with synthetic data;
- security headers/CSP and cross-origin tests;
- request size/rate controls;
- dependency scan;
- Vercel Preview/Production separation;
- Neon backup and restore rehearsal outside Production;
- Safari iPhone/iPad and desktop browser matrix;
- keyboard, screen reader, contrast and 390px checks;
- support and privacy content;
- private-beta incident simulation;
- deployment rollback rehearsal;
- consolidated client checklist extending docs/DEFERRED_CLIENT_RETESTING.md.

# Current official-source review

All sources below are official provider documentation and were accessed 15 July 2026.

| Source title | Provider | Requirement or risk supported |
| --- | --- | --- |
| App Review Guidelines — https://developer.apple.com/app-store/review/guidelines/ | Apple | Complete, secure, accurately represented apps; privacy responsibilities; review access; login-service rules. |
| Offering account deletion in your app — https://developer.apple.com/support/offering-account-deletion-in-your-app/ | Apple | Apps supporting account creation must let users initiate full account deletion in-app; clear confirmation and legal retention disclosure. |
| App privacy — https://developer.apple.com/help/app-store-connect/reference/app-privacy/ | Apple | Privacy Policy URL is required; privacy choices URL is optional. |
| Manage app privacy — https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy | Apple | App Store disclosures must cover the app and third-party partners and remain accurate. |
| Platform version information — https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/ | Apple | Support URL, product metadata and review account/instructions requirements. |
| Identity verification — https://developer.apple.com/help/account/membership/identity-verification | Apple | Legal identity verification; organisation enrollment may require D‑U‑N‑S and binding authority. |
| Screenshot specifications — https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/ | Apple | Current accepted screenshot sizes and device presentation requirements. |
| Protect content from unauthenticated users — https://clerk.com/docs/nextjs/guides/secure/protect-content | Clerk | Every protected resource should perform its own server-side auth check; client checks are not security boundaries. |
| clerkMiddleware — https://clerk.com/docs/reference/nextjs/clerk-middleware | Clerk | Middleware integration and authorised-parties option; resource-level protection is preferred. |
| Deploy your Clerk app to production — https://clerk.com/docs/guides/development/deployment/production | Clerk | Separate production instance/keys, domains, DNS, allowlisted redirects and production configuration. |
| Add reverification for sensitive actions — https://clerk.com/docs/guides/secure/reverification | Clerk | Account deletion is a sensitive action requiring recent strong verification. |
| Manage users — https://clerk.com/docs/guides/users/managing | Clerk | Programmatic user deletion is available through Clerk’s Backend API/SDK. |
| Email deliverability — https://clerk.com/docs/guides/development/troubleshooting/email-deliverability | Clerk | Production email domain, SPF/DKIM and recommended DMARC/deliverability checks. |
| Protected branches — https://neon.com/docs/guides/protected-branches | Neon | Protected branches resist deletion/reset and can support stronger network/password separation. |
| Security overview — https://neon.com/docs/security/security-overview | Neon | Protection, role/password and sensitive-branch considerations. |
| Development and production — https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production | Prisma | Use migrate deploy in Production/test; never use migrate dev/reset in Production; CI/CD is recommended. |
| Deploying database changes with Prisma Migrate — https://docs.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate | Prisma | Keep migration history in source control and apply through CI/CD, not local Production credentials. |
| Database connections — https://docs.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections | Prisma | Reuse PrismaClient and plan serverless pooling/concurrency. |
| Environments — https://vercel.com/docs/deployments/environments | Vercel | Preview and Production are separate deployment environments and can have distinct configuration. |
| Environment variables — https://vercel.com/docs/environment-variables | Vercel | Scope encrypted variables by environment; changes affect later deployments. |
| Deployment Protection — https://vercel.com/docs/deployment-protection | Vercel | Preview and Production access can be controlled, with plan-dependent capabilities. |
| Runtime Logs — https://vercel.com/docs/logs/runtime | Vercel | Runtime log availability and retention are plan-dependent; application log content remains the developer’s responsibility. |
| WAF Rate Limiting — https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting | Vercel | Platform request rate limits are available and may avoid an application package. |
| Next.js May 2026 security release — https://vercel.com/changelog/next-js-may-2026-security-release | Vercel/Next.js | All Next.js 13.x/14.x versions are affected; patching to a supported fixed release is the complete mitigation. |
| Content Security Policy — https://nextjs.org/docs/app/guides/content-security-policy | Next.js | CSP mitigates XSS/clickjacking/code injection and has rendering/performance trade-offs. |
| Security headers configuration — https://nextjs.org/docs/app/api-reference/config/next-config-js/headers | Next.js | Next.js can set CSP, HSTS, content-type, referrer and permissions headers. |

# Material client decisions before implementation approval

1. Web private beta first, or include iOS packaging in Phase 5.
2. Signed-out browser-local mode for the release candidate.
3. Exact supported dependency upgrade route from Next.js 14.
4. Groveware legal identity, public contact and support details.
5. Apple Developer individual or organisation enrollment.
6. Export package and audit-history treatment.
7. Immediate deletion or grace period.
8. Retention rules for audit, support and backups.
9. Clerk/database deletion ordering and completion notification.
10. Production/Preview Vercel, Clerk and Neon environment mapping.
11. Production migration workflow and approval owner.
12. Neon branch protection, backup retention, RPO and RTO.
13. Monitoring/alerting provider and alert owner.
14. Product analytics off versus approved privacy-friendly analytics.
15. Rate-limit mechanism and thresholds.
16. Support provider, attachment policy and response expectations.
17. Countries/regions and legal-review scope.
18. Custom domain, Privacy Policy URL and support URL.
19. Native framework, only if packaging is approved.
20. Private-beta audience and explicit later public-launch gate.

# Recommended first implementation milestone

After client approval, begin Phase 5 Milestone 1 — Readiness Contract, Critical Security and Environment Gate.

First actions should be:

1. approve release target and signed-out route posture;
2. approve the exact Next.js patched-major upgrade plan;
3. verify Vercel/Clerk/Neon Preview-versus-Production mapping;
4. verify safe migration metadata and backup prerequisites;
5. re-audit protected resources and owner boundaries;
6. produce a green regression/client package.

Do not begin account deletion until these foundations and the retention decisions are settled.

# Final audit statement

Phase 5 remains unapproved. No Phase 5 implementation began. No application code, schema, migration, package, lockfile, provider, secret, environment, Production data, public launch or App Store resource was changed or accessed by this audit.
