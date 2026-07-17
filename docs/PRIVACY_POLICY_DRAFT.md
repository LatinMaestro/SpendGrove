# SpendGrove Privacy Policy — pre-release draft and review checklist

Status: **draft for factual and professional legal review; not approved legal advice**  
Developer brand: Groveware  
Prepared: 17 July 2026  
Release target: controlled Australian web private beta

> Contact placeholder: Groveware support and privacy contact details must be approved before private beta invitations are sent. Do not publish invented contact details.

## Purpose

This draft translates the implemented SpendGrove privacy posture into policy inputs. It is not ready to publish as a final legal policy until every item in the factual and legal checklist is resolved.

## Draft policy inputs

### Product scope

SpendGrove is an Australian personal-finance record-keeping and budgeting web application. Users manually enter data or choose CSV files to review and import. SpendGrove does not enable live bank connections, payments, tax lodgement, AI advice or advertising analytics.

### Information an account may hold

Depending on features used:

- Clerk-linked account profile, name and email;
- user settings;
- categories and budgets;
- reviewed transactions, notes, merchant labels and split relationships;
- safe import status, row decisions and mapping configuration;
- saved merchant profiles, aliases and rules;
- confirmed regular payments and dismissed suggestions;
- Property nicknames, Loan Accounts and repayment breakdowns;
- reconciliation and Property-transaction links;
- lifecycle state for active, archived and soft-deleted records;
- safe audit events with operational reason codes.

Amounts use integer cents. Financial calendar dates retain Australian date meaning.

### Information deliberately not requested

SpendGrove does not ask for:

- internet-banking usernames or passwords;
- bank MFA or verification codes;
- card PINs;
- authority to move money;
- tax-file numbers;
- exact Property addresses in the accepted product model.

### CSV handling

The user chooses a CSV file in their browser. SpendGrove performs privacy scanning and presents review-before-commit controls.

Current intended treatment:

- raw CSV files are not retained;
- raw rows are not retained as a downloadable source file;
- private fields such as account numbers, BSBs, card/customer identifiers and balances are excluded from committed transaction records;
- safe structured import status and commit metadata may be stored;
- reviewed, sanitised transaction descriptions and merchant labels may form part of committed account data;
- filenames and filename hashes are operational metadata and are excluded from the account export.

This wording needs a final code/log verification before publication.

### Browser-local prototype data

Older prototype data may remain in browser storage on a particular device. It is segregated from the durable account:

- no automatic upload;
- no automatic merge;
- no inclusion in authenticated totals;
- no cross-user transfer;
- no promise of backup or synchronisation;
- no silent deletion on sign-in or sign-out.

A future local-to-account migration is not approved.

### Providers

Current providers:

- Clerk — authentication, account identity and sessions;
- Vercel — hosting, server execution and deployment infrastructure;
- Neon — PostgreSQL database infrastructure.

No behavioural analytics, advertising, crash-reporting or support-ticket provider is enabled.

Provider terms, subprocessors, hosting regions, international transfers and contractual safeguards require factual and legal review.

### Cookies and sessions

Clerk and the application may use cookies or browser storage necessary for authentication, security, preferences and session continuity. A final cookie inventory and any consent requirement must be confirmed before publication.

### Export

A signed-in user can request a versioned JSON account export after recent identity reverification. The export is generated on demand, delivered with private no-store headers and is not sent to external file storage by SpendGrove.

### Deletion

A signed-in user can initiate permanent account deletion in Settings after deliberate confirmation and recent identity reverification.

The implemented sequence removes owner-scoped application data atomically, then requests deletion of the Clerk identity. Partial provider failure is reported truthfully and can be retried. There is no grace period.

The final policy must accurately state:

- provider-backup retention;
- deletion propagation;
- lawful or operational retention exceptions, if any;
- whether any support or security evidence must be retained;
- the contact path for deletion problems.

### Security and logs

SpendGrove uses server-side authentication and owner scoping. The intended logging boundary excludes raw CSV rows, filenames, transaction descriptions, merchant-level financial history, amounts, balances, banking identifiers, emails unless required for account operations, exact Property details and secrets.

This is a design and test boundary, not a guarantee against every security incident. Incident and recovery procedures belong in Phase 5 operational records.

### Financial and tax boundary

SpendGrove provides record keeping and personal budgeting. It is not tax, legal, investment, debt or credit advice. Property records are not ATO-ready, accountant-certified or deductible/claimable calculations.

### Children and geography

The target audience, minimum age, residency scope and handling of users outside Australia require client and legal decisions. The present release target is a controlled Australian private beta.

## Factual-review checklist

Client/operator must confirm:

- [ ] final Groveware legal/business name;
- [ ] public privacy contact;
- [ ] public support contact and support URL;
- [ ] business address or alternative legally acceptable contact disclosure;
- [ ] Australian business/registration details, if required;
- [ ] intended minimum user age;
- [ ] accepted user geography;
- [ ] Vercel production region and current subprocessors;
- [ ] Neon production project/branch/region mapping;
- [ ] Clerk Production instance, domains and email delivery;
- [ ] Preview and Production separation;
- [ ] exact cookie and browser-storage inventory;
- [ ] provider log retention;
- [ ] database backup/PITR retention;
- [ ] deletion propagation into backups;
- [ ] incident contact and notification owner;
- [ ] support request storage, access and retention;
- [ ] whether any account data is retained for legal obligations;
- [ ] custom domain and final policy URL;
- [ ] accessibility and plain-language review.

## Professional legal-review checklist

Australian privacy/legal counsel should determine:

- [ ] whether Groveware is covered by the Privacy Act 1988 and Australian Privacy Principles at launch;
- [ ] required collection notices and consent treatment;
- [ ] cross-border disclosure wording;
- [ ] cookie/session disclosure and consent obligations;
- [ ] children/minors treatment;
- [ ] data-breach notification process;
- [ ] access, correction and complaint handling;
- [ ] retention and backup wording;
- [ ] deletion exceptions;
- [ ] third-party provider disclosure detail;
- [ ] consumer-law and financial/tax disclaimer wording;
- [ ] Terms of Use dependency;
- [ ] contact and identity information required for publication.

## Release gate

Do not label this document professionally approved. Do not invite private-beta users until the central contact placeholder, Clerk Production instance, environment mapping, retention facts and legal review outcome are resolved.
