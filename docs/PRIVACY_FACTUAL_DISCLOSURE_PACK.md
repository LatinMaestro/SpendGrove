# Privacy Factual Disclosure Pack

Status: factual drafting input; not final legal advice  
Prepared: 18 July 2026  
Target: Australian web private beta and future iPhone/iPad application

## Purpose

Provide verified product facts for a qualified privacy/legal reviewer and for consistent in-app, website and App Store disclosures.

## Product and controller facts requiring client confirmation

- legal entity/business name;
- trading name and ABN/ACN where applicable;
- physical or service address;
- privacy contact;
- support contact;
- security contact;
- countries where the product will be offered;
- minimum age;
- complaint-handling process;
- applicable retention periods;
- approved subprocessors and contracts.

Do not publish placeholder contact information.

## Information currently collected

For an authenticated account, SpendGrove may store:

- Clerk-linked application user identifier and account lifecycle state;
- transactions created manually or committed after CSV review;
- integer-cent amounts, Australian dates, transaction direction and categories;
- split relationships;
- safe cleaned merchant/profile/rule data;
- import batch metadata and safe row-level review outcomes;
- saved import profiles without raw CSV rows;
- Loan Accounts, repayment breakdowns and reconciliation links;
- Properties and user-selected transaction links;
- recurring items/suggestion decisions;
- monthly budgets;
- safe audit events and reason codes;
- account export/deletion workflow state where currently implemented.

Future guarded Phase 6/7/9/10/11 records are not operational until migrations and activation are approved.

## Information deliberately not retained

Current CSV design does not durably retain:

- raw CSV files or rows;
- filenames;
- bank account numbers;
- BSBs;
- card/customer identifiers;
- excluded private columns;
- raw narration;
- document bytes.

Browser-local parsing and privacy scanning happen before reviewed data is committed.

## Providers currently relevant

### Clerk

Purpose: authentication, sessions and identity lifecycle.

Facts to confirm:

- Production instance;
- enabled login methods;
- verification/recovery flows;
- processing regions and international transfers;
- provider retention and deletion;
- cookie/session details;
- security and privacy terms.

### Neon PostgreSQL

Purpose: durable owner-scoped application records.

Facts to confirm:

- exact Production and Preview mapping;
- region;
- backup/history retention;
- branch protection;
- deletion propagation;
- provider subprocessors/terms.

### Vercel

Purpose: web hosting, build and request execution.

Facts to confirm:

- project/team ownership;
- regions and logs;
- log retention/access;
- firewall/monitoring configuration;
- cookies and deployment protection;
- provider subprocessors/terms.

### GitHub

Purpose: source control and CI. No user financial rows should be present.

Facts to confirm:

- repository access;
- secret scanning/push protection;
- Actions retention;
- incident/access process.

## Cookies, sessions and local storage

- Clerk uses cookies/session mechanisms required for authentication.
- Protected responses are private/no-store.
- Browser-local prototype/import state is not silently uploaded, merged, shared or deleted.
- Current browser-local keys and preservation treatment remain documented separately.
- Any analytics cookie is absent because analytics is off.

A final cookie table must be produced from the release candidate and provider configuration.

## Financial and Property privacy

- finance routes require authentication;
- server resources enforce owner scope;
- financial values use integer cents;
- everyday Transactions remain the cashflow source;
- loan repayment breakdowns remain analytical;
- no tax/deductibility, credit, debt or investment advice is provided;
- reports are organisational record-keeping aids and require professional review;
- exact Property addresses and private source identifiers are not used in safe audit/monitoring metadata.

## Export

Current account export is authenticated and owner-scoped. Final policy must state:

- included active, archived and soft-deleted records;
- format and date/money representation;
- excluded raw CSV because it is not stored;
- future provider/document/collaboration treatment;
- identity verification;
- secure delivery;
- export log retention.

## Deletion

Current account deletion is implemented, but final policy requires decisions for:

- immediate deletion versus grace period;
- Clerk identity deletion;
- ordered application deletion;
- audit-event retention;
- backups and deletion propagation;
- future household/accountant/documents;
- legal holds;
- failed/partial deletion recovery;
- Apple token revocation where applicable.

## Support and feedback

Users must be warned not to send:

- real CSV files;
- bank statements;
- account/card identifiers;
- screenshots containing finance details;
- passwords/tokens;
- identity documents.

Final support channel, operator, retention and escalation are unapproved.

## Monitoring and analytics

- product analytics is off;
- no monitoring/crash provider is active;
- future operational monitoring must use allowlisted safe codes and exclude financial/private fields;
- any activated provider must be added to this pack and reviewed before release.

## Future optional providers

Currently disabled and unapproved:

- Basiq;
- AI provider;
- document object storage and malware service;
- email/invitation/support provider;
- payments/billing;
- native push notifications;
- monitoring/crash reporting.

No privacy statement should imply these are active.

## Professional review questions

1. Privacy Act/APP coverage and small-business applicability.
2. Overseas disclosure wording for Clerk, Vercel, Neon, GitHub and Apple.
3. Retention, backup and audit-log obligations.
4. Consumer complaint and correction rights.
5. Data breach response obligations.
6. Account deletion and Apple requirements.
7. Financial/tax organisational-tool disclaimers.
8. Household/accountant role implications.
9. Document/OCR/AI/Basiq consent and disclosure if activated.
10. Commercial terms, refunds, GST and Australian Consumer Law.

## Publication gate

Do not publish final Privacy Policy or Terms until:

- product/provider set is frozen;
- client facts are complete;
- provider regions/retention are confirmed;
- release binary behaviour matches the document;
- qualified Australian legal review is complete;
- Apple privacy answers are reconciled;
- client explicitly approves publication.
