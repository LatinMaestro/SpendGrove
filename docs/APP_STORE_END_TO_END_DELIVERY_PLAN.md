# App Store End-to-End Delivery Plan

Prepared: 17 July 2026  
Status: planning only  
Authority: no Apple account purchase, App Store Connect record, TestFlight invitation, submission or public launch is authorised

## Objective

Deliver a polished SpendGrove iPhone application with practical iPad support while preserving the accepted web product, server-side ownership, privacy-first CSV handling and financial rules.

The existing responsive web application is a strong reusable foundation, but it is not assumed to be an App Store-ready native product without a platform decision, native implementation, device QA and Apple compliance work.

# 1. Current position

Available foundations:

- authenticated Next.js web product;
- shared TypeScript financial/import logic;
- Clerk account model and owner-scoped server APIs;
- privacy-first CSV parser/review;
- account export and deletion;
- SpendGrove logo and visual system;
- responsive mobile web layouts;
- Vercel/Neon deployment foundation.

Not yet present:

- native project/framework;
- Apple signing/certificates/profiles;
- secure native token and file lifecycle;
- native navigation/device permissions;
- TestFlight build;
- iPhone/iPad device evidence;
- App Store metadata/privacy disclosures/review account;
- Apple submission.

# 2. Mandatory platform-decision gate

## Candidates

### Capacitor

Strengths:

- highest direct reuse of the current Next.js/web interface;
- web-first delivery can preserve the accepted visual system;
- established native plugin bridge for files, notifications and app lifecycle;
- likely shortest route to a proof.

Risks:

- App Store quality depends on genuinely app-like navigation, performance and offline/error behaviour;
- server-rendered/authenticated web patterns and file/export handling need careful packaging design;
- widgets/share extensions/complex native surfaces may require native plugin work;
- a thin website wrapper would create review and product-quality risk.

### React Native with Expo

Strengths:

- native component model and mature device APIs;
- strong file/document picker, notifications, linking and build tooling;
- practical iPhone/iPad adaptive implementation;
- TypeScript/domain packages can be shared.

Risks:

- existing web UI components cannot be reused directly;
- duplicate presentation work and a shared API/client layer are required;
- Clerk native OAuth and production flows require development-build verification;
- more implementation effort than a web wrapper.

### SwiftUI

Strengths:

- strongest Apple-native control, accessibility integration and platform fit;
- direct access to widgets, App Intents, biometrics and native document flows;
- lowest framework abstraction risk for Apple-only delivery.

Risks:

- highest duplication of UI/client code;
- Swift implementation and long-term two-client maintenance;
- TypeScript business logic must be exposed through APIs or reimplemented with parity tests;
- longer path for the complete planned product.

## Required comparison evidence

Before selection, prepare a time-boxed architecture proof plan covering:

- Clerk sign-in/session renewal/sign-out;
- authenticated API request and owner-boundary error;
- CSV file selection and temporary cleanup;
- import review performance with a large synthetic file;
- export download/share;
- offline/network failure;
- navigation/deep link;
- accessibility;
- iPhone and iPad layout;
- notification feasibility;
- build/signing and App Store review risk;
- code reuse, maintenance and estimated delivery cost.

## Current recommendation

Do not select a framework in this planning PR. The first proof should compare Capacitor, as the highest-reuse path, with Expo/React Native, as the strongest cross-platform native-component path. Advance SwiftUI if the proof shows that required Apple-native capabilities or quality cannot be achieved safely through those options.

A final client decision is required before a native framework is committed.

# 3. End-to-end delivery stages

## Stage A — Apple/operator readiness

Operator actions:

- confirm Apple Developer account type and legal entity;
- confirm Groveware legal name, address, contact and D-U-N-S status where organization enrollment is intended;
- approve membership cost;
- identify authorized App Store Connect roles;
- reserve bundle identifier and final product name only after approval;
- define secure credential/signing ownership.

Repository work:

- operator checklist only until access is available;
- never record Apple secrets, signing keys or private certificates in GitHub/chat.

Exit:

- legal seller identity and credential owner are confirmed.

## Stage B — Architecture and shared-code boundary

- complete platform proof and selection;
- define native repository/project structure;
- identify shared pure TypeScript packages for money, dates, parsing eligibility, calculations and contracts;
- define authenticated API boundary and versioning;
- define web/native parity tests;
- decide whether the web application remains separately deployed.

Exit:

- architecture decision record approved;
- no duplicated financial rule without shared fixtures/parity evidence.

## Stage C — Native foundation

- app shell, theming and accessibility baseline;
- Clerk authentication and secure token/session storage;
- signed-out/public surfaces;
- authenticated API client;
- environment separation for development, Preview/TestFlight and Production;
- error/loading/offline patterns;
- deep-link foundation.

Exit:

- sign-in, sign-out, expiry and two-user isolation pass on real devices.

## Stage D — Native core product

Implement in dependency order:

1. Home and Transactions;
2. manual create/edit, split, transfer and category workflows;
3. CSV file selection, mapping, review and import;
4. Budgets and Regular payments;
5. Loans, repayments and Properties;
6. reports, exports and account controls;
7. household/documents/optional features selected for release.

Requirements:

- no new native-specific financial calculations;
- server and shared-domain sources remain authoritative;
- temporary files are cleaned under an explicit lifecycle;
- exports use safe native share/save flows;
- all web account deletion/export obligations remain reachable.

Exit:

- feature register reaches release-complete parity or explicitly approved native exceptions.

## Stage E — Device capabilities

Only after explicit scope approval:

- push notifications and permission education;
- biometrics/passcode;
- widgets;
- share extension;
- background processing;
- App Intents/Shortcuts.

Privacy rules:

- notifications/widgets show no merchant, amount, balance, Property or loan detail by default;
- device caches are minimized, encrypted by platform facilities and cleared on sign-out where safe;
- no browser-local data is silently imported.

Exit:

- permission denial, revocation, lock-screen privacy and sign-out cleanup are tested.

## Stage F — iPad and accessibility

- compact/regular size-class layouts;
- portrait/landscape where supported;
- keyboard, pointer and external display behaviour;
- Dynamic Type;
- VoiceOver and focus order;
- reduced motion, contrast and touch targets;
- no horizontal overflow or clipped financial values.

Exit:

- supported iPhone and iPad matrix passes automated and manual review.

## Stage G — App Store content and compliance

Prepare:

- app name, subtitle, description, keywords and category;
- icon, launch assets and screenshots for required devices;
- support URL and professionally reviewed Privacy Policy URL;
- Terms/end-user agreement decision;
- App privacy disclosures for Clerk, Neon, Vercel, optional providers, documents, analytics/monitoring and support;
- account-deletion explanation;
- financial/tax no-advice wording;
- review notes, complete review account and supported-bank limitations;
- age rating and export compliance responses;
- pricing/IAP metadata only if commercial Phase 14 is approved.

Rules:

- no placeholder screenshots or undocumented dormant feature;
- metadata must match the submitted build;
- no real client financial data in screenshots;
- use synthetic accounts/transactions for review.

Exit:

- legal/provider fact checklist is complete and reviewed.

## Stage H — TestFlight

- archive/sign through the approved build path;
- upload only after operator approval;
- internal testing first;
- crash/error and privacy-safe operational review;
- external TestFlight only after invitation approval;
- complete consolidated client acceptance;
- resolve every high-severity defect.

Exit:

- client accepts the TestFlight release candidate.

## Stage I — Submission and launch gate

Before submission:

- confirm complete-product feature register;
- full automated and device evidence;
- supported-bank matrix;
- financial report reconciliation;
- account export/deletion;
- environment/migration/backup proof;
- security/legal/accessibility review;
- support and incident response;
- monitoring decision;
- final App privacy answers;
- launch and rollback plan.

Submission requires a new explicit client authorization. Public release/phased release/manual release choice also requires explicit authorization.

# 4. Authentication and Sign in with Apple

The current Clerk account flow must be verified in the chosen native framework. If SpendGrove later adds third-party/social login that triggers Apple’s equivalent-login requirements, Sign in with Apple implications must be reviewed against the current App Review Guidelines and Clerk capability. This plan does not add social login.

Required tests:

- email verification/provider flow;
- password reset/equivalent recovery;
- session renewal/expiry;
- sign-out device cleanup;
- account deletion initiation;
- review-account access;
- two-user isolation;
- revoked/deleted account behaviour.

# 5. CSV and file privacy on iOS/iPadOS

The native client must:

- use the system document picker;
- request only user-selected files;
- avoid broad file-library access;
- parse locally where practical;
- apply the existing privacy scan before durable commit;
- never upload a raw CSV when the current contract sends reviewed fields only;
- clean temporary copies and caches;
- handle provider-backed files without retaining credentials;
- protect logs and crash reports from filenames, narration and account identifiers.

Exports must use system save/share surfaces with plain warnings that the exported file contains private financial data.

# 6. Notifications, widgets and lock-screen privacy

Push or local notifications require an explicit message catalogue and privacy classification.

Allowed default examples:

- “You have items to review.”
- “A regular payment may be due soon.”

Disallowed by default on a lock screen:

- amounts;
- balances;
- merchant names;
- account/Property/loan names;
- tax/report details.

Widgets must be a separate approval because they can expose information while the device is locked.

# 7. App privacy and account deletion

Apple official guidance reviewed on 17 July 2026 supports these release gates:

- App privacy disclosures must describe the app’s and integrated partners’ data practices.
- A privacy policy URL is required in App Store Connect.
- Apps that support account creation must provide an in-app path to initiate account deletion.
- Deletion must address associated user data, with legally required retention explained.
- Metadata and review notes must accurately describe functionality and provider use.

SpendGrove already has a web account-deletion foundation. The native app must expose and verify the same capability; it must not redirect users into an inaccessible or incomplete flow.

# 8. Commercial decision

If the first release is paid or subscription-based:

- complete Phase 14 first;
- determine Apple in-app purchase requirements;
- define web versus App Store entitlements;
- implement restore purchases;
- test renewals, cancellations, billing retry, refunds and account deletion;
- professionally review GST/tax and support obligations.

If commercial scope is not approved, release without dormant purchase UI and record commercial work as deferred.

# 9. Real-device matrix

Minimum final evidence:

- smallest supported iPhone;
- current standard iPhone size;
- large iPhone;
- supported iPad compact and regular layouts;
- current supported iOS/iPadOS versions selected at platform gate;
- Wi-Fi and constrained/interrupted network;
- document picker from local and cloud file providers;
- light/dark appearance where supported;
- Dynamic Type including large sizes;
- VoiceOver;
- keyboard/pointer on iPad;
- sign-in/session expiry;
- notification permission allowed/denied if included;
- export/share/save;
- account deletion.

Simulator evidence is useful but does not replace real-device file, notification, authentication and performance testing.

# 10. Security and operations

Before TestFlight external testing:

- Production and TestFlight environment mapping is explicit;
- no development Clerk/Neon/Vercel secret is bundled in Production;
- client contains only publishable configuration;
- server secrets remain server-side;
- API authorization is resource-level;
- build provenance and dependency inventory are recorded;
- crash/error telemetry, if approved, is privacy-filtered;
- incident and rollback paths are documented;
- compromised build/signing response is documented.

# 11. Official source register

Accessed 17 July 2026.

| Title | Provider | URL | Planning implication |
|---|---|---|---|
| App Review Guidelines | Apple | https://developer.apple.com/app-store/review/guidelines/ | completeness, metadata, beta/TestFlight and review expectations |
| Managing app privacy | Apple | https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/ | App privacy answers must be maintained |
| App privacy details | Apple | https://developer.apple.com/app-store/app-privacy-details/ | include integrated partner practices |
| Offering account deletion in your app | Apple | https://developer.apple.com/support/offering-account-deletion-in-your-app | in-app deletion initiation for account apps |
| D-U-N-S Number | Apple | https://developer.apple.com/help/account/membership/D-U-N-S/ | organization identity dependency |
| App information reference | Apple | https://developer.apple.com/help/app-store-connect/reference/app-information/app-information | privacy/support/metadata requirements |
| Capacitor documentation | Ionic | https://capacitorjs.com/docs | web-first native candidate |
| React Native architecture | Meta | https://reactnative.dev/architecture/overview | native-component architecture candidate |
| Expo documentation | Expo | https://docs.expo.dev/ | React Native tooling/device APIs candidate |
| Expo FileSystem | Expo | https://docs.expo.dev/versions/latest/sdk/filesystem/ | native file lifecycle assessment |
| Expo notifications | Expo | https://docs.expo.dev/push-notifications/what-you-need-to-know/ | notification delivery/permission assessment |
| SwiftUI | Apple | https://developer.apple.com/documentation/technologyoverviews/swiftui | Apple-native implementation candidate |
| Clerk Expo SDK | Clerk | https://clerk.com/docs/reference/expo/overview | native authentication compatibility assessment |

# 12. Operator actions that must remain outside GitHub

- Apple membership purchase;
- legal entity/D-U-N-S confirmation;
- App Store Connect role assignment;
- bundle ID/certificate/profile creation;
- provider secret entry;
- signing-key custody;
- TestFlight invitations;
- App privacy answers and legal attestation;
- price publication;
- App Store submission/release.

For each, the repository will contain a safe checklist and result characteristic, never the secret value.

# 13. Final approval gates

Separate explicit approvals are required for:

1. native platform selection;
2. Apple account/membership expenditure;
3. device capabilities with privacy impact;
4. notification provider/configuration;
5. commercial plans/pricing/payments;
6. TestFlight external invitations;
7. App Store submission;
8. public release.

This document authorises none of those actions.
