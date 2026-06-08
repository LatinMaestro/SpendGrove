**SpendGrove**

**Version 2.0 Master Specification**

Integrated product, platform, security, data, web, mobile and autonomous-agent delivery specification

Privacy-first Australian personal finance app \| CSV import platform \| Property, loan and tax-ready financial records

*Prepared for SpendGrove product development and supervised autonomous coding-agent delivery*

Date: 8 June 2026

# Document Control

| **Version** | **Date**                         | **Description**                                                                                                                                                                                                                                                                                                                               |
|-------------|----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 2.0         | 8 June 2026                      | Full integrated master specification rebuilt from the prior roadmap and v2 framework. Consolidates product vision, platform architecture, account strategy, web/mobile strategy, data model, import engine, privacy, security, AI roadmap, production operations, QA, and autonomous-agent delivery controls into one coherent specification. |
| Supersedes  | v1.7 and v2.0 framework addendum | This master specification supersedes the earlier appended/addendum structure and should be used as the primary source of truth for Codex, Claude Code, Cursor, Replit Agent, TrySolid or a software development team.                                                                                                                         |
| 2.0.1       | 8 June 2026                      | Completeness check update after comparison against the v2.0 framework/addendum. Adds Appendix O to explicitly preserve lower-level feature-register, CSV testing, UI review, agent-control, platform-option and external-reference details that were condensed in the v2.0 master rewrite.                                                    |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Source-of-truth statement</strong></p>
<p>This document is intended to be the master product and technical brief for SpendGrove. Repository operating files such as AGENTS.md, BUILD_PLAN.md, REVIEW_GATES.md and DECISION_LOG.md should point back to this document rather than replacing it.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# Manual Table of Contents

- 1\. Executive Summary

- 2\. Product Vision and Market Positioning

- 3\. Guiding Principles and Non-Negotiables

- 4\. Product Governance and Decision Management

- 5\. User Personas and Core Journeys

- 6\. Platform Strategy: iOS, iPad and Web

- 7\. Account, Authentication and Identity Architecture

- 8\. User Roles, Permissions and Household Strategy

- 9\. Commercial, Subscription and Payment Strategy

- 10\. Target Architecture and Engineering Principles

- 11\. Core Data Model and Financial Rules

- 12\. Application Navigation and Information Architecture

- 13\. Mobile App Specification

- 14\. Web Platform Specification

- 15\. Onboarding, Settings and Feature Flags

- 16\. Transaction Management

- 17\. CSV Import Engine and Bank Format Register

- 18\. Privacy Scanning, Safe File Handling and Import Review

- 19\. Home Loan, Personal Loan and Reconciliation Engine

- 20\. Merchant Intelligence, Categorisation and Basiq Roadmap

- 21\. Recurring Transactions and Subscriptions

- 22\. Budgets, Insights and Dashboard

- 23\. Net Worth Module

- 24\. Property, Loans and Tax Reporting

- 25\. Reports, Exports and Accountant Packs

- 26\. Document and Receipt Management

- 27\. Notifications and Reminders

- 28\. Help, Support and Feedback

- 29\. Privacy, Security and Compliance Framework

- 30\. Data Ownership, Retention, Deletion and Recovery

- 31\. Analytics, Monitoring and Production Operations

- 32\. AI and Automation Roadmap

- 33\. Apple App Store and Release Readiness

- 34\. QA, Testing and Acceptance Criteria

- 35\. Autonomous Agent Delivery Model

- 36\. Delivery Roadmap

- Appendices A to J

# 1. Executive Summary

SpendGrove is a privacy-first Australian personal finance platform for users who want transaction import convenience without providing online banking credentials or live bank access. The core workflow allows users to download transaction CSV exports from their bank, upload them into SpendGrove, review every parsed row, confirm categories and merge duplicates before data is committed to their account.

The product sits between simple manual budgeting apps and fully connected open-banking products. It is intentionally CSV-first, review-first and Australian-first. It supports everyday budgeting, recurring payments, merchant categorisation, investment property tracking, home and personal loan repayment breakdowns, EOFY reports, accountant exports and future web-based bulk workflows.

Version 2.0 establishes a full product and technical baseline for building SpendGrove with a supervised autonomous coding agent. It integrates product scope, platform strategy, account architecture, data ownership, cloud sync, privacy, security, roles, payments, production operations, AI roadmap, QA and delivery governance into a single coherent specification.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Core promise</strong></p>
<p>Track your money without handing over your bank login. SpendGrove should never require internet banking usernames, passwords, MFA codes or default live bank linking.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

| **Area**           | **Master requirement**                                                                                                                                                       |
|--------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Primary platform   | iPhone-first app suitable for Apple App Store release, with iPad support and a future linked desktop web platform.                                                           |
| Core data model    | Account-based cloud data from inception so the future web app and mobile app use the same user account, database and reporting rules.                                        |
| Privacy position   | CSV imports are user-controlled. Private bank fields are detected and excluded. Raw CSVs are not stored by default.                                                          |
| Agent delivery     | Codex or similar agent may work autonomously through approved phases but must pause for review gates, user testing, privacy changes, schema changes and milestone approvals. |
| Commercial posture | Payments and subscriptions are planned but not implemented until explicitly approved. Architecture must support future plans without paywalling the MVP prematurely.         |

# 2. Product Vision and Market Positioning

SpendGrove should feel calm, private and trustworthy. It should appeal to people who are uncomfortable giving third-party apps their banking credentials but still want a faster workflow than manually entering every transaction. The app should also support more advanced Australian use cases such as investment property tax records and home loan interest breakdowns without overwhelming beginner users.

| **Comparison**                | **SpendGrove positioning**                                                                           |
|-------------------------------|------------------------------------------------------------------------------------------------------|
| Versus connected finance apps | No default bank credential sharing or ongoing account access. Import is initiated by the user.       |
| Versus manual-only apps       | CSV import, duplicate detection and merchant rules significantly reduce data-entry workload.         |
| Versus spreadsheets           | Structured import history, categories, rules, reconciliation, reports and cross-device account sync. |
| Versus global finance apps    | Australian financial year, Australian banks, AUD, local tax terminology and property-loan workflows. |

- Primary market: Australian individuals and households who want privacy-first spending visibility.

- Secondary market: property owners who want better EOFY preparation records.

- Future market: accountants or tax agents receiving export packs or read-only access.

- Brand personality: calm, modern, premium, simple and growth-oriented rather than technical or intimidating.

# 3. Guiding Principles and Non-Negotiables

| **Principle**            | **Requirement**                                                                                                                                                                                          |
|--------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Privacy-first by design  | Do not ask for bank login credentials. Do not require live bank connections. Do not store raw CSVs by default. Detect and exclude BSB, account number, account name, card number and customer ID values. |
| Review before commit     | Imported rows must remain editable and reviewable before becoming transactions. Every row should allow Import, Skip or Merge.                                                                            |
| Australian-first         | Use AUD, Australian dates, July-to-June financial years, Australian banks and Australian EOFY/tax language.                                                                                              |
| Data integrity           | Store money as integer cents. Exclude split parent records from totals. Reconcile loan breakdowns without double-counting repayments.                                                                    |
| Progressive complexity   | Default to Simple Mode and reveal property, loans, tax, recurring, advanced reports and Basiq only when enabled.                                                                                         |
| User ownership           | Users own their data and can export it. Account deletion must be supported before public production launch.                                                                                              |
| Local-first intelligence | Use user-confirmed merchant/category rules before keyword logic and before any optional enhanced lookup.                                                                                                 |
| Agent discipline         | Autonomous agents may implement approved scope, but may not silently expand scope, weaken privacy, change financial logic or skip review gates.                                                          |

# 4. Product Governance and Decision Management

SpendGrove should be managed like a product rather than a one-off coding task. Material decisions must be recorded, especially where they affect privacy, financial calculations, data models, third-party providers, App Store compliance, user roles, payments or major user experience direction.

| **Governance item**     | **Required behaviour**                                                                                                                          |
|-------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| Decision log            | Record date, decision, reason, approver, affected modules and implementation impact.                                                            |
| Specification hierarchy | This v2.0 master specification is the source of truth. AGENTS.md and repository docs should reference it.                                       |
| Scope control           | MVP and phase boundaries must be maintained. Agents should not build later-phase modules without approval.                                      |
| Change requests         | Client feedback is treated as formal change requests. The agent should implement, test and summarise the change in the same PR where practical. |
| Release governance      | Each release requires feature scope, test evidence, privacy review, known limitations and rollback notes.                                       |

# 5. User Personas and Core Journeys

| **Persona**                      | **Needs**                                                         | **Key product response**                                                            |
|----------------------------------|-------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| Privacy-conscious budget tracker | Wants spending visibility without bank linking.                   | Manual entry, CSV import, privacy scan, clear no-bank-login copy and exports.       |
| Busy household user              | Wants quick monthly categorisation.                               | Import review, merchant rules, apply-to-same-merchant and dashboard summaries.      |
| Manual-first user                | Adds transactions during the month then imports later.            | Future CSV match checkbox, fuzzy duplicate detection and merge preservation.        |
| Property investor                | Needs rental income, expenses and loan interest grouped for EOFY. | Property records, home loan CSV import, reconciliation and property tax reports.    |
| Desktop CSV user                 | Prefers web for bulk import and exports.                          | Future web app with the same account, same database and wider import review tables. |
| Accountant-prep user             | Needs cleaner reports and evidence.                               | EOFY reports, accountant export pack, document attachments and audit history.       |

## 5.1 Priority user journeys

- First-time setup: create account, confirm Australian defaults, choose Simple Mode or Advanced Mode, see privacy promise, then add transaction or import CSV.

- Monthly CSV import: upload file, privacy scan, bank detection, mapping, review, edit categories, merge duplicates, confirm and view summary.

- Manual transaction then later CSV import: create manual record with future CSV hint, import later, merge bank row into manual transaction while preserving notes, splits, tax and property links.

- Home loan reconciliation: import everyday transaction payment and loan CSV breakdown, link them, show one cashflow transaction and a principal/interest/fee breakdown.

- Web bulk import: use desktop browser for large CSV review, then view results on iPhone via the same account.

# 6. Platform Strategy: iOS, iPad and Web

SpendGrove should be account-based from inception. Even if the initial build is mobile-first, the architecture must not trap data on a single device or require a later migration to support the desktop web app.

| **Platform**    | **Purpose**                                                          | **Key requirements**                                                                                                  |
|-----------------|----------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| iPhone app      | Daily use, dashboards, manual entry, quick review and notifications. | Mobile-first UI, secure local session, large touch targets, App Store readiness and Simple Mode default.              |
| iPad app        | Optional larger-screen use and reporting.                            | Responsive layouts that adapt from phone cards to wider panels without a separate product logic layer.                |
| Desktop web app | Bulk CSV import, review tables, exports and advanced reporting.      | Same login, same backend, same business logic, stronger table workflows and download/export tooling.                  |
| Backend/API     | Single source of truth.                                              | User-owned records, typed endpoints, validation, import processing, reporting logic, privacy controls and audit logs. |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Architecture requirement</strong></p>
<p>The mobile app and future website must share the same account, database and domain logic. CSV imports performed on web should appear on mobile, and manual entries on mobile should appear on web.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 7. Account, Authentication and Identity Architecture

SpendGrove shall use a secure account model before public production release. During early prototype phases, local/demo authentication may be used only if it is clearly temporary and cannot be mistaken for production readiness.

| **Phase**       | **Authentication scope**                                                                                                |
|-----------------|-------------------------------------------------------------------------------------------------------------------------|
| MVP development | May use development auth stubs only if isolated and documented. Data models must already include user ownership.        |
| Private beta    | Email/password, password reset, email verification and secure session management.                                       |
| Public launch   | Production authentication, account deletion, export before deletion, privacy policy and App Store account requirements. |
| Future          | Sign in with Apple, Google Sign-In and passkeys, subject to product and compliance review.                              |

- Every user-owned record must include user ownership and server-side authorisation checks.

- Do not hardcode demo user IDs in production paths.

- Account deletion must delete or anonymise user data according to the approved retention policy.

- Users should be able to export their data before deletion.

- Authentication logs must not contain transaction descriptions, CSV content or private banking identifiers.

# 8. User Roles, Permissions and Household Strategy

Option A is adopted: Phase 1 supports one account per user. Future phases may introduce Household Mode with explicit sharing and permissions. This avoids overcomplicating the MVP while preserving a path to partner/family use.

| **Role**                       | **Timing** | **Permissions concept**                                                                                             |
|--------------------------------|------------|---------------------------------------------------------------------------------------------------------------------|
| Account Owner                  | Phase 1    | Full control over personal account, settings, imports, transactions, exports and deletion.                          |
| Household Administrator        | Future     | Creates household, invites members, manages shared budgets/properties and permissions.                              |
| Household Member               | Future     | Can view or edit shared records depending on permission level. May keep selected transactions private if supported. |
| Accountant / Read-only Auditor | Future     | Read-only access to selected reports, exports and evidence, with no transaction editing rights.                     |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Household design rule</strong></p>
<p>Shared finance functionality must never accidentally expose private records. Household sharing should be explicit, permissioned and reversible.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 9. Commercial, Subscription and Payment Strategy

SpendGrove should be designed to support future subscriptions or paid tiers, but payment processing and paywalls must not be implemented until the client approves the business model, pricing, App Store policy approach and customer support implications.

| **Plan concept** | **Illustrative inclusions**                                                                      |
|------------------|--------------------------------------------------------------------------------------------------|
| Free             | Manual transactions, basic dashboard, limited CSV imports and safe sample/demo mode.             |
| Plus             | Unlimited CSV imports, merchant rules, recurring transactions, subscriptions and budgets.        |
| Pro              | Property, loan tracking, EOFY reports, advanced exports, web access and accountant export packs. |
| Household add-on | Future shared household workspaces, shared budgets and invited user permissions.                 |

- No payment provider, subscription tier or paywall is to be implemented without explicit approval.

- The architecture should allow feature entitlements later through server-side plan checks and feature flags.

- The app should not block core privacy/data export/account deletion workflows behind a paid tier.

- For iOS digital subscriptions, App Store rules must be rechecked before implementation.

# 10. Target Architecture and Engineering Principles

SpendGrove should use clean architecture with shared domain logic. CSV parsing, privacy scanning, duplicate matching, merchant cleanup, rule evaluation, reporting and loan reconciliation should not be buried in UI components.

| **Layer**            | **Responsibility**                                                                                                                               |
|----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| Presentation         | Mobile and web screens, forms, cards, review tables, dashboard widgets and settings UI.                                                          |
| Application services | Import workflows, transaction CRUD orchestration, export generation, notifications and feature-flag checks.                                      |
| Domain logic         | Money/date utilities, financial-year logic, duplicate scoring, split validation, merchant matching, recurring detection and report calculations. |
| Data access          | Typed repositories or ORM models with user ownership and audit history.                                                                          |
| Infrastructure       | Authentication, storage, email, monitoring, analytics, crash reporting, background jobs and future third-party integrations.                     |

- Use integer cents for money throughout persistence and calculations.

- Use typed schemas and server-side validation for all mutations and imports.

- Use feature flags for major modules: properties, loans, tax, recurring, Basiq, AI, web beta and household mode.

- Keep provider keys and secrets server-side only.

- Keep import parser behaviour covered by fixtures and regression tests.

# 11. Core Data Model and Financial Rules

The data model should support single-user MVP functionality while being extensible to households, web access, subscriptions, documents and audit history. Field names may vary by implementation, but relationships and product intent must be preserved.

| **Model**                                      | **Purpose**                                                                                      |
|------------------------------------------------|--------------------------------------------------------------------------------------------------|
| User                                           | Account owner identity, authentication profile and lifecycle state.                              |
| UserSettings                                   | Currency, financial year, feature flags, privacy settings, analytics opt-out and mode selection. |
| Category                                       | System and user-defined income, expense and transfer categories.                                 |
| Transaction                                    | Core income, expense, transfer and split records, with integer cents and import metadata.        |
| ImportBatch                                    | Safe metadata about an import, excluding raw CSV content by default.                             |
| BankImportProfile                              | Saved safe column mapping and parser options per bank/import type.                               |
| MerchantProfile / MerchantAlias / MerchantRule | Canonical merchant identity, aliases and user-confirmed rules.                                   |
| LoanAccount / LoanRepayment                    | Loan account metadata and repayment breakdowns for principal, interest, fees and balance.        |
| Property                                       | Investment property records, linked transactions and tax reporting context.                      |
| Subscription / RecurringTemplate               | Confirmed recurring payments, expected frequency and future matching behaviour.                  |
| Budget                                         | Category budgets, periods and progress tracking.                                                 |
| DocumentAttachment                             | Receipts, property documents, loan statements and tax evidence.                                  |
| AuditEvent                                     | Transaction edits, imports, merges, rule changes, exports and settings changes.                  |
| Household / HouseholdMember                    | Future shared-finance workspace and permissions.                                                 |

## 11.1 Financial counting rules

| **Scenario**                        | **Required treatment**                                                                            |
|-------------------------------------|---------------------------------------------------------------------------------------------------|
| Normal transaction                  | Count once in dashboards, budgets and reports.                                                    |
| Split parent                        | Display container only. Exclude from financial totals.                                            |
| Split child                         | Count in totals and reports. Carries category, property and tax meaning.                          |
| Skipped duplicate                   | Do not create transaction. Preserve import summary metadata only.                                 |
| Merged manual/imported row          | Preserve manual context and attach import metadata without creating a duplicate.                  |
| Everyday loan repayment transaction | Count once as cashflow/spending.                                                                  |
| Loan CSV breakdown                  | Do not double count. Use for principal, interest, fees, balances and tax grouping where relevant. |

# 12. Application Navigation and Information Architecture

Navigation should be simple for beginners but extensible for advanced users. Simple Mode should hide complex modules without deleting data or preventing future activation.

| **Area**         | **Mobile treatment**                                            | **Web treatment**                                                |
|------------------|-----------------------------------------------------------------|------------------------------------------------------------------|
| Home             | Bottom-tab primary screen with summary cards and quick actions. | Dashboard overview with wider charts and recent activity.        |
| Transactions     | Card list with filters and transaction detail modal.            | Table-first ledger with bulk actions and filters.                |
| Add              | Prominent quick entry flow.                                     | Modal or full-page form for fast entry.                          |
| Import           | Guided wizard and card review.                                  | Desktop import centre with tables, bulk editing and exports.     |
| Insights         | Simple charts and plain-language summaries.                     | Advanced charting, filters and drilldowns.                       |
| Properties/Loans | Advanced Mode modules only.                                     | Detailed panels, statements and reports.                         |
| Settings         | Profile, mode, features, privacy, export/delete and support.    | Account, billing, import profiles, household and admin settings. |

# 13. Mobile App Specification

The first-class user experience is iPhone. The design should align with the SpendGrove green/teal logo, white or soft off-white backgrounds, rounded cards, strong contrast, large touch targets and plain-English labels.

- Use bottom navigation for core areas and avoid dense spreadsheet-style screens on phone.

- Use guided import steps: upload, privacy scan, mapping, review, confirm and summary.

- Use cards/chips/badges for statuses such as uncategorised, possible duplicate, merge recommended and possible subscription.

- Provide empty states that explain what to do next rather than showing blank screens.

- All forms should include clear labels, validation, large inputs and obvious primary/secondary actions.

- UI is not considered final until the client has reviewed screenshots or a working preview.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>UI flexibility rule</strong></p>
<p>The agent may make first-pass UI decisions for buttons, cards, spacing and layout within the simple green/teal design direction. The client may request changes during review and the agent must implement approved changes.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 14. Web Platform Specification

The future web app is not a separate product. It is a companion interface using the same account, database and domain logic. It should focus on workflows that are easier on desktop: CSV import, review tables, bulk editing, reporting, exports and future accountant/household administration.

| **Web module**       | **Required future behaviour**                                                                       |
|----------------------|-----------------------------------------------------------------------------------------------------|
| Import Centre        | Drag/drop CSV, bank selection, profile management, row review, bulk actions and parser diagnostics. |
| Transactions Ledger  | Large table view, saved filters, bulk category/property/tax updates and audit history.              |
| Reports              | Advanced date filters, export packs, property reports, loan reports and PDF/CSV downloads.          |
| Account and billing  | Subscription management, data export, account deletion and privacy settings.                        |
| Accountant workspace | Future read-only access to selected reports/evidence with explicit permission.                      |

# 15. Onboarding, Settings and Feature Flags

Onboarding must communicate the product promise immediately: users can track money without handing over bank logins. The initial experience should offer a simple path: add a manual transaction or import a CSV.

| **Setting / flag**       | **Purpose**                                                                                                  |
|--------------------------|--------------------------------------------------------------------------------------------------------------|
| Simple Mode              | Default. Shows core budget and transaction workflows and hides advanced modules.                             |
| Split transactions       | Enables split editor and split reporting.                                                                    |
| Tax reporting            | Shows tax flags, tax groups and EOFY report areas.                                                           |
| Property tracking        | Shows property fields, property reports and property-linked transactions.                                    |
| Loan tracking            | Shows home/personal loan CSV import, loan accounts and repayment breakdowns.                                 |
| Subscriptions/recurring  | Shows recurring detection, subscription page and reminders.                                                  |
| Enhanced merchant lookup | Future optional setting. Default off. Requires privacy disclosure and client approval before production use. |
| Analytics opt-out        | Allows users to disable non-essential analytics.                                                             |

# 16. Transaction Management

Transactions are the core ledger for manual entry, CSV import, splits, duplicates, tax grouping, property linking, loan reconciliation and reports.

| **Field / capability** | **Requirement**                                                                                                              |
|------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Type                   | Income, expense or transfer. Expense is default for manual entry.                                                            |
| Date                   | Australian-friendly date display and parsing.                                                                                |
| Amount                 | Entered as dollars, stored as integer cents.                                                                                 |
| Merchant / Payee       | Cleaned merchant display name with original description preserved for import audit.                                          |
| Category               | Required for confirmed records unless deliberately uncategorised/needs review.                                               |
| Property and tax       | Optional fields when advanced flags are enabled.                                                                             |
| Future CSV hint        | Checkbox indicating a manual transaction may later appear in a CSV import. Enables fuzzy matching and merge recommendations. |
| Splits                 | Parent container excluded from totals; children counted with separate category/property/tax treatment.                       |
| Audit history          | Edits, merges, deletions and category changes should be logged.                                                              |

- Split child totals must equal parent amount exactly in cents before saving.

- Merging an import row into a manual transaction must preserve manual notes, splits, tax flags and property links.

- Soft delete should be considered for transactions so accidental deletion can be recovered within a defined window.

- Bulk editing should be web-first and require confirmation/undo where practical.

# 17. CSV Import Engine and Bank Format Register

The CSV import engine is SpendGrove’s signature capability. It must support known Australian bank formats, manual/generic mapping and safe regression testing using synthetic and redacted fixtures.

| **Workflow step** | **Required behaviour**                                                                       |
|-------------------|----------------------------------------------------------------------------------------------|
| Upload            | User selects transaction CSV, home loan CSV or personal loan CSV where supported.            |
| Privacy scan      | Detect and exclude private fields before mapping/review.                                     |
| Bank detection    | Score likely bank/profile based on headers, column order, date formats and amount formats.   |
| Mapping           | Allow manual mapping where confidence is low or unknown.                                     |
| Profile saving    | Save safe column mapping per bank/import type for future use.                                |
| Review            | Show editable rows with category suggestions, duplicate status, action and warning badges.   |
| Commit            | Only reviewed rows are committed. Create ImportBatch metadata and transactions/merges/skips. |
| Summary           | Show counts, totals, private columns excluded and follow-up items.                           |

## 17.1 Bank register targets

Initial targets: CommBank, Westpac, NAB, ANZ, Macquarie, ING, Bankwest, St George, BankSA, Bank of Melbourne, Suncorp, Bendigo Bank, Adelaide Bank, BOQ, ubank, Up, Great Southern Bank, Heritage Bank and People’s Choice.

Each register entry should include bank ID, aliases, expected headers, expected column order, date/description/amount/debit/credit/balance mappings, date and amount formats, private-field patterns, detection scoring, edge cases and support status.

# 18. Privacy Scanning, Safe File Handling and Import Review

SpendGrove must assume CSV files may contain private banking fields even when users believe they are simple transaction exports. The product must visibly protect the user and clearly communicate what is excluded.

| **Risk**                                                | **Control**                                                                                                |
|---------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| BSB/account number/account name/card/customer ID fields | Detect by header and value pattern, exclude from stored records, and tell the user they were excluded.     |
| Raw CSV storage                                         | Do not store raw CSVs by default. Parse in memory or temporary secure storage and delete after processing. |
| Logs/screenshots                                        | Never log raw rows or private fields. Support flow should warn against unredacted uploads.                 |
| Third-party lookup leakage                              | Never send full CSVs or private fields to Basiq or any external provider.                                  |
| Real test files                                         | Use only in gitignored private local folders. Convert parser learnings into synthetic/redacted fixtures.   |

## 18.1 Import review row actions

| **Action**             | **Meaning**                                                                                     |
|------------------------|-------------------------------------------------------------------------------------------------|
| Import                 | Create a new transaction using reviewed values.                                                 |
| Skip                   | Do not create a transaction, but preserve safe import summary metadata.                         |
| Merge                  | Attach imported metadata to an existing manual or candidate duplicate transaction.              |
| Create category        | Create and assign category inline without leaving review.                                       |
| Apply to same merchant | Apply chosen category to all matching merchant rows in current review and optionally save rule. |
| Save rule/alias        | Create merchant rule or alias for future imports after user confirmation.                       |

# 19. Home Loan, Personal Loan and Reconciliation Engine

Loan imports must be treated as first-class import types, not one-off parsers. Home loan and personal loan files may contain payment, interest, fee, principal and balance data that should reconcile against ordinary transaction cashflows without double counting.

| **Scenario**                            | **Required behaviour**                                                                                 |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------|
| Everyday account payment imported first | Later loan CSV should suggest linking repayment breakdown to the existing transaction.                 |
| Loan CSV imported first                 | Create unmatched repayment and suggest linking when the cashflow transaction appears later.            |
| Investment property loan                | Interest and eligible fees may flow to property tax report; principal is excluded.                     |
| Owner-occupier loan                     | Show repayment breakdown but do not treat interest as deductible by default.                           |
| Personal loan                           | Track repayment, principal, interest and balance where available, but do not default to tax treatment. |
| Split loans                             | Support multiple LoanRepayment records linked to one cashflow payment where needed.                    |

- LoanAccount should store bank, nickname, loan purpose, loan type, linked property, balances and safe masked reference only if needed.

- LoanRepayment should store total payment, principal, interest, fees, balance after payment, source import and reconciliation status.

- The user must be able to manually link/unlink repayments and transactions.

- Unmatched repayment queues should be visible and actionable.

# 20. Merchant Intelligence, Categorisation and Basiq Roadmap

Merchant intelligence should reduce user review effort over time without removing user control. SpendGrove must prioritise local rules and user-confirmed history before any optional provider-based enrichment.

| **Priority** | **Suggestion source**                 | **Rule**                                                                   |
|--------------|---------------------------------------|----------------------------------------------------------------------------|
| 1            | User-confirmed merchant/category rule | Use saved local rule. Do not call Basiq.                                   |
| 2            | Merchant alias/canonical profile      | Use known alias and profile defaults.                                      |
| 3            | Local keyword/category rule           | Use built-in or user-managed keyword logic.                                |
| 4            | User history                          | Use previous confirmed categorisation patterns.                            |
| 5            | Optional Basiq enhanced lookup        | Use only if enabled, privacy-safe and no reliable local suggestion exists. |
| 6            | Uncategorised/needs review            | Leave for manual review when confidence is low.                            |

- Merchant settings must include search, filters, aliases, default category, default property, default tax behaviour, transaction count and last seen date.

- Merchant merge should require confirmation before updating historical transactions.

- Enhanced lookup must be optional, off by default, sandbox-tested first and clearly labelled in review.

- Confirmed enhanced suggestions should become local rules so future imports do not repeat provider calls.

# 21. Recurring Transactions and Subscriptions

Recurring detection should identify repeated payments over time but should not silently create templates without user confirmation. Confidence should improve as more import batches are added.

| **Capability**    | **Requirement**                                                                                  |
|-------------------|--------------------------------------------------------------------------------------------------|
| Detection signals | Same merchant, similar amount, regular interval, description patterns and user confirmations.    |
| Review badge      | Rows can show possible subscription/recurring badges in import review.                           |
| Confirmation      | User confirms frequency, amount range, category and next expected date.                          |
| Future merging    | Imported rows should link to confirmed templates rather than duplicate predicted/manual records. |
| Reminders         | Optional future notifications before due dates.                                                  |
| Analytics         | Monthly and annualised subscription totals.                                                      |

# 22. Budgets, Insights and Dashboard

Budgets and insights should convert raw transaction data into simple, understandable guidance. The dashboard should be helpful without being intimidating.

| **Widget / area**      | **Requirement**                                                                       |
|------------------------|---------------------------------------------------------------------------------------|
| Current month summary  | Income, expenses, net position, savings rate and comparison to prior month.           |
| Budget progress        | Category progress bars, remaining amount and over-budget warnings.                    |
| Recent transactions    | Latest transactions with category/tax/property/import badges.                         |
| Upcoming subscriptions | Due soon and large recurring payments.                                                |
| Needs review           | Uncategorised transactions, possible duplicates, unmatched loans and pending imports. |
| Property FYTD          | Rental income, property expenses, interest/fees and net position where enabled.       |

- Initial budgets may be monthly by category; rollovers and forecasting can come later.

- Reports and budgets must count split children and exclude split parents.

- Insights should avoid judgmental language and present simple explanations and drilldowns.

# 23. Net Worth Module

Net worth tracking is a future advanced module. It should remain separate from the MVP but be anticipated in the data model and roadmap. It should allow users to track assets, liabilities and long-term financial position over time.

| **Category** | **Examples**                                                                                                          |
|--------------|-----------------------------------------------------------------------------------------------------------------------|
| Assets       | Cash, offset accounts, savings, property values, vehicles, investments and superannuation.                            |
| Liabilities  | Home loans, investment loans, personal loans, credit cards, HECS/HELP and other debts.                                |
| Trends       | Monthly or quarterly net worth snapshots, asset/liability charts and manual valuation updates.                        |
| Privacy      | Manual values only unless future optional integrations are approved. Values must not be used for analytics profiling. |

# 24. Property, Loans and Tax Reporting

Property and tax tools are advanced features. They should help users organise records for personal/accountant review, not provide regulated financial or tax advice.

| **Area**              | **Requirement**                                                                                              |
|-----------------------|--------------------------------------------------------------------------------------------------------------|
| Property records      | Nickname, optional address, property type, ownership share, linked loans and default rules.                  |
| Property transactions | Manual or imported transactions and split children may link to properties.                                   |
| Loan tax treatment    | Investment loan interest/eligible fees may flow to property reports. Principal never defaults as deductible. |
| EOFY reports          | Financial-year grouping with drilldown and export. Include tax disclaimer.                                   |
| Mixed-use complexity  | Future support requires explicit user confirmation and may need accountant review prompts.                   |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>Tax disclaimer requirement</strong></p>
<p>SpendGrove reports are organisational tools only. They must not be presented as tax, financial or investment advice.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 25. Reports, Exports and Accountant Packs

Reports should support both everyday budgeting and accountant-friendly record preparation. Export should reinforce the user ownership principle.

| **Report/export**   | **Requirement**                                                                |
|---------------------|--------------------------------------------------------------------------------|
| Monthly summary     | Income, expenses, net, category totals, merchant totals and budget comparison. |
| Category report     | Spending by category over a selected date range with transaction drilldown.    |
| EOFY tax report     | Tax-flagged transactions grouped by financial year and tax group.              |
| Property tax report | Property income, deductible expense groups, loan interest and loan fees.       |
| Loan report         | Principal, interest, fees, balances and linked cashflow status.                |
| Subscription report | Active subscriptions, monthly total and annualised cost.                       |
| Import audit report | Batches, rows imported/merged/skipped, warnings and excluded private columns.  |
| Full account export | CSV/JSON export of user-owned data before deletion or migration.               |
| Accountant pack     | Future ZIP/PDF/CSV pack with reports, evidence list and selected documents.    |

# 26. Document and Receipt Management

Document storage is a future module supporting receipts, property records, invoices, loan statements and tax evidence. It should be privacy-conscious and controlled by the user.

- Receipt attachments may link to transactions or split child lines.

- Property documents may link to a property, loan account or financial year.

- Attachments should have file type, size, upload date, owner, linked records and retention/deletion metadata.

- OCR/AI extraction should be optional and privacy-reviewed before implementation.

- Support flows must not request unredacted bank statements or private documents unless absolutely necessary and formally approved.

# 27. Notifications and Reminders

Notifications should be useful and respectful. They should support budgeting and recordkeeping without becoming noisy.

| **Notification type**   | **Purpose**                                                                 |
|-------------------------|-----------------------------------------------------------------------------|
| Budget alert            | Notify when spending approaches or exceeds a budget threshold.              |
| Subscription reminder   | Notify before large or important recurring payments.                        |
| Import reminder         | Prompt if no CSV import has occurred recently or pending review exists.     |
| Loan repayment reminder | Future reminder for scheduled repayment or unmatched loan import follow-up. |
| Report reminder         | EOFY preparation reminders and export prompts.                              |

- Notifications should be opt-in and configurable.

- Notification content should avoid sensitive details on lock screens unless explicitly allowed.

- Push notifications must be disclosed in App Store/privacy materials as required.

# 28. Help, Support and Feedback

Help content should reduce friction and build trust. It should explain the privacy-first model, CSV import process, bank export guidance, redaction guidance and limitations of tax reports.

| **Support feature**      | **Requirement**                                                                                           |
|--------------------------|-----------------------------------------------------------------------------------------------------------|
| Help Centre              | Searchable articles for onboarding, CSV import, manual entry, reports, property/loans and privacy.        |
| FAQ                      | No bank login, manual entry support, CSV privacy scan, tax disclaimer, data deletion and supported banks. |
| Feedback/bug reports     | Structured support form with issue/suggestion/bank-format categories.                                     |
| Safe sample contribution | Ask for headers, column order and fictional rows only; never request private values.                      |
| Support operations       | Future triage workflow, status, internal notes and closure reason.                                        |

# 29. Privacy, Security and Compliance Framework

Privacy and security are core product features. They should be built early, tested repeatedly and reflected in user-facing copy.

| **Area**                   | **Requirement**                                                                                                |
|----------------------------|----------------------------------------------------------------------------------------------------------------|
| Transport security         | HTTPS only in production.                                                                                      |
| Encryption at rest         | Use managed database/storage encryption; consider field-level encryption for high-sensitivity optional fields. |
| Password security          | Use trusted auth provider or secure hashing/session management. Never store plaintext credentials.             |
| Authorisation              | Every API checks user ownership and role permissions.                                                          |
| Input validation           | Validate all imports, mutations, file uploads and report requests.                                             |
| Logging                    | Do not log raw CSV content, private fields, full sensitive descriptions or provider secrets.                   |
| Rate limiting              | Protect auth, import and provider endpoints.                                                                   |
| Secrets management         | Server-side environment variables only. No secrets in mobile/web clients.                                      |
| Security incident response | Prepare future process for triage, containment, communication and remediation.                                 |

- Privacy policy must plainly explain what data is collected, what is not collected, and how CSV privacy scanning works.

- Any third-party analytics, crash reporting or merchant enrichment must be disclosed and minimised.

- Future AI features must be opt-in and privacy-reviewed.

- No production open-banking or live account linking is included in the core product promise.

# 30. Data Ownership, Retention, Deletion and Recovery

Users must not be locked into SpendGrove. Data export and deletion are part of the trust model and App Store readiness.

| **Lifecycle capability** | **Requirement**                                                                                                   |
|--------------------------|-------------------------------------------------------------------------------------------------------------------|
| Data export              | CSV/JSON exports for transactions, categories, imports, reports, properties, loans and settings where applicable. |
| Soft delete              | Consider recoverable deletion for transactions, categories, documents and import batches within a defined window. |
| Permanent deletion       | User-initiated account deletion should permanently remove or anonymise user data according to final policy.       |
| Backup retention         | Define backup retention and deletion propagation before public launch.                                            |
| Recovery                 | Provide recovery path for accidental deletion where feasible and policy-compliant.                                |
| Audit retention          | Audit records should support integrity and debugging while respecting account deletion requirements.              |

# 31. Analytics, Monitoring and Production Operations

Production readiness requires operational visibility without compromising privacy. Monitoring should help keep the app reliable and identify parser/import failures while avoiding sensitive financial analytics.

| **Operational area**       | **Requirement**                                                                                                       |
|----------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Crash reporting            | Enable before public launch; scrub sensitive metadata.                                                                |
| Performance monitoring     | Track slow screens/imports/API calls without recording transaction content.                                           |
| Import success metrics     | Track parser success/failure, bank confidence, mapping required and row warning counts.                               |
| Privacy-friendly analytics | Track feature usage and completion funnels, not transaction amounts, balances or merchant-level behavioural profiles. |
| Incident management        | Define severity levels, response process, user communication and post-incident review.                                |
| Backups                    | Automated backups with tested recovery procedures.                                                                    |
| Environment strategy       | Separate development, staging and production environments with separate secrets and databases.                        |

# 32. AI and Automation Roadmap

AI features are optional future enhancements. They must never undermine the privacy-first product promise or silently alter financial data without review.

| **Future AI feature**       | **Guardrail**                                                                                                           |
|-----------------------------|-------------------------------------------------------------------------------------------------------------------------|
| AI categorisation assistant | Use only cleaned merchant/category context and ask for user confirmation before saving rules.                           |
| Natural language search     | Search user-owned records; avoid sending sensitive content to external models unless explicitly approved and disclosed. |
| Budget coaching             | Provide general insights; avoid regulated financial advice.                                                             |
| Spending anomaly detection  | Flag unusual patterns for review, not automatic changes.                                                                |
| Document extraction         | Opt-in only and privacy-reviewed; avoid sending sensitive documents to providers without consent.                       |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><p><strong>AI rule</strong></p>
<p>AI may assist with suggestions and explanations, but user review remains mandatory for categories, rules, imports, tax flags, property links and financial reports.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 33. Apple App Store and Release Readiness

SpendGrove should be developed with App Store submission in mind, even if the first build is a responsive web or prototype implementation. Official Apple requirements must be checked again before launch.

- App must have a clear purpose and stable core flows.

- Privacy policy and App Store privacy details must match actual data collection.

- Account deletion must be available if account creation is supported.

- No misleading financial, tax or investment claims are permitted.

- Screenshots and App Store copy must accurately explain CSV import and no-bank-login positioning.

- Any subscriptions, analytics, crash reporting, AI or third-party lookup must be disclosed and compliant.

- Tax reports must include disclaimers and avoid presenting outputs as advice.

Key guidance to re-check before launch includes Apple App Store Review Guidelines, App privacy details, App Store Connect privacy requirements and Apple Human Interface Guidelines.

# 34. QA, Testing and Acceptance Criteria

Testing should focus on financial accuracy, privacy protections, import reliability, mobile usability and regression safety. A feature is not complete merely because code exists.

| **Test area**        | **Acceptance expectation**                                                                       |
|----------------------|--------------------------------------------------------------------------------------------------|
| Transaction CRUD     | Create/edit/delete/duplicate normal and split transactions; validate cents and split totals.     |
| CSV privacy scan     | Private fields detected, warned and excluded from storage/logging.                               |
| Bank detection       | Known formats detected; unknown formats trigger manual mapping.                                  |
| Import review        | Rows can be imported, skipped, merged, edited and categorised before commit.                     |
| Duplicate handling   | Exact duplicates skipped; possible duplicates reviewed; manual future CSV hints merge correctly. |
| Merchant rules       | Rules and aliases apply in correct priority order.                                               |
| Loan reconciliation  | Loan breakdowns link to cashflow transactions without double counting.                           |
| Reports              | Totals match transaction counting rules and financial year selection.                            |
| Mobile UX            | No clipped controls on iPhone-sized screens; import review usable as cards.                      |
| Security/auth        | User ownership enforced and production auth used before launch.                                  |
| Data export/deletion | Export and deletion work according to final lifecycle policy.                                    |

## 34.1 Definition of Done

- Delivered behaviour matches approved scope and does not silently expand phase boundaries.

- UI works on iPhone and relevant web/desktop layouts.

- Validation, empty states, errors and loading states are implemented.

- Privacy and data integrity rules are preserved.

- Typecheck, lint, unit tests, smoke tests and parser regression tests pass or exceptions are documented.

- Screenshots or preview links are provided for UI review.

- Known limitations and next recommended task are documented.

- Client change requests are resolved, deferred or rejected with reasons.

# 35. Autonomous Agent Delivery Model

Codex or a similar coding agent should act like a professional lead developer working for a client. The client should not need to provide every micro-task once an active phase is approved. The agent should break the phase into logical PR-sized tasks and proceed through review gates.

| **Agent may do autonomously**                                                                                                         | **Agent must pause for approval**                                                                                                                                                                                  |
|---------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Create components, utilities, services, tests, folders, small UI refinements and internal quality improvements inside approved scope. | New phase, scope expansion, material UX/navigation change, schema change, privacy/logging change, financial calculation change, third-party service, payment/paywall implementation or production launch decision. |
| Continue to the next task in the active approved phase after PR approval.                                                             | Milestone closure, user testing checkpoint, real CSV handling beyond local testing or any unresolved conflict with the specification.                                                                              |
| Suggest improvements labelled recommended, optional or risk-driven.                                                                   | Implementing material suggestions that change product behaviour, privacy, architecture or commercial model.                                                                                                        |

| **Required repository control file** | **Purpose**                                                             |
|--------------------------------------|-------------------------------------------------------------------------|
| AGENTS.md                            | Standing autonomous-agent instructions and approval boundaries.         |
| docs/AUTONOMOUS_DELIVERY_MODE.md     | Rules for continuation, pause points and no-over-questioning behaviour. |
| docs/MVP_SCOPE.md                    | Locked Phase 1 boundaries and exclusions.                               |
| docs/BUILD_PLAN.md                   | Phased task sequence.                                                   |
| docs/REVIEW_GATES.md                 | PR, UI, data/privacy, user testing and milestone requirements.          |
| docs/DEFINITION_OF_DONE.md           | Completion standard.                                                    |
| docs/DESIGN_SYSTEM.md                | UI and brand rules.                                                     |
| docs/UI_FEEDBACK_PROCESS.md          | How the client reviews UI and requests changes.                         |
| docs/CSV_TESTING_PROTOCOL.md         | Safe handling of real, redacted and synthetic CSV samples.              |
| docs/DECISION_LOG.md                 | Approved decisions and implementation impact.                           |

# 36. Delivery Roadmap

The roadmap should be delivered progressively. Each phase requires review, testing and approval before the next phase begins.

| **Phase**                                 | **Scope**                                                                                                                                                                                                     | **Exit criteria**                                                                                        |
|-------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Phase 1 - MVP Foundation                  | Account-ready data model, app shell, onboarding/settings, categories, manual transactions, transaction CSV import, privacy scan, mapping/review, duplicate handling, basic merchant rules and import history. | Client can create transactions, import CSVs safely, review/merge/skip rows and view summaries on mobile. |
| Phase 2 - Import Refinement               | Inline category creation, apply-to-same-merchant, import profiles, stronger generic mapping, merchant aliases and parser regression fixtures.                                                                 | Import review becomes efficient and stable across supplied bank samples.                                 |
| Phase 3 - Loans, Properties and Tax       | Loan accounts, home/personal loan CSV import, reconciliation, property records and EOFY property reports.                                                                                                     | Loan repayments are reconciled without double counting and reports are exportable.                       |
| Phase 4 - Recurring, Budgets and Insights | Subscription detection, budget CRUD, dashboard refinement, trends and reminders.                                                                                                                              | Users can understand monthly position and recurring commitments.                                         |
| Phase 5 - Production Readiness            | Auth, export/delete, privacy policy, monitoring, analytics controls, support, App Store readiness and security hardening.                                                                                     | Private beta/public launch readiness achieved.                                                           |
| Phase 6 - Desktop Web Platform            | Web import centre, bulk editing, advanced reports, account/billing and future accountant workspace.                                                                                                           | Same account/data works across mobile and web.                                                           |
| Phase 7 - Optional Enhancements           | Basiq sandbox-to-production review, AI assistants, household mode, documents, net worth and accountant packs.                                                                                                 | Each optional module approved separately with privacy/commercial review.                                 |

# Appendix A. Default Australian Category Seed List

### Income

- Salary / wages

- Business income

- Rental income

- Interest income

- Dividends

- Refunds / rebates

- Government payments

- Other income

### Everyday spending

- Groceries

- Dining out

- Coffee / takeaway

- Transport

- Fuel

- Parking

- Public transport

- Rideshare / taxi

- Shopping

- Clothing

- Health / pharmacy

- Medical / dental

- Entertainment

- Hobbies

- Gifts

- Pets

### Bills and household

- Electricity

- Gas

- Water

- Internet

- Mobile phone

- Streaming / subscriptions

- Insurance

- Council rates

- Rent

- Mortgage / loan repayment

- Home maintenance

- Homewares

- Bank fees

### Financial

- Savings transfer

- Investment contribution

- Credit card payment

- Loan repayment

- Interest charged

- Fees

- Tax payment

- ATO refund

### Property investment

- Rental income

- Property management fees

- Repairs and maintenance

- Council rates

- Water charges

- Strata / body corporate

- Landlord insurance

- Property loan interest

- Property loan fees

- Advertising

- Cleaning

- Gardening

- Pest control

- Depreciation / capital works placeholder

- Other property expense

### Tax / work related

- Work travel

- Uniforms / protective clothing

- Training / education

- Professional memberships

- Home office

- Tools / equipment

- Donations

- Tax agent fees

- Other deductible expense

### Review

- Uncategorised

- Needs review

- Possible duplicate

- Transfer to review

# Appendix B. Schema Blueprint Summary

| **Entity**                 | **Key fields / notes**                                                                                                                                          |
|----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| User                       | id, email, displayName, timezone, country, createdAt, updatedAt, lifecycle status.                                                                              |
| UserSettings               | currency, FY start, simpleMode, feature flags, analytics opt-out, enhanced lookup consent.                                                                      |
| Transaction                | userId, type, date, amountCents, merchant, originalDescription, categoryId, propertyId, tax fields, split parent/child, import metadata, futureCsvMatch fields. |
| ImportBatch                | userId, importType, bankId, filename, row counts, warnings, privateColumnsExcluded, parserVersion, summary totals.                                              |
| LoanAccount                | bankId, nickname, loanPurpose, loanType, linked property, balances, masked reference.                                                                           |
| LoanRepayment              | loanAccountId, repaymentDate, total, principal, interest, fees, balance, linkedTransactionId, reconciliationStatus.                                             |
| MerchantProfile/Alias/Rule | canonical name, alias text, default category/property/tax, transaction count, last seen.                                                                        |
| AuditEvent                 | userId, actor, eventType, entityType, entityId, before/after summary, timestamp, metadata.                                                                      |
| DocumentAttachment         | owner, file metadata, linked entity, storage key, retention/deletion status.                                                                                    |
| Household/Future roles     | householdId, membership, role, permissions and invited status.                                                                                                  |

# Appendix C. Import State Machine

| **State**        | **Meaning**                                               | **Allowed transitions**                |
|------------------|-----------------------------------------------------------|----------------------------------------|
| created          | File selected but not processed.                          | scanning, cancelled                    |
| scanning         | Privacy scan and parser detection running.                | mapping_required, review_ready, failed |
| mapping_required | Bank/columns cannot be confidently detected.              | review_ready after mapping, cancelled  |
| review_ready     | Rows parsed and safe preview generated.                   | reviewing, cancelled                   |
| reviewing        | User edits row actions and category/property/tax choices. | confirming, cancelled                  |
| confirming       | Server commits accepted actions.                          | completed, failed                      |
| completed        | Import batch committed and summary saved.                 | view_only                              |
| failed           | Processing error occurred.                                | retry, cancelled                       |

# Appendix D. Duplicate Scoring Guidance

| **Signal**                               | **Illustrative score** | **Notes**                                             |
|------------------------------------------|------------------------|-------------------------------------------------------|
| Exact amount match                       | +30                    | Same cents value.                                     |
| Rounded amount match                     | +18                    | Useful for manual rounded entries.                    |
| Same-day date match                      | +25                    | High confidence.                                      |
| Date within +/-3 days                    | +15                    | Covers processing delays.                             |
| Cleaned merchant exact/alias match       | +25                    | Use merchant profiles and aliases.                    |
| Description token overlap                | +10                    | Useful when cleanup differs.                          |
| Manual future CSV flag                   | +20                    | Strong user signal.                                   |
| Same import hash                         | +100                   | Exact duplicate; recommend skip.                      |
| Known recurring interval different month | -25                    | Avoid mistaking subscription instances as duplicates. |

Suggested thresholds: 80+ high-confidence duplicate or merge; 55-79 possible duplicate requiring review; below 55 import as new unless another rule applies. These thresholds should be refined after real redacted sample testing.

# Appendix E. CSV Testing Protocol

| **Sample type**          | **Permitted use**                                | **Handling rule**                                                                                     |
|--------------------------|--------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Real client-provided CSV | Temporary local testing only.                    | Never commit, upload to third parties or log raw rows. Store only in gitignored private-local folder. |
| Redacted fixture         | Regression tests after sanitisation.             | Remove or fictionalise private fields, names and sensitive descriptions.                              |
| Synthetic fixture        | Default committed fixtures and sample downloads. | Use fictional Australian transactions only.                                                           |
| Loan CSV                 | Parser and reconciliation development.           | Treat as sensitive and ensure no double counting.                                                     |

# Appendix F. Product Copy and App Store Draft

- Tagline: Track your money without handing over your bank login.

- Short description: Private Australian expense tracking from your own bank CSV exports.

- Positioning: Import, review, categorise and understand your spending while keeping control of what data is stored.

- Disclaimer: SpendGrove does not provide financial, tax or investment advice.

Draft App Store description: SpendGrove is an Australian personal finance app for people who want clearer spending insights without linking their bank account. Import transaction CSV exports from your bank, review every row, categorise spending, track budgets, identify subscriptions, manage investment property expenses and prepare cleaner EOFY summaries. SpendGrove is designed around privacy and control: you choose what to import, private account fields are excluded, and manual entry remains available whenever you need it. Advanced tools support split transactions, merchant rules, property loan repayment breakdowns and tax-ready reporting. SpendGrove does not provide financial or tax advice.

# Appendix G. Glossary

| **Term**          | **Meaning**                                                                             |
|-------------------|-----------------------------------------------------------------------------------------|
| CSV               | Comma-separated values file exported from a bank or system.                             |
| ImportBatch       | Safe metadata record representing an import event.                                      |
| BankImportProfile | Saved column mapping and bank settings for future imports.                              |
| Split parent      | Container transaction representing an overall payment; excluded from totals.            |
| Split child       | Allocated part of a split transaction; counted in totals.                               |
| LoanAccount       | A specific home, investment or personal loan account/split.                             |
| LoanRepayment     | Record showing principal, interest, fees and balance for a loan payment.                |
| EOFY / FYTD       | End of financial year / financial year to date. Australian default FY ends 30 June.     |
| Merchant alias    | Alternative name for the same merchant, such as wollies and Woolworths.                 |
| Private fields    | Sensitive fields such as BSB, account number, account name, card number or customer ID. |

# Appendix H. Detailed Screen Specifications

| **Screen**              | **Mobile specification**                                                                                                                                        | **Web/desktop specification**                                                                               |
|-------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Home / Dashboard        | Stack summary cards vertically. Show current month income, expenses, net position, budget progress, recent transactions, quick actions and needs-review alerts. | Use two or three-column dashboard with larger charts, recent transactions table and import/reminder panels. |
| Transactions            | Card list with date, merchant, category, amount, badges and simple filters. Detail screen/modal includes split, import and loan links.                          | Table view with advanced filters, date ranges, bulk category/property/tax updates and export actions.       |
| Add/Edit Transaction    | Large amount field, segmented type control, date picker, merchant, category, optional advanced fields and future CSV match panel.                               | Full form or modal with keyboard-friendly workflow, split editor and duplicate warning sidebar.             |
| Import Landing          | Two clear cards: Bank transaction CSV and Loan CSV. Explain privacy scanning and review-before-commit.                                                          | Import centre with drag/drop, supported bank list, sample templates, recent imports and saved profiles.     |
| Import Mapping          | Simplified guided mapping with preview cards and private columns hidden/masked.                                                                                 | Preview table showing first safe rows and column mapping controls.                                          |
| Import Review           | Cards grouped by status: needs review, possible duplicate, uncategorised, ready, possible subscription.                                                         | Editable table with filters, bulk actions, sticky summary and keyboard-friendly review.                     |
| Import Complete         | Summary cards for imported, merged, skipped and excluded private columns, plus next actions.                                                                    | Detailed import report, downloadable audit summary and links to imported records.                           |
| Merchant Categorisation | Searchable list with merchant cards, default category and aliases.                                                                                              | Full management table with filters, merge tools, historical apply options and rule audit history.           |
| Loan Repayments         | Loan account selector, repayment cards with principal/interest/fees and reconciliation badges.                                                                  | Detailed table, filters, unmatched queue, manual linking and export.                                        |
| Reports                 | Report cards with simple date selectors and export buttons.                                                                                                     | Advanced filters, drilldowns, preview/export workflow and accountant pack generation.                       |
| Settings                | Profile, privacy, mode, feature toggles, export/delete and support.                                                                                             | Account, billing, household, import profiles, privacy, exports and admin settings.                          |

# Appendix I. Detailed Feature Register by Module

| **Module**     | **Feature**                    | **Priority / timing** | **Detailed behaviour**                                                                                       |
|----------------|--------------------------------|-----------------------|--------------------------------------------------------------------------------------------------------------|
| Onboarding     | Privacy-first introduction     | MVP                   | Explain no bank login, no default live bank connection, user-controlled CSV import and review-before-commit. |
| Onboarding     | Simple/Advanced mode           | MVP                   | Default to Simple Mode. Advanced Mode exposes property, tax, loan, merchant rules and reports.               |
| Transactions   | Manual transaction CRUD        | MVP                   | Create, edit, duplicate, delete, search and filter income, expense and transfer records.                     |
| Transactions   | Split transactions             | Early advanced        | Parent is display-only, children count. Live cent-level validation required.                                 |
| Transactions   | Future CSV match hint          | MVP or Phase 2        | Capture expected merchant/date/amount tolerance so later CSV rows can merge into manual records.             |
| CSV Import     | Transaction CSV upload         | MVP                   | Upload, privacy scan, detect bank, map columns, review rows, import/skip/merge and save batch metadata.      |
| CSV Import     | Manual mapping                 | MVP/Phase 2           | For low-confidence or unknown files, user maps date, description, amount/debit/credit and balance.           |
| CSV Import     | Import profile management      | Phase 2               | Save safe mapping per user, bank and import type.                                                            |
| CSV Import     | Inline category creation       | Phase 2               | Create category during row review without leaving import workflow.                                           |
| CSV Import     | Import undo                    | Future                | Allow safe reversal of recent imports with careful treatment of merged manual records.                       |
| Merchant Rules | Merchant profiles              | Phase 2/3             | Canonical merchant, aliases, default category/property/tax and transaction count.                            |
| Merchant Rules | Bulk merchant rule application | Future                | Apply rule to historical transactions with confirmation and audit trail.                                     |
| Loans          | LoanAccount model              | Phase 3               | Store safe loan metadata, loan purpose, type, linked property and balances.                                  |
| Loans          | Loan CSV parser                | Phase 3               | Parse repayments, interest, principal, fees, balance and dates from home/personal loan exports.              |
| Loans          | Reconciliation engine          | Phase 3               | Link loan breakdowns to cashflow transactions and avoid double counting.                                     |
| Recurring      | Subscription detection         | Phase 4               | Identify repeated merchants and amounts over time; require user confirmation.                                |
| Budgets        | Category budgets               | Phase 4               | Monthly budgets, progress, remaining amount and over-budget warnings.                                        |
| Insights       | Charts and trends              | Phase 4               | Category breakdowns, spending trends, merchant trends and subscription totals.                               |
| Properties     | Property CRUD                  | Phase 3/4             | Add/edit/deactivate properties with optional address, loan links and ownership share.                        |
| Reports        | EOFY and property reports      | Phase 3/4             | Financial year grouped reports with disclaimers and export.                                                  |
| Documents      | Receipt/property documents     | Future                | Attach receipts and documents to transactions, properties, loans and reports.                                |
| Net Worth      | Asset/liability tracking       | Future                | Manual values and snapshots for long-term financial picture.                                                 |
| AI             | AI categorisation assistant    | Future                | Opt-in suggestions only; no silent changes and privacy-reviewed provider use.                                |
| Basiq          | Enhanced lookup fallback       | Future                | Sandbox first, opt-in, local-first, cleaned descriptors only and user review required.                       |

# Appendix J. Home Loan and Personal Loan Reconciliation Worked Examples

| **Example**                | **Input situation**                                                                                                                             | **Expected app result**                                                                                                                                          |
|----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Everyday transaction first | Everyday account CSV shows -\$3,200 home loan repayment. Later home loan CSV shows \$3,200 payment with \$1,950 interest and \$1,250 principal. | Link LoanRepayment to existing Transaction. Transactions show one \$3,200 cashflow. Loan page shows breakdown. Property report uses interest only if investment. |
| Loan file first            | Loan CSV shows \$2,800 repayment but no matching everyday transaction exists yet.                                                               | Create unmatched LoanRepayment. Later transaction import suggests linking to pending repayment.                                                                  |
| Interest-only loan         | Loan CSV shows \$2,100 repayment, \$2,100 interest and \$0 principal.                                                                           | Record principal as zero. Investment report includes interest only. Cashflow still shows full payment once.                                                      |
| Split loans                | Two loan accounts each show \$1,600 repayment and everyday account shows one \$3,200 total outgoing payment.                                    | Allow one cashflow transaction to link to two LoanRepayment records or a grouped repayment link. Expenditure remains \$3,200 once.                               |
| Separate fee row           | Loan CSV shows repayment plus a separate \$10 fee.                                                                                              | Record fee as loan cost and link to same period where appropriate. Investment report may include eligible fee subject to review.                                 |
| Amount mismatch            | Everyday transaction is -\$3,200 but loan CSV payment is \$3,199.98.                                                                            | Show needs_review with likely match and allow manual link. Store actual values and explain mismatch.                                                             |
| Personal loan              | Personal loan CSV shows repayment, interest and balance but no property link.                                                                   | Track breakdown and balance. Do not route to property tax by default.                                                                                            |
| Owner occupier loan        | Loan marked owner-occupier.                                                                                                                     | Show repayment breakdown, exclude interest from tax report by default.                                                                                           |
| Investment property loan   | Loan linked to investment property.                                                                                                             | Report interest and eligible fees; exclude principal.                                                                                                            |

# Appendix K. QA and Regression Testing Matrix

| **Test area**            | **Scenario**                                                                        | **Expected result**                                                                      |
|--------------------------|-------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| Privacy scan             | Upload CSV containing BSB, account number and account name columns.                 | Private fields are detected, warning is shown and values are excluded from storage/logs. |
| Supported bank import    | Upload supported CommBank-like CSV.                                                 | Bank detected, rows parsed, review populated and confirm creates transactions.           |
| Generic import           | Upload unknown CSV with headers.                                                    | Manual mapping appears and user can map required columns.                                |
| Duplicate exact          | Import same CSV twice.                                                              | Second import recommends skip for exact duplicates.                                      |
| Manual merge             | Create rounded manual transaction with future CSV hint, then import exact bank row. | Review recommends merge and preserves manual context.                                    |
| Split validation         | Create split where children do not equal parent.                                    | Save blocked with clear error.                                                           |
| Split reports            | Split parent with children in different categories.                                 | Reports count children only.                                                             |
| Inline category          | Create new category during import review.                                           | Category is created and assigned without leaving review.                                 |
| Apply merchant category  | Change Woolworths category and accept apply-to-same-merchant.                       | All same merchant rows in current review update.                                         |
| Merchant alias           | Merge wollies into Woolworths.                                                      | Future imports use canonical merchant and rules.                                         |
| Subscription detection   | Import three months of same streaming payment.                                      | App suggests possible subscription with confirmation flow.                               |
| Loan reconciliation      | Import transaction payment and matching loan breakdown.                             | One cashflow transaction appears and repayment breakdown is linked.                      |
| Investment report        | Investment loan has principal and interest.                                         | Report includes interest/fees and excludes principal.                                    |
| Mobile layout            | Open import review on iPhone viewport.                                              | No clipped columns; row cards readable and actions accessible.                           |
| Account deletion         | Production user deletes account.                                                    | Deletion/export flow works according to final policy.                                    |
| Enhanced lookup fallback | No local category and enhanced lookup enabled in sandbox.                           | Only cleaned descriptor is sent; suggestion is labelled and requires confirmation.       |
| Enhanced lookup privacy  | Row contains account-like or BSB-like text.                                         | No provider call; row remains local/manual review.                                       |

# Appendix L. Release Readiness Checklist

| **Release area** | **Required before public launch**                                                                         |
|------------------|-----------------------------------------------------------------------------------------------------------|
| Product scope    | No placeholder/broken core screens. MVP flows completed and known limitations documented.                 |
| Authentication   | Production auth, password reset, account deletion and user ownership checks.                              |
| Privacy          | Privacy policy, CSV privacy explanation, private field exclusion and data export.                         |
| Security         | HTTPS, secure secrets, input validation, rate limiting, least privilege database access and safe logging. |
| Monitoring       | Crash reporting, error monitoring, import failure visibility and operational alerts.                      |
| App Store        | Privacy labels, screenshots, accurate description, support contact and review account if required.        |
| QA               | Regression tests pass for transactions, imports, duplicates, splits, loans and reports.                   |
| Support          | Help centre, FAQ, feedback flow and redacted CSV guidance.                                                |
| Commercial       | If payments are included, approved pricing, entitlements, App Store compliance and support process.       |

# Appendix M. Agent Review Package Template

| **Review package item**  | **Required content**                                                                     |
|--------------------------|------------------------------------------------------------------------------------------|
| Summary                  | Plain-English summary of the feature or fix delivered.                                   |
| Scope confirmation       | Approved phase/task and items intentionally excluded.                                    |
| Screens and UX           | Screenshots or preview link for iPhone and relevant web views.                           |
| Data and privacy impact  | Model changes, data stored, privacy controls, logging risks or import behaviour changes. |
| Testing evidence         | Typecheck, lint, unit tests, smoke tests, parser fixtures and manual checks.             |
| Specification compliance | Confirmation that non-negotiables are preserved and deviations are identified.           |
| Change request log       | Client requests addressed, rejected or deferred with reasons.                            |
| Known limitations        | Incomplete items, risks and follow-up tasks.                                             |
| Next recommendation      | Next smallest useful task in the active approved phase.                                  |

# Appendix N. Basiq Enhanced Merchant Lookup Guardrails

- Build local merchant cleanup, aliases, category rules and user history first.

- Use Basiq sandbox only with synthetic or cleaned descriptors during proof of concept.

- Production use requires privacy policy update, App Store disclosure review, pricing/contract review and explicit client approval.

- Enhanced lookup is disabled by default and must be opt-in.

- Never send full CSVs, account numbers, BSBs, account names, customer IDs, card numbers, balances or excluded private columns.

- Only send cleaned/redacted merchant descriptors and minimum approved context.

- Do not call enhanced lookup where a reliable local rule/history/alias exists.

- Label suggestions as enhanced lookup suggestions and require user confirmation before saving.

- Convert confirmed enhanced suggestions into local rules for future imports.

# Final Master Specification Statement

This v2.0 master specification is the consolidated product and technical baseline for SpendGrove. It is intended to guide a supervised autonomous coding agent or human development team through staged delivery while preserving the product’s privacy-first Australian CSV import position, user ownership model, mobile-first simplicity and future account-based web platform strategy.

# Appendix O. Framework Continuity and Granular Requirements Register

This appendix was added following a direct comparison of the v2.0 Master Specification against the prior v2.0 framework/addendum. The master rewrite captured the major product modules, platform strategy and enterprise areas, but several lower-level implementation details were condensed. The following requirements remain in force and are included to ensure no previously approved detail is lost. This appendix should be read together with the main specification; it does not expand the approved MVP beyond the delivery roadmap or override phase gates.

## O.1 Platform implementation options to evaluate

- Before committing to the App Store packaging pathway, evaluate appropriate delivery options including responsive web/PWA, Capacitor, React Native, Expo, SwiftUI or another high-quality mobile framework.

- The selected path must preserve the shared backend, account-based architecture, mobile-first experience, privacy controls and App Store readiness requirements.

- Implementation convenience must not override user privacy, secure file handling, account deletion, data export, financial data integrity or long-term maintainability.

## O.2 Granular feature-register items preserved from the framework

| **Area**                      | **Requirement retained in the master specification**                                                                                                                                                                                                    |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Onboarding                    | Provide a safe sample/demo data mode later so users can explore without importing their own transactions. Demo data must be clearly marked and separable from real user data.                                                                           |
| Categories                    | Support category hierarchy, custom categories, inline category creation during import review and future category archive/hide behaviour while preserving historical reports.                                                                            |
| Transactions                  | Support bulk recategorisation/bulk updates as a future web-first workflow with confirmation, audit trail and undo where practical.                                                                                                                      |
| Transactions                  | Support transfer linking/detection as a future feature so transfers between the user’s own accounts are not incorrectly treated as income and expense.                                                                                                  |
| Accounts                      | Allow safe account nicknames for user clarity without storing full account numbers.                                                                                                                                                                     |
| CSV import                    | Provide user-facing sample template downloads using synthetic Australian transactions for supported banks. Do not include real names, BSBs, account numbers or real transaction details.                                                                |
| CSV import                    | Support import undo as a future capability where safe. Merged manual transactions require careful rollback so user-entered context is not deleted.                                                                                                      |
| CSV import                    | Manual mapping must allow users to map date, description, signed amount or debit/credit columns, balance and ignored columns when confidence is low.                                                                                                    |
| Settings                      | Include privacy/security controls, import profile management, data export, account deletion and feature toggles.                                                                                                                                        |
| Help/support                  | Provide a detailed tutorial with UI screenshots once the UI is stable, plus FAQ, feedback, bug reports and support tickets.                                                                                                                             |
| Safe bank format contribution | Ask only for bank name, account type, header presence, column headers, column order, fictional date/amount examples and two to five fictional rows. Include a confirmation that no real account numbers, BSBs, names or real transactions are included. |

## O.3 Bank format register and parser detail

Each transaction CSV and loan CSV register entry should preserve the following implementation-level metadata.

| **Register field**              | **Requirement**                                                                                                                                                |
|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| bankId / bankName / aliases     | Stable bank identifier, display name and recognisable aliases, including related bank brands.                                                                  |
| possibleColumnHeaders           | Header patterns used for detection and mapping.                                                                                                                |
| expectedColumnOrder             | Expected sequence for known/headerless formats.                                                                                                                |
| hasHeader                       | True, false or variable.                                                                                                                                       |
| date / value date columns       | Date fields used for transaction dates, loan events and reconciliation.                                                                                        |
| description column              | Merchant, payee, narration or loan movement description.                                                                                                       |
| amount / debit / credit columns | Support signed amount and separate debit/credit formats.                                                                                                       |
| balance / rate columns          | Optional balance and interest-rate fields where provided.                                                                                                      |
| dateFormats / amountFormat      | Supported Australian date formats and amount formats including signed amounts, debit/credit, parentheses negatives, currency symbols and thousands separators. |
| privateFieldPatterns            | Patterns for BSB, account number, account name, card number, customer ID and loan-account identifiers.                                                         |
| parserConfidenceRules           | Scoring rules to decide bank/profile confidence and when manual mapping is required.                                                                           |
| edgeCaseNotes                   | Known bank/account-type caveats including interest-only loans, offset accounts, split loans, redraw, refinance adjustments and separate fee rows.              |
| supportStatus                   | Supported, best-effort or manual-mapping status.                                                                                                               |

When parser work is reviewed, the agent should provide a CSV test report covering files tested, account type, bank detected, private fields found, row counts, rows parsed, rows needing mapping, duplicate outcomes, import-review issues and unsupported format notes.

## O.4 Merchant cleanup examples retained for implementation testing

| **Raw bank description example**             | **Cleaned merchant** |
|----------------------------------------------|----------------------|
| WOOLWORTHS 1234 BRISBANE AU CARD XX1234      | Woolworths           |
| COLES EXPRESS 4567 QLD VALUE DATE 01/05/2026 | Coles Express        |
| OPENAI \*CHATGPT 855-836-3987 US             | OpenAI / ChatGPT     |
| UBER \*TRIP HELP.UBER.COM                    | Uber                 |
| BP THE GAP QLD 4061                          | BP                   |
| AGL ENERGY PAYMENT                           | AGL                  |
| BUNNINGS 1234 NEWSTEAD                       | Bunnings             |

## O.5 Recurring and subscription detail retained

- Detection signals include same merchant, similar amount, regular weekly/fortnightly/monthly/quarterly/yearly interval, known subscription descriptions and user confirmations.

- Where history is insufficient, show a needs-more-history or low-confidence state rather than overconfidently creating a recurring template.

- Subscription statuses should include active, paused, cancelled, unknown and needs review.

- Future imported rows should link to confirmed subscription or recurring templates rather than duplicating predicted/manual recurring records.

- Show detection source where practical: manual, import-confirmed, rule-based suggestion, user history or enhanced lookup fallback.

## O.6 Property, loan and tax detail retained

- Property records should support nickname, optional address, property type, ownership share, acquisition date, linked loan accounts and default rules.

- Users may choose nickname-only property records where address privacy is preferred.

- Manual, imported and split-child transactions may link to a property for reporting.

- Investment loan interest and eligible fees may flow to property tax reports; principal must never be treated as deductible by default.

- Personal loan repayment, principal, interest and balance tracking may be supported but must not default to tax treatment.

## O.7 Agent repository files, UI review and autonomous delivery detail retained

| **Repository file**              | **Purpose**                                                                                            |
|----------------------------------|--------------------------------------------------------------------------------------------------------|
| README.md                        | Project setup and developer entry point. Commands must remain current as the stack evolves.            |
| AGENTS.md                        | Standing coding-agent instructions, privacy rules, autonomy boundaries and PR behaviour.               |
| docs/AUTONOMOUS_DELIVERY_MODE.md | Rules for autonomous continuation, pause points, progress reporting and no-over-questioning behaviour. |
| docs/MVP_SCOPE.md                | Locked Phase 1 boundaries and explicit exclusions.                                                     |
| docs/BUILD_PLAN.md               | Current phased task plan and next-task sequencing.                                                     |
| docs/REVIEW_GATES.md             | Client approval gates for PRs, UI, data/privacy, user testing and milestones.                          |
| docs/DEFINITION_OF_DONE.md       | Completion standard for features, screens, import workflows and milestones.                            |
| docs/DESIGN_SYSTEM.md            | SpendGrove colours, typography, spacing, cards, forms, states and accessibility rules.                 |
| docs/UI_REVIEW_GUIDE.md          | Checklist for reviewing UI like a client reviewing an Apple app developer.                             |
| docs/UI_FEEDBACK_PROCESS.md      | How the agent presents screenshots/previews and handles client UI change requests.                     |
| docs/CSV_TESTING_PROTOCOL.md     | Rules for real, redacted and synthetic CSV samples.                                                    |
| docs/DECISION_LOG.md             | Accepted product and technical decisions, reasons and implementation impact.                           |

- Agent suggestions should be labelled as recommended, optional or risk-driven.

- The agent should make routine internal decisions without over-questioning, but pause for material database/schema changes, privacy/logging changes, financial-calculation changes, third-party services, payments, production release decisions or major UX/navigation changes.

- The agent review package must include summary, scope confirmation, screens/UX, data/privacy impact, testing evidence, specification compliance, change-request log, known limitations and next recommendation.

## O.8 Design system detail retained

| **Design element** | **Default rule**                                                                                                                                                  |
|--------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Colour             | Use deep teal/navy for primary text and headers, green/teal for primary actions, soft mint panels, off-white backgrounds, amber warnings and red for errors only. |
| Layout             | Use mobile-first cards, generous whitespace, clear section headings and simple bottom navigation.                                                                 |
| Typography         | Use readable modern rounded typography, clear hierarchy and plain-English labels.                                                                                 |
| Forms              | Use large inputs, clear labels, inline validation and obvious primary/secondary actions.                                                                          |
| Import review      | Use guided checklist/card patterns on mobile and denser editable tables only on desktop.                                                                          |
| Accessibility      | Maintain strong contrast, large touch targets, icon labels and do not rely only on colour.                                                                        |

## O.9 Basiq enhanced lookup phased implementation and references retained

- Phase A: Complete local merchant cleanup, aliases, category rules, user-confirmed learning, apply-to-same-merchant and import-review integration.

- Phase B: Create an internal sandbox proof of concept using synthetic or cleaned sample merchant descriptions only.

- Phase C: Integrate fallback suggestions into import review only when no reliable local category exists, the feature is enabled and privacy checks pass.

- Phase D: Add user-facing Enhanced Merchant Lookup setting and plain-English disclosure explaining what is sent and what is never sent.

- Phase E: Complete production review of pricing, contract terms, provider terms, privacy policy, App Store disclosures, caching/storage terms and support processes before any production enablement.

- External source notes to re-check before implementation: Basiq homepage/platform overview, Basiq Enrich documentation, Basiq sandbox/testing documentation and Basiq pricing.

- Apple source notes to re-check before launch: App Store Review Guidelines, App privacy details, App Store Connect privacy requirements and Apple Human Interface Guidelines.

## O.10 Continuity conclusion

With Appendix O added, the v2.0 Master Specification explicitly preserves both the strategic/enterprise requirements and the granular implementation details from the framework document. Future edits should continue using the v2.0 Master Specification as the source of truth while retaining this appendix as the continuity checklist against the prior framework.
