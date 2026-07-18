# Phase 14 Commercial Readiness Contract

Prepared: 17 July 2026  
Status: repository planning approved; prices, payment providers and live entitlements unapproved  
Runtime posture: accepted SpendGrove functionality remains unchanged and unpaywalled

## Objective

Prepare a provider-neutral entitlement and subscription lifecycle architecture for possible Free, Plus, Pro and Household plans without collecting money, publishing prices, restricting the accepted product or committing to a billing provider.

## Non-negotiable current behaviour

Until a later commercial activation contract is approved:

- every currently available authenticated feature keeps its existing availability;
- no paywall, upgrade prompt, trial countdown or entitlement denial is shown;
- no user receives a durable paid plan;
- no payment, receipt, subscription or billing-customer record is created;
- no Apple, Stripe or other billing SDK/API is called;
- no prices or savings claims are displayed;
- account export and deletion cannot be paywalled;
- privacy, security and correction controls cannot be paywalled;
- no provider package, secret, environment variable or webhook exists.

## Candidate plans

Plan names are reserved for planning only:

- `FREE`
- `PLUS`
- `PRO`
- `HOUSEHOLD`

The names do not represent published products. Prices, billing periods, trials, discounts, tax/GST treatment and exact limits remain client/commercial decisions.

## Candidate entitlement catalogue

The architecture may describe these stable capabilities without activating them:

- core Transactions and manual entry;
- CSV imports and saved profiles;
- bulk workflows and import undo;
- budgets and regular payments;
- Loans and Properties;
- reports and accountant preparation;
- advanced personal-finance planning;
- household collaboration;
- accountant read-only collaboration;
- document storage;
- optional merchant enrichment;
- optional AI assistance;
- native device features;
- support/service level.

Every entitlement needs:

- a stable internal key;
- plain-English product copy approved separately;
- a source of truth;
- explicit effective/expiry dates where time-based;
- provider evidence where purchased;
- an audit-safe reason code;
- account/household scope;
- export and deletion treatment;
- offline and failure behaviour.

## Limits

Potential limits include import count, bulk-operation size, household members, accountant grants, document storage bytes, optional provider requests and AI requests.

No numeric limit is approved in this contract. The disabled architecture must represent a limit as `UNDECIDED`, not as zero, unlimited or an invented number.

Safety and data-control operations must never fail merely because a commercial limit is unavailable.

## Authoritative entitlement model

When later activated, the server must be authoritative.

Clients may display entitlements returned by the server, but must not determine paid access from:

- local storage;
- client clocks;
- hidden UI;
- unverified StoreKit/Stripe results;
- email domain;
- narration or finance data;
- provider metadata without signature/server validation.

A future durable model may need account-level and household-level grants, external provider references, effective dates, status and an append-only lifecycle journal. Exact schema and migration require a separate proposal after prices/providers are approved.

This contract creates no schema or migration.

## Provider-neutral lifecycle

The future state machine must account for:

- no subscription;
- trial where approved;
- active;
- grace/billing retry;
- paused where provider-supported;
- cancelled but active until period end;
- expired;
- refunded/revoked;
- disputed;
- provider unavailable;
- manual support grant with expiry and audit;
- account deletion.

Provider events must be idempotent, signature-verified and mapped to safe internal reason codes. A failed webhook must not corrupt finance records.

## App Store boundary

Current Apple guidance requires In-App Purchase when iOS functionality is unlocked through digital purchases. Auto-renewable subscriptions must provide ongoing value, work across relevant devices, clearly describe benefits and support management/restoration.

Therefore:

- native digital feature purchase must use an approved StoreKit/In-App Purchase path unless a documented current exception applies;
- web-purchased entitlements may be recognised in a multiplatform service only under the then-current App Review rules and must not create an unapproved external-purchase flow in the app;
- Restore Purchases must be visible and user-initiated;
- Apple receipts/transactions must be server validated;
- App Store Server Notifications/API reconciliation is required before Production;
- refund/revocation and billing-retry states must remove or preserve access according to an approved customer-treatment contract;
- account deletion must explain that Apple subscription cancellation is a separate Apple action where applicable;
- no App Store product or subscription group is created now.

## Web billing boundary

No web billing provider is selected. A future provider decision must cover:

- Australian availability;
- pricing and fees;
- GST/tax invoices;
- customer portal;
- upgrade/downgrade/proration;
- cancellation and refunds;
- webhooks and signature verification;
- data region and retention;
- support;
- reconciliation with Apple entitlements;
- duplicate-purchase prevention;
- secrets and incident response.

## Cross-platform entitlement rules

A user must not pay twice for the same intended entitlement without clear choice and disclosure.

Before activation define:

- whether each plan is available on web, App Store or both;
- product identifiers and equivalence;
- account-to-App-Store purchase binding;
- household purchaser/member rules;
- upgrade/downgrade precedence;
- refund/revocation treatment;
- restore and device-change treatment;
- region/currency/tax display;
- support and exception process.

## Household rules

A Household plan cannot silently share records. Commercial entitlement and data-sharing permission remain separate.

- entitlement may allow household capability;
- household membership/invitations still require explicit accepted state;
- existing personal records remain private until deliberately shared;
- removing/cancelling a plan must not expose or destroy finance records;
- a downgrade needs an approved read/export/correction grace policy;
- account deletion and household administrator rules remain authoritative.

## Documents, Basiq and AI

Entitlement does not activate a provider.

- document entitlement cannot enable upload until storage/malware/environment/migration gates pass;
- optional merchant enrichment remains local-first, opt-in and provider-approved;
- AI remains opt-in, read-only/reviewable and provider-approved;
- provider quotas and costs require separate approval;
- unavailable providers fail back to safe local functionality;
- no user finance record is held hostage because an optional provider is unavailable.

## Privacy and security

Commercial records must contain only necessary account, plan, provider-reference and lifecycle information.

Do not place in billing metadata or logs:

- raw CSV;
- transaction descriptions;
- merchants;
- amounts or balances;
- account/BSB/card references;
- Loan or Property details;
- document names/content;
- AI prompts containing finance history.

Provider customer identifiers are private operational data. They must be export/deletion-reviewed, access controlled and never exposed in normal UI.

## Support and refunds

Before payment activation approve:

- support contact and response expectations;
- cancellation wording;
- refund process for web and Apple;
- billing error escalation;
- entitlement repair;
- receipt/invoice access;
- account deletion interaction;
- Australian Consumer Law review;
- GST/tax review;
- outage/service-credit position.

No generated wording is final legal advice.

## Disabled repository architecture

A safe pre-provider implementation may contain:

- stable plan and entitlement enums/types;
- a catalogue describing capabilities;
- a server-side resolver that always returns the current baseline;
- a hard-false commercial runtime gate;
- typed provider adapter interfaces with no implementation;
- tests proving no accepted feature is denied and no provider is called.

It must not contain:

- published prices;
- checkout;
- paywall UI;
- purchase/restore buttons;
- receipt parsing;
- webhooks;
- provider SDKs;
- durable billing schema;
- secrets/environment variables;
- App Store product IDs;
- customer identifiers.

## Required tests for disabled foundation

- runtime gate is false;
- every current accepted capability remains available;
- unavailable future capabilities are labelled not configured rather than purchasable;
- no plan is inferred from client input;
- no provider call occurs;
- no price exists;
- no finance/private fields exist in entitlement payloads;
- account export/deletion and corrections remain available;
- no schema/migration/package/environment change;
- no UI/paywall/navigation change.

## Decisions still required

1. Whether SpendGrove charges at first release.
2. Exact Free/Plus/Pro/Household features.
3. Numeric limits and storage allowances.
4. Monthly/annual prices, currency and GST treatment.
5. Trials, discounts and grandfathering.
6. Apple versus web availability and cross-platform equivalence.
7. Web billing provider.
8. Apple Developer/App Store commercial setup.
9. Refund/cancellation/support policy.
10. Household downgrade and data-access policy.
11. Basiq/AI/storage cost treatment.
12. External legal/accounting review.

## Official sources reviewed

Accessed 17 July 2026:

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — digital feature unlocking, multiplatform access, subscriptions and disclosure.
- [Auto-renewable subscriptions](https://developer.apple.com/app-store/subscriptions/) — subscription groups, device access and management.
- [App Store Server API](https://developer.apple.com/documentation/appstoreserverapi) — server-side transaction, status, refund and notification reconciliation.
- [Restoring purchased products](https://developer.apple.com/documentation/storekit/restoring-purchased-products) — visible user-initiated restoration.
- [Handling subscriptions billing](https://developer.apple.com/documentation/storekit/handling-subscriptions-billing) — active/renewed/lapsed/billing-retry state handling.

## Mandatory hard stops

Stop before:

- publishing prices;
- adding checkout/paywall/purchase UI;
- selecting/configuring a live provider;
- adding provider packages/secrets/environment variables;
- creating App Store products;
- collecting money;
- Production billing activation;
- paid-provider purchase;
- schema/migration for durable billing;
- inviting real users;
- TestFlight/App Store/public launch.

## Exit for repository preparation

Phase 14 repository preparation is complete when the contract and hard-disabled provider-neutral entitlement foundation are merged, verified and documented. Commercial readiness is not operational until every provider, price, legal, Apple and Production gate is separately approved.
