# Complete Product Current-State Audit

Audit date: 17 July 2026  
Repository: LatinMaestro/SpendGrove  
Baseline: main through PR #164  
Method: read-only GitHub repository, schema, route, service, test, governance and connected deployment metadata review. No Production database rows, secrets or private financial content were accessed.

## Executive assessment

SpendGrove is a substantial authenticated web product, not an empty prototype. Its strongest completed areas are privacy-first CSV review, transaction integrity, loan and Property workflows, recurring/budget insights, beginner-first responsive presentation, account lifecycle and the Phase 5 security/authentication baseline.

The main remaining work is not rebuilding those foundations. It is:

- completing desktop-scale workflows and bulk safety;
- expanding named bank/loan format coverage and import recovery;
- completing tax/accountant reports under professional review;
- adding advanced finance, household permissions, documents and optional enrichment;
- choosing and delivering the native iPhone/iPad pathway;
- completing commercial, legal, operational and release gates.

## Safe baseline confirmed

- Phase 5 records: PR #163 at 668c09cae49ce1ff58021c95be1c199eb39c0127 and PR #164 at ac7eeb89c17b774720c7d447386dd4be67705276.
- Framework: Next.js 15.5.20, React 19.1.8, React DOM 19.1.8, eslint-config-next 15.5.20.
- Deterministic npm lockfile is committed; no affected Next.js 14 dependency remains.
- Verification record: 110 test files / 677 tests, TypeScript, lint with documented warnings, optimised production build.
- Latest inspected Production application deployment: dpl_8bfqT5DskyyaiLHAsgPwzNTLngMn, application commit 1c048abf363b2c9d97818e6724d549725509eeda, Ready, canonical domain spendgrove.vercel.app.
- Phase 5 is technically complete but pending deferred client acceptance and not formally closed.

## Sources reviewed

- governing records: AGENTS.md, PLAN.md, README.md, current handoff, build plan, review gates, definition of done, decision log and deferred testing;
- master source records: specification source-of-truth record and complete machine-readable companion to the SpendGrove v2.0.1 master specification; authoritative DOCX repository identity was confirmed;
- all available Phase 1–5 summaries, contracts and QA records;
- Prisma schema, application routes, Route Handlers, server modules, components, import parsers and tests;
- current official Apple, Clerk, Neon, Prisma, Vercel, Capacitor, React Native and Expo material where requirements are time-sensitive.

## Status vocabulary

- Complete: implemented, connected and covered by accepted technical evidence.
- Complete / polish: implemented but still needs broader complete-product/device/client polish.
- Partial: useful implementation exists but the specified module is not complete.
- Dormant: structural code/schema exists but normal user workflow is absent or secondary.
- Documented only: designed or assessed but not implemented.
- Missing: no meaningful implementation found.
- Provider blocked: requires provider/configuration/credentials.
- Decision blocked: requires client, commercial, legal or professional decision.

# 1. Platform and user experience

## Responsive web

Status: Complete / polish.

The current route set includes Home, Transactions, Import, Loans, Loan import, Budgets, Regular payments, Settings, Onboarding, Privacy, Help and Clerk authentication. Phase 4 established a consistent responsive visual system and compact beginner-first workflows. Mobile and desktop sweeps are recorded.

Remaining:

- desktop tables, bulk selection, saved views and high-density workflows;
- complete browser/device matrix;
- removal of any residual long-form or mobile-shaped workflow on wide screens;
- final accessibility review after all future modules.

## Desktop web

Status: Partial.

The web application is responsive, but there is no complete desktop Import Centre, transaction ledger, safe bulk-update system, advanced report centre or merchant/profile administration workspace. Existing bulk actions are concentrated in import review, not the durable transaction ledger.

## iPhone/iPad

Status: Documented only.

Phase 5 assessed packaging but no native project, framework, secure native file flow, device notification integration, TestFlight build or App Store record exists. The platform decision remains open.

# 2. Authentication, ownership and account lifecycle

Status: Complete / verification for future models.

Implemented:

- Clerk sign-in/sign-up provider surfaces;
- authenticated finance-route posture;
- user provisioning and session-bound current-user resolution;
- owner-scoped durable reads/writes;
- two-user boundary tests;
- account export and deletion;
- signed-out handling and browser-local preservation notice;
- removal/protection of production demo/stub paths.

Remaining:

- apply the same authorization pattern to every future household, document, net-worth and provider model;
- final Production Clerk/operator verification and release review account;
- household roles, invitations and accountant access;
- backup-deletion propagation and provider-retention confirmation.

# 3. Current domain and schema inventory

Implemented owner-scoped models:

- User and UserSettings;
- Category and Transaction;
- ImportBatch, ImportRow and BankImportProfile;
- MerchantProfile, MerchantAlias and MerchantRule;
- AuditEvent;
- Property and PropertyTransactionLink;
- LoanAccount, LoanRepayment and LoanReconciliationLink;
- PropertyReportReview;
- RecurringItem and RecurringSuggestionDismissal;
- CategoryBudget.

Not present as first-class schema:

- bank/account register and durable transfer-pair link;
- import undo operation/history;
- saved transaction filters or bulk-operation journal;
- detailed tax classification/group/evidence models;
- advanced report/pack manifests;
- savings goals;
- assets, liabilities and net-worth snapshots;
- notification/reminder schedules and delivery history;
- household, membership, invitation, role or share-grant models;
- accountant access grants;
- documents, receipts or storage-object links;
- support tickets/feedback;
- Basiq/AI consent, request or cache records;
- entitlements, plans, purchases or subscriptions.

Dormant/limited structures:

- PropertyReportReview exists but must be assessed against future reporting review needs;
- MerchantProfile has a safe core but lacks the richer default Property/tax behaviour in the master plan;
- RecurringItem supports weekly/fortnightly/monthly/other and active/archived, not the complete planned lifecycle;
- CategoryBudget is monthly-only;
- Property holds safe nickname/usage state but not the complete planned management metadata.

# 4. Transactions and manual entry

Status: Complete / polish.

Implemented:

- owner-scoped manual create/edit;
- integer cents and signed-direction invariant;
- direction-aware category compatibility;
- split parent/child rules and no-double-count treatment;
- soft deletion and recovery;
- month navigation, search and category drilldown;
- Property linking;
- anomaly visibility/correction without historical rewrite.

Gaps:

- durable transfer-pair linking;
- desktop ledger/bulk corrections;
- saved views;
- broad operation undo;
- advanced audit/history presentation;
- possible full account/liability association after Phase 9;
- final mixed workflow QA after household sharing.

# 5. CSV import and data quality

Status: Strong partial.

Implemented:

- browser-first parse and private-field scanning;
- upload limits and no raw-file retention;
- generic/manual mapping;
- saved import profiles;
- review-before-commit;
- Import, Skip and Merge;
- duplicate scoring/handling;
- import history;
- category and merchant learning;
- Property review linking;
- sign/type integrity;
- supported synthetic regression fixtures.

Named everyday profiles confirmed in code:

- CommBank;
- ANZ;
- NAB;
- Westpac.

The master target list also names Macquarie, ING, Bankwest, St George, BankSA, Bank of Melbourne, Suncorp, Bendigo, Adelaide, BOQ, ubank, Up, Great Southern, Heritage and People’s Choice. Those formats currently depend on generic/manual mapping unless separately covered by an undocumented-compatible layout; they do not have the same explicit named-profile evidence.

Gaps:

- named/fixture-backed coverage for the remaining target banks;
- full account and loan-format matrix;
- import undo;
- parser quality reporting and safe sample contribution workflow;
- durable transfer-pairing;
- stronger mapping diagnostics and desktop review efficiency.

# 6. Merchants and categorisation

Status: Partial to strong.

Implemented:

- cleaned merchant presentation;
- aliases;
- merchant profiles;
- user-confirmed merchant/category rules;
- deterministic keyword suggestions;
- direction-compatible rule precedence;
- conservative reference normalization for recurring detection;
- custom categories.

Gaps:

- complete merchant administration UI;
- robust user-reviewed merchant merge/history;
- safe apply-to-history/bulk scope;
- richer profile defaults;
- optional Basiq sandbox and disclosure work;
- optional AI suggestions and natural-language search.

Local intelligence is sufficiently mature to remain the mandatory first layer. Basiq/AI must not replace it.

# 7. Loans and Properties

Status: Complete core / partial planned breadth.

Implemented:

- home and personal Loan Accounts;
- linked Property nickname/usage;
- loan repayment CSV review/import;
- principal, interest, fees and balances;
- high-confidence and manual reconciliation;
- both import orders;
- one canonical repayment presentation;
- correction, unlink, delete/restore;
- Property transaction links;
- Property records and accepted export;
- no-double-count safeguards.

Gaps:

- additional loan/provider format coverage;
- complete Property/loan metadata required by the master specification;
- broader advanced loan reports;
- accountant-ready packs;
- evidence-document links;
- tax-preparation classifications under professional review;
- multi-loan/multi-owner household treatment.

# 8. Budgets, recurring and insights

Status: Complete foundation / partial advanced scope.

Implemented:

- monthly category budgets, edit/delete/restore;
- confirmed recurring/subscription records, suggestions, dismissal and lifecycle;
- weekly, fortnightly and monthly detection;
- monthly spending, budget progress and month comparisons;
- Transactions category chart and drilldown;
- explicit no-double-count and transfer exclusions.

Known accepted limitations/gaps:

- monthly-only budgets and no rollover;
- positive refunds do not reduce original expense-category spending;
- limited recurring lifecycle/cadences;
- no due-date reminder delivery;
- no savings goals;
- no forecasting contract;
- no net-worth model;
- no account/asset/liability tracking;
- no advanced trend/report centre.

# 9. Reports, tax and accountant readiness

Status: Partial.

Implemented:

- Property records derived from accepted linked sources;
- Australian financial-year selection;
- accepted Property export;
- concise record-keeping/no-tax-advice boundary.

Missing/partial:

- complete advanced everyday, loan and Property report suite;
- accountant packs/manifests;
- evidence lists;
- report reconciliation across all planned outputs;
- tax-preparation flags/groups and review workflow;
- independent Australian tax/accounting terminology review;
- accountant collaboration/access.

No automatic deductibility, tax lodgement or tax advice is implemented; this boundary must remain.

# 10. Household, roles and collaboration

Status: Missing.

All current durable records are individually owner-scoped. There are no household memberships, invitations, share grants, role permissions or accountant access models. This is a major privacy and migration project, not a UI-only feature.

Required safeguards:

- existing records remain private by default;
- explicit selection before sharing;
- revocation and audit;
- resource-level server authorization;
- no browser-local sharing;
- accountant read-only selected scope.

# 11. Documents and receipts

Status: Missing.

No secure document object storage, metadata/link models, malware controls, retention/deletion/export treatment or receipt/OCR workflow was found. Provider and cost decisions are mandatory before implementation.

# 12. Notifications and reminders

Status: Missing beyond in-app review states.

There is no notification schedule/delivery model, push provider, permission flow or quiet-hours control. Native push depends on the Phase 13 platform choice. In-app reminders can be designed earlier but require exact lifecycle rules.

# 13. Help, tutorials, FAQ and feedback

Status: Partial.

Implemented:

- Help and Privacy routes;
- CSV/privacy guidance;
- account lifecycle guidance;
- baseline disclosure content.

Gaps:

- complete tutorial/onboarding curriculum;
- supported-bank matrix for users;
- fuller FAQ;
- safe bug/feature feedback intake;
- explicit warning not to submit real CSVs/screenshots;
- support workflow and contact/operator ownership;
- ticket retention and privacy treatment.

# 14. Export, deletion, retention and recovery

Status: Complete core / operational verification remains.

Implemented:

- account export across current user-owned entities;
- deletion lifecycle and Clerk/database coordination contract;
- archived/deleted record treatment;
- privacy-safe error handling.

Remaining:

- extend export/deletion to every future model/provider;
- prove backup retention and deletion propagation;
- failed/partial external-provider deletion recovery;
- document/object deletion;
- household/member versus household-owner deletion rules;
- optional-provider data deletion.

# 15. Security and operations

Status: Strong baseline / final readiness incomplete.

Implemented or documented:

- authenticated route posture and owner boundaries;
- mutation validation patterns;
- request/upload limits;
- safe audit metadata rules;
- security headers baseline;
- Preview migration workflow;
- environment/recovery runbooks;
- framework security upgrade;
- Preview/Production mapping assessment.

Remaining:

- final threat model after all modules;
- rate-limit/firewall decision and implementation;
- privacy-safe monitoring/alert provider decision;
- dependency review at release;
- backup/restore rehearsal;
- incident response drill;
- independent security/penetration review;
- Production configuration verification without exposing secrets.

# 16. Commercial readiness

Status: Missing / decision blocked.

No plans, entitlements, StoreKit purchases, web billing, payment provider or price publication are implemented. The first release can remain free if the client decides. Commercial implementation requires pricing, App Store billing treatment, provider costs, GST/tax review, refund/support and live-credential gates.

# 17. Optional Basiq and AI

Status: Intentionally deferred.

Basiq and AI are absent, which is correct under prior exclusions. The complete-product direction now includes them as optional planned work, but only after:

- local merchant intelligence is complete;
- provider pricing/terms/region and privacy are approved;
- payload minimization and opt-in are contracted;
- user confirmation and no-advice boundaries are tested.

# 18. App Store and native release

Status: Planning only.

Missing:

- framework/native architecture;
- Apple Developer organization/operator confirmation;
- native build/signing;
- TestFlight;
- privacy nutrition labels;
- final privacy/support URLs;
- screenshots/metadata;
- review account;
- real-device iPhone/iPad evidence;
- App Store submission.

Apple requirements reviewed on 17 July 2026 indicate that apps with account creation need an in-app path to initiate account deletion, App privacy disclosures must cover app and partner data practices, accurate metadata and complete reviewable functionality are required, and beta distribution belongs in TestFlight rather than the public App Store.

# 19. Missing screen and workflow register

No current primary screens were found for:

- desktop Import Centre;
- desktop transaction ledger/bulk operations;
- full merchant/profile administration;
- advanced report centre/accountant pack;
- net worth/assets/liabilities;
- household and permissions;
- accountant access;
- documents/receipts;
- notifications/reminders;
- support/feedback management;
- optional enrichment/AI controls;
- commercial plans/purchases;
- native iPhone/iPad client.

These are roadmap work, not evidence that the accepted current routes are defective.

# 20. Migration posture

## No-change extensions

Likely possible without schema for:

- desktop shell/layout;
- Import Centre composition;
- many parser profiles/fixtures;
- report presentation over existing accepted sources;
- help/tutorial/FAQ content;
- platform proofs that do not write durable data.

## Additive migration groups

Expected:

1. desktop saved views/bulk operation history/undo;
2. transfer pairing/import undo/richer merchant history;
3. Property/tax/reporting metadata;
4. goals/assets/liabilities/reminders;
5. household/roles/grants;
6. documents/links;
7. optional provider consent/cache;
8. entitlements/subscriptions.

Each group requires exact Prisma and SQL review, ownership/deletion/export impact, Preview deployment and post-migration checks. Production migration remains a separate operator gate.

# 21. Provider and environment blockers

Client/operator decisions are required for:

- native framework and Apple Developer organization;
- secure document storage and malware controls;
- push notification delivery;
- monitoring/error/incident alerting;
- analytics, if any;
- Basiq sandbox/Production;
- AI provider/model/cost;
- web payment provider and StoreKit;
- support contact/ticket handling;
- legal and tax professional review.

No provider purchase, new secret or environment change is authorised by this audit.

# 22. Recommended immediate work

Activate Phase 6 Milestone 6.0 after the planning and governance records merge. Begin with:

1. desktop route/interface audit;
2. exact bulk-action safety contract;
3. no-schema desktop shell and Import Centre design;
4. schema assessment for saved filters, operation history and undo.

This creates high user value while avoiding premature provider, native, tax and household decisions.

# Official source register

Accessed 17 July 2026.

| Source | Provider | Requirement or risk supported |
|---|---|---|
| App Review Guidelines | Apple | Complete, reviewable, accurately described apps; beta distribution through TestFlight; no dormant undocumented functionality |
| Managing app privacy | Apple | App privacy responses and ongoing update responsibility |
| App privacy details | Apple | Disclosure includes first- and third-party partner data practices |
| Offering account deletion in your app | Apple | Account-creation apps need an in-app deletion initiation path |
| D-U-N-S Number | Apple | Organization enrollment/legal identity dependency |
| App information reference | Apple | Privacy policy, support and metadata dependencies |
| Expo documentation and file/document APIs | Expo | Native file handling and production-build considerations |
| React Native architecture overview | Meta | Native rendering/architecture trade-offs |
| Capacitor documentation | Ionic | Web-first native runtime and plugin approach |
| SwiftUI documentation | Apple | Apple-native UI framework option |
| Clerk Expo SDK documentation | Clerk | Expo authentication/session and development-build considerations |
| Branching and restore documentation | Neon | Branching, recovery and plan capability considerations |
| Environment variable documentation | Vercel | Environment-scoped configuration handling |
| Rate limiting guidance | Vercel | Platform/application abuse-control options |

## Audit conclusion

SpendGrove has a credible complete-product foundation. The remaining scope is substantial and includes several high-risk data/provider/native projects. The revised Phase 6–15 sequence is safer than treating all remaining work as a single optional phase, and it preserves every mandatory client/operator gate.
