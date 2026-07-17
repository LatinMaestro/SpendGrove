# Phase 5 Platform Packaging Decision Pack

Status: proposal-only; no native implementation selected  
Release target: controlled Australian account-based web private beta  
Reviewed: 17 July 2026

## Decision now

SpendGrove should complete and operate the controlled web private beta before any native packaging project begins.

No Capacitor, React Native, Expo or SwiftUI package is approved. No Apple Developer enrolment, App Store Connect record, native bundle, build upload or submission has occurred.

A future native decision should be made only after:

- the web private beta blockers are resolved;
- the account, import, export and deletion workflows have been tested by real beta participants using synthetic or their own controlled data;
- Groveware identity and support details are final;
- the legal/privacy review is complete;
- the target devices, distribution countries and budget are explicit.

## Current product posture

SpendGrove is a responsive Next.js account-based web application with:

- Clerk authentication;
- server-side ownership boundaries;
- Neon/PostgreSQL durable storage;
- browser-based CSV review;
- no live bank connection;
- no payment or subscription purchasing;
- account export and deletion workflows;
- mobile-width responsive layouts;
- no native project, native file entitlement, native keychain integration or App Store metadata record.

This is suitable for a controlled web private beta once the remaining provider and legal blockers are cleared. It is not currently an iOS app.

## Future delivery-path matrix

| Path | Reuse of current web product | Native experience | Main benefits | Main costs/risks | Suitable decision point |
|---|---:|---:|---|---|---|
| Responsive web/PWA | Highest | Lowest | Fastest private beta; one codebase; current CSV and Clerk flows remain; web updates do not require App Review | No App Store listing; browser file/auth constraints; offline and native integration remain limited | Approved current target |
| Capacitor native shell | High | Medium | Designed to wrap an existing web app; likely smallest route to an iOS package; can add native file and device APIs selectively | App Review minimum-functionality risk; native navigation/auth redirects/file access must be proven; plugin supply chain; Xcode signing and release process still required | First native proof-of-concept candidate after private beta |
| React Native with Expo | Medium/low | High | Native UI primitives; cross-platform path; Expo can simplify build and distribution workflows | Substantial UI rewrite; web components are not directly reusable; Expo/EAS is a new provider and may introduce plan, secret and operational decisions | Consider if native Android and iOS become strategic pillars |
| React Native without Expo | Medium/low | High | Native UI and more direct control of native projects | Highest React Native operations burden; Xcode/Gradle ownership; native module and release maintenance | Consider only with an experienced native engineering commitment |
| SwiftUI | Low | Highest on Apple platforms | Direct Apple platform APIs, accessibility and interface patterns; strongest iOS-specific control | Near-total UI rewrite; iOS-only investment; separate web and native delivery teams; all data/auth/import flows need native integration | Consider only if iOS becomes the primary product |

## Capability questions for a future proof of concept

Any future packaging proof of concept must verify, without using real financial data:

1. Clerk sign-in, sign-up, verification, password recovery and sign-out.
2. Safe return paths and deep links.
3. Account deletion and export downloads.
4. CSV selection through the iOS document picker.
5. CSV processing without leaking files into logs, cloud backup or temporary storage.
6. Large review lists and charts on supported iPhones and iPads.
7. Browser-local prototype-data policy after packaging.
8. Secure cookies, session storage and keychain expectations.
9. Downloaded JSON/CSV handling.
10. VoiceOver, Larger Text, keyboard and switch-control behaviour.
11. Network loss, provider outage and expired-session recovery.
12. App update, rollback and minimum supported OS policy.
13. Whether the package supplies enough native value for App Review.

## Authentication implications

The current app uses Clerk. A future native pathway must decide:

- browser-based OAuth versus native provider SDKs;
- callback and universal-link ownership;
- secure token/session storage;
- review-account access;
- whether any third-party/social login option triggers Apple's equivalent-login requirement;
- whether Sign in with Apple must be added;
- how Apple token revocation would integrate with account deletion if Sign in with Apple is used.

No new authentication provider is selected here.

## CSV and file-handling implications

SpendGrove deliberately avoids storing raw CSV files. A native package must preserve that boundary.

The future contract must define:

- the exact document-picker scope;
- temporary file lifetime;
- backup and Files-app behaviour;
- whether security-scoped URLs are used;
- memory and row limits;
- what happens when a file is malformed or the app is backgrounded;
- confirmation that filenames, raw rows and bank identifiers do not enter logs or analytics.

No native file implementation is approved.

## Recommended future decision process

### Gate A — business and distribution

Client confirms:

- Apple enrolment as individual/sole proprietor or organization;
- legal seller name;
- Groveware branding ownership;
- target countries;
- iPhone-only versus iPhone and iPad;
- whether Android is a near-term requirement;
- native budget and maintenance commitment.

### Gate B — technical proof of concept

Approve one short-lived synthetic-data experiment comparing the web private beta with the leading native candidate. Do not create an App Store record.

### Gate C — architecture contract

Document authentication, file handling, data storage, privacy, updates, accessibility, support and rollback before creating the production native project.

### Gate D — packaging implementation

Requires separate client approval, provider/package review, Apple account readiness and a new milestone.

## Recommendation

Do not choose a native framework during Phase 5.

If the client later prioritises the fastest credible iOS route while retaining the mature web product, assess Capacitor first in a bounded proof of concept. If the product strategy instead requires deeply native interaction or simultaneous Android investment, compare React Native/Expo against a SwiftUI iOS-only path.

This recommendation is not approval to install a package or create a native app.

## Mandatory stop conditions

Stop before:

- installing any native framework or plugin;
- creating Xcode, Android or Expo projects;
- adding EAS or another build provider;
- creating bundle identifiers, certificates or provisioning profiles;
- enrolling or paying Apple;
- creating an App Store Connect record;
- uploading a build or TestFlight package;
- changing authentication providers;
- changing CSV retention;
- adding payments, subscriptions, analytics, AI or live bank connections;
- starting Phase 6.

## Official sources

Accessed 17 July 2026:

- Apple, SwiftUI: https://developer.apple.com/swiftui/
- Apple, App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Capacitor official documentation: https://capacitorjs.com/docs
- React Native official overview: https://reactnative.dev/
- Expo official core concepts: https://docs.expo.dev/core-concepts/
