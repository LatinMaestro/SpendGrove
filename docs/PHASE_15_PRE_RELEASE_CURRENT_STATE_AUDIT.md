# Phase 15 Pre-release Current-State Audit

Audit date: 18 July 2026  
Repository baseline: `fd4817aa50e0a0c89296c3ddbf17cbf98b382e1b`  
Status: repository and safe connected-metadata audit; no Production data inspection  
Release authority: no TestFlight upload, App Store submission, real-user invitation or public launch

## Audit method

This audit reviewed current repository contracts, application configuration, authentication middleware, account lifecycle services, security tests, complete-product roadmap records and current official Apple, Next.js, Vercel and Neon documentation.

It did not:

- inspect Production financial rows;
- connect to Production with Prisma;
- run a migration;
- rewrite or backfill data;
- reveal a secret or connection string;
- change a provider dashboard;
- purchase a plan;
- configure monitoring;
- sign or upload a native build;
- invite a real user.

## Status vocabulary

- **Adequate repository baseline** — implemented and covered, with final environment/device evidence still required where relevant.
- **Prepared but externally gated** — repository work exists; provider/operator/migration action is intentionally incomplete.
- **Partially complete** — useful work exists but release evidence or functionality is incomplete.
- **Missing** — no release-grade implementation/evidence exists.
- **Professional review required** — factual repository material exists but final legal, tax, security or accounting approval is external.

# 1. Framework and dependency security

Status: **Adequate repository baseline**

- Next.js is pinned to patched 15.5.20.
- React and React DOM are 19.1.8.
- `eslint-config-next` is 15.5.20.
- A deterministic npm lockfile is committed.
- CI verifies the installed framework tree, TypeScript, lint, full tests and optimized build.
- No affected Next.js 14 dependency remains in the recorded Phase 5 baseline.

Remaining release evidence:

- run an approved current dependency vulnerability report at final release;
- triage direct and transitive findings without unrelated modernization;
- record supported-version status on the release date;
- repeat immediately before TestFlight and public launch.

# 2. Authentication and route posture

Status: **Adequate repository baseline**

- Clerk middleware protects operational finance routes.
- Public paths are limited to approved help, privacy, onboarding and authentication surfaces.
- Protected API paths return safe 401 responses.
- Signed-out page access redirects through a sanitised internal return path.
- Protected responses use private/no-store caching.
- Operational routes fail closed when Clerk is not configured.
- Resource-level services require authenticated context and owner-scoped access.
- Route-policy, current-user, ownership and two-user negative tests exist.
- Browser-local prototype data is not silently uploaded, merged, deleted or shared.

Remaining release evidence:

- verify the exact Production Clerk instance and keys without exposing values;
- run signed-in/signed-out direct URL tests on the release candidate;
- run expiry, revocation, password recovery and email verification in Production-like configuration;
- verify native auth separately after the Expo client exists.

# 3. Browser security baseline

Status: **Adequate repository baseline**

Current explicit controls include:

- strict Clerk nonce-based Content Security Policy;
- `base-uri 'self'`;
- `frame-ancestors 'none'`;
- `object-src 'none'`;
- HSTS;
- frame denial;
- MIME sniffing prevention;
- strict-origin referrer policy;
- restrictive camera, microphone, geolocation, payment, USB and browsing-topics permissions;
- opener policy compatible with authentication popups;
- DNS prefetch disabled;
- framework identification header disabled;
- private/no-store caching for protected responses.

Remaining work:

- keep pre-release public surfaces out of search indexes until launch approval;
- verify actual response headers on Preview and Production release candidates;
- retest Clerk sign-in, redirects, export downloads and CSV flow after any CSP/header change;
- obtain an external security review before public launch.

# 4. Ownership, mutation and financial integrity

Status: **Adequate repository baseline**

- Durable reads and writes use authenticated owner-scoped services.
- Zod/server validation is widespread.
- Server-boundary tests prevent unapproved persistence paths.
- Signed amount/transaction type, transfers, splits and no-double-count rules are explicitly tested.
- Everyday Transactions remain the sole cashflow records.
- LoanRepayment remains analytical.
- Account export and deletion have dedicated owner-scoped services and routes.
- Audit metadata is constrained to safe codes.

Remaining release evidence:

- final negative/fuzz tests for malformed and oversized requests;
- synthetic concurrency tests for imports, deletion and future collaboration activation;
- external security review of high-risk mutations;
- full financial reconciliation at the final release commit.

# 5. CSV, upload and denial-of-service posture

Status: **Adequate current CSV baseline; future documents gated**

- CSV parsing remains browser-local.
- Raw CSV is not durably retained.
- Existing limits are 5 MiB and 5,000 rows.
- Review-before-commit and bounded server validation remain in place.
- Import/Skip/Merge and duplicate scoring are covered.
- Private-field scanning and safe error/audit rules exist.
- Future document upload is hard disabled and no storage provider exists.

Remaining release evidence:

- final supported-bank synthetic fixture matrix;
- request-size and concurrent-import tests;
- safe failure/retry and partial-commit review;
- real-device native CSV temporary-file cleanup once Phase 13 is bootstrapped;
- rate-limit/provider decision for abuse protection.

# 6. Account export, deletion, retention and recovery

Status: **Partially complete**

Implemented:

- authenticated complete account export using current operational models;
- account deletion flow with data/identity ordering and failure handling;
- in-app access;
- no raw CSV export because raw CSV is not stored;
- current guarded missing-table features are excluded until migrations activate.

Still required:

- final retention/grace-period decision;
- backup deletion propagation;
- future household/document/provider deletion treatment;
- Sign in with Apple token revocation if that login is activated;
- proof of deletion against release-like synthetic data;
- legal review of retained audit/backup obligations;
- explicit operator recovery for partial provider deletion.

# 7. Preview/Production environment and migration posture

Status: **Prepared but externally gated**

Confirmed:

- retained isolated Neon Preview project: `cold-field-54187673`;
- retained isolated Preview branch: `br-sweet-flower-aj2ng7ix`;
- no Production data was copied;
- Vercel Preview-only database configuration was separated;
- Production variables were not edited during isolation;
- GitHub Preview-secret replacement is blocked on operator reauthentication.

Six migrations remain unexecuted, in order:

1. `20260717090000_phase_6_bulk_operation_foundation`
2. `20260717100000_phase_7_transfer_link_foundation`
3. `20260717110000_phase_7_import_undo_foundation`
4. `20260717120000_phase_9_advanced_personal_finance_foundation`
5. `20260717130000_phase_10_household_accountant_foundation`
6. `20260717140000_phase_11_document_metadata_foundation`

All dependent runtime gates remain false.

Release blockers:

- operator must update GitHub Preview secrets after reauthentication;
- each Preview migration must run individually in exact order with synthetic-only verification;
- guarded runtime activation requires focused later PRs;
- Production environment mapping, migration history, backups and rollback readiness must be proven;
- each Production migration requires a separate explicit gate.

# 8. Backups and recovery

Status: **Prepared but externally gated**

Neon supports branch history and point-in-time restore within the configured retention window. Repository records do not safely prove the Production plan, retention window, branch protection or a completed restore rehearsal.

Required before release:

- record Production project/branch safe identifiers;
- verify configured history retention and plan capability;
- define RPO and RTO;
- create a synthetic non-Production restore rehearsal;
- verify application startup and migration history after restore;
- retain evidence without private row content;
- approve Production restore authority and communications;
- never rehearse destructive restore against Production.

# 9. Rate limiting and firewall

Status: **Partially complete / operator decision**

- Vercel provides platform DDoS mitigation and WAF capabilities.
- CSV/request bounds reduce application abuse risk.
- No SpendGrove-specific WAF/rate-limit configuration is verified.
- No application rate-limit package/provider is approved.

Required before release:

- inspect current plan capabilities;
- define limits for authentication abuse, account deletion/export and import commit;
- choose Vercel controls or a separately approved application mechanism;
- verify failure wording and legitimate-user recovery;
- avoid logging IP/user finance content unnecessarily;
- record alert ownership.

# 10. Monitoring and incident response

Status: **Missing operational activation; design can be completed**

- GitHub/Vercel expose deployment status.
- Vercel, Clerk and Neon expose provider-native operational signals.
- No monitoring, crash-reporting or analytics provider is configured.
- Analytics remains off.
- No named operational owner, channel, severity SLA or completed incident exercise is recorded.

Minimum safe release posture:

- deployment failure visibility;
- application/runtime error counts using safe reason codes;
- authentication availability;
- database availability;
- import failure rate by stage/code only;
- latency/availability buckets;
- backup/restore evidence;
- incident severity, containment, communication and post-incident review.

Never monitor raw CSV, narration, merchant history, amounts, balances, filenames, banking identifiers, Property/Loan details or unnecessary email.

A provider, package, secret, environment variable or paid alert channel remains a separate gate.

# 11. Privacy, legal and professional review

Status: **Factual foundation exists; professional review required**

Available:

- in-app privacy surface;
- privacy-first CSV rules;
- raw CSV non-retention;
- provider inventories and boundaries;
- account export/deletion;
- tax/advice disclaimers;
- analytics off;
- optional Basiq/AI/documents/payments disabled.

Still required:

- Groveware legal/business name and contact details;
- final Australian privacy-law review;
- international processing facts for Clerk, Vercel, Neon and future providers;
- retention/backups/deletion wording;
- support and security contact;
- final Privacy Policy and Terms;
- Australian tax/accounting review of report language;
- Australian Consumer Law/GST review if commercial activation proceeds;
- App Store privacy answers matching the final binary and providers.

Repository-generated material remains factual input, not legal advice.

# 12. Help and support

Status: **Partially complete**

- Public Help and Privacy routes exist.
- CSV and feature guidance exists in product and internal records.
- Safe feedback rules prohibit real CSV/private finance submissions.

Missing:

- approved public support email/URL and responsible operator;
- response expectations;
- security vulnerability contact;
- safe bug-report intake;
- supported-bank public matrix;
- release-grade FAQ/tutorial completion;
- escalation path for account deletion, billing and incidents.

No support provider or public attachment upload is approved.

# 13. Native and App Store readiness

Status: **Architecture selected; implementation missing**

- Expo/React Native with Expo Router is selected.
- Clerk, system document picker, secure storage, biometrics, notifications and deep-link approaches are documented.
- No native project, deterministic native lockfile, signed build or device evidence exists.
- No Apple Developer payment, bundle identifier, App Store record, TestFlight upload or review account exists.
- No privacy manifest exists because there is no native target.
- App privacy factual inputs are incomplete until the final provider/package set is frozen.

Apple release requirements still include:

- valid privacy manifest where required;
- privacy policy URL;
- app privacy disclosures covering third-party SDKs;
- in-app account deletion;
- complete/non-placeholder binary and metadata;
- demo/review account and live backend;
- iPhone/iPad/accessibility/device evidence;
- Sign in with Apple review where applicable;
- explicit TestFlight and submission approval.

# 14. Commercial readiness

Status: **Guarded preparation complete; activation unapproved**

- Phase 14 contract and immutable baseline resolver exist.
- Runtime is false.
- No price, plan assignment, limit, paywall, checkout, provider or billing schema exists.
- Accepted capabilities remain available.

Release decision remains open:

- free versus paid first release;
- plan contents, limits and pricing;
- Apple/web treatment;
- provider;
- GST/legal/refunds/support;
- StoreKit products and server reconciliation.

# 15. Accessibility and device/browser QA

Status: **Strong web baseline; final matrices incomplete**

- Phase 4 delivered responsive/mobile/accessibility hardening.
- Automated semantic and overflow tests exist.
- 390 px and desktop visual checks are part of prior evidence.

Still required:

- final browser/device matrix;
- keyboard and screen-reader manual review;
- text scaling and reduced motion;
- iPhone/iPad real-device testing after native implementation;
- long content and offline/failure states;
- external accessibility review where practical.

# 16. Public-release posture

Current conclusion: **not release ready**.

Repository-safe foundations are substantial, but release is blocked by:

1. six Preview migrations and activation work;
2. Production mapping, migration, backup and recovery proof;
3. native client bootstrap and real-device evidence;
4. privacy/legal/professional review;
5. support contact and operating model;
6. monitoring/alert ownership and incident exercise;
7. final commercial decision;
8. Apple identity, signing, metadata, TestFlight and review;
9. final consolidated client acceptance.

No public launch or App Store action should occur until the Phase 15 exit criteria are proven.

## Official sources reviewed

Accessed 18 July 2026:

- [Next.js 15 headers configuration](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/headers)
- [Vercel security overview](https://vercel.com/docs/security)
- [Vercel Firewall](https://vercel.com/docs/vercel-firewall)
- [Vercel Firewall observability](https://vercel.com/docs/vercel-firewall/firewall-observability)
- [Neon branching and restore](https://neon.com/docs/guides/branching-intro)
- [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
- [Apple manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)
- [Apple privacy manifests](https://developer.apple.com/documentation/bundleresources/adding-a-privacy-manifest-to-your-app-or-third-party-sdk)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
