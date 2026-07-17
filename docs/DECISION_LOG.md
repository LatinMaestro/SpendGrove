# Decision Log

Material decisions should be recorded here. This prevents future agents from re-litigating settled choices.

| Date | Decision | Reason | Approved by | Implementation impact |
|---|---|---|---|---|
| 2026-07-15 | Accept PR #149 and activate Phase 5 Milestone 1 only | Establish a controlled production-readiness programme while addressing the critical Next.js security and environment-truth gates before later account-lifecycle or release work | Client | Phase 5 is active for PRs 5.1A–5.1C only: target an account-based Australian web private beta; require authenticated finance routes while preserving browser-local data; upgrade only to patched supported Next.js 15.x (15.5.18 minimum); keep analytics off; no provider plan, schema, migration, Production data/configuration, native/App Store or Milestones 2–6 work; PR 5.1B requires client UX approval before merge |
| 2026-06-08 | SpendGrove is CSV-first and privacy-first with no default live bank linking | Core product differentiator and user trust model | Client | Import workflow and product copy must reinforce no-bank-login promise |
| 2026-06-08 | Use account-based architecture from inception | Future iOS/iPad/web sync without migration | Client | Data models should include user ownership even during prototype |
| 2026-06-08 | Adopt Household Strategy Option A | Avoid MVP complexity while preserving future household mode | Client | Phase 1 is one account per user; household entities are future-ready only |
| 2026-06-08 | Basiq is optional, sandbox-first, local-first and fallback-only | Preserve privacy and reduce third-party disclosure | Client | Do not implement production Basiq until explicit approval |
| 2026-06-08 | Payments/paywalls require future explicit approval | Avoid premature monetisation complexity | Client | Do not implement payment provider or entitlements without approval |
| 2026-06-08 | Approve Phase 1 technical stack: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma and PostgreSQL | Supports mobile-first web development, Vercel preview workflow, type-safe data modelling and future account-ready architecture | Client | Initialise Phase 1 using this stack; update README commands; use Prisma/PostgreSQL for data model foundation |
| 2026-06-08 | Use stubbed single-user authentication for Phase 1 with no third-party services | Keeps MVP foundation focused while preserving future auth/sync readiness and avoiding premature provider/security complexity | Client | Add user ownership fields and local/dev current-user handling only; do not implement production auth, analytics, Basiq, AI, payments or other third-party services in Phase 1 |
| 2026-06-09 | Approve Phase 1 Task 1.2 account-ready Prisma/PostgreSQL data model and Zod validation foundation | Establishes user-owned transactions, categories, safe import review rows, local merchant rules and privacy-aware audit metadata before feature CRUD/import implementation | Client | Store money as integer cents; require user ownership; store safe import metadata and sanitised review rows only; exclude split parents from totals; preserve manual/import source during merges; defer loans, property, tax, recurring, Basiq, payments and AI |
| 2026-06-09 | Approve Phase 1 Task 1.3 privacy-first onboarding and settings foundation with Simple Mode default | Introduces the product promise and Australian defaults without implying production accounts or enabling unfinished advanced modules | Client | Persist prototype preferences in browser storage only; keep Simple Mode and analytics opt-out on by default; keep all advanced feature flags hard-off until separately approved; do not add production auth or runtime database dependency |
| 2026-06-09 | Approve Phase 1 Task 1.4 manual transactions using versioned browser-local prototype persistence | Enables honest manual transaction CRUD and validation before production authentication or runtime database access is approved | Client | Store persisted amounts as integer cents; use Australian formatting and seeded category catalogue; soft-delete locally; keep duplicate detection advisory; keep CSV matching as a hint only; do not imply cloud sync or production account storage |
| 2026-06-09 | Approve Phase 1 Task 1.5 transient local CSV parsing, privacy scanning, profile detection and manual mapping foundation | Establishes the review-before-commit entry flow without uploading files, persisting raw CSV content or creating transactions | Client | Read selected CSVs in browser memory only; exclude private headers and value-pattern columns before preview; show sanitised mapped fields only; route unknown formats to manual mapping; defer Import, Skip, Merge and database writes to later approved tasks |
| 2026-06-10 | Approve Phase 1 Task 1.6 non-committing import review and browser-local summary history foundation | Demonstrates review-before-commit row actions and safe editing without prematurely creating transactions or saving imported row data | Client | Keep sanitised review rows and Import/Skip/Merge intentions in memory only; allow transient merchant/category edits; persist only versioned aggregate counts, timestamp and review status; do not write import rows, actions or history to Prisma/runtime database |
| 2026-06-10 | Approve Phase 1 Task 1.7 local-first merchant rule and alias foundation | Speeds up review while preserving user control, privacy and the no-third-party-processing promise | Client | Clean merchant names deterministically; store only versioned browser-local profiles, normalised aliases, exact rules and category choices; prioritise user rules over aliases and generic keywords; keep every category result reviewable; reject private banking identifiers; do not add Basiq, AI or runtime database writes |
| 2026-06-14 | Formally close Phase 1 Tasks 1.1 to 1.8 and accept the Phase 1 QA report and documented limitations | Approved Phase 1 scope is complete, PR #8 is merged and the final main Vercel build is green | Client | Phase 1 is closed; preserve accepted limitations; do not begin Phase 2 implementation until the client approves a Phase 2 plan and authorises an implementation branch |
| 2026-06-14 | Approve Phase 2 Import Refinement as six sequential PR-sized tasks, beginning with parser regression hardening | Improve reusable mappings, local categories, merchant rules and duplicate review while preserving privacy-first review-before-commit behaviour | Client | Keep Phase 2 browser-local and non-committing; do not add runtime database writes or schema migrations; use safe profile metadata and synthetic fixtures only; require separate financial-logic approval before duplicate scoring implementation; exclude Phase 3+ modules |
| 2026-06-14 | Approve browser-local saved import profiles for Phase 2 PR B | Reduce repetitive column matching without weakening local processing, review-before-continue or private CSV handling | Client | Save only versioned safe structural mapping metadata and generic labels on the current device; exclude filenames, raw headers, sample values, rows, balances and private identifiers; allow review, rename, disable, delete, reset and safe corruption recovery; do not add cloud sync or runtime database writes |
| 2026-06-15 | Approve inline browser-local custom category creation for Phase 2 PR C | Let users adapt the import review catalogue without leaving the review flow or introducing production persistence | Client | Keep seeded categories immutable; store versioned safe custom category metadata on the current device only; prevent normalised duplicate names; support rename, archive and restore; preserve archived selections already used in transient review; reject private banking identifiers; do not add database writes or import commits |
| 2026-06-15 | Approve stronger browser-local merchant aliases, rules and apply-to-same-merchant refinement for Phase 2 PR D | Make repeated import review faster while keeping all merchant learning deterministic, private, reversible and user-confirmed | Client | Migrate merchant helpers to a versioned safe local format; support alias and canonical-name lifecycle controls and explicit conflict choices; keep user rules above aliases and keywords; show affected-row counts, exclude skipped rows and provide one-level undo; store no raw descriptions or private banking identifiers; do not add runtime database writes or import commits |
| 2026-06-16 | Approve Phase 2 PR E duplicate scoring weights, threshold bands and safety gates | Duplicate warnings must speed up import review without creating false confidence, automatic merges or recurring/subscription false positives | Client | Score exact amount, date proximity, merchant similarity, safe description similarity and consistency; show manual transactions as possible merge targets only; show same-import matches as warnings only; exclude skipped, deleted, split-parent and invalid rows; keep all merge choices review-only and non-committing |
| 2026-06-17 | Approve Phase 2 PR F QA and integration stabilisation as a documentation/report pass unless defects are found | Phase 2 needs a closure-readiness audit without beginning Phase 3 or expanding product scope | Client | Produce Phase 2 QA report; verify Vercel, tests, scope and privacy posture; fix only Phase 2 defects or documentation gaps; do not close Phase 2 or start Phase 3 without explicit client approval |
| 2026-06-17 | Formally close Phase 2 Import Refinement and accept the Phase 2 QA report and documented limitations | Approved Phase 2 PRs A–F are merged, the final main Vercel build is green and no Phase 3 implementation has started | Client | Phase 2 is closed; preserve accepted browser-local/prototype limitations; do not begin Phase 3 implementation until the client approves a Phase 3 plan and authorises an implementation branch |
| 2026-06-17 | Approve PR 3A.0 documentation-only auth/database decision record for Phase 3A Persistence & Commit Foundation | Phase 3A needs explicit provider, ownership, server-only data access, migration and privacy decisions before implementation begins | Client | Draft docs should recommend Clerk and Neon Postgres with Prisma, keep Vercel hosting, preserve browser-local raw CSV handling, and require no code/schema/auth/database writes until PR 3A.0 is reviewed and approved |
| 2026-06-17 | Adopt Autonomous Phase Delivery Mode and require phase-end Phase Summary Reports | Client wants to review SpendGrove primarily as a user/tester at phase or major milestone checkpoints instead of approving every routine technical PR | Client | Agents may merge green, in-scope, privacy-safe routine PRs inside approved phases; stop only for documented blocker conditions; every phase must end with a complete plain-English Phase Summary Report and non-technical user-testing checklist before closure |
| 2026-06-20 | Simplify the active CSV import flow to automatic per-file mapping confirmation, source-only More options and Settings-based committed history | Client acceptance testing found saved mapping controls, visible privacy panels and in-flow history confusing for beginner users | Client | Keep privacy scanning and durable safe history infrastructure, but hide saved/reuse mapping controls and the large privacy panel from active import; show committed history in Settings; keep Home dashboard stats deferred |
| 2026-06-22 | Formally close Phase 3A Persistence & Commit Foundation and accept the documented limitations | The client completed final Phase 3A retesting and reported no further acceptance comments; the final functional main deployment, tests, type-check and production build are green | Client | Phase 3A is closed; preserve its privacy and migration boundaries; no Production migration has been run; do not start Phase 3B implementation, Phase 4, Home dashboard statistics or later modules without explicit client approval |
| 2026-06-22 | Approve Phase 3B Milestone 1 under Autonomous Phase Delivery Mode | Establish privacy-safe loan/property foundations and allow client review of metadata setup and browser-local loan CSV review before durable repayment commit or reconciliation | Client | Authorise PRs 3B.0–3B.3; stop before any Preview migration and after PR 3B.3; no Production migration, tax reports, Home statistics, Phase 4 or later modules |
| 2026-06-22 | Adopt the Phase 3B financial rules and minimum data contract | Loan repayment breakdowns require explicit integer-cent semantics, conservative review-only matching rules, no-double-count treatment and strict private-data exclusions before schema work | Client via approved PR 3B.0 scope | Use non-negative reviewed repayment components; preserve missing versus zero; block component variance above 2 cents; never count loan repayment records as cashflow; use suggestion-only reconciliation bands; persist no account/reference/address/raw-source identifiers |
| 2026-06-22 | Make Loans the primary Phase 3B user-facing section and properties optional supporting metadata | SpendGrove must support owner-occupier, investment, car, personal and other loans rather than presenting a property-first workflow | Client | Show Loan Accounts first; allow optional property links for relevant loans; never force property data for car/personal/other loans; preserve neutral tax wording; defer property profiles, tax links/reports and Home stats |
| 2026-06-22 | Approve a minimal `CAR_LOAN` enum amendment before the Phase 3B Preview migration | Existing `HOME_LOAN`, `PERSONAL_LOAN` and `OTHER` values cannot preserve a distinct Car loan label and edit/CSV-selection behaviour without misclassification | Client | Add only `CAR_LOAN` to `LoanType` and the still-unexecuted enum creation SQL; no table/column/relationship/private-field/data rewrite; run Preview only after the amendment PR is green and merged |
| 2026-06-23 | Support both component-column and row-event loan CSV formats in Milestone 1 review | Client testing showed that loan ledger exports may classify each signed row amount by a transient event/type column instead of supplying separate repayment components | Client | Auto-detect safe headerless ledger structure; validate each format separately; derive safe row labels transiently; never persist or display raw event text; no schema, durable commit or reconciliation change |
| 2026-06-24 | Group same-date row-event loan ledger rows into repayment breakdowns before review display | Client retesting showed that one repayment can appear as multiple same-date ledger rows for payment, interest and fees, which looked like extra repayments when displayed row-by-row | Client | In browser-local review only, group safe same-date repayment components; derive principal only for clear single-repayment groups; show ambiguous patterns as Needs review; provide neutral transient property/tax record-keeping suggestions for investment-loan interest without tax advice or durable tax fields |
| 2026-06-26 | Formally close Phase 3B Milestone 1 Loans-First Foundations and prepare Milestone 2 as proposal-only | Client completed final Milestone 1 retesting with no further acceptance comments and requested a plan before any new implementation | Client | Milestone 1 is closed; preserve Preview-only migration status and no Production migration; do not start PR 3B.4, Milestone 2, Phase 4, Home dashboard statistics, tax/EOFY reporting or later modules until explicit approval |
| 2026-06-28 | Approve Phase 3B Milestone 2 durable repayment and reconciliation sequence under Autonomous Phase Delivery Mode | Turn accepted browser-local loan CSV review into a durable, privacy-safe workflow with repayment history, user-confirmed reconciliation and no-double-count protection | Client | Authorise PRs 3B.4-3B.8 using the existing schema; preserve approved confidence bands and reversible links; stop for client retesting after PR 3B.8; no Production migration, tax/EOFY reporting, Home statistics, Phase 4 or later modules |
| 2026-06-30 | Formally close Phase 3B Milestone 2 Durable Loan Repayments and Reconciliation and prepare Milestone 3 as proposal-only | Client completed signed-in retesting with no further acceptance comments and requested a plan before any new implementation | Client | Milestone 2 is accepted and closed with documented limitations; no Production migration has run; do not start Milestone 3, Phase 4, Home dashboard statistics, tax/EOFY reporting, Basiq, AI, payments or later modules until explicit approval |
| 2026-06-30 | Approve Phase 3B Milestone 3 repayment correction, duplicate re-import safety and non-destructive cleanup sequence | Users need safe correction and recovery before reports or dashboard work without weakening privacy, reconciliation or no-double-count rules | Client | Authorise PRs 3B.9-3B.13 using the existing schema; require unlink-before-edit, exact structured duplicate warnings, visible user override and archive/restore only; stop on any schema/migration need and after PR 3B.13; no Production migration or later modules |
| 2026-07-01 | Formally close Phase 3B Milestone 3 Repayment Corrections and Duplicate Re-import Safety | Client completed signed-in retesting, including post-save navigation hardening, with no further acceptance comments | Client | Milestone 3 is accepted and closed with documented limitations; no Production migration has run; Phase 3C remains proposal-only and Phase 4, Home statistics, tax/EOFY reporting and later modules remain unstarted |
| 2026-07-02 | Approve Phase 3C Milestone 1 property-linked record-keeping foundations under Autonomous Phase Delivery Mode | Add a reversible privacy-safe relationship between an everyday transaction and an optional Property without tax treatment, reporting or duplicate cashflow | Client | Authorise PRs 3C.0-3C.4; freeze one-Property-per-transaction cardinality in PR 3C.0; stop after PR 3C.1 before any Preview migration; no Production migration, tax/EOFY reports, property/Home statistics, automatic linking, allocation, Phase 4 or later modules |
| 2026-07-02 | Approve a development/Preview-only transaction reset utility before PR 3C.2 | Client needs repeatable clean-account testing without removing durable account, category, import, Property, Loan Account or repayment foundations | Client | Gate UI and API fail-closed with local development or Vercel `VERCEL_ENV=preview`; require `DELETE TRANSACTIONS`; soft-delete only the authenticated user's transactions; detach active loan/property links; preserve repayments and all other records; no schema, migration, Production exposure or private output |
| 2026-07-02 | Permit automatic loan repayment reconciliation only for exactly one revalidated high-confidence candidate | Client retesting found repetitive confirmation burdensome when an exact-amount, zero-to-one-day match is unambiguous | Client | After durable repayment save, use the existing serializable reconciliation validation to link one unique `HIGH`/`SUGGESTED` candidate; keep zero/multiple/medium/manual/override/uncertain cases manual; links remain reversible and no transaction or Property link is created or changed; no schema or migration change |
| 2026-07-03 | Formally close Phase 3C Milestone 1 Property-Linked Record-Keeping Foundations | Client completed signed-in retesting after acceptance hardening with no further acceptance comments | Client | Milestone 1 is accepted and closed with its documented limitations; its sole migration remains Preview-only and no Production migration has run; the next-scope options are proposal-only and no Phase 4, Home statistics, tax/EOFY reporting, Basiq, AI, payments or later module has started |
| 2026-07-03 | Approve Phase 3C Milestone 2 reporting contract and foundations sequence | Build neutral Australian financial-year Property record review and safe export foundations on accepted links without implying tax outcomes | Client | Authorise PRs 3C.5-3C.9; require manual neutral classifications, one-transaction/one-Property reporting, explicit approved gross summaries, current-state traceability and safe export fields; stop before the PR 3C.6 Preview migration; no Production migration, tax advice, automatic deductibility, Home statistics or Phase 4 work |
| 2026-07-03 | Use one minimum `PropertyReportReview` record and neutral classification enum for the Phase 3C Milestone 2 schema foundation | The approved reporting contract needs durable user review state while preventing copied financial/source data and cross-Property double counting | Client via approved PR 3C.6 scope | Persist only generated ID, user/Property/transaction IDs, one neutral classification and timestamps; enforce one review per transaction, owner-scoped indexes and restrictive source deletion; migration remains unexecuted pending explicit Preview approval |
| 2026-07-03 | Approve and complete the Phase 3C Milestone 2 Preview-only migration with secret-safe verification | Reporting review implementation requires the merged additive schema, while Production and private-data boundaries must remain intact | Client | Deploy run `28639135158` applied the migration once; verification-only run `28657045177` confirmed exact schema, empty review table and unchanged existing aggregate counts; PR 3C.7 may begin; no Production migration is authorised |
| 2026-07-04 | Require unambiguous evidence before assigning a specific bank profile | Common date/amount/description headers are shared by multiple Australian banks and a confident but incorrect bank label is less safe than visible generic mapping review | Client-approved compatibility hardening | A bank profile is confirmed only when its accepted header signature is unambiguous; otherwise SpendGrove uses `Generic or custom CSV`, keeps the complete suggested mapping visible and requires user review; filenames and private source values are not used for detection or persisted |
| 2026-07-04 | Permit deterministic, user-confirmed Property record classification suggestions | Client retesting found repeated manual selection burdensome, while the record-keeping and no-tax-advice boundary requires the user to retain control | Client | Suggest only compatible neutral classifications from transaction type, amount sign, exact seeded category metadata and current connection source; never persist silently; bulk apply requires explicit confirmation and server-side ownership, eligibility, compatibility and stale-state revalidation; ambiguous records remain manual and suggestion-only records remain excluded from summaries/exports |
| 2026-07-04 | Supersede report-only classification with direct linked-record reporting | Client retesting confirmed the feature worked technically but found a second reporting classification pass inconsistent with SpendGrove's simple import, categorise and link workflow | Client | Include every currently eligible linked everyday transaction after ownership/relationship checks; derive only simple money-in, money-out, loan-context and count summaries from safe current facts; export all eligible rows without `record_classification`; remove classification/suggestion controls and write routes from the normal reporting flow; leave the Preview-only review table dormant without schema, migration or data changes |
| 2026-07-07 | Formally close Phase 3C Milestone 2 Property/EOFY Reporting Contract and Foundations | Client completed Vercel retesting after PR #97 and accepted the simplified linked-record reporting/export workflow with no further acceptance comments | Client | Milestone 2 is accepted as a current-state Property record/export foundation; preserve the dormant Preview-only `PropertyReportReview` table, accepted export fields and no-tax/no-double-count limitations; no Production migration has run; next milestones remain proposal-only until explicitly approved |
| 2026-07-08 | Approve Phase 3C Milestone 3 import-review Property linking and workflow polish | The accepted linked-record reporting workflow is useful only when relevant transactions can be linked to Properties during the normal review flow, without a second report-only task | Client | Authorise PRs 3C.10-3C.15; start with a documentation-only contract; prefer no schema/migration by using existing `PropertyTransactionLink` only after transaction commit; keep Merge rows out of pre-commit linking unless separately approved; no Production migration, tax advice, automatic Property matching, Home statistics, Phase 4 or later modules |
| 2026-07-08 | Confirm Phase 3C Milestone 3 needs no schema or migration for import-review Property linking | Existing `PropertyTransactionLink` already stores one owned transaction-to-Property relationship with unlink-before-relink, and import commit can create links only after owned imported transactions exist | Codex assessment under approved PR 3C.11 | Continue to PR 3C.12 without a Preview migration; do not add staging tables or durable import-row Property-choice records; keep Merge rows out of pre-commit linking and stop if implementation later needs schema, migration or durable staging state |
| 2026-07-08 | Formally close Phase 3C Milestone 3 Import-review Property Linking and Workflow Polish | Client completed Vercel retesting after PR #104 and reported no further acceptance comments | Client | Milestone 3 is accepted and closed; preserve Import-row Property linking, post-commit durable links, Skip/Merge boundaries, manual transaction Property-link polish and no report-only classification; no schema change, new Preview migration, Production migration, durable staging table, data rewrite, backfill, table drop, package/provider/secret/env change occurred; next milestones remain proposal-only |
| 2026-07-08 | Prefer larger safe development batches before Vercel pushes where usage is constrained | Client is building multiple apps and Vercel usage is capped, so excessive preview deployments should be avoided when safe | Client | Future approved implementation phases may group more PR-sized work before pushing/Vercel if scope, tests, review gates, privacy boundaries and mandatory stop conditions remain clear; do not use this to bypass schema/migration approvals or client stop gates |

| 2026-07-08 | Approve Phase 4 Milestone 1 recurring, budgets and everyday insights sequence | Make SpendGrove useful between CSV imports with reviewable patterns, monthly budgets and transparent everyday insights | Client | Authorise PRs 4.0-4.5; require contract and schema gates; no automatic recurring status, Production migration, Property/tax/loan Home statistics, Basiq, AI, payments or later modules |
| 2026-07-10 | Complete and verify the Phase 4 Preview-only recurring and budget foundation migration | Approved durable recurring-dismissal and monthly-budget state is required before PR 4.2, while existing Phase 3A-3C data and Production must remain untouched | Client-approved migration; verified by Codex | Deploy run `29060523217` applied the migration once; checker correction PR #110 merged as `be53523040ba9a13b48d42408968fabf4b91c922`; verify-only run `29072916307` confirmed exact schema, empty new tables and unchanged existing counts; no Production migration ran |
| 2026-07-10 | Use exact signed integer-cent amounts as the conservative initial recurring-suggestion amount threshold | The approved contract allows similar amounts but requires deterministic thresholds and a stop on ambiguity; exact amounts avoid fuzzy financial inference and false confidence | Codex implementation under approved PR 4.0 contract | Combine exact amount with the same safe merchant profile, category and type plus approved cadence windows; three or more occurrences are high confidence, two are review-only, and ambiguous or non-exact patterns produce no suggestion |

| 2026-07-12 | Freeze monthly category-budget progress to active owned everyday EXPENSE transactions using absolute integer cents | Keep the first budget model simple, transparent and aligned with existing transaction signs and no-double-count rules | Client-approved PR 4.0 contract; implemented by Codex | Use Brisbane calendar months; include eligible split children; exclude split parents, income, transfers, deleted/inactive/cross-user rows and analytical loan repayment records; no rollover |
| 2026-07-12 | Limit the Phase 4 Home overview to transparent everyday current/previous-month facts | Give beginners useful context without forecasts, judgement, advice or Property/tax/loan reporting leakage | Client-approved PR 4.0 contract and explicit PR #113 merge confirmation | Show current spending/count, top categories, budget progress, confirmed recurring items and explicit month comparison only; no net-worth, Property, tax or loan-balance statistics |

| 2026-07-12 | Defer Phase 4 Milestone 1 client retesting without accepting or rejecting delivery, while authorising continued Phase 4 development | Client is temporarily away from the Vercel review environment but does not want safe roadmap progress blocked | Client | Keep Milestone 1 open and testable; maintain a consolidated deferred checklist; later feedback may require focused acceptance hardening; do not close milestones on the client's behalf |
| 2026-07-12 | Select Phase 4 Milestone 2 recurring and budget lifecycle recovery with no reminders and no schema change | Archived and dismissed-state recovery adds everyday value using existing models without introducing ambiguous calculations, notification infrastructure or later-module scope | Codex under client autonomous continuation authority and master specification | Implement explicit recurring restore, current dismissed-suggestion undo, budget restore, active/archived UI and QA through PRs 4.6-4.8; preserve all Milestone 1 formulas and stop if schema/migration becomes necessary |
| 2026-07-12 | Permit hard deletion only for an explicit undo of an owned recurring-suggestion dismissal preference | RecurringSuggestionDismissal has no archive state and is a non-financial preference; undo must not delete financial or planning records | Codex under approved Milestone 2 contract | Delete only the exact user-owned dismissal row in an atomic audited action; recurring items, budgets and transactions remain non-destructively archived/restored |

| 2026-07-12 | Approve Phase 4 Milestone 3 beginner-first UI simplification using progressive disclosure | Make SpendGrove calm and obvious for first-time budgeting users without adding product scope or changing financial behaviour | Client | Audit every current screen; preserve essential actions and all calculations/rules; use unique internal labels 4.12-4.17 because Milestone 2 already used 4.6-4.8; no schema, migration, navigation tab or new feature |

| 2026-07-13 | Default Transactions to one Brisbane calendar month with month-scoped search and accessible navigation | The all-history page was too long and obscured the current task | Client | Query and render only the selected month by default; preserve transaction ownership, values, split handling and cashflow rules |
| 2026-07-13 | Prioritise deterministic local category intelligence and conservative stable merchant grouping | Obvious merchant/purpose terms and changing trailing references can reduce repetitive review without Basiq, AI or private persistence | Client | User-confirmed rules remain first; generic keyword suggestions stay reviewable; exact recurring amount/cadence thresholds remain unchanged; ambiguous cases remain manual |
| 2026-07-13 | Re-evaluate unique high-confidence loan repayment matches after either import order | Loan-first imports should receive the same safe automation as everyday-first imports | Client | Use only the accepted exact remaining amount, zero-to-one-day, owned active and unique-candidate rules; keep ambiguous/medium/manual cases unlinked; everyday transactions remain the only cashflow records |
| 2026-07-13 | Use Delete/Deleted/Restore language over the existing recovery-safe internal archive lifecycle | Beginner-facing Archive terminology added unnecessary product complexity | Client | Do not hard-delete financial/planning records; preserve retention, audit, reconciliation and restore behaviour |
| 2026-07-13 | Add category-level month comparison using the existing overall comparison periods and eligibility formula | Users need understandable category context without a new financial calculation model | Client | Use active owned everyday expenses, include eligible split children, exclude split parents/income/transfers/analytical repayments; no Property, tax, loan or net-worth comparisons |

| 2026-07-13 | Use compact task-first presentation for recurring suggestions, Loan Accounts and budget creation, and fall back to the latest populated transaction month only on initial entry | The client recording showed correct features were still producing long pages and exposing forms/history before they were needed | Client | Show at most three recurring suggestions on Home, one suggestion editor and one Loan Account detail at a time, three recent loan records before View all, and budget fields only after Add budget; preserve all existing financial, reconciliation and lifecycle rules |

| 2026-07-14 | Present one canonical Loan repayment row and exclude repayment cashflows from the main Property transactions list | Repeating the same underlying repayment as a breakdown, linked cashflow and Property record confused beginner users | Client | Combine one LoanRepayment with optional safe reconciliation/transaction context for display only; keep the everyday transaction as the sole cashflow record; preserve report/export and all durable relationships |

| 2026-07-14 | Use a focused selected-loan subview, quiet healthy repayment rows and a separate Property report dialog | The inline Loan expansion still made the overview long and gave technical/secondary tools equal visual weight | Client | Keep the existing /loans navigation; show repayments first and Property transactions second; allow one repayment detail at a time; preserve all matching, cashflow, Property-link and report/export rules |

| 2026-07-14 | Approve Phase 4 Milestone 4 as a substantial logo-led, beginner-first UI overhaul | Repeated client recordings showed that isolated simplification patches left the global visual system too large, green-card-heavy, mobile-shaped on desktop and administratively dense | Client | Rebuild presentation and responsive navigation through PRs 4.18-4.26 using the approved repository logo, neutral surfaces, compact rows, one primary action and progressive disclosure; preserve exactly five destinations and every financial/import/matching/report/privacy rule; no schema, migration, package/provider/secret/environment change |

| 2026-07-14 | Adopt the Milestone 4 responsive visual system as the technically verified presentation baseline | The completed overhaul gives beginners a compact month-first experience while retaining all accepted product rules | Client-approved milestone direction; technically verified by Codex | Use the repository logo, desktop sidebar, mobile five-item bottom navigation, neutral surfaces, compact rows, one primary action and progressive disclosure; keep exactly Home, Transactions, Loans, Import and Settings; all Phase 4 milestones remain open pending client acceptance |

## Template

| Date | Decision | Reason | Approved by | Implementation impact |
|---|---|---|---|---|
| YYYY-MM-DD |  |  |  |  |

## Decisions that must be logged

- Product direction.
- Framework/stack choice.
- Database provider.
- Authentication approach.
- File handling strategy.
- Duplicate scoring thresholds.
- Financial calculation assumptions.
- Third-party providers.
- Payment/subscription model.
- Major navigation changes.
- Privacy/security changes.
- Delivery workflow changes.

## 2026-07-14 - Transactions uses a compact whole-month category chart

Decision:

- Transactions shows one compact accessible donut for the currently selected Australian month.
- The chart reuses the approved everyday monthly-spending eligibility and integer-cent amount rule; it is not a second financial formula.
- Search and list-only filters do not change the whole-month chart.
- Up to five categories appear directly; additional categories are represented by exact presentation-only `Other`.
- The full breakdown always exposes the real categories, and selecting one applies a removable same-month transaction filter.
- Unusable categories remain visible as `Needs review`.
- The implementation uses repository-native SVG and adds no chart dependency.

Reason:

The client requested an immediate, beginner-friendly explanation of what makes up monthly spending without turning Transactions into a large dashboard. A compact summary plus deliberate full breakdown preserves the redesigned page hierarchy and keeps every value traceable.

Boundaries:

No new refund, split, transfer, category, budget, import, Property, loan or tax calculation; no schema/migration/package/provider/secret/environment change; no new primary navigation destination; no raw source data in chart presentation.


## 2026-07-14 - Require sign-safe expense eligibility for everyday spending

Decision:

- An everyday record counts as spending only when it satisfies the existing ownership, active/deleted, split and date rules, has transaction type `EXPENSE`, and has a strictly negative integer-cent signed amount.
- A positive or zero record typed `EXPENSE` is treated as an inconsistent record requiring user correction, not as spending.
- `Needs review` is only an otherwise eligible expense without a usable active category.
- Chart category drilldown uses the exact owned transaction IDs included in the server aggregate.
- Home monthly spending, category comparisons and category-budget progress reuse the same canonical eligibility helper.
- Existing inconsistent records are not rewritten or backfilled.

Reason:

Client recording showed a positive incoming transaction inside Needs review spending. Import review can preserve a positive source amount while the neutral fallback category supplies type `EXPENSE`; type-only eligibility followed by `abs()` therefore inflated spending. The sign guard enforces the existing money-out convention without changing transfer/refund treatment or import semantics.

Approved by:

Client-approved Phase 4 Milestone 4 correctness hardening; implemented by Codex within the audit contract.

Implementation impact:

One shared pure eligibility helper is authoritative for everyday spending; chart, breakdown and drilldown reconcile to one record set. Percentage copy uses `<0.1%` for positive sub-0.1% values, and category colours are deterministic without persistence. No schema, migration, rewrite/backfill, package/provider/secret/environment, signed-money, refund, transfer, split, category, import, Property, Loan, report/export or navigation change.

## 2026-07-14 - Transaction direction precedes categorisation

Decision:

- Confirmed transfer treatment is authoritative first.
- Otherwise, strictly positive integer cents are Money in / `INCOME`, and strictly negative integer cents are Money out / `EXPENSE`.
- Category compatibility and categorisation occur only after direction is established and cannot reverse it.
- Zero-value ordinary transactions are rejected.
- Positive and negative confirmed transfers remain `TRANSFER`.
- Needs review is a category-review state, not a financial direction.
- Split children must be non-zero, share the parent's sign and compatible type, and sum exactly to the parent.
- Existing inconsistent records are not rewritten; they remain visible, excluded from incompatible calculations and correctable through normal Edit.

Edge decisions:

- positive non-transfer refunds remain Money in and do not reduce expense spending or budget progress;
- negative income adjustments are Money out under the current model and may affect spending until appropriately categorised;
- no mixed-direction split support is introduced;
- description and merchant text may inform reviewable categorisation but never determine final direction.

Reason:

CSV Import could preserve a positive signed amount while an expense-typed reviewed category supplied durable type. Enforcing one shared server-side invariant prevents future sign/type mismatches without inventing a new accounting treatment or rewriting historical data.

Implementation impact:

CSV Import, manual create/edit, generic transaction validation, category suggestions, Merge validation and split validation share the same direction rules. Transfer thresholds, duplicate scoring, refund calculations, budgets, Property/Loan/reporting, schema and persisted historical data remain unchanged.

## 2026-07-15 - Formally close Phase 4 Milestones 1-4

Decision:

- The client accepted the merged Production walkthrough and formally closed Phase 4 Milestones 1, 2, 3 and 4.
- All four milestones are client accepted, closed, technically verified and deployed to Production.
- The accepted baseline is `main` commit `a401d40275c4c63d5759a690dbc4830e45d46917` and Production deployment `dpl_EYxdfCR5SdgAEdyDR2AZsX841wzJ`.
- The accepted transaction sign/type precedence is confirmed transfer treatment, otherwise signed integer cents, then compatible categorisation.
- Existing sign/type anomalies are not rewritten or backfilled.
- Phase 5 remains unapproved and not started.

Reason:

The client completed the consolidated Production review and explicitly reported acceptance with no unresolved Phase 4 blocker. The accepted build passed 101 test files / 633 tests, TypeScript, lint, optimized build, route HTTP checks, desktop smoke and 390 px overflow verification.

Implementation impact:

Phase 4 is closed without application or data mutation. Historical QA and the consolidated client checklist remain preserved. Any Phase 5 progression requires a separate documentation-first planning gate and explicit client approval; this closure grants no Phase 5 implementation authority.


## 17 July 2026 — Phase 5 repository delivery complete pending client acceptance

- **Decision:** Complete all authorised repository-side Phase 5 Milestones 1–6 under the web-first controlled Australian private-beta target.
- **Approved by:** Client through the autonomous Phase 5 continuation direction.
- **Implemented:** Account-protected finance routes, browser-local data segregation, complete account export, immediate account deletion, Privacy/Help, browser security headers, bounded request bodies, safe errors, operations runbooks, deterministic dependency locking and future App Store/platform documentation.
- **Dependency decision:** Keep Next.js at supported patched `15.5.20` with React/React DOM `19.1.8`; add a committed lockfile and high/critical Production audit gate; do not use `--force`, Next.js 16 or an unrelated tooling migration.
- **Platform decision:** Complete web private-beta readiness first. Capacitor, React Native/Expo and SwiftUI remain unselected future options. No native or App Store action occurred.
- **Provider decision:** Analytics and external monitoring remain off. No provider or paid plan was added or upgraded.
- **Data decision:** Phase 5 required no Prisma schema change, migration, backfill, data rewrite, manual SQL or Production financial-row access.
- **Release decision:** SpendGrove is conditionally ready only after Clerk Production, environment separation, migration-health, recovery, contact and legal gates pass. It is not approved for beta invitations, public launch or App Store submission today.
- **Status:** Phase 5 remains open pending consolidated client acceptance. Phase 6 is unapproved and not started.


## 17 July 2026 — Adopt complete-product first-release direction and revised roadmap

Decision:

- Preserve the technically complete Phase 5 repository baseline while deferring client acceptance; Phase 5 is not formally closed.
- Replace the former limited Phase 6–7 ending with the complete Phase 6–15 delivery roadmap merged in PR #165 as `8146c37040da98c9e08bac3123c8f78a3ef0caec`.
- Target a complete, polished first public/App Store product containing all selected core and optional planned modules rather than a deliberately limited MVP.
- Activate Phase 6 — Desktop Web Platform and Bulk Workflows, beginning with Milestone 6.0.
- Permit autonomous continuation through the merged roadmap when scope is defined and every financial, privacy, ownership, schema, provider, environment, commercial and operator gate is satisfied.
- Defer consolidated client review until the complete pre-release application is ready.

Reason:

The master specification and repository audit show that SpendGrove already has strong transaction, import, Loan, Property, budget, recurring, account-lifecycle and security foundations, while desktop bulk workflows, import coverage, advanced reporting, net worth, household roles, documents, optional enrichment, native delivery and final release operations remain distinct projects. A Phase 6–15 dependency sequence reduces migration and privacy risk and avoids rebuilding accepted work.

Implementation impact:

- Phase 6 Milestone 6.0 starts with documentation and interface rules.
- Material schema changes still require exact model/SQL/privacy/ownership/export/deletion and Preview migration contracts.
- Paid providers, secrets, Production migrations/data access, browser-local migration/deletion, live Basiq/AI/payments, real-user invitations, public launch and App Store submission remain hard stops.
- The native framework, commercial model, provider choices and professional reviews remain explicit decisions in `docs/REMAINING_CLIENT_AND_OPERATOR_DECISIONS.md`.

## 2026-07-17 — Use a separate empty Neon project for Preview development

- Decision: retain a separate Neon Free project for Preview migrations, synthetic testing and destructive non-Production verification rather than branching from the existing SpendGrove project.
- Safe identity: project `cold-field-54187673`, branch `br-sweet-flower-aj2ng7ix`, database `neondb`.
- Reason: Neon branches inherit parent data; Production must be presumed private. An independent empty project prevents copying Production users or financial records.
- Vercel Preview-only database variables were updated; Production entries were not edited.
- GitHub Actions Preview secrets remain an operator-authenticated gate because GitHub required fresh account confirmation. No migration may be dispatched until those secrets are replaced and proven.
- No provider purchase, Production migration/data access, schema change, data rewrite/backfill or application behaviour change formed part of this decision.

