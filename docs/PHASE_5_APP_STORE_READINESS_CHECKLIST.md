# Phase 5 App Store Readiness Checklist

Status: future readiness only; no App Store action authorised  
Reviewed: 17 July 2026

## Readiness conclusion

SpendGrove is not ready for App Store submission.

The current approved release target is a controlled Australian web private beta. Native packaging has not been selected or implemented. The checklist below preserves the path to a later Apple decision without creating an Apple account, app record or build.

## 1. Apple developer identity

- [ ] Client chooses individual/sole-proprietor enrolment or organization enrolment.
- [ ] Seller-name implications are accepted: individual enrolment displays the person's legal name; organization enrolment displays the legal entity name.
- [ ] Apple Account has two-factor authentication.
- [ ] Applicant has authority to enter legal agreements.
- [ ] If organization enrolment is chosen, legal entity and D-U-N-S details are valid.
- [ ] Groveware is confirmed as a legal entity, trade name or product brand and used consistently.
- [ ] Annual membership cost and renewal owner are approved.
- [ ] Account Holder and backup operational roles are assigned.
- [ ] No credentials or verification documents are stored in GitHub.

Apple states that distribution requires Apple Developer Program membership; organization enrolment uses the legal entity name and requires a D-U-N-S Number.

## 2. Native delivery decision

- [ ] Future packaging framework is separately approved.
- [ ] iPhone and iPad support decision is explicit.
- [ ] Minimum iOS/iPadOS versions are defined.
- [ ] Native authentication and deep-link contract is approved.
- [ ] Native CSV/document-picker privacy contract is approved.
- [ ] Native secure-storage and session model is approved.
- [ ] Build signing, certificate, provisioning and renewal ownership is assigned.
- [ ] Update and rollback process is tested.
- [ ] App provides sufficient native value and is not merely an unreviewed website wrapper.

## 3. Account and authentication readiness

- [x] In-product account deletion exists in repository code.
- [x] Complete owner-scoped account export exists in repository code.
- [x] Operational finance routes require authentication in the accepted private-beta posture.
- [x] Durable reads and writes enforce server-side authentication/ownership.
- [ ] Clerk Production instance replaces the current development/test instance.
- [ ] Production email verification and recovery flows are proven.
- [ ] App Review demo account is prepared with synthetic data and stable credentials.
- [ ] Review notes explain CSV-first behaviour without requiring private bank data.
- [ ] If a third-party/social login is used as the primary account login, Apple's equivalent-login requirement is assessed.
- [ ] If Sign in with Apple is adopted, token revocation and account-deletion coordination are implemented and tested.

Apple requires apps that support account creation to let users initiate deletion in the app. Reauthentication and confirmation are permitted when they do not make deletion unnecessarily difficult.

## 4. Privacy and data disclosure

- [x] SpendGrove has a pre-release privacy draft and in-product privacy surface.
- [x] Raw CSV non-retention and excluded bank-identifier boundaries are documented.
- [x] Analytics is off.
- [x] Third-party roles for Clerk, Vercel and Neon are documented as policy inputs.
- [ ] Privacy draft receives client factual review.
- [ ] Australian privacy/legal professional reviews final wording and cross-border processing.
- [ ] Final public Privacy Policy URL is stable and accessible without sign-in.
- [ ] Optional privacy-choices URL is decided.
- [ ] App Privacy answers include all data collected by SpendGrove and embedded third parties.
- [ ] App Privacy answers are reviewed after the native framework and authentication path are selected.
- [ ] Contact, financial information, identifiers, diagnostics and usage-data answers are factually validated.
- [ ] Backup retention and deletion propagation facts are confirmed.
- [ ] No claim says the policy is professionally approved until that review occurs.

Apple requires a privacy policy URL and accurate App Privacy disclosures, including third-party partner practices.

## 5. Support and public URLs

- [x] Help and safe-support guidance exist in the web product.
- [ ] Final Groveware support contact is supplied.
- [ ] Public Support URL contains actual contact information and meets applicable legal requirements.
- [ ] Public Privacy Policy URL is supplied.
- [ ] Marketing URL is decided.
- [ ] Optional accessibility URL is decided.
- [ ] User privacy choices/account-management URL is decided.
- [ ] URLs work without authentication, use HTTPS and have an operational owner.
- [ ] Support process warns users not to send real CSV files or private screenshots.

Apple requires a support URL and privacy policy link for App Store apps. The support URL must lead to real contact information.

## 6. Product claims and disclaimers

- [ ] App copy is reviewed for accuracy.
- [ ] “CSV-first”, “review before import”, “no live bank connection by default” and “record keeping only” claims match the submitted build.
- [ ] No copy claims tax advice, automatic deductibility, accountant certification or ATO readiness.
- [ ] No copy promises guaranteed savings, forecasts or financial outcomes.
- [ ] Subscription/payment copy is absent while purchasing is not implemented.
- [ ] Private-beta limitations are removed or updated only when the release posture changes.
- [ ] Groveware trademark, logo and third-party content rights are confirmed.
- [ ] Age-rating questionnaire is completed accurately.

## 7. App privacy and financial-data review

Potential App Privacy categories must be assessed against the final native build, not copied mechanically:

- contact information used by Clerk for account operations;
- user ID or other account identifiers;
- financial information entered/imported by the user;
- diagnostics if a future native framework or provider emits them;
- usage data only if analytics is later approved;
- data linked to identity and purposes such as app functionality, security and account management.

No analytics or crash-reporting provider is approved now.

## 8. Accessibility

- [x] The responsive web product has keyboard, label, contrast and narrow-width QA evidence.
- [ ] Native common tasks are tested with VoiceOver.
- [ ] Larger Text at Apple's required evaluation level is tested.
- [ ] Meaning does not rely on colour alone.
- [ ] Contrast is reviewed on every supported device appearance.
- [ ] Reduced Motion behaviour is tested.
- [ ] Login, CSV import, review, transaction correction, export, deletion and Settings are included in the common-task audit.
- [ ] Accessibility Nutrition Label answers are supported by evidence for each claimed device.
- [ ] Accessibility URL content is prepared if used.

Apple now provides Accessibility Nutrition Labels and requires developers to evaluate common tasks before claiming support.

## 9. Screenshots and metadata

- [ ] Final name and subtitle are approved.
- [ ] Description, keywords and promotional text are approved.
- [ ] Copyright owner is confirmed.
- [ ] Bundle ID and SKU are approved before record creation.
- [ ] Primary category and age rating are approved.
- [ ] One to ten required screenshots are prepared for each supported device class/localization.
- [ ] Screenshots contain only synthetic data.
- [ ] Screenshots accurately represent the submitted build.
- [ ] No merchant, account, address, property, loan or user private data appears.
- [ ] Optional app preview video is deliberately approved or omitted.
- [ ] Screenshot dimensions are rechecked against Apple's current specification at upload time.

## 10. App Review access

- [ ] App Review contact first name, surname, phone and email are provided.
- [ ] Stable synthetic demo account is available.
- [ ] Demo account can exercise all account-only features.
- [ ] Review notes explain authentication, CSV file selection and account deletion.
- [ ] A synthetic CSV fixture is available if review cannot understand import otherwise.
- [ ] No reviewer is asked to provide real financial data.
- [ ] Backend and provider environments remain available throughout review.
- [ ] Any special configuration is described precisely.

Apple directs developers to provide a valid demo account when sign-in is required and to include sufficient review information.

## 11. Technical release gate

- [ ] Exact native build commit is recorded.
- [ ] Supported Xcode/SDK submission requirements are checked on submission day.
- [ ] Production Clerk, Vercel and Neon mapping is proven.
- [ ] Production migration history is proven without inspecting private rows.
- [ ] Backup/recovery capability and rollback plan are proven.
- [ ] Full automated regression is green.
- [ ] Account isolation, export, deletion and privacy logging tests are green.
- [ ] iPhone and iPad visual/overflow testing is green for declared devices.
- [ ] Browser/native console and crash review is clean.
- [ ] Security headers and web-session behaviour remain correct where a web view is used.
- [ ] Dependency and native-plugin advisories are reviewed.
- [ ] No development/test provider key is present.
- [ ] No public launch occurs before a separate client launch approval.

## 12. Submission controls

- [ ] Client explicitly authorises app-record creation.
- [ ] Client explicitly authorises build upload.
- [ ] Client explicitly authorises TestFlight external testing, if used.
- [ ] Client explicitly authorises App Review submission.
- [ ] Release mode (manual, automatic or phased) is chosen.
- [ ] Launch support and rollback owner are available.
- [ ] Privacy/support/legal pages are live before submission.
- [ ] Agreements and compliance reviews are current.

## Current blockers

1. No native packaging framework or native project.
2. Clerk Production credentials are not active in the current Production deployment.
3. Vercel/Clerk/Neon environment mapping remains partially unproven.
4. Production migration history and restoration evidence remain unproven.
5. Groveware legal entity/seller identity is unresolved.
6. Final support contact and public URLs are unresolved.
7. Privacy and release wording require factual and professional review.
8. No Apple Developer enrolment, App Store Connect record, bundle ID, signing or review account exists.

## Official Apple sources

Accessed 17 July 2026:

- Choosing a Membership: https://developer.apple.com/support/compare-memberships/
- Program enrollment: https://developer.apple.com/help/account/membership/program-enrollment
- D-U-N-S Number: https://developer.apple.com/help/account/membership/D-U-N-S/
- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Offering account deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app
- Manage app privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/
- App information reference: https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/
- Platform version information: https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information
- App Review overview: https://developer.apple.com/app-store/review/
- Screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
- Accessibility Nutrition Labels: https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels/
