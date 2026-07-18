# App Store Metadata and Privacy Worksheet

Status: preparation only; no App Store Connect record or submission  
Prepared: 18 July 2026  
Architecture: future Expo/React Native client with Expo Router

## Release authority

This worksheet does not authorise:

- Apple Developer enrolment/payment;
- bundle identifier or App Store record creation;
- signing credentials;
- EAS provider setup;
- TestFlight upload;
- App Review submission;
- public release.

## Product identity inputs

Client decisions required:

- final app name and subtitle;
- legal seller/developer identity;
- bundle identifier;
- primary/secondary categories;
- age rating answers;
- copyright;
- support URL;
- marketing URL;
- privacy policy URL;
- contact name, phone and email;
- review-account credentials and lifecycle;
- export-compliance answers.

Do not place review credentials in the repository.

## Proposed plain-English product position

SpendGrove helps Australian users organise transactions, CSV imports, regular payments, budgets, loans, Property records and reports in one private account-based application.

Final copy must avoid:

- regulated financial advice;
- tax/deductibility conclusions;
- promises of savings or outcomes;
- unsupported bank/provider claims;
- descriptions of guarded or disabled features as available.

## App Review readiness checklist

- [ ] complete, non-placeholder native binary;
- [ ] stable live backend for review;
- [ ] in-app account deletion;
- [ ] sign-in/recovery works;
- [ ] review account and instructions;
- [ ] all links work;
- [ ] no dormant control claims availability;
- [ ] privacy policy and support URLs are public;
- [ ] screenshots match the submitted binary;
- [ ] iPhone layouts verified;
- [ ] iPad compatibility verified where offered;
- [ ] accessibility checks complete;
- [ ] financial/tax disclaimers reviewed;
- [ ] no payments unless Apple/web rules are separately approved.

## Account-based app

The current product requires an authenticated account for finance screens. Final review notes should explain:

- why sign-in is required;
- how the review account is used;
- that user-owned records remain isolated;
- where account deletion is found;
- that raw CSV is parsed locally and not retained;
- which sample/synthetic data is safe for review.

## App privacy data inventory

Final answers must be derived from the final binary and SDK list.

Potential linked-to-user categories currently expected:

- user ID/account identifier;
- user-created financial records;
- app interaction necessary to provide account features;
- diagnostics only if a monitoring provider is later approved.

Not currently active:

- advertising data;
- tracking;
- third-party advertising;
- product analytics;
- precise location;
- contacts;
- health;
- live bank connection;
- payments;
- document bytes;
- Basiq;
- AI provider.

Do not answer App Privacy questions until native packages, providers and Production configuration are frozen.

## Privacy manifest

The native target must include a valid privacy manifest where required. Before signing:

- inventory every native dependency and required-reason API;
- inspect third-party SDK privacy manifests;
- declare tracking domains only if applicable;
- verify no undeclared data collection;
- regenerate the factual provider inventory;
- archive manifest evidence with the release commit.

No manifest exists yet because no native target exists.

## Sign in with Apple

Current web authentication uses Clerk. Before deciding native login methods:

- inventory every third-party/social login offered;
- assess Apple’s login-services requirement;
- configure Sign in with Apple only through approved Apple/Clerk operator actions;
- implement token revocation/deletion handling;
- update privacy and deletion disclosures;
- test account linking and duplicate identity prevention.

## Financial and Property wording

Required review:

- organisational record-keeping only;
- no tax return preparation;
- no automatic deductibility;
- no investment, credit, debt or financial advice;
- Loan/Property reports explain user-entered and linked records;
- accountant packs are preparation aids;
- calculations reconcile under approved contracts.

## Screenshot and preview plan

Required device evidence after native implementation:

- iPhone small/standard/large layouts;
- iPad portrait/landscape if supported;
- Dynamic Type;
- VoiceOver;
- reduced motion;
- dark appearance if offered;
- empty/loading/error states;
- CSV file selection with synthetic data;
- transactions, budgets, regular payments, loans, reports, export and deletion.

Do not use real user financial data in screenshots.

## Metadata draft checklist

- app name;
- subtitle;
- promotional text;
- description;
- keywords;
- support URL;
- privacy URL;
- marketing URL;
- version/release notes;
- age rating;
- category;
- review notes;
- demo account;
- privacy answers;
- export compliance;
- content rights.

## Official sources

Accessed 18 July 2026:

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Manage app privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
- Privacy manifests: https://developer.apple.com/documentation/bundleresources/adding-a-privacy-manifest-to-your-app-or-third-party-sdk
- Account deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app/
