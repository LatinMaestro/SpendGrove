# Decision Log

Material decisions should be recorded here. This prevents future agents from re-litigating settled choices.

| Date | Decision | Reason | Approved by | Implementation impact |
|---|---|---|---|---|
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