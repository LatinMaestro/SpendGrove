# SpendGrove App Store Release Traceability and Gate Dashboard

Prepared: 26 July 2026  
Status: controlling companion to `APP_STORE_SUBMISSION_MASTER_BUILD_PLAN.md`  
Purpose: map every feature-register item to its release evidence and expose the current delivery, decision, provider, Production and Apple gates in one place.

## 1. Status language

- **Accepted** — merged, technically verified and client accepted where acceptance is required.
- **Merged** — on `main` and technically verified, but consolidated client acceptance or later release evidence may remain.
- **Preview-ready** — implemented in the open Preview activation stack and verified by integrated Vercel build evidence, but not merged or Production-ready.
- **Prepared** — contract, schema, service or adapter exists but the complete user workflow is not operational.
- **Planned** — included in the master plan but implementation has not started.
- **External gate** — blocked by a client, operator, provider, professional, Apple or Production decision/action.
- **Not selected** — may be excluded only by an explicit client release-scope decision; no dormant or misleading UI may ship.

Release evidence dimensions:

- **W** — responsive web/mobile-web user workflow.
- **B** — server/API, ownership, persistence and account lifecycle.
- **N** — native iPhone/iPad implementation.
- **Q** — automated, browser, accessibility and device QA.
- **S** — App Store metadata, privacy, review-account and submission evidence.

## 2. Current top-level delivery dashboard

| Gate | State | Current evidence | Required next action | Hard stop |
|---|---|---|---|---|
| G-00 Master plan | In review | PR #242; Vercel Preview Ready | Complete this traceability/gate companion, self-review and merge when repository gates permit | Do not treat an open planning PR as merged repository truth |
| G-01 Preview activation implementation | Preview-ready | PRs #231–#241; integrated head `e07644efdd6363800e6a2ec3bc6c4f028af42556`; 156 files / 962 tests; Vercel Ready | Authenticated synthetic QA and executable GitHub Actions check | Do not merge stack without remaining exact-head gates |
| G-02 GitHub Actions execution | External gate | Runs fail before any step/log; client advised Actions capacity returns 1 August 2026 | Retry once when capacity is restored; require exact-head application verification | No blind repeated retries or no-op commits |
| G-03 Authenticated synthetic Preview QA | External gate | Signed-out route/header smoke passed; no connected synthetic Clerk session | Execute A–J QA with synthetic owner/member/accountant users | No real users or real financial data |
| G-04 Preview migrations | Complete for current stack | Verify-only run recorded 12 healthy migrations and six controlled profiles exactly once | Do not rerun; preserve evidence | No reset, repeat, manual SQL or Production use |
| G-05 Ordered merge #231–#241 | Blocked by G-02/G-03 | All PRs open and mergeable | Review and merge in order after all gates | No out-of-order merge |
| G-06 Production mapping | External gate | Production remains on accepted pre-activation `main`; Preview isolated | Prove Vercel/Clerk/Neon identity and secret separation without revealing values | No Production data access |
| G-07 Backup/restore | External gate | Runbooks prepared | Confirm Neon capabilities, RPO/RTO and synthetic restore rehearsal | No Production migration before proof |
| G-08 Production migration | Explicit approval required | Proposal not yet authorised | Prepare exact proposal after G-05–G-07; obtain client approval | Do not execute without explicit approval |
| G-09 Complete web/backend scope | Active after G-05 | Mature baseline plus Preview stack | Close remaining register items through focused phases C–I | No financial/privacy drift |
| G-10 Native bootstrap | Prepared architecture | Expo/React Native decision merged; no native project | Deterministic online bootstrap and proof | No EAS/Apple credentials until approved |
| G-11 Native feature parity | Planned | Shared API/domain boundaries documented | Implement phases J–L after bootstrap proof | No direct Neon/Prisma/native secrets |
| G-12 Providers | External gate | Storage, invitation, push, OCR, Basiq, AI, monitoring prepared only | Select exact providers, privacy/cost/region/retention and credentials through separate approvals | No paid/provider activation without approval |
| G-13 Commercial model | External gate | Entitlement resolver hard-false; no prices/paywall | Decide free versus paid; implement only if approved | No dormant purchase UI |
| G-14 Legal/professional review | External gate | Factual packs and draft wording prepared | Australian legal/privacy, tax/accounting and security review | No unreviewed tax/legal claims |
| G-15 Apple operator setup | Explicit approval required | No Apple Developer/App Store Connect state | Confirm seller identity, enrolment, bundle ID, signing custody and roles | No payment, signing or App Store record without approval |
| G-16 TestFlight | Explicit approval required | No signed build | Complete exact RC, internal QA and obtain upload approval | No upload/invitations without approval |
| G-17 App Review submission | Explicit approval required | Master plan only | Complete final checklist and obtain submission approval | No submission/public release without approval |

## 3. Feature traceability matrix

### 3.1 Platform, authentication and lifecycle

| ID | Capability | Current state | Evidence required for completion | Master-plan path | Immediate gate |
|---|---|---|---|---|---|
| PLAT-01 | Responsive web product | Accepted foundation | W/B/Q: complete regression, supported viewports, merged-main deployment | Phase C and N | Maintain parity and no regression |
| PLAT-02 | Desktop shell and efficiency | Merged/partial | W/Q: wide-screen workflows, keyboard, no mobile regression | Phase C | Close saved views/audit/admin gaps |
| PLAT-03 | Desktop Import Centre | Merged | W/B/Q: bank matrix, large-file and accessibility evidence | Phase C2 | Remaining bank/loan formats |
| PLAT-04 | Desktop transaction ledger | Merged | W/Q: filters, saved views, keyboard and responsive evidence | Phase C1 | Saved views and audit UI |
| PLAT-05 | Safe desktop bulk workflows | Preview-ready | W/B/Q: synthetic owner isolation, partial failure and undo | Phase A | G-02/G-03 |
| PLAT-06 | Native iPhone application | Planned | N/B/Q/S: complete native parity, device and store evidence | Phases J–O | G-10 |
| PLAT-07 | iPad-compatible application | Planned | N/Q/S: adaptive layout, keyboard/pointer, accessibility | Phase L | G-10/G-11 |
| AUTH-01 | Clerk sign-in/sign-up/session | Merged web; native planned | W/N/B/Q/S: recovery, expiry, sign-out, review account | Phases J and O | Production/native Clerk setup |
| AUTH-02 | Email verification/reset/provider flow | Provider-backed partial | N/Q/S: release-instance verification and review notes | Phases J/O | Clerk Production operator gate |
| AUTH-03 | Protected finance routes | Merged | B/Q: direct URL/API denial on web/native | Every phase | Maintain owner tests |
| AUTH-04 | User provisioning/owner isolation | Merged | B/Q: every new model/API included | Every phase | Extend matrices per feature |
| AUTH-05 | Browser-local prototype preservation | Accepted rule | W/N/Q: no silent migration/deletion/share | Every phase | Maintain isolation |
| LIFE-01 | Complete account export | Merged plus Preview extensions | B/N/Q/S: every model/provider included, safe native share | Phases A–I/K/O | G-05 then provider extensions |
| LIFE-02 | Account deletion | Merged plus Preview extensions | B/N/Q/S: in-app initiation, provider propagation, reauth/recovery | Phases A–I/K/O | G-05 and provider decisions |
| LIFE-03 | Retention/backups/deletion propagation | Prepared | B/Q/S: approved schedules and operational proof | Phases B/G/N/O | G-07/G-12/G-14 |
| LIFE-04 | Recovery/grace-period policy | Planned/external | B/Q/S: client/legal decision and truthful UI | Phase N | Legal/client decision |

### 3.2 Transactions and imports

| ID | Capability | Current state | Completion evidence | Master-plan path | Immediate gate |
|---|---|---|---|---|---|
| TX-01 | Manual create/edit | Accepted web | W/N/B/Q parity | C1/K2 | Native implementation |
| TX-02 | Signed money/type invariant | Accepted | Shared fixtures and server-authoritative parity | All phases | Preserve invariant |
| TX-03 | Split transactions | Accepted web | W/N/B/Q no-double-count parity | C1/K2 | Native parity |
| TX-04 | Transfer classification | Accepted web | W/N/B/Q transfer exclusion | C1/K2 | Native parity |
| TX-05 | Durable transfer pair/link | Preview-ready | W/B/N/Q explicit confirmation, ambiguity, unlink | A/K2 | G-02/G-03/G-05 |
| TX-06 | Delete/restore lifecycle | Accepted web | W/N/B/Q audit and recovery | C1/K2 | Native parity |
| TX-07 | Search/month/category filters | Merged web | W/N/Q saved views and accessibility | C1/K2 | Saved-view contract |
| TX-08 | Saved filters/views | Planned | W/B/N/Q ownership/export/deletion or approved local preference | C1/K2 | Schema/preference assessment |
| TX-09 | Bulk category/Property/status actions | Preview-ready | W/B/Q partial failure and isolation | A | G-02/G-03 |
| TX-10 | Transaction operation undo | Preview-ready | W/B/Q exact eligibility and one-time undo | A | G-02/G-03 |
| TX-11 | Audit history UI | Partial | W/N/B/Q safe metadata only | C1/K2 | Presentation contract |
| IMP-01 | Privacy-first browser parse/scanning | Accepted web | W/N/Q parity; no raw retention | C2/K3 | Native file proof |
| IMP-02 | Generic/manual mapping | Accepted web | W/N/Q unknown-format usability | C2/K3 | Native parity |
| IMP-03 | Saved import profiles | Accepted web | W/N/B/Q owner-scoped parity | C2/K3 | Native implementation |
| IMP-04 | Review-before-commit | Accepted | W/N/B/Q server revalidation | C2/K3 | Preserve rule |
| IMP-05 | Import/Skip/Merge | Accepted | W/N/B/Q parity and idempotency | C2/K3 | Native parity |
| IMP-06 | Duplicate detection | Accepted | Shared fixtures and threshold freeze | C2/K3 | Expand bank matrix |
| IMP-07 | Import history | Accepted web | W/N/B/Q privacy and lifecycle | C2/K3 | Native parity |
| IMP-08 | Import undo | Preview-ready | W/B/N/Q future imports only, dependency guards, restore | A/K3 | G-02/G-03/G-05 |
| IMP-09 | CommBank profile | Merged | W/N/Q synthetic matrix | C2/K3 | Native parity |
| IMP-10 | ANZ profile | Merged | W/N/Q synthetic matrix | C2/K3 | Native parity |
| IMP-11 | NAB profile | Merged | W/N/Q synthetic matrix | C2/K3 | Native parity |
| IMP-12 | Westpac profile | Merged | W/N/Q synthetic matrix | C2/K3 | Native parity |
| IMP-13 | Remaining target-bank profiles | Partial/planned | W/N/Q public/synthetic fixtures for each accepted format | C2 | Format evidence |
| IMP-14 | Loan CSV format matrix | Partial | W/N/Q named lender/account variants and diagnostics | C2/K6 | Format evidence |
| IMP-15 | Safe bank-format contribution | Planned | W/N/B/Q no real CSV intake | C2/N | Support/privacy contract |
| IMP-16 | Parser quality reporting | Partial | W/B/Q aggregate diagnostics and truthful Help | C2/N | Complete matrix |

### 3.3 Merchants and categories

| ID | Capability | Current state | Completion evidence | Master-plan path | Immediate gate |
|---|---|---|---|---|---|
| MER-01 | Clean merchant names | Accepted | W/N/B/Q parity | C3/K2 | Native parity |
| MER-02 | Merchant aliases | Merged | W/N/B/Q ownership and lifecycle | C3/K2 | Native parity |
| MER-03 | Merchant profiles | Merged foundation | W/N/B/Q complete administration | C3/K2 | Merge/history gap |
| MER-04 | User-confirmed category rules | Accepted | W/N/B/Q direction compatibility | C3/K2 | Native parity |
| MER-05 | Local keyword/brand suggestions | Accepted | Shared fixtures and false-positive tests | C3/K2 | Native parity |
| MER-06 | Apply to same merchant/history | Partial | W/B/N/Q preview, confirmation and undo | C3/K2 | Bulk/history contract |
| MER-07 | Merchant merge/history | Partial/prepared | W/B/N/Q reversible merge and unrelated-record protection | C3/K2 | Schema/workflow assessment |
| MER-08 | Default Property/tax fields | Planned | W/B/N/Q professional wording and no automatic conclusions | C3/D | G-14 |
| CAT-01 | Seeded/custom categories | Accepted | W/N/B/Q direction compatibility | C3/K2 | Native parity |
| CAT-02 | Category management workspace | Merged foundation | W/N/B/Q archive/restore and accessibility | C3/K2 | Complete admin parity |

### 3.4 Loans, Properties, tax and reports

| ID | Capability | Current state | Completion evidence | Master-plan path | Immediate gate |
|---|---|---|---|---|---|
| LOAN-01 | Loan Accounts | Accepted web | W/N/B/Q owner parity | D/K6 | Native parity |
| LOAN-02 | Repayment imports | Accepted web | W/N/B/Q lender matrix | C2/D/K6 | Remaining formats |
| LOAN-03 | Principal/interest/fees/balances | Accepted | W/N/B/Q integer-cent reconciliation | D/K6 | Native parity |
| LOAN-04 | Reconciliation both orders | Accepted | Shared fixtures and no double count | D/K6 | Native parity |
| LOAN-05 | Manual matching/correction/unlink | Accepted | W/N/B/Q reversibility | D/K6 | Native parity |
| LOAN-06 | Additional lender/format coverage | Partial | W/N/Q synthetic matrix | C2/D | Format evidence |
| LOAN-07 | Advanced loan reports | Merged foundation/partial | W/N/B/Q professional review and reconciliation | D/K7 | G-14 |
| PROP-01 | Properties and Loan links | Accepted web | W/N/B/Q owner parity | D/K6 | Native parity |
| PROP-02 | Property transaction links | Accepted | W/N/B/Q cardinality/no double count | D/K6 | Native parity |
| PROP-03 | Property records/export | Accepted foundation | W/N/B/Q accountant usability | D/K7 | Professional closure |
| PROP-04 | Complete Property metadata | Partial | W/N/B/Q minimum-data decision | D/K6 | Data-minimisation decision |
| TAX-01 | EOFY Property reporting | Merged foundation/partial | W/N/B/Q professional terminology and fixtures | D/K7 | G-14 |
| TAX-02 | Tax-preparation classification | Dormant/partial | W/N/B/Q user-controlled record-keeping only | D/K7 | G-14/schema assessment |
| REP-01 | Advanced everyday reports | Partial | W/N/B/Q source reconciliation and accessibility | D/K7 | Implement remaining reports |
| REP-02 | Accountant-ready export pack | Merged foundation | W/N/B/Q final manifest/evidence | D/K7 | Professional/client review |
| REP-03 | Document evidence list | Planned/metadata foundation | W/N/B/Q secure evidence links | G/K7 | Storage/provider gate |
| REP-04 | Accountant collaboration | Preview-ready | W/N/B/Q selected read-only scope and revocation | A/F/K8 | G-02/G-03/G-12 invitation |

### 3.5 Everyday finance, planning and reminders

| ID | Capability | Current state | Completion evidence | Master-plan path | Immediate gate |
|---|---|---|---|---|---|
| BUD-01 | Monthly category budgets | Accepted web | W/N/B/Q parity | E/K4 | Native parity |
| BUD-02 | Budget edit/delete/restore | Accepted web | W/N/B/Q lifecycle | E/K4 | Native parity |
| BUD-03 | Other periods/rollover | Not selected under current contract | Explicit client financial decision or no UI | E | Monthly/no-rollover remains authoritative |
| REC-01 | Recurring suggestions | Accepted web | W/N/B/Q deterministic parity | E/K4 | Native parity |
| REC-02 | Subscription lifecycle | Preview-ready | W/N/B/Q pause/cancel/review/delete | A/E/K4 | G-02/G-03/G-05 |
| REC-03 | Due dates/price changes | Preview-ready/partial | W/N/B/Q exact detection and correction | E/K4 | Merge stack then polish |
| INS-01 | Monthly insights/trends | Accepted web | W/N/B/Q transparent formulas | E/K5 | Native parity |
| INS-02 | Advanced drilldowns | Partial | W/N/Q accessibility and source reconciliation | E/K5 | Implement remaining views |
| GOAL-01 | Savings goals | Preview-ready | W/N/B/Q manual contributions only | A/E/K5 | G-02/G-03/G-05 |
| NW-01 | Assets/liabilities | Preview-ready | W/N/B/Q manual values and compatible links | A/E/K5 | G-02/G-03/G-05 |
| NW-02 | Snapshots/trend | Preview-ready | W/N/B/Q immutable snapshots and no inferred values | A/E/K5 | G-02/G-03/G-05 |
| REM-01 | In-app reminders | Preview-ready | W/N/B/Q opt-in, dedupe, done/dismiss | A/E/K5 | G-02/G-03/G-05 |
| REM-02 | Push notifications | Planned/external | N/B/Q/S permission, privacy-safe catalogue and delivery | L | G-12/Apple credentials |

### 3.6 Household, accountant, documents and help

| ID | Capability | Current state | Completion evidence | Master-plan path | Immediate gate |
|---|---|---|---|---|---|
| HH-01 | Household/workspace | Preview-ready | W/N/B/Q private-by-default lifecycle | A/F/K8 | G-02/G-03/G-05 |
| HH-02 | Invitations/membership roles | Preview-ready without delivery | W/N/B/Q abuse, expiry, role and removal tests | A/F/K8 | Invitation provider gate |
| HH-03 | Shared/private boundaries | Preview-ready | W/N/B/Q explicit sharing and immediate revocation | A/F/K8 | G-02/G-03/G-05 |
| ACC-01 | Read-only accountant role | Preview-ready | W/N/B/Q selected/time-bound scope and wording | A/F/K8 | G-02/G-03; delivery provider |
| DOC-01 | Secure document/receipt storage | Metadata Preview-ready; bytes planned | W/N/B/Q/S provider, quarantine, malware, retention | G/K9 | G-12/G-14 |
| DOC-02 | Record/evidence links | Preview-ready metadata | W/N/B/Q secure objects, export/delete | A/G/K9 | G-02/G-03 then storage |
| DOC-03 | OCR/extraction | Planned/external | W/N/B/Q reviewed suggestions and no mutation | G/K9 | OCR provider/privacy decision |
| HELP-01 | Help/privacy guidance | Merged foundation | W/N/Q/S current facts and legal review | N/O | G-14 |
| HELP-02 | Tutorials/onboarding | Partial | W/N/Q complete-product curriculum | N/K/O | Feature parity first |
| HELP-03 | FAQ/supported-bank guide | Partial | W/N/Q truthful matrix and limits | C2/N/O | Format matrix |
| HELP-04 | Safe feedback/support | Planned/external | W/N/B/Q/S support process with no private-file intake | N/O | Support/provider/legal decision |

### 3.7 Optional Basiq and AI

| ID | Capability | Current state | Completion evidence | Master-plan path | Immediate gate |
|---|---|---|---|---|---|
| BAS-01 | Basiq sandbox enrichment | Prepared hard-disabled | W/N/B/Q payload minimisation, sandbox and fallback | H/K10 | Provider/cost/privacy approval |
| BAS-02 | Enhanced lookup | Prepared hard-disabled | W/N/B/Q opt-in, local-first, cache/delete | H/K10 | Separate Production approval |
| AI-01 | AI categorisation suggestions | Prepared hard-disabled | W/N/B/Q opt-in, minimum payload, confirmation | I/K10 | Provider/model/privacy approval |
| AI-02 | Natural-language search | Planned/prepared boundary | W/N/B/Q authorization, limits and ambiguity | I/K10 | Query/provider decision |
| AI-03 | Explanations/anomalies | Planned/prepared boundary | W/N/B/Q no advice/no mutation | I/K10 | Provider/financial wording review |

### 3.8 Native, Store, commercial and release operations

| ID | Capability | Current state | Completion evidence | Master-plan path | Immediate gate |
|---|---|---|---|---|---|
| NAT-01 | Native platform decision/proof | Architecture accepted; proof pending | N/B/Q deterministic bootstrap and parity proof | J | G-10 |
| NAT-02 | Native Clerk auth/session | Planned | N/B/Q/S real-device auth/recovery/expiry | J/O | Clerk/Apple operator setup |
| NAT-03 | Secure CSV picker/import | Planned | N/Q system picker, temp cleanup, parity | J/K3 | Bootstrap proof |
| NAT-04 | Native exports/share | Planned | N/B/Q privacy warnings and cleanup | J/K7 | Bootstrap proof |
| NAT-05 | Biometrics/passcode | Planned/external | N/Q locked-device/sign-out behaviour | L | Device-feature approval |
| NAT-06 | Deep links/share extension | Planned/external | N/B/Q authorization and privacy | J/L | Device-feature approval |
| NAT-07 | Widgets | Planned/external | N/Q/S locked-device privacy and refresh | L | Device-feature/Apple approval |
| STORE-01 | Icon/assets/screenshots | Partial planning | N/Q/S final synthetic assets for required devices | O | Native UI complete |
| STORE-02 | App privacy metadata | Prepared worksheet | S: final provider inventory and legal review | O | G-12/G-14 |
| STORE-03 | TestFlight/review account | Planned/external | N/Q/S signed RC and non-expiring synthetic account | O | G-15/G-16 |
| COMM-01 | Plans/pricing/entitlements | Prepared hard-false | W/N/B/Q/S approved matrix or explicit free launch | M/O | Client commercial decision |
| COMM-02 | App Store purchases/restore | Planned/external | N/B/Q/S StoreKit lifecycle | M/O | G-13/G-15 |
| COMM-03 | Web billing/subscriptions | Planned/external | W/B/Q/S webhooks, refunds, GST/support | M/O | Provider/commercial approval |
| OPS-01 | Privacy-safe monitoring/errors | Prepared design | B/Q/S provider, redaction, alerts and retention | N | Monitoring decision |
| OPS-02 | Rate limiting/firewall | Partial/prepared | B/Q provider/app controls and abuse tests | N | Vercel plan decision |
| OPS-03 | Backup/restore rehearsal | Prepared runbook | B/Q exact operator evidence | B/N | G-07 |
| OPS-04 | Incident response/rollback | Prepared runbooks | B/Q/S rehearsal and responsible owners | N/O | Monitoring/support decisions |
| LEG-01 | Reviewed Privacy Policy/Terms | Draft factual pack | W/N/S professional review and published URLs | N/O | G-14 |
| LEG-02 | Tax/report disclaimers | Draft/partial | W/N/S qualified Australian review | D/N/O | G-14 |
| QA-01 | Full regression/bank matrix | Strong baseline; expands | Q: exact final web/native/provider matrix | Every phase/N/O | Scope completion |
| QA-02 | Accessibility audit | Partial baseline | Q: WCAG, VoiceOver, Dynamic Type, keyboard/pointer | L/N/O | Native and complete UI |
| QA-03 | iPhone/iPad real-device matrix | Planned | Q/S required physical-device evidence | L/O | G-15/G-16 |
| QA-04 | Security/penetration review | Planned/external | Q/S no unresolved critical/high issues | N/O | G-14/security provider |
| REL-01 | Private complete-product beta | Planned/external | Q/S approved users, support and defect closure | N/O | Explicit invitation/TestFlight approval |
| REL-02 | App Store launch | Hard stop | S: exact submission and public-release approval | O | G-17 |

## 4. External decision and operator dashboard

| Decision | Class | Current default | Needed before | Repository-safe work while blocked |
|---|---|---|---|---|
| D-001 Release scope | Client | All features remain in plan; no misleading dormant UI | Final scope freeze | Complete contracts, adapters, tests and decision packages |
| D-010 Bank format priority/evidence | Client/evidence | Existing four named profiles plus generic fallback | C2 completion | Public research and synthetic fixture framework |
| D-013 Tax/accounting terminology | Professional | No advice or automatic deductibility | D finalisation | Reconciliation fixtures and factual wording pack |
| D-014 Property metadata minimisation | Client/privacy | Nicknames/minimum fields | D metadata expansion | Schema alternatives and privacy assessment |
| D-023 Push semantics | Client/privacy/provider | In-app only; private lock-screen text | L activation | Message catalogue and local adapter tests |
| D-030 Household model | Resolved contract | Existing records private; granular explicit sharing | Production activation | Synthetic isolation and lifecycle tests |
| D-032 Accountant scope | Resolved contract/pro review | Read-only, selected, time-bound, revocable | Real invitations | Wording and synthetic authorization tests |
| D-040 Storage provider | Provider/cost/security | No provider selected | G uploads | Provider-neutral adapter, threat model and quotas |
| D-041 Retention/deletion | Legal/privacy | No final schedule | G/N/O | Retention alternatives and deletion matrix |
| D-042 OCR | Optional provider | No OCR active | G OCR | On-device/external comparison and review UX |
| D-050 Basiq | Optional provider | Off/local-first | H sandbox/Production | Payload and adapter tests |
| D-051 AI model | Optional provider | Off/no external model | I activation | Provider-neutral schemas and privacy tests |
| D-060 Native framework | Resolved | Expo/React Native/Expo Router | J | Bootstrap and parity proof |
| D-061 Apple identity | Operator/commercial | None | Signing/App Store records | Checklists and metadata drafts only |
| D-062 Bundle/metadata | Client/brand | SpendGrove/Groveware planning names | O | Synthetic copy/assets worksheet |
| D-063 Device features | Client/privacy | Included in plan, separately gated | L | Contracts and fallback UX |
| D-064 TestFlight/submission | Explicit approvals | None authorised | O | Complete RC and checklists only |
| D-070 Free versus paid | Client/commercial | No paywall; baseline available | M/O | Entitlement tests remain hard-false |
| D-080 Monitoring | Provider/privacy/cost | Provider off | N/private beta | Redacted event catalogue and runbooks |
| D-082 Firewall/rate limits | Provider/plan | Existing app/platform baseline | N/private beta | Abuse tests and compensating controls |
| D-083 Backup/restore | Operator/provider | Runbook only | B Production migration | Synthetic rehearsal plan |
| D-084 Support handling | Client/legal/operator | No final channel/owner | N/O/beta | Safe support protocol and FAQ |

## 5. Readiness definitions

### Production-ready

Production-ready means the selected web/backend release has proven environment mapping, backups, approved migrations, owner isolation, export/deletion, monitoring/support decisions and merged-main deployment evidence. It does not imply native, TestFlight or App Store readiness.

### TestFlight-ready

TestFlight-ready means Production-ready plus an exact signed native release candidate, complete native feature parity, privacy-safe device capabilities, App Store Connect beta metadata, review/test accounts, real-device/accessibility evidence and explicit upload approval.

### Submission-ready

Submission-ready means TestFlight-ready plus accepted beta results, resolved high-severity defects, final legal/privacy/tax/security reviews, complete screenshots/metadata/privacy answers/review notes, working Production backend and explicit client approval to submit the exact build.

### Client-accepted

Client-accepted is an explicit decision by the client after the relevant consolidated review. Technical delivery, a green Preview, a TestFlight build or an App Review approval does not automatically mark a phase accepted.

## 6. Automation execution order

Each autonomous run must:

1. Inspect G-01 through G-05 first and advance the activation stack only when its exact gates are satisfied.
2. Advance G-00 documentation and independent traceability work while Actions or authenticated QA remain blocked.
3. After G-05, begin G-06/G-07 repository-safe evidence while stopping before G-08 execution.
4. Select the earliest incomplete feature row whose dependencies are satisfied.
5. Reference the affected feature IDs and master-plan phase in every PR.
6. Update this dashboard when a feature changes state, a gate closes, evidence changes or a new external dependency is identified.
7. Avoid repeated deployment/CI retries that do not test a substantive correction.
8. Never convert an external blocker into an unsafe shortcut.

## 7. Current next actions

1. Await GitHub Actions execution capacity; run one exact-head Application Verification when jobs can execute.
2. Complete authenticated synthetic Preview QA for PRs #231–#241 using synthetic users only.
3. Review and merge PRs #231–#241 in order after both gates pass.
4. Merge PR #242 when its documentation diff is self-reviewed and repository checks permit.
5. Prepare the Production mapping and backup/restore evidence package without accessing Production rows or executing migrations.
