# Complete Product Feature Register

Audit date: 17 July 2026  
Purpose: one register for every completed, partial, dormant, missing and optional SpendGrove capability planned by the master specification or later approved decisions.

## How to read this register

Status codes:

- C: complete and technically verified.
- P: partially implemented.
- D: structurally present/dormant.
- W: implemented on web only.
- O: documentation/planning only.
- M: missing.
- X: intentionally deferred pending approval.
- B: blocked by provider, commercial, legal or operator decision.

Surface codes use Web / Mobile web / Desktop / Native / Backend / Schema / Tests.

Privacy classes:

- L: low, aggregate or preference data.
- F: financial record data.
- I: identity/account data.
- H: high-sensitivity financial/document/shared-access data.
- E: external-provider disclosure.

Migration:

- N: no schema change expected.
- A: additive migration likely.
- G: exact schema decision gate required.
- P: provider/configuration gate in addition to any schema work.

Release importance:

- R: required for the selected complete-product release.
- S: selected optional feature; complete only if client confirms inclusion.
- C: conditional commercial capability.

Acceptance shorthand:

- OWN: server ownership/isolation tests.
- FIN: accepted financial calculations and reconciliation.
- PRIV: no raw/private source exposure and deletion/export coverage.
- A11Y: keyboard, screen reader, contrast and responsive evidence.
- OPS: deployment, recovery and operational evidence.
- DEV: real-device/native evidence.

The “Source” column uses MS for the v2.0.1 master specification, HD for historical decisions/contracts and CD for the 17 July 2026 complete-product direction.

## Platform, authentication and lifecycle

| ID | Feature / user value | Source | Status and surfaces | Backend/schema/tests | Privacy / financial | Dependencies / migration | Release / phase / PR sequence | Acceptance / blocker |
|---|---|---|---|---|---|---|---|---|
| PLAT-01 | Responsive web product | MS, HD | C; Web/Mobile web complete, Desktop polish | Backend C; schema N; broad tests | F; preserve all rules | N | R; maintained through 6–15 | A11Y, FIN, OPS |
| PLAT-02 | Desktop shell and wide-screen efficiency | MS, CD | P; responsive shell exists, desktop workflows incomplete | Shared backend; N initially | F | N | R; 6.0–6.1 | A11Y; no mobile regression |
| PLAT-03 | Desktop Import Centre | MS, CD | C/W; PR #168 | Existing import services reused; N; tests C | H/F | N | R; 6.1 delivered | PRIV, FIN, performance; client review deferred |
| PLAT-04 | Desktop transaction ledger | MS, CD | C/W foundation; PR #169, mobile list preserved | Existing owned month queries; N; tests C | F | N | R; 6.2 delivered | OWN, A11Y; client review deferred |
| PLAT-05 | Safe desktop bulk workflows | MS, CD | P/B; contract and unexecuted schema merged, app workflow absent | Additive operation layer files; migration not run | F/H | isolated Preview/operator gate | R; 6.3 blocked | FIN, OWN, partial failure, undo; run 29555735427 stopped before deploy |
| PLAT-06 | Native iPhone application | MS, CD | O | Shared API available; native schema N initially | H/F/I | framework/client decision; P | R; 13.0–13.3 | DEV, PRIV, OWN |
| PLAT-07 | iPad-compatible application | MS, CD | O | Shared API available | H/F/I | native choice | R; 13.4 | DEV, adaptive layout |
| AUTH-01 | Clerk sign-in/sign-up/session | MS, HD | C/W | C; current User schema; tests C | I | Production operator verification | R; 15.0 | OWN, session expiry |
| AUTH-02 | Email verification/reset/provider flow | MS, HD | P/C via Clerk; needs release verification | Provider-managed | I/E | Clerk Production config | R; 15.0 | operator and review-account check |
| AUTH-03 | Protected finance routes | HD | C/W | middleware + resource checks; tests C | I/F | N | R; maintained | direct URL/negative tests |
| AUTH-04 | User provisioning and owner isolation | MS, HD | C | C on current models; tests C | I/F | extend to future models | R; every phase | OWN |
| AUTH-05 | Browser-local prototype preservation | HD | C/W | keys documented; no auto migration | H | no deletion/migration without contract | R; maintained | PRIV |
| LIFE-01 | Complete account export | MS, HD | C for current models | server export; extend per new model | H | future models must register | R; 10–12, 15 | OWN, PRIV |
| LIFE-02 | Account deletion | MS, HD | C for current models | coordinated lifecycle; future providers pending | H/I/E | provider deletion extensions | R; 10–12, 15 | reauth, partial-failure recovery |
| LIFE-03 | Retention/backups/deletion propagation | MS, HD | O/P | runbook exists; provider proof incomplete | H | provider/operator | R; 15.0–15.3 | OPS |
| LIFE-04 | Data recovery and grace-period policy | MS, CD | O/B | no product grace model | H | client/legal decision; A/P possible | R decision; 15 | legal/retention gate |

## Transactions and imports

| ID | Feature / user value | Source | Status and surfaces | Backend/schema/tests | Privacy / financial | Dependencies / migration | Release / phase / PR sequence | Acceptance / blocker |
|---|---|---|---|---|---|---|---|---|
| TX-01 | Manual create/edit | MS, HD | C/W | C; Transaction model; tests C | F | N | R; maintain | FIN, OWN |
| TX-02 | Signed money/type invariant | HD | C | shared validation; tests C | F | N | R; maintain | FIN |
| TX-03 | Split transactions | MS, HD | C/W | parent/child fields; tests C | F | N | R; maintain | FIN, no double count |
| TX-04 | Transfer classification | MS, HD | C/W | TRANSFER type; tests C | F | N | R; maintain | FIN |
| TX-05 | Durable transfer pair/link | MS, CD | O/B; exact contract and schema assessment complete | TransferLink proposed; implementation absent | F | A/G; isolated Preview gate | R; 7.3 contract delivered | exact opposite amount, two-day window, user confirmation, unlink, no double count |
| TX-06 | Delete/restore lifecycle | MS, HD | C/W | soft-delete state; tests C | F | N | R | recovery and audit |
| TX-07 | Search/month/category filters | MS, HD | C/W | month queries; tests C | F | N | R; 6.2 polish | OWN, A11Y |
| TX-08 | Saved filters/views | MS, CD | M | no model | L/F | A/G or browser preference decision | R; 6.2 | ownership/export/deletion |
| TX-09 | Bulk categorisation/property updates | MS, CD | M durable ledger | server bulk action needed | F/H | A/G for journal/undo | R; 6.3 | FIN, OWN, partial failure |
| TX-10 | Transaction operation undo | MS, CD | M | no operation journal | F/H | A/G | R; 6.3/7.4 | strict eligibility |
| TX-11 | Audit history UI | MS | P; audit events exist, limited UI | AuditEvent limited enums | H | A/G for richer events | R; 6/10/15 | PRIV, safe metadata |
| IMP-01 | Privacy-first browser parse/scanning | MS, HD | C/W | client parser; tests C | H | N | R | raw file not retained |
| IMP-02 | Generic/manual mapping | MS, HD | C/W | parser/mapping core; tests C | H/F | N | R; 7.2 polish | fixtures/A11Y |
| IMP-03 | Saved import profiles | MS, HD | C/W | BankImportProfile; tests C | F | N | R | OWN |
| IMP-04 | Review-before-commit | MS, HD | C/W | transient review + commit validation | H/F | N | R | PRIV, FIN |
| IMP-05 | Import/Skip/Merge | MS, HD | C/W | C; tests C | F | N | R | FIN/idempotency |
| IMP-06 | Duplicate detection | MS, HD | C/W | deterministic score; tests C | F | N | R | no threshold drift |
| IMP-07 | Import history | MS, HD | C/W | ImportBatch/Row; tests C | H/F | N | R | OWN, privacy |
| IMP-08 | Import undo | MS, CD | O/B; exact contract and schema assessment complete | operation/item models proposed; implementation absent | F/H | A/G; isolated Preview gate | R; 7.4 contract delivered | future imports only; edits/links/merge safety; no backfill |
| IMP-09 | CommBank named profile | MS, HD | C | parser + fixtures | H/F | N | R; regression | fixture matrix |
| IMP-10 | ANZ named profile | MS, HD | C | parser + fixtures | H/F | N | R | fixture matrix |
| IMP-11 | NAB named profile | MS, HD | C | parser + fixtures | H/F | N | R | fixture matrix |
| IMP-12 | Westpac named profile | MS, HD | C | parser + fixtures | H/F | N | R | fixture matrix |
| IMP-13 | Remaining 15 target-bank profiles | MS, CD | P/M; generic fallback only | parser profiles/fixtures missing | H/F | N | R; 7.1 batches | synthetic samples/format truth |
| IMP-14 | Loan CSV format matrix | MS, HD | P; truthful two-mode registry and Help delivered in PR #181 | accepted structural modes exist; named lender coverage incomplete | H/F | N mostly | R; 7.2 delivered/8.1 expand | named lender evidence and synthetic samples |
| IMP-15 | Safe bank-format contribution | MS, CD | M | no intake workflow | H | support/privacy contract | R; 7.6/15.2 | never request real CSV |
| IMP-16 | Parser quality reporting | CD | P; typed registry/quality boundaries and truthful Help exist | no private quality dashboard | L | N | R; 7.1 delivered/7.6 expand | no private data; safe contribution workflow missing |

## Merchants and categories

| ID | Feature / user value | Source | Status and surfaces | Backend/schema/tests | Privacy / financial | Dependencies / migration | Release / phase / PR sequence | Acceptance / blocker |
|---|---|---|---|---|---|---|---|---|
| MER-01 | Clean merchant names | MS, HD | C/W | deterministic normalization | F | N | R | no raw narration persistence expansion |
| MER-02 | Merchant aliases | MS, HD | C/W | MerchantAlias; tests C | F | N | R; 6.4 polish | OWN |
| MER-03 | Merchant profiles | MS, HD | C/W for safe name/category edit and reversible lifecycle; PR #184 | existing owner-scoped model/actions; tests C | F | N for delivered profile completion | R; 7.5 delivered | OWN; merge/history remains separately blocked |
| MER-04 | User-confirmed category rules | MS, HD | C/W | MerchantRule; tests C | F | N | R | direction compatibility |
| MER-05 | Local keyword/brand suggestions | HD | C/W | deterministic client/server helpers | F | N | R | false-positive tests |
| MER-06 | Apply to same merchant | MS, CD | P in review/rules, incomplete durable bulk | existing rules + new bulk action | F | A/G if undo journal | R; 6.3/7.5 | explicit scope/preview |
| MER-07 | Merchant merge/history | MS, CD | P/D | server structures exist; complete workflow absent | F/H | A/G likely | R; 7.5 | reversible, no unrelated merge |
| MER-08 | Default Property/tax profile fields | MS | M | schema absent | F/H | Phase 8 contract; A/G | R; 8.1–8.2 | no automatic tax conclusion |
| CAT-01 | Seeded/custom categories | MS, HD | C/W | Category model/actions; tests C | F | N | R | direction compatibility |
| CAT-02 | Category management workspace | MS, CD | C/W foundation; Settings consolidation PR #174 | existing owned actions/components; tests C | F | N | R; 6.4 foundation delivered | safe archive/restore; client review deferred |

## Loans, Properties and reports

| ID | Feature / user value | Source | Status and surfaces | Backend/schema/tests | Privacy / financial | Dependencies / migration | Release / phase / PR sequence | Acceptance / blocker |
|---|---|---|---|---|---|---|---|---|
| LOAN-01 | Home/personal Loan Accounts | MS, HD | C/W | LoanAccount; tests C | H/F | N | R | OWN |
| LOAN-02 | Loan repayment imports | MS, HD | C/W | LoanRepayment; tests C | H/F | N | R; format expansion 7.2 | FIN |
| LOAN-03 | Principal/interest/fees/balances | MS, HD | C/W | integer cents; tests C | H/F | N | R | reconciliation |
| LOAN-04 | Repayment reconciliation both orders | MS, HD | C/W | LoanReconciliationLink; tests C | H/F | N | R | no double count |
| LOAN-05 | Manual matching/correction/unlink | MS, HD | C/W | actions/tests C | H/F | N | R | OWN, reversibility |
| LOAN-06 | Additional lender/format coverage | MS, CD | P/M | parser expansion | H/F | N mostly | R; 7.2/8.1 | samples/fixtures |
| LOAN-07 | Advanced loan reports | MS, CD | M/P | data exists, report suite absent | H/F | A/G possible | R; 8.3 | FIN/professional review |
| PROP-01 | Properties and Loan links | MS, HD | C/W | Property/Loan fields; tests C | H/F | N | R | OWN |
| PROP-02 | Property transaction links | MS, HD | C/W | PropertyTransactionLink; tests C | H/F | N | R | cardinality/no double count |
| PROP-03 | Property records and export | MS, HD | C/W | report actions/export; tests C | H/F | N | R | FIN |
| PROP-04 | Complete Property metadata | MS | P | nickname/usage only | H | A/G | R; 8.1 | minimization/address decision |
| TAX-01 | EOFY Property reporting | MS, HD | P | FY report exists; full planned pack incomplete | H/F | A/G likely | R; 8.0–8.3 | tax professional review |
| TAX-02 | Tax-preparation classification | MS | D/P; review model exists, no full workflow | PropertyReportReview limited | H/F | A/G | R; 8.2 | no advice/deductibility |
| REP-01 | Advanced everyday reports | MS, CD | M/P | monthly aggregates exist | F | N/A by report | R; 8.3 | source reconciliation |
| REP-02 | Accountant-ready export pack | MS, CD | M | no pack manifest | H/F | A/G maybe | R; 8.4 | export/privacy/pro review |
| REP-03 | Document evidence list | MS, CD | M | depends on Phase 11 | H | Phase 11 | R; 8.4/11.2 | secure links |
| REP-04 | Accountant collaboration | MS, CD | M | no role/access model | H/I | Phase 10 A/G | S/R if selected; 10.3 | least privilege |

## Everyday finance and net worth

| ID | Feature / user value | Source | Status and surfaces | Backend/schema/tests | Privacy / financial | Dependencies / migration | Release / phase / PR sequence | Acceptance / blocker |
|---|---|---|---|---|---|---|---|---|
| BUD-01 | Monthly category budgets | MS, HD | C/W | CategoryBudget; tests C | F | N | R | FIN |
| BUD-02 | Budget edit/delete/restore | MS, HD | C/W | lifecycle tests C | F | N | R | OWN |
| BUD-03 | Additional periods/rollover | MS | X | monthly/no rollover accepted | F | new financial contract; A/G | S; 9.0–9.2 | client formula decision |
| REC-01 | Recurring suggestions | MS, HD | C/W | deterministic engine; tests C | F | N | R | review required |
| REC-02 | Confirmed subscription management | MS, HD | C/W foundation | RecurringItem | F | A for richer lifecycle | R; 9.1 | lifecycle contract |
| REC-03 | Due dates/price changes | MS, CD | P/M | some next date, no full workflow | F | A/G | R; 9.1 | deterministic rules |
| INS-01 | Monthly insights/trends | MS, HD | C/W | shared aggregates; tests C | F | N | R; 9.3 expand | transparent formulas |
| INS-02 | Advanced insight/report drilldowns | MS, CD | P | category chart exists | F | N/A | R; 9.3 | FIN/A11Y |
| GOAL-01 | Savings goals | MS, CD | M/decision | no model | F | rules + A/G | S; 9.0/9.2 | client scope |
| NW-01 | Assets and liabilities | MS, CD | M | no schema | H/F | A/G | R under complete direction; 9.4 | valuation/source rules |
| NW-02 | Net-worth snapshots/trend | MS, CD | M | no schema | H/F | NW-01 | R; 9.4 | no inferred valuation/advice |
| REM-01 | In-app reminders | MS, CD | M | no schedule model | F | rules + A/G | R; 9.5 | timezone/opt-out |
| REM-02 | Push notifications | MS, CD | M/B | no native/provider integration | H/E | Phase 13/provider; P | R if selected; 9.5/13.3 | consent/private content |

## Household, documents, help and optional intelligence

| ID | Feature / user value | Source | Status and surfaces | Backend/schema/tests | Privacy / financial | Dependencies / migration | Release / phase / PR sequence | Acceptance / blocker |
|---|---|---|---|---|---|---|---|---|
| HH-01 | Household/workspace | MS, CD | M | no model | H/I/F | major A/G | R under complete direction; 10.0–10.1 | privacy/migration decision |
| HH-02 | Invitations/membership roles | MS, CD | M | no model | H/I | HH-01 | R; 10.1 | abuse/revocation tests |
| HH-03 | Shared/private record boundaries | MS, CD | M | current owner-only model | H/F | per-model sharing contract | R; 10.2 | no implicit sharing |
| ACC-01 | Read-only accountant role | MS, CD | M | no grants | H/I/F | HH foundation A/G | S/R if selected; 10.3 | selected scope/revocation |
| DOC-01 | Secure document/receipt storage | MS, CD | M/B | no storage/model | H/E | provider/cost/security; A/P | R under complete direction; 11.0–11.1 | malware/encryption/retention |
| DOC-02 | Record/Property/Loan evidence links | MS, CD | M | no link models | H/F | DOC-01; A/G | R; 11.2 | OWN/export/delete |
| DOC-03 | OCR/extraction | MS, CD | X/B | absent | H/E | separate provider/privacy approval | S; 11.3 | user confirmation |
| HELP-01 | Help and privacy guidance | MS, HD | C/W foundation | content routes | I/H | legal update later | R | accessibility/current facts |
| HELP-02 | Tutorials/onboarding curriculum | MS, CD | P | onboarding exists | L | N | R; 15.2 | complete-product coverage |
| HELP-03 | FAQ/supported-bank guide | MS, CD | P/M | help partial | L | Phase 7 matrix | R; 7.6/15.2 | accurate limits |
| HELP-04 | Safe feedback/support | MS, CD | M/B | no ticket provider/workflow | H/E | contact/provider/privacy decision | R; 15.2 | prohibit real CSV/screenshots |
| BAS-01 | Basiq sandbox enrichment | MS, CD | X/B | absent | E/H | provider/cost/terms/secrets | S; 12.0–12.1 | cleaned descriptor only |
| BAS-02 | Opt-in enhanced lookup | MS, CD | X/B | absent | E/H | BAS-01 + Production approval | S; 12.2 | local-first/fallback-only |
| AI-01 | AI categorisation suggestions | MS, CD | X/B | absent | E/H/F | provider/model/cost/privacy | S; 12.0/12.3 | opt-in/review/no advice |
| AI-02 | Natural-language search | MS, CD | X/B | absent | E/H | AI gate | S; 12.3 | minimum data/authorization |
| AI-03 | Explanations/anomaly suggestions | MS, CD | X/B | absent | E/H/F | AI gate + financial contract | S; 12.3 | no silent changes |

## Native, commercial and release operations

| ID | Feature / user value | Source | Status and surfaces | Backend/schema/tests | Privacy / financial | Dependencies / migration | Release / phase / PR sequence | Acceptance / blocker |
|---|---|---|---|---|---|---|---|---|
| NAT-01 | Native platform decision/proof | CD | O/B | no native repo | H/I | client decision | R; 13.0 | compare Capacitor/Expo-RN/SwiftUI |
| NAT-02 | Native Clerk auth/session | MS, CD | M | shared server ready | I/E | platform/Clerk config | R; 13.1 | secure token/session |
| NAT-03 | Secure CSV file picker/import | MS, CD | M | web parser reusable assessment | H | platform filesystem | R; 13.2 | temp-file privacy |
| NAT-04 | Native exports/share | MS, CD | M | export APIs exist | H | platform share/files | R; 13.2 | no unintended exposure |
| NAT-05 | Biometrics/passcode | CD | X | absent | I/H | platform/client approval | S; 13.3 | device security |
| NAT-06 | Deep links/share extension | CD | X | absent | H | platform/client approval | S; 13.3 | authorization/privacy |
| NAT-07 | Widgets | CD | X | absent | H | client approval | S; 13.3 | no private lock-screen data |
| STORE-01 | App icon/assets/screenshots | MS, CD | P/O; logo exists | no app record | L | native UI complete | R; 13.5 | device evidence |
| STORE-02 | App privacy metadata | MS, CD | O | no App Store record | H/I/E | complete provider inventory/legal | R; 13.5/15.2 | Apple/operator |
| STORE-03 | TestFlight/review account | MS, CD | M/B | no build | I/H | Apple credentials/native complete | R; 15.5 | operator gate |
| COMM-01 | Plans/pricing/entitlements | MS, CD | M/B | no models | I/F | client commercial decision; A/G | C; 14 | pricing/legal |
| COMM-02 | App Store purchases/restore | MS, CD | M/B | absent | I/F/E | StoreKit/App Store | C; 14 | Apple rules |
| COMM-03 | Web billing/subscriptions | MS, CD | M/B | absent | I/F/E | provider/pricing/secrets | C; 14 | payment/GST/support |
| OPS-01 | Privacy-safe monitoring/errors | MS, HD | O/B | no provider enabled | H/E | provider/cost/privacy | R; 15.3 | redaction/alerts |
| OPS-02 | Rate limiting/firewall hardening | MS, HD | P/O | request limits exist; platform controls undecided | H | provider/plan decision | R; 15.1 | abuse tests |
| OPS-03 | Backup/restore rehearsal | MS, HD | O/B | runbook exists | H | Neon plan/operator | R; 15.0 | evidence |
| OPS-04 | Incident response/rollback | MS, HD | P/O | runbooks partial | H | monitoring/operator | R; 15.3/15.5 | drill |
| LEG-01 | Professionally reviewed Privacy Policy/Terms | MS, CD | P/B; product disclosures exist | content only | I/H/E | legal review/business facts | R; 15.2 | external review |
| LEG-02 | Tax/report disclaimer review | MS, CD | P/B | no-advice copy exists | F/H | tax/legal professional | R; 8.0/15.2 | external review |
| QA-01 | Full regression and bank matrix | MS, HD | C baseline; expands with scope | 722 tests at PR #184 exact head | H/F | all phases | R; every QA/15.4 | exact-head green |
| QA-02 | Accessibility audit | MS, HD | P/C baseline | current checks | L/H | final full-app review | R; 15.4 | WCAG/device |
| QA-03 | iPhone/iPad real-device matrix | MS, CD | M | no native build | H | Phase 13 | R; 13/15 | DEV |
| QA-04 | Security/penetration review | MS, CD | M/B | internal tests only | H | external provider/professional | R; 15.1 | no high severity |
| REL-01 | Private complete-product beta | CD | M | no invitation authorised | H/I | Phases 6–15 | R; 15.4 | explicit approval |
| REL-02 | Public/App Store launch | CD | M/hard stop | not authorised | H/I/E | final client approval | R final | submission/launch gate |

# Cross-cutting financial rules to preserve

Every future feature must retain:

- integer cents internally;
- Australian calendar dates and explicit financial-year boundaries;
- signed direction and transfer precedence;
- review-before-commit;
- split-child inclusion and counted-parent exclusion;
- everyday transaction as the sole cashflow record for reconciled Loan repayments;
- owner-scoped active/non-deleted records;
- no automatic tax/deductibility or regulated advice;
- no silent AI/provider-driven financial changes.

# Cross-cutting privacy rules to preserve

- no full CSV retention;
- no raw source narration or excluded bank identifiers in logs/audit/provider payloads;
- browser-local data remains isolated unless a separately approved migration exists;
- every new model enters account export/deletion and ownership matrices;
- shared access is explicit and revocable;
- documents and external enrichment require minimum-data contracts;
- monitoring and notifications contain no sensitive financial detail by default.

# Register maintenance rule

Each implementation PR must update affected rows with:

- exact PR/merge evidence;
- final schema/migration name;
- test counts;
- provider/environment status;
- remaining blocker;
- deferred client test reference.

A feature is not “complete” merely because a schema or component exists; the user workflow, authorization, privacy, financial integrity, tests and release evidence must all be present.
