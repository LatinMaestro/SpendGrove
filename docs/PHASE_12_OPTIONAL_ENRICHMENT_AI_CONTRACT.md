# Phase 12 Optional Merchant Enrichment and AI Contract

Date: 17 July 2026  
Status: repository preparation contract; all external providers disabled  
Client review: deferred until consolidated pre-release review

## Objective

Prepare optional, user-reviewed enrichment and assistance boundaries without selecting a paid provider, exposing private bank data or allowing any provider response to mutate financial records.

## Non-negotiable priority

1. User-confirmed local merchant/category rule.
2. User-confirmed alias or cleaned merchant profile.
3. Existing safe local history.
4. Conservative local keyword/brand rule.
5. No suggestion.
6. Optional external fallback only after explicit opt-in and every provider gate passes.

A reliable local result prevents an external call.

## Basiq boundary

Basiq remains optional, sandbox-first, disabled by default and fallback-only.

The official Enrich API accepts a search query derived from a transaction description and requires country and institution context. It can return merchant, location and category data. SpendGrove's privacy contract is deliberately narrower than the provider's full capability.

An approved future adapter may send only:

- a transient cleaned merchant description with volatile references and private identifiers removed;
- country `AU`;
- a non-user-specific Basiq institution code when safely available;
- a coarse account type only if separately approved.

Do not send:

- full CSV or raw row;
- raw narration;
- amount or balance;
- account number, BSB, card/customer/member/loan identifier;
- name, email, phone or address;
- filename/import metadata;
- Property or Loan private details;
- user ID or another persistent identifier.

Do not request or retain merchant address, phone, ABN or other fields that the local use case does not need.

Provider output is a suggestion only. The user must confirm it. An accepted result becomes a normal local rule; the provider payload is not retained.

Basiq direction/classification must never override SpendGrove's confirmed transfer treatment or signed-money invariant.

## Basiq official-source findings

Accessed 17 July 2026:

- [Basiq Enrich API](https://api.basiq.io/reference/enrich) documents merchant/category enrichment and required query, institution and country inputs.
- [Basiq API services](https://api.basiq.io/v2.0/docs/basiq-api-services-1) states sandbox use is available and Enrich access requires enablement.
- [Basiq testing](https://api.basiq.io/reference/testing) states initial sandbox testing is free and paying-customer charges apply later.
- [Basiq API rate limiting](https://api.basiq.io/docs/api-rate-limiting) documents a 100-query monthly sandbox Enrich limit.
- [Basiq go-live checklist](https://api.basiq.io/docs/go-live-checklist) requires separate applications/keys and cleanup of test users before live operation.

Exact Production pricing is not published in the reviewed official material and requires a commercial quote. No account, key, provider call, cost or Production enablement is approved.

## AI boundary

AI remains optional, opt-in, disabled and provider-neutral.

Permitted future assistance classes:

- category suggestion from minimum safe structured facts;
- natural-language search translated into a read-only owner-scoped query;
- general budget explanation based on approved aggregates;
- anomaly suggestion for user review;
- Help assistance from product documentation.

AI must never:

- silently create, edit, categorise, link, delete or share financial records;
- determine Transaction direction, transfer treatment, tax treatment or deductibility;
- provide regulated financial, credit, debt or tax advice;
- receive raw CSV, narration, filenames, account/card/BSB/customer identifiers, exact addresses, document contents or provider secrets;
- expose another user's data;
- use a provider response as executable code or an unrestricted database query;
- store prompts/responses in audit metadata;
- present uncertain output as fact.

Natural-language search must compile to a strict allowlisted read-only query and reapply authenticated ownership server-side. The model never receives database credentials or executes SQL.

## AI provider and privacy assessment

No AI provider is selected.

Any later provider decision must document:

- current model and regional availability;
- prompt/response retention and training controls;
- zero-data-retention eligibility where relevant;
- sub-processors and data location;
- security, incident and deletion treatment;
- pricing, quotas and spend controls;
- App Store and Privacy Policy disclosure;
- export/deletion impact.

For example, [OpenAI API data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint) states API data is not used for training by default unless opted in, while default abuse-monitoring logs may retain customer content for up to 30 days and stronger retention controls require eligibility. This is assessment input only, not provider approval.

## Repository architecture

Prepare two independent hard-false runtime gates:

- optional merchant enrichment;
- optional AI assistance.

Provider-neutral adapters must:

- have no default implementation;
- receive only an allowlisted safe request object;
- return a bounded typed suggestion;
- perform no persistence;
- fail closed before adapter access;
- expose no route/UI as available;
- use no provider package, secret or environment variable.

Local categorisation continues to work independently.

## User consent and review

A future activation must include:

- feature disabled by default;
- plain-English explanation of what leaves SpendGrove;
- explicit opt-in;
- separate Basiq and AI controls;
- immediate opt-out;
- user confirmation before every durable financial change;
- visible “suggested” wording;
- correction and deletion treatment;
- no dark patterns.

## Safe request shapes

### Merchant enrichment

- cleaned merchant text;
- AU country;
- safe institution code where available;
- optional coarse account type;
- requested dataset limited to merchant name/category.

### AI categorisation

- direction;
- cleaned local merchant label;
- existing category names/IDs safe for that owner;
- no amount/date/raw description.

### AI budget explanation

- approved category aggregate labels;
- rounded/necessary aggregate cents only if later privacy approval allows;
- comparison period;
- no individual merchant/transaction details.

### AI search

- locally separated search intent and allowlisted filters;
- no unrestricted query, SQL or database schema;
- owner checks applied after compilation.

### AI Help

- SpendGrove documentation snippets only;
- no account data by default.

## Persistence and audit

No new schema is required for disabled adapter preparation.

Future durable preferences may reuse safe settings only after a separate exact review. Do not store provider payloads, prompts, responses or embeddings in Phase 12 preparation.

Safe audit may record only fixed feature/decision reason codes after a user confirms a durable local action through an existing service. Provider calls themselves are not logged with content.

## Tests before activation

- local reliable result prevents adapter call;
- disabled gate prevents adapter access;
- explicit opt-in required;
- safe request contains no forbidden fields;
- category/direction/transfer compatibility remains enforced;
- provider output cannot mutate records;
- user confirmation remains required;
- malformed/untrusted output is rejected;
- timeout/failure falls back to local/manual review;
- no prompt/provider payload in logs/audit;
- two-user isolation;
- no unrestricted SQL/query execution;
- opt-out prevents future calls;
- no provider package/secret/environment change.

## External gates

Basiq:

- sandbox account/access;
- exact commercial pricing and terms;
- privacy/legal/App Store disclosures;
- retention/caching;
- environment/key separation;
- synthetic descriptor verification;
- explicit Production approval.

AI:

- provider/model/cost;
- retention/training/data-location controls;
- approved safe payload per assistance class;
- privacy/legal/App Store disclosures;
- evaluation and misuse testing;
- explicit Production approval.

## Mandatory stops

Stop before:

- adding a provider SDK/package;
- creating provider credentials or environment variables;
- sending any real transaction or user data;
- enabling a provider route/UI;
- live Basiq;
- paid AI;
- provider spend;
- persisting provider payloads/prompts/responses;
- silent financial mutation;
- advice wording;
- schema/migration;
- Production data access;
- public launch/TestFlight/App Store action.

## Current confirmation

This contract authorises only provider-neutral, fail-closed repository abstractions and tests. It does not select or call Basiq/AI, add a package/secret, enable a UI, send data, change financial rules or make Phase 12 operational.
