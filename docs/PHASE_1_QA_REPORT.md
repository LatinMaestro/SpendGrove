# Phase 1 QA Report

Date: 12 June 2026  
Scope: Phase 1 Tasks 1.1 to 1.8 only  
Base commit reviewed: `27f9ac5fd98e4d55812792d3c497b3a7d98f20cc`

## Recommendation

Phase 1 is ready for client closure after this focused stabilisation PR is reviewed and merged. Do not begin Phase 2 until the client explicitly approves Phase 1 closure and progression.

## Scope Audit

| Task | Result | Evidence |
|---|---|---|
| 1.1 Project foundation | Pass | Next.js App Router shell, responsive navigation, theme tokens, valid Vercel deployment and development commands are present. |
| 1.2 Data model foundation | Pass | Approved Prisma/PostgreSQL models, user ownership, integer cents, validation, safe import review entities, merchant rules, audit events and seed foundation are present. |
| 1.3 Onboarding and settings | Pass | Privacy-first onboarding, Simple Mode default, Australian defaults and hard-disabled future feature flags work with browser-local prototype preferences. |
| 1.4 Manual transactions | Pass | Create, list, detail, edit, duplicate, advisory duplicate warning and soft-delete work with seeded categories and versioned browser-local storage. |
| 1.5 CSV import foundation | Pass | Local file selection, parsing, privacy scanning, profile detection, headerless handling, manual mapping and safe preview work without upload or raw-file persistence. |
| 1.6 Import review and history | Pass | Import, Skip and Merge intentions, live counts, safe row edits and aggregate-only browser history work without transaction creation or database writes. |
| 1.7 Merchant rule foundation | Pass | Deterministic merchant cleanup, reviewable category suggestions, apply-to-same-merchant and user-confirmed browser-local rules work without external lookup. |
| 1.8 QA and review | Pass with one stabilisation fix | End-to-end smoke, privacy, storage, responsive UI and build evidence passed. A missing app icon caused a favicon 404 and is fixed in this PR. |

## Automated Checks

- Latest `main` commit has a successful Vercel status.
- The repository `build` command runs the full Vitest suite before `next build`.
- The successful Next.js production build includes TypeScript validity and Next.js lint checks.
- Prisma client generation runs during dependency installation and completed in Vercel.
- Prisma schema validation was completed during Task 1.2; the schema has not changed since that approved task.
- A standalone Task 1.8 `prisma validate` rerun was not possible in the current connector-only workspace because a local authenticated repository checkout was unavailable. This is documented rather than bypassed with a live database or real credentials.

## End-to-End Smoke Test

The production deployment was tested at mobile and desktop sizes using fictional synthetic data only.

### Home

- Privacy-first promise is prominent.
- Empty state does not imply example or saved financial data.
- Browser-local transaction status reflects only user-created local entries.

### Onboarding

- Privacy, Australian defaults and starting-path steps work.
- Simple Mode defaults on.
- Completion state clearly explains browser-local prototype preferences.

### Settings

- Browser-local-only wording is present.
- Australian defaults are shown.
- Advanced feature flags remain disabled and cannot activate future modules from stored browser data.

### Manual Transactions

- Create, list, detail, edit, duplicate and soft-delete flows passed.
- Duplicate opens an unsaved prefilled draft.
- Duplicate warning is advisory and does not block saving.
- Amounts persist as integer cents.
- Australian dates and AUD currency display correctly.
- Seeded category selection works.
- Future CSV-match hint persists without accessing a CSV.
- Deleted entries are excluded from the active list and active count.

Monetary totals are not displayed in the current approved Phase 1 manual-transaction UI. The product currently shows active counts only. This is a documented deferred item rather than a Task 1.8 financial-calculation change.

### CSV Import Flow

A four-row, five-column fictional headerless CSV was used for the smoke test.

| Check | Result |
|---|---|
| Upload screen | Pass; file handled locally and original filename hidden |
| Headerless detection | Pass; first row preserved as transaction data |
| Manual mapping | Pass; generic Column 1, Column 2 and Column 3 labels used |
| Three-row preview | Pass; exactly three safe examples shown |
| Full review | Pass; all four rows available in continuous scroll |
| Private-only columns | Pass; identifier-only columns excluded from mapping and preview |
| Date parsing | Pass |
| Signed amount parsing | Pass; integer cents retained |
| Merchant cleanup | Pass |
| Transfer suggestion | Pass; clear account movement suggested as Transfer |
| Import / Skip / Merge | Pass as non-committing review intentions |
| Live counts | Pass; summary reconciled to all rows |
| Apply to same merchant | Pass using cleaned merchant matching |
| Local merchant rule | Pass after explicit category review |
| Summary history | Pass; aggregate metadata only |

## Privacy Audit

- No raw CSV persistence was observed.
- No raw row storage was observed.
- Original filenames are not displayed or stored.
- CSV selection triggered no write/upload network request.
- No server upload or third-party processing was observed.
- No runtime Prisma/database writes are used by current Phase 1 screens.
- Synthetic private identifier tokens did not appear in mapping, review, browser console output, merchant storage or import-history storage.
- Import history stores only version, generated ID, timestamp, status and aggregate counts.
- Merchant storage keeps only cleaned merchant/profile, alias, rule and category metadata.
- Transaction storage keeps the user-entered browser-local prototype records and integer-cent amounts.
- Repository protections exclude environment files, private-local CSVs, real-export naming patterns, parser dumps, private screenshots, private exports and local databases.
- Repository review found only fictional/synthetic tests and fixtures; no real client CSVs, private screenshots, private exports, secrets or real database credentials were identified.
- `.env.example` contains placeholders only.
- `vercel.json` contains a non-routable build-only Prisma placeholder pointing to `127.0.0.1`; it is not a runtime database configuration.

## UI Review

- Home, Onboarding, Settings, Transactions and Import were checked at 390 x 844 and 1440 x 1000 viewports.
- No horizontal clipping was detected.
- Mobile cards, dialogs, switches and segmented review actions remain usable.
- Desktop layouts widen appropriately without changing the workflow.
- Empty states and privacy wording remain honest and beginner-friendly.
- The Upload → Match columns → Review transactions journey uses plain-English wording.

## Defect Found and Fixed

### Missing app icon

Before this PR, each route requested `/favicon.ico` and produced a browser-console 404.

This PR adds `app/icon.svg`, allowing Next.js to provide application icon metadata and removing the missing-icon defect. No product logic, privacy rule, financial calculation or Phase 1 workflow is changed.

## Known Limitations and Deferred Items

- Browser-local storage is prototype-only and is not cloud sync, account storage or recovery.
- Production authentication and runtime database persistence are not implemented.
- Import, Skip and Merge do not create, skip or merge transactions yet.
- Import review rows and tax flags remain transient.
- Saved import profiles are not implemented.
- Duplicate scoring and merge-target selection are not implemented.
- Monetary transaction totals are not yet displayed.
- Bank/profile coverage remains a foundation rather than a complete format register.
- Very large imports may later need virtualised rendering.
- The temporary build-only `DATABASE_URL` placeholder must be removed or replaced when an approved database is provisioned.
- Dependency audit findings recorded in Task 1.1 remain follow-up work; do not use `npm audit fix --force` without explicit approval.
- Loans, property/tax reports, recurring detection, budgets, Basiq, enhanced merchant lookup, AI, payments and production release workflows remain excluded.

## Closure Status

No Phase 2 work has begun. After this stabilisation PR is visually reviewed, confirmed green and merged, Phase 1 can be recommended for closure. Actual Phase 1 closure and any progression to Phase 2 require explicit client approval.
