# Phase 13 Native Architecture Decision

Decision date: 17 July 2026  
Status: architecture selected for repository planning; native project not yet bootstrapped  
Release target: polished SpendGrove iPhone application with practical iPad support  
Hard gates: no Apple Developer payment, signing, EAS/provider account setup, TestFlight upload, App Store record, submission or public launch

## Decision

Use **React Native with Expo and Expo Router** for the SpendGrove native client.

Use custom, SpendGrove-designed authentication screens with Clerk's Expo SDK and native Sign in with Apple when later configured. Do not depend on Clerk's currently beta prebuilt native UI as the only authentication path.

Keep the accepted Next.js web application independently deployed. Share pure TypeScript domain contracts, money/date utilities, CSV rules and test fixtures where platform-safe. Do not share web React components with the native client by forcing a web-view presentation.

## Why this is the best fit

SpendGrove needs a genuinely native beginner experience, secure session storage, system document selection, CSV review, downloads/sharing, deep links, biometrics, reminders, iPhone/iPad layouts and future widgets. It also already has extensive TypeScript business rules and tests.

Expo/React Native provides the strongest balance:

- native controls and navigation rather than a thin web wrapper;
- TypeScript reuse for safe domain logic and contracts;
- official document picker, file system, secure storage, local authentication, notifications and linking capabilities;
- official Clerk Expo support, including custom auth flows and native Sign in with Apple;
- one native client architecture for iPhone and iPad;
- less duplication of domain logic than SwiftUI;
- less App Store quality and web-runtime coupling risk than Capacitor.

## Candidate assessment

| Criterion | Capacitor | Expo / React Native | SwiftUI |
| --- | --- | --- | --- |
| Existing web UI reuse | Highest | Low | None |
| TypeScript domain reuse | High | High | Via API/fixtures only |
| Native control quality | Hybrid/WebView plus plugins | Native components | Native |
| Clerk path | Web/custom bridge requires proof | Official Expo SDK | Official iOS SDK |
| CSV file selection | Plugin/custom native | Official DocumentPicker/FileSystem | Native APIs |
| Secure session storage | Plugin/custom native | SecureStore and Clerk integration | Keychain/native |
| Notifications | Official plugin; native setup | Official Expo API; native setup | Native |
| Widgets/extensions | Native plugin work | Native modules/targets | Strongest |
| iPad adaptation | Web responsive plus native shell | React Native adaptive layouts | Strongest |
| Existing client rewrite | Lowest initially | Moderate/high | Highest |
| Thin-wrapper review risk | Highest | Low | Low |
| Long-term two-client maintenance | Moderate | Moderate | Highest |
| SpendGrove fit | Useful fallback/prototype | **Selected** | Escalation path only |

## Why Capacitor was not selected

Capacitor v8 officially supports modern web-first apps, native plugins and iOS 15+, but the accepted SpendGrove product requires native-quality navigation, large CSV review performance, secure file lifecycle, authentication continuity and future Apple-specific capabilities. Reusing the entire current interface inside WKWebView would save initial work while retaining web runtime constraints and increasing the risk that the result feels like a wrapped website.

Capacitor remains a credible fallback if a time-boxed Expo proof fails a mandatory capability. It is not the active architecture.

## Why SwiftUI was not selected

SwiftUI offers the strongest Apple-specific integration and accessibility potential, and Clerk now has an official iOS SDK. It would, however, duplicate nearly all presentation and client state, reduce reuse of mature TypeScript rules and fixtures, and create the largest parity/maintenance burden.

SwiftUI remains the escalation path for discrete Apple-only surfaces or if Expo cannot meet a mandatory verified requirement. It is not the primary client architecture.

## Repository structure

The intended structure is:

```text
apps/
  native/                 Expo/React Native application
packages/
  domain/                 platform-neutral money/date/calculation contracts
  api-contracts/          versioned request/response schemas without server secrets
  test-fixtures/          synthetic parity fixtures
app/                      existing Next.js web application remains in place initially
src/server/               server-only ownership, persistence and provider code
```

Do not move the existing web application into a monorepo as part of bootstrap merely for symmetry. Introduce workspace structure only when the native package can be generated and verified atomically with its lockfile.

Server-only modules, Prisma, Clerk server helpers and environment access must never be imported into the native bundle.

## Native data boundary

The native client must call authenticated, versioned server endpoints. It must not connect directly to Neon or use Prisma.

Every endpoint must:

- authenticate the Clerk session server-side;
- enforce resource ownership and collaboration scope itself;
- validate typed bounded input;
- return only the minimum safe response;
- use integer cents and explicit Australian date strings;
- preserve signed-money, transfer, split and no-double-count rules;
- avoid raw CSV retention and private logging;
- fail safely after session expiry or account revocation.

The server remains authoritative for durable financial writes. Native clients may perform transient CSV parsing/review only where the same privacy and parity rules are proven.

## Authentication and device storage

Planned approach:

- Clerk Expo SDK;
- custom sign-in/sign-up/recovery flows matching SpendGrove's visual system;
- native Sign in with Apple when Apple configuration is approved;
- secure token/session treatment through Clerk and platform secure storage;
- no finance data stored in SecureStore;
- no silent import of existing browser-local data;
- explicit sign-out cleanup for native caches and temporary files;
- real-device verification for biometric and secure-storage behaviour.

Clerk's prebuilt Expo native components are currently beta and therefore are not the sole release authentication dependency.

## Files, exports and temporary data

Use the system document picker for CSV selection. Copy to a temporary app-controlled location only when immediate reading requires it.

Requirements:

- user-initiated selection;
- accepted type/size limits;
- private-field scan before commit;
- no background upload;
- no raw CSV retention;
- explicit temporary-file cleanup after success, cancellation, failure and sign-out;
- exported files use system share/save surfaces;
- no support upload of real financial files.

## Notifications, biometrics and extensions

Repository support may be prepared, but capability activation remains gated.

- In-app reminders remain operational independently of push.
- Push requires Apple capability, credentials, provider/transport and privacy review.
- Biometrics protect local access/session convenience; they do not replace server authentication.
- Widgets, App Intents and share extensions require separate scope and lock-screen privacy rules.
- No notification/widget may expose merchant, amount, balance, Property or Loan detail by default.

## Package and provider boundary

The architecture decision does not itself add packages.

A later bootstrap PR may add only the current supported Expo/React Native/Expo Router/Clerk packages and minimum directly required first-party Expo modules. It must generate a deterministic lockfile and pass online verification.

EAS Build, Expo accounts, push credentials and paid services are not selected or configured by this decision. A native project that cannot be tested without unavailable credentials must remain repository-only and explicitly unverified.

## Bootstrap proof gate

Before broad native feature work, a focused bootstrap must prove:

1. iPhone and iPad app shell;
2. custom Clerk sign-in, renewal, expiry and sign-out;
3. authenticated request and two-user owner-boundary denial;
4. secure session storage and sign-out cleanup;
5. CSV selection, bounded temporary read and cleanup using a synthetic file;
6. export download/share using synthetic content;
7. deep link routing;
8. offline and failed-request recovery;
9. keyboard, screen-reader and dynamic-text behaviour;
10. 390 px-equivalent iPhone and regular-width iPad layouts;
11. no web-only/server-only package in the native bundle;
12. no Apple signing, TestFlight or Production environment use.

Broad feature implementation starts only after this proof is green.

## Shared-domain extraction rules

Extract only pure, proven code:

- integer-cent money utilities;
- Australian calendar/date boundaries;
- transaction direction and compatibility contracts;
- split/transfer/no-double-count predicates;
- report and budget calculation contracts;
- CSV parser fixtures and privacy rules where browser/native APIs are abstracted.

Do not move Prisma or server authorization code into shared packages. Each extraction requires parity tests against the existing web/server behaviour.

## App Store implications

The selected architecture does not reduce Apple compliance obligations. Before submission SpendGrove still needs:

- Apple Developer identity and signing;
- privacy policy URL and in-app access;
- in-app account deletion;
- final App privacy disclosures;
- Sign in with Apple treatment where required;
- complete metadata, screenshots and review notes;
- working review account;
- iPhone/iPad and accessibility evidence;
- live backend services for review;
- final client, legal/privacy and operator approval.

## Official sources reviewed

Accessed 17 July 2026:

- [Expo DocumentPicker](https://docs.expo.dev/versions/latest/sdk/document-picker/) — system document selection and temporary-copy behaviour.
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) — encrypted local key-value storage, iOS Keychain behaviour and real-device caveats.
- [Expo LocalAuthentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/) — biometric capability.
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) — local and push notification capability.
- [Expo Router](https://docs.expo.dev/router/introduction/) — native routing foundation.
- [Clerk Expo SDK](https://clerk.com/docs/reference/expo/overview) — Expo authentication, native hooks and beta status of prebuilt native components.
- [Clerk Expo quickstart](https://clerk.com/docs/expo/getting-started/quickstart) — custom flows and development-build requirements.
- [Clerk native Sign in with Apple](https://clerk.com/docs/reference/expo/native-hooks/use-sign-in-with-apple) — iOS-only native hook and native-build requirement.
- [Clerk iOS SDK](https://clerk.com/docs/ios/reference/native-mobile/overview) — credible SwiftUI fallback.
- [Capacitor documentation](https://capacitorjs.com/docs) — web-first native runtime and plugin model.
- [Capacitor iOS](https://capacitorjs.com/docs/ios) — WKWebView, iOS 15+ and Xcode requirements.
- [React Native platform-specific code](https://reactnative.dev/docs/platform-specific-code) — shared and platform-specific implementation model.
- [Apple SwiftUI](https://developer.apple.com/swiftui/) — Apple-native alternative.
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — completeness, privacy, login and account-deletion requirements.
- [Apple account deletion guidance](https://developer.apple.com/support/offering-account-deletion-in-your-app) — in-app deletion and Sign in with Apple revocation expectations.

## Remaining hard gates

Stop before:

- Apple Developer payment or enrolment;
- bundle identifier/App Store record reservation;
- signing credentials or certificates;
- EAS/provider account or secret configuration;
- TestFlight build/upload;
- real-user invitation;
- App Store submission or public launch;
- any provider purchase;
- any Production migration or Production financial-data access.

## Conclusion

Expo/React Native is selected as the native repository architecture. This decision authorises a later no-cost bootstrap and parity proof, not signing, TestFlight or release. The existing responsive web application remains supported and independently deployed.
