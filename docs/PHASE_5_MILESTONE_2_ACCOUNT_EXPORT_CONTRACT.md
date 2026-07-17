# Phase 5 Milestone 2 account export contract

Status: approved implementation scope  
Release target: controlled Australian web private beta  
Date: 17 July 2026

## Objective

Give an authenticated SpendGrove account owner a complete, portable copy of their durable account data without exposing another user's data, raw CSV source material, provider secrets or unsafe internal metadata.

Account deletion is delivered separately after this export foundation is merged and verified.

## User value

The user can download one understandable JSON file before leaving SpendGrove or whenever they want a personal copy. The file preserves exact integer-cent values, durable relationships, Australian calendar dates and lifecycle state without pretending to be a tax, accounting or bank export.

## Authorisation and confirmation

- The export endpoint is account-protected by the private-beta route policy.
- Server code resolves the authenticated Clerk identity to the durable SpendGrove user.
- Every database read is filtered by that durable user ID.
- Clerk strict reverification is required immediately before generation.
- The client uses Clerk's supported reverification flow and retries only after successful verification.
- Cancellation creates no export.
- The response is generated on demand, is not stored by SpendGrove and uses private no-store headers.

## Format and versioning

The first format is a single UTF-8 JSON document:

- contract: `spendgrove.account-export`;
- version: `1`;
- generated timestamp: UTC ISO 8601;
- currency: `AUD`;
- calendar timezone: the account timezone, defaulting to `Australia/Brisbane`;
- monetary values: signed integer cents;
- Australian transaction, repayment and balance dates: `YYYY-MM-DD`;
- lifecycle and system timestamps: UTC ISO 8601;
- relationships: stable record IDs already owned by the account.

No ZIP archive or new package is required. CSV is intentionally deferred because a relational account export is safer and more complete in versioned JSON.

## Included durable entities

The export contains the authenticated owner's:

- account profile and settings;
- categories, including archived and soft-deleted records;
- transactions, including splits, notes, durable safe description and merchant fields, lifecycle state and relation IDs;
- safe import-batch metadata and safe import-row commit metadata;
- saved bank import profiles;
- merchant profiles, aliases and rules;
- Properties and Loan Accounts;
- Loan repayments and reconciliation links;
- Property transaction links and dormant Property report reviews;
- recurring items and dismissed suggestion keys;
- category budgets;
- a safe audit-event summary.

Archived and soft-deleted records are included so the export is complete and lifecycle state is traceable.

## Deliberate exclusions

The export does not contain:

- raw CSV files or raw CSV rows;
- original or redacted filenames;
- filename hashes;
- raw import-row descriptions or merchant text;
- import-row metadata blobs;
- detected bank/account labels or excluded private header names;
- transaction matching fingerprints, duplicate keys or CSV match hints;
- unsafe audit metadata;
- Clerk secret keys, session tokens or provider configuration;
- database URLs, Vercel/Neon identifiers or environment values;
- data belonging to another user.

Saved mapping configuration is included because it is durable user-controlled configuration, not a raw CSV row. Durable transaction descriptions and merchant names are included because they are part of the user's committed account data; the export itself is protected by strict reverification.

## Audit treatment

Existing audit events are exported only as:

- event ID;
- entity type;
- related entity ID where present;
- action code;
- creation timestamp.

The free-form audit metadata object is omitted. This implementation does not create a misleading export audit event because the current schema has no dedicated account-export audit action. Adding one would require a separately approved schema migration.

## Data consistency and failure behaviour

- The server reads the account-owned entity sets through one Prisma transaction to reduce cross-query drift.
- A missing durable account or a failed read returns no partial file.
- The browser downloads only after a complete successful response.
- Errors use plain language and do not include database, provider or record details.
- Export failure does not mutate account data.
- The route never logs the export payload.

## Privacy and security boundaries

- Authentication, recent reverification and resource ownership are server-enforced.
- The chart/report safe-field contract is not reused as an account-export contract; this export is private to the verified account owner.
- No raw source content is reconstructed.
- No private payload is written to audit metadata, logs or temporary storage.
- Download headers include `Cache-Control: private, no-store, max-age=0` and `X-Content-Type-Options: nosniff`.
- Browser-local prototype data is not read, uploaded, merged, deleted or added to the account export.

## Schema and migration assessment

No Prisma schema change, Preview migration, Production migration, backfill or data rewrite is required. All included entities already have owner relationships and existing IDs.

## Tests and review gates

Required automated evidence:

- all current owner-owned entity groups are represented;
- exact integer cents and date formats are preserved;
- archived and soft-deleted records remain represented;
- raw import fields, fingerprints and audit metadata are absent;
- another user's records are excluded by every durable query;
- strict server-side reverification is present;
- response headers are private and no-store;
- cancellation/failure does not create a download;
- Settings keeps one clear export action;
- no schema, migration, package or financial-rule change occurs;
- the complete regression suite, TypeScript, lint and optimized build pass online.

## Stop conditions

Stop before broadening this implementation if it requires:

- a schema or migration;
- Production data access or data rewriting;
- a package, provider, secret or environment change;
- server-side file storage;
- background export infrastructure;
- relaxing recent reverification;
- including unsafe raw import or audit metadata;
- changing any financial calculation or transaction rule.

## Exclusions

This PR does not implement account deletion, retention/grace periods, legal policy text, monitoring, analytics, support tooling, native packaging, App Store work or public launch.
