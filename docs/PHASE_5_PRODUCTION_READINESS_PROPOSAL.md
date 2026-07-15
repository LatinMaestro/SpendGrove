# Phase 5 Production Readiness Proposal

Status: proposal only — implementation is not authorised  
Prepared: 15 July 2026  
Repository baseline: main at 7bee32e484ce0f0dea74762ade75e832f9fa2199  
Production deployment observed Ready: dpl_E7mtF7tM7NA82eaukRruJVn2Vh5B

## Authority and scope of this document

This document proposes a safe Phase 5 programme. It does not approve Phase 5, start implementation, authorise a public launch, authorise an App Store submission, or authorise access to or changes in Production data.

The master SpendGrove specification remains the source of truth. Phase 4 Milestones 1–4 are accepted, closed, technically verified and deployed. Phase 5 requires a separate client approval and must begin with decisions and contracts before application changes.

## Objective

Prepare SpendGrove for a controlled private beta and, after a separate platform decision, for a possible public web release and/or iOS App Store pathway.

Phase 5 should close genuine release-readiness gaps without rebuilding capabilities already delivered in Phase 3A–4. In particular, it should preserve the existing Clerk authentication, server-side user provisioning, owner-scoped durable persistence, privacy-first CSV handling, transaction sign/type integrity, financial rules and no-double-count behaviour.

## Intended user value

A user should be able to trust that:

- their account is protected and belongs only to them;
- they can obtain a complete, understandable copy of their SpendGrove data;
- they can request deletion of their account and associated data through a clear, safeguarded flow;
- SpendGrove accurately explains what it collects, what it deliberately does not collect and which processors it uses;
- support channels do not encourage disclosure of real bank files or private financial details;
- failures can be detected and handled without collecting sensitive financial content;
- the product has a tested recovery, incident and release process;
- any App Store listing accurately represents the product and its privacy practices.

## Current release posture

SpendGrove is a technically verified responsive Next.js web application deployed through Vercel. The accepted Phase 4 baseline records 101 test files and 633 passing tests, successful TypeScript, lint and optimized production build checks, HTTP 200 checks for /, /transactions and /import, desktop route smoke coverage and a 390px overflow check.

That evidence supports continued controlled review. It does not establish public-release readiness.

Current posture:

- Responsive web product: implemented and deployed.
- Production-labelled Vercel deployment: Ready.
- Phase 4 product behaviour: client accepted and closed.
- Public launch: not approved.
- App Store submission: not approved and no native packaging path has been selected.
- Account export: missing.
- In-product account deletion: missing.
- Final privacy policy, support URL and legal disclosures: missing or awaiting client/professional input.
- Monitoring, alerting and incident operations: not approved and not implemented as a complete operational system.
- Production database migration posture: unresolved. Repository evidence records all Prisma migrations as Preview-only and no Production migration. A Ready web deployment is not evidence that the Production database schema matches the accepted application schema.
- Dependency security: requires immediate Phase 5 attention. The repository uses Next.js 14. Vercel’s 7 May 2026 security release states that all Next.js 13.x and 14.x versions are affected by the listed advisories and recommends upgrading to a patched release.
- Signed-out experience: public prototype routes and browser-local behaviour remain available. The release posture for those routes requires an explicit decision; durable server reads and writes are independently authenticated and owner-scoped.
- Environment mapping: requires operator verification. Connected metadata exposed only one Neon branch named production and did not establish which Vercel environment points to which database. No database content was inspected.

Recommendation: do not describe the current deployment as public-beta ready until the Next.js security upgrade, account lifecycle, privacy/support, Production database/environment mapping and minimum operations gates are complete.

## Proposed Phase 5 boundaries

### In scope

- final production-readiness contract and risk register;
- release-target and platform decision;
- account data export;
- account deletion, retention, recovery and Clerk/database coordination;
- privacy-policy fact pack and professionally reviewed public wording;
- in-product privacy, help and support disclosures;
- dependency and configuration security hardening;
- authentication and ownership verification rather than authentication replacement;
- safe request limits and abuse/denial-of-service controls;
- safe logging and error-response verification;
- Preview/Production environment and database mapping verification;
- Production migration planning and approval gates, but no migration without explicit approval;
- backup and recovery verification;
- monitoring, alerting and privacy-friendly analytics decisions;
- incident-response and release runbooks;
- web private-beta readiness;
- iOS delivery-path decision and App Store readiness planning;
- private-beta QA and client acceptance.

### Explicitly out of scope unless separately approved

- rebuilding authentication;
- public launch;
- App Store submission or TestFlight distribution;
- choosing or implementing Capacitor, React Native, Expo, SwiftUI or another packaging approach before a client decision;
- payments, subscriptions or paywalls;
- Basiq or live bank linking;
- AI;
- household mode;
- document or receipt storage;
- tax advice, automatic deductibility or ATO integration;
- Property profit, yield, valuation, equity or net-worth features;
- unrelated feature work;
- Production data access, rewrite or backfill without an exact approved operation;
- analytics, monitoring or support providers before provider and privacy approval;
- final legal advice generated by the development process.

## Recommended milestone structure

The six-milestone shape in the master specification is sound, with two amendments:

1. Put the dependency-security and environment/database release blockers into Milestone 1 rather than waiting for general operational hardening.
2. Make the web private-beta gate explicit before any iOS packaging work. This avoids selecting a native framework before account lifecycle, privacy and backend release controls are stable.

### Phase 5 Milestone 1 — Readiness Contract, Critical Security and Environment Gate

Objective: turn this proposal into an approved implementation contract and close blockers that invalidate later release evidence.

Proposed PR sequence:

- PR 5.0 — Final Phase 5 contract, release target, decision register and threat model.
- PR 5.1 — Dependency-security upgrade plan, including the Next.js patched-major path and compatibility assessment. Stop before package changes until the exact dependency PR is approved.
- PR 5.2 — Focused dependency/security upgrade and regression evidence, after approval.
- PR 5.3 — Preview/Production environment and database mapping contract, migration inventory, safe metadata checks and recovery prerequisites.
- PR 5.4 — Authentication, signed-out route and ownership verification package; no Clerk rebuild.
- PR 5.5 — Milestone QA and client gate.

Dependencies:

- PR 5.0 must precede all implementation.
- PR 5.1 must identify exact package and lockfile changes; those changes require client approval under the existing stop rules.
- No Production migration may run in this milestone without a separate exact-file approval.
- Public/private beta claims must wait for PRs 5.2–5.5.

Client review gate:

- approve the release target;
- approve or reject signed-out browser-local operation for release;
- approve exact dependency changes;
- verify environment/database mapping;
- confirm no unresolved high-severity dependency or authorization blocker.

### Phase 5 Milestone 2 — User Data Export and Account Deletion

Objective: give users control over their complete SpendGrove account data and provide a safe, verifiable deletion lifecycle.

Proposed PR sequence:

- PR 5.6 — Export/deletion/retention contract and entity register.
- PR 5.7 — Schema and migration assessment only.
- PR 5.8 — Account export implementation.
- PR 5.9 — Account deletion orchestration and recovery safeguards, only after retention decisions and any migration gate.
- PR 5.10 — Failure recovery, idempotency, privacy and account-isolation tests.
- PR 5.11 — Client QA package.

Dependencies:

- client decisions on immediate deletion versus grace period, audit retention, backup retention, export format and deletion notifications;
- Clerk production configuration verification;
- exact Production schema/migration status;
- professional review of retention obligations where necessary.

Likely implementation posture:

- Export can probably be implemented without schema changes.
- Immediate permanent deletion may be possible with existing owner relations and cascades, but must not be assumed safe until ordered-deletion, Clerk coordination and audit-retention tests are complete.
- A grace period, pending-deletion state, deletion job/idempotency record or recovery workflow may require additive schema. If so, stop after exact schema and migration files are proposed.
- No historical data rewrite or backfill is proposed.

Client review gate:

- synthetic complete-account export;
- archived/deleted record treatment;
- export-before-deletion;
- strong reauthentication;
- partial-failure recovery;
- account isolation;
- Clerk identity and database record outcomes;
- backup-retention disclosure.

### Phase 5 Milestone 3 — Privacy, Help and User-Facing Release Disclosures

Objective: give users accurate, understandable privacy, support and limitation information based on verified product facts.

Proposed PR sequence:

- PR 5.12 — Product privacy fact sheet and legal-review input pack.
- PR 5.13 — Client-approved business identity, contact, retention and processor decisions.
- PR 5.14 — Professionally reviewed Privacy Policy and Terms integration.
- PR 5.15 — Help, CSV safety, supported-bank guidance, FAQ and safe feedback flow.
- PR 5.16 — Disclaimer, accessibility and client QA package.

Dependencies:

- Groveware legal entity/controller details;
- support contact and response owner;
- approved retention/deletion policy;
- confirmed provider regions, subprocessors and contractual posture;
- external legal review.

Client review gate:

- every statement reconciles with actual code/provider configuration;
- no claim that raw CSV is stored;
- no request for real CSV files or financial screenshots in support;
- financial/tax disclaimers remain accurate;
- App Store privacy facts can be derived from the same register.

### Phase 5 Milestone 4 — Security and Operational Hardening

Objective: establish minimum controls and runbooks for a private beta without collecting sensitive financial content in telemetry.

Proposed PR sequence:

- PR 5.17 — Security test plan and findings register.
- PR 5.18 — Security headers/CSP and error-response hardening.
- PR 5.19 — Rate-limit and CSV abuse-control implementation.
- PR 5.20 — Monitoring/alerting provider decision document.
- PR 5.21 — Approved minimum monitoring and safe-event implementation, if authorised.
- PR 5.22 — Backup/restore drill, incident-response and operations runbooks.
- PR 5.23 — Security and operations client gate.

Dependencies:

- exact package/provider/secret/environment approval where needed;
- approved telemetry data dictionary;
- alert recipient and response owner;
- verified backup retention and restore capability;
- environment/database mapping.

Client review gate:

- no raw CSV, narration, merchant history, amounts, balances, identifiers, filenames, email or Property/loan private details in telemetry except an email strictly required for account operations;
- tested request limits;
- security headers and Clerk compatibility;
- alert routing and incident severity;
- evidence of restore rehearsal using non-Production-safe procedures;
- dependency audit and remediation status.

### Phase 5 Milestone 5 — App Store and Platform Packaging Readiness

Objective: decide the delivery path and prepare a compliant package plan without submitting an app.

Proposed PR sequence:

- PR 5.24 — Web-only versus iOS packaging decision record.
- PR 5.25 — Candidate evaluation for Capacitor, React Native/Expo, SwiftUI or another approved path.
- PR 5.26 — Exact packaging foundation plan, package/provider/secret implications and prototype gate.
- PR 5.27 — App Store metadata, privacy labels, support/privacy URLs, review-account and screenshot plan.
- PR 5.28 — iPhone/iPad/accessibility packaging QA plan.
- PR 5.29 — Client decision gate; no submission.

Dependencies:

- web private-beta backend readiness;
- account deletion;
- final privacy/support URLs;
- Groveware developer identity and Apple Developer Program status;
- legal and branding decisions;
- explicit framework approval.

Recommendation: prepare and release-gate the web product first. Begin native packaging only after the client selects the target and accepts the ongoing maintenance trade-off. No framework is selected by this proposal.

### Phase 5 Milestone 6 — Private Beta QA and Phase Closure

Objective: prove the complete release candidate under realistic, privacy-safe conditions.

Proposed PR sequence:

- PR 5.30 — Final regression and device/browser matrix.
- PR 5.31 — Authenticated end-to-end, isolation, export/deletion and failed-import QA.
- PR 5.32 — Security/privacy/log and backup/recovery evidence.
- PR 5.33 — Private-beta release and rollback runbook.
- PR 5.34 — Consolidated client testing package.
- PR 5.35 — Closure records only after explicit client acceptance.

Dependencies:

- all prior milestone gates;
- no unresolved critical/high release blocker;
- client test accounts and synthetic datasets;
- approved private-beta audience and support process.

No public launch or App Store submission is implied by Phase 5 closure unless separately and explicitly approved.

## Cross-PR dependency map

1. Release/platform decisions and risk register.
2. Critical dependency security and environment/database mapping.
3. Account export/deletion contract and any schema gate.
4. Privacy/legal facts based on the final account lifecycle and provider map.
5. Security operations and monitoring based on the approved data dictionary.
6. Platform packaging decision based on a stable backend and public disclosures.
7. Private-beta QA and client acceptance.

No later PR may bypass an unresolved earlier stop condition.

## Data export proposal

The complete export should be owner-scoped, generated only after strong authentication and delivered without logging its contents.

Recommended package:

- a JSON manifest preserving entity relationships, stable record IDs, statuses and timestamps;
- human-readable CSV files by entity where tabular representation is useful;
- UTF-8, no spreadsheet formulas, no hidden or summary rows;
- integer cents represented as integers in JSON and clearly labelled decimal AUD values only at human-readable boundaries;
- Australian dates represented as ISO date strings where the product treats them as calendar dates; timestamps represented as UTC ISO 8601 with timezone explanation;
- a versioned export schema and generated-at timestamp;
- archived and soft-deleted records included with explicit status by default so the export is complete;
- raw CSV files excluded because SpendGrove deliberately does not store them;
- no secrets, database connection data, internal stack traces or provider credentials.

Entity scope should cover the authenticated user’s User and UserSettings records and all owner-scoped Category, Transaction, ImportBatch, ImportRow, BankImportProfile, MerchantProfile, MerchantAlias, MerchantRule, Property, LoanAccount, LoanRepayment, LoanReconciliationLink, PropertyTransactionLink, PropertyReportReview, RecurringItem, RecurringSuggestionDismissal and CategoryBudget records.

AuditEvent treatment requires a client/legal decision:

- recommended default: include a separate limited security/activity history using safe event codes and timestamps, not internal debugging metadata;
- exclude provider secrets, raw request data and any metadata that does not pass the established audit safety boundary;
- document any retained audit data that is not exported and why.

## Account deletion proposal

Required safeguards:

- clear in-account entry point;
- strong Clerk reverification plus a second explicit destructive confirmation;
- export-before-deletion option;
- owner revalidation immediately before destructive work;
- idempotent server-side orchestration;
- coordinated handling of Clerk identity and database records;
- defined ordering and compensation for partial failure;
- no client-only deletion authority;
- safe status/reason codes only;
- user notification of timing and completion;
- no false claim that backups disappear immediately when provider retention says otherwise.

Decisions required before design:

- immediate erasure or recoverable grace period;
- whether access is disabled at request time;
- grace-period duration and cancellation method;
- audit-event retention and legal basis;
- backup retention and deletion propagation;
- whether support can intervene;
- treatment of failed deletion after Clerk deletion or database deletion;
- whether a deletion receipt is retained and, if so, in what non-identifying form.

Recommended safety principle: do not delete the Clerk identity first unless the database operation is designed to remain safely resumable without an interactive session. The exact order must be fixed in the contract and tested with injected failures.

## Schema and migration assessment

Planning conclusion:

- This proposal changes no schema and runs no migration.
- Account export is expected to require no schema change.
- Account deletion may require no schema change only if the approved policy is immediate, synchronous and safely idempotent with existing relations.
- A grace period, pending-deletion lifecycle, deletion job ledger, completion receipt or resumable orchestration may require additive schema.
- Monitoring and analytics should not use the product database unless explicitly justified and approved.
- Support content can be static; an in-app ticket system would require separate product and schema approval.
- Native packaging should not require product-database schema changes by itself.

Production posture:

- Repository migration history contains five migrations through the Phase 4 recurring/budget foundation.
- Permanent records state that these migrations were applied to Preview only and no Production migration has run.
- The current Production schema was not inspected and cannot be declared sufficient.
- Before any Production-data-backed beta, an approved workflow must compare safe migration metadata, establish the exact baseline, plan ordering and rollback, capture safe aggregate checks and receive explicit migration approval.
- Dormant Preview-only PropertyReportReview structures may remain; they must not be dropped merely for cleanup.
- No Production migration is authorised by this proposal.

## Provider, package and environment assessment

No provider, package, secret or environment change is made by this proposal.

Decisions likely required during implementation:

- Next.js and possibly React upgrade path to address the May 2026 security advisory;
- monitoring/error provider versus Vercel-native-only operations;
- privacy-friendly product analytics: none initially, or an approved provider with opt-out and a minimal data dictionary;
- support channel/provider;
- rate limiting through Vercel Firewall versus application controls;
- Clerk production-domain, email, verification, reset, session and reverification configuration;
- Neon Production/Preview branch separation, branch protection, backup retention and least-privilege roles;
- Apple Developer individual versus Groveware organisation enrollment;
- iOS packaging framework and its packages/build tooling;
- any custom domain, support URL and privacy URL.

Each provider/package/secret/environment decision requires its own documented approval before implementation.

## Privacy and security risks

Highest-priority risks:

1. Next.js 14 is within the versions identified by Vercel’s 7 May 2026 security release as affected. Patch/major-upgrade planning is a release blocker.
2. Production database schema and migration state are not proven. A Ready deployment must not be treated as database readiness.
3. Signed-out public prototype routes remain available; release intent and data expectations need an explicit decision.
4. Account export and account deletion do not exist.
5. Formal privacy/support disclosures do not exist.
6. No complete monitoring, alerting, incident or backup-restore evidence exists.
7. No explicit application security-header/CSP configuration was found.
8. No explicit application-level rate limiting was found.
9. Clerk production settings, email delivery, reset, verification and sensitive-action reverification require dashboard verification.
10. Connected Neon metadata showed a single unprotected branch named production; exact environment mapping and protection settings require operator verification.
11. Dependency and lockfile security posture requires a current automated audit and remediation plan.
12. User financial data could be exposed if future telemetry, support or export implementations ignore the existing safe-metadata boundaries.

## Legal and professional-review dependencies

This development process can prepare a factual privacy pack, but should not publish legal wording as professionally approved.

External legal review should cover:

- Australian Privacy Act and Australian Privacy Principles applicability;
- Groveware’s identity as controller/business, contact details and any ABN/company/address disclosures;
- international processing and cross-border disclosures for Clerk, Neon and Vercel;
- lawful retention, erasure exceptions and backup retention;
- privacy policy and terms;
- support records and incident communications;
- App Store privacy disclosures;
- financial-information and no-tax/no-financial-advice disclaimers;
- age eligibility and whether minors may create accounts;
- consumer-law implications of release claims;
- EU/UK/other territory implications if distribution extends beyond Australia;
- Digital Services Act trader status if the app is distributed in the EU.

Apple Developer organisation enrollment may require a D‑U‑N‑S number and authority verification. This is a business decision, not a code decision.

## Client decisions required before Phase 5 approval

1. Release target: controlled web private beta first, or web plus iOS packaging in Phase 5.
2. Private-beta audience, size, invitation method and support expectations.
3. Whether signed-out browser-local use remains available in the release candidate.
4. Groveware legal entity/controller name, public contact details, support email and address requirements.
5. Apple Developer enrollment identity: individual or organisation.
6. Export formats and whether safe audit history is included.
7. Immediate deletion versus a recovery period; duration and cancellation rules.
8. Audit-event, support-record and backup retention.
9. Order and user experience for Clerk identity/database deletion.
10. Monitoring approach and alert owner.
11. Whether product analytics remain off or use an approved privacy-friendly provider.
12. Rate-limit approach and acceptable beta traffic limits.
13. Preview/Production Vercel and Neon environment/database mapping.
14. Production migration approval process and maintenance window.
15. Backup retention, recovery-point objective and recovery-time objective.
16. Support provider and safe evidence submission process.
17. iOS packaging framework decision, if and only if iOS packaging is approved.
18. Target countries/regions and need for external legal review there.
19. Custom domain, privacy URL and support URL ownership.
20. Whether a public release is a later separate phase even after private-beta readiness.

## Mandatory stop conditions

Stop and request explicit approval before:

- any Phase 5 implementation;
- package or lockfile changes;
- provider selection or configuration;
- new secret or environment variable;
- schema or migration changes;
- Preview migration;
- Production migration;
- Production database access;
- data rewrite, deletion or backfill;
- account deletion policy implementation without retention decisions;
- monitoring, analytics or support integration;
- security logging that might contain financial or identity data;
- navigation changes;
- public launch;
- App Store record, TestFlight build or submission;
- selection or implementation of a native framework;
- any change to financial, import, recurring, budget, loan, Property or report rules;
- legal wording represented as professionally approved without review.

## Review and client-testing gates

Every implementation milestone should include:

- contract approval before code;
- exact schema/migration assessment;
- provider/package/environment assessment;
- privacy data-flow review;
- account isolation and ownership tests;
- safe logs and error-response review;
- full tests, TypeScript, lint and optimized production build;
- Vercel Preview for meaningful user-facing or operational changes;
- client synthetic-data test checklist;
- explicit no-Production-migration confirmation unless a separately approved migration ran;
- merge and main deployment evidence;
- stop for client acceptance before milestone closure.

The existing docs/DEFERRED_CLIENT_RETESTING.md must be preserved as historical evidence and extended, not replaced.

## Proposed Phase 5 exit criteria

Phase 5 may be considered complete only when all approved scope is implemented and the client explicitly accepts it. Minimum exit criteria:

- exact release target and platform strategy recorded;
- supported Next.js/React dependency posture with no unresolved critical/high release blocker;
- authenticated access and owner isolation independently verified;
- signed-out route posture explicitly accepted;
- complete user export implemented and tested;
- account deletion implemented, reauthenticated, failure-safe and tested;
- retention, backup and recovery policy approved and accurately disclosed;
- professionally reviewed privacy policy and user-facing disclosures published at stable URLs;
- safe help/support process available;
- security headers, request limits, error safety and dependency controls verified;
- approved monitoring/alerts operational without private financial telemetry;
- incident and rollback runbooks tested;
- Preview/Production environments and databases mapped and separated;
- required Production migrations separately approved, run once and verified, if any;
- private-beta browser/device/accessibility/account-isolation suite green;
- App Store pathway either completed to its approved no-submission gate or intentionally deferred;
- no unresolved blocker;
- explicit client acceptance and closure record.

Public launch and App Store submission remain separate approvals even if these exit criteria are met.

## Official-source register

Accessed 15 July 2026. The detailed audit applies these sources.

- Apple — App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple — Offering account deletion in your app: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Apple — App privacy: https://developer.apple.com/help/app-store-connect/reference/app-privacy/
- Apple — Manage app privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
- Apple — Platform version information: https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/
- Apple — Identity verification: https://developer.apple.com/help/account/membership/identity-verification
- Clerk — Protect content from unauthenticated users: https://clerk.com/docs/nextjs/guides/secure/protect-content
- Clerk — Deploy your Clerk app to production: https://clerk.com/docs/guides/development/deployment/production
- Clerk — Add reverification for sensitive actions: https://clerk.com/docs/guides/secure/reverification
- Clerk — Manage users: https://clerk.com/docs/guides/users/managing
- Neon — Protected branches: https://neon.com/docs/guides/protected-branches
- Neon — Security overview: https://neon.com/docs/security/security-overview
- Prisma — Development and production migration workflows: https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production
- Prisma — Database connections: https://docs.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections
- Vercel — Environments: https://vercel.com/docs/deployments/environments
- Vercel — Environment variables: https://vercel.com/docs/environment-variables
- Vercel — Deployment Protection: https://vercel.com/docs/deployment-protection
- Vercel — Runtime Logs: https://vercel.com/docs/logs/runtime
- Vercel — WAF Rate Limiting: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
- Vercel — Next.js May 2026 security release: https://vercel.com/changelog/next-js-may-2026-security-release
- Next.js — Content Security Policy: https://nextjs.org/docs/app/guides/content-security-policy
- Next.js — Security headers configuration: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers

## Final authorisation statement

Phase 5 remains unapproved. This document is a proposal for client review. No application code, schema, migration, package, provider, secret, environment, Production data, monitoring, analytics, platform packaging, public launch or App Store action is authorised or begun by this proposal.
