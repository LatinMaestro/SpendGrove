# Phase 5 App Store Copy, URL and Asset Inventory

Status: working draft only; not approved metadata  
Reviewed: 17 July 2026

All examples below require client, legal and product review. They must be checked against the eventual submitted native build. No App Store record has been created.

## Draft product positioning

### App name

`SpendGrove`

Apple limit: 30 characters.

### Subtitle

Preferred draft:

`Simple spending, your way`

Alternative:

`Review spending with clarity`

Apple limit: 30 characters.

### Promotional text

Draft:

`Import your bank CSV, review each transaction, set simple budgets and understand regular payments—without a live bank connection.`

Apple limit: 170 characters. Recount before submission.

### Short product statement

`SpendGrove is a calm, CSV-first way to review everyday spending, manage monthly category budgets and keep user-controlled financial records.`

### Draft description

```text
SpendGrove helps you understand everyday spending without connecting a live bank account.

Import a supported bank CSV, review transactions before saving them, correct categories and keep your records under your control. You can also add transactions manually.

EVERYDAY MONEY, KEPT SIMPLE
• See spending by month and category
• Create straightforward monthly category budgets
• Review suggested regular payments before confirming them
• Search and correct your transaction history

PRIVACY-FIRST CSV REVIEW
• CSV files are reviewed in your browser
• Raw CSV files are not retained by SpendGrove
• Private bank identifiers are screened and excluded
• Nothing is imported until you review and confirm it

OPTIONAL PROPERTY RECORDS
Link selected transactions to a property and keep a simple record/export view. Record keeping only — not tax advice.

YOUR ACCOUNT, YOUR CONTROL
Export your account data or delete your SpendGrove account from Settings.

SpendGrove does not provide tax, credit, debt or investment advice. It does not submit tax returns or move money. Live bank connections, payments and subscriptions are not included.
```

Apple limit: 4,000 characters.

### Draft keywords

Candidate set for later byte-count review:

`budget,spending,expenses,CSV,money,transactions,recurring,personal finance`

Do not include competitor or company names. Apple limit: 100 bytes.

### Category

Client decision required. Candidate: Finance.

### Age rating

Client must complete Apple's current questionnaire from actual functionality. Do not assume a rating in advance.

## Required URL inventory

| URL | Required | Current state | Owner/action |
|---|---:|---|---|
| Privacy Policy URL | Yes | Web privacy route exists; final public legal URL and professional review unresolved | Client/legal |
| Support URL | Yes | Help route exists; final real Groveware contact details unresolved | Client |
| Marketing URL | Optional | No approved public marketing site | Client decision |
| User Privacy Choices URL | Optional | Account export/deletion exist; a stable public explanation/entry URL is not approved | Product/legal decision |
| Accessibility URL | Optional | No dedicated public accessibility statement | Prepare only after native accessibility audit |
| Terms/EULA URL | Optional/custom | Apple standard EULA may apply; legal decision required | Legal review |
| Account deletion information URL | Operationally useful | In-app deletion exists; public support explanation can use Help/Privacy when final | Product/legal |
| Status page | Optional | No provider or public status page approved | Operations decision |

Every public URL must use HTTPS, be accessible without signing in, be stable for the lifetime of the listing and contain no private data.

## Screenshot inventory

Use synthetic data only. No screenshot may show real:

- names or email addresses;
- transaction narration;
- merchant-level personal history;
- account or card identifiers;
- BSBs or account numbers;
- loan identifiers or balances;
- exact Property addresses;
- filenames;
- private notifications.

### iPhone sequence

1. **Calm monthly overview**
   - Home screen
   - synthetic month
   - spending, budgets and regular-payment review only
   - caption idea: `See the month at a glance`

2. **Spending by category**
   - Transactions page with compact donut and legend
   - category values reconcile
   - caption: `Understand where money went`

3. **Review before import**
   - compact CSV review with safe synthetic rows
   - direction/category controls visible
   - no filename or source identifiers
   - caption: `Review every transaction first`

4. **Simple monthly budgets**
   - active budget cards and progress
   - no judgmental language
   - caption: `Set straightforward monthly budgets`

5. **Regular payments**
   - compact confirmed/suggested regular payments
   - no payment or cancellation implication
   - caption: `Keep an eye on regular payments`

6. **Account control**
   - Privacy/Settings with export and deletion entry points
   - no destructive confirmation screen required for marketing
   - caption: `Export or delete your account`

7. **Optional Property records**
   - only if this remains prominent in the native release
   - simple linked records/report action
   - concise record-keeping disclaimer
   - caption: `Keep linked Property records together`

### iPad sequence

Prepare only if iPad is declared supported. Use layouts designed for iPad rather than stretched iPhone captures.

Candidate scenes:

- monthly overview with readable content width;
- Transactions category breakdown and compact list;
- CSV review with accessible controls;
- Loan detail with repayments and Property transactions;
- Settings privacy/account controls.

### Screenshot production rules

- verify Apple's current pixel dimensions immediately before upload;
- supply one to ten images per required device set;
- no alpha/transparency;
- represent the actual build;
- keep captions outside critical UI;
- retain safe-area margins;
- verify Larger Text where screenshots claim accessibility;
- do not imply live bank linking, automatic tax treatment, bill payment or AI;
- do not use “ATO-ready”, “tax deductible”, “accountant approved” or guaranteed-outcome claims.

## Optional app preview

Recommendation: omit for the first submission unless a short, accurate synthetic-data walkthrough materially improves review and discovery.

If approved later:

- show only actual interactions;
- avoid rapid motion;
- include readable captions;
- do not display private data;
- do not imply money movement;
- verify Apple's duration, codec and device requirements at production time.

## App Review information inventory

Required operator-provided fields:

- contact first and last name;
- contact phone;
- contact email;
- synthetic demo-account username;
- synthetic demo-account password;
- review notes.

Draft review-note outline:

```text
SpendGrove is an account-based, CSV-first personal finance record-keeping app.

Use the supplied synthetic review account. No bank login is required. To test CSV import, use the attached synthetic supported-bank fixture; it contains no real customer or banking data.

Transactions are reviewed before commit. SpendGrove does not move money, provide tax advice or connect to a live bank in this build.

Account export and account deletion are available in Settings. Property records, where present, are record-keeping views only.
```

Do not place Production secrets or a real user's credentials in review notes.

## App Privacy input inventory

Final answers require factual and legal review after a native path is selected.

Likely facts to evaluate:

- Clerk account email/contact information;
- application user identifier;
- user-entered/imported financial information;
- user preferences and settings;
- support contact information if support is later enabled;
- diagnostics emitted by the selected native/runtime providers;
- whether data is linked to identity;
- purposes: app functionality, authentication, security and account management;
- no analytics while the approved analytics-off decision remains;
- no advertising or tracking;
- no live bank credential collection;
- raw CSV non-retention.

The final disclosure must include embedded third-party partners, not just SpendGrove's own code.

## Branding inventory

Available:

- SpendGrove product name;
- repository logo assets;
- green/teal visual system;
- Groveware developer-brand direction.

Client decisions:

- legal owner of the SpendGrove name and logo;
- seller name shown by Apple;
- Groveware legal/business status;
- copyright owner and year;
- final app icon;
- final support identity;
- localization beyond Australian English.

## Copy prohibitions

Do not use:

- guaranteed savings;
- automatic financial advice;
- tax deductible or claimable conclusions;
- ATO-ready;
- tax-ready;
- accountant approved;
- live bank connection claims;
- automatic cancellation or bill payment;
- AI categorisation;
- account data “fully backed up” until backup facts are proven;
- public-release wording before launch approval.

## Official Apple sources

Accessed 17 July 2026:

- App information: https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/
- Platform version information: https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information
- Upload previews and screenshots: https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots
- Screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
- App Review information: https://developer.apple.com/documentation/appstoreconnectapi/app-store-review-details
- Manage app privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/
