# Phase 3C Milestone 3 Schema and Migration Assessment

Status: approved assessment for PR 3C.11

Date: 8 July 2026

## Assessment result

The existing schema can support Phase 3C Milestone 3 import-review Property linking without a Prisma schema change, migration, durable staging table or data rewrite.

No Preview migration is required.

No Production migration is authorised or required.

## Existing schema support

The existing `PropertyTransactionLink` table already provides the durable relationship needed by the approved contract:

- generated link ID;
- authenticated `userId`;
- `transactionId`;
- `propertyId`;
- nullable `unlinkedAt`;
- created/updated timestamps;
- one unique `transactionId` constraint;
- owner-scoped indexes;
- user, transaction and Property foreign keys.

This matches the accepted Milestone 3 requirement that one eligible everyday transaction may have at most one active Property link.

## Existing service support

The existing `src/server/property-transaction-links.ts` service already revalidates:

- authenticated ownership;
- active/non-deleted transaction state;
- split-parent exclusion with `splitRole: { not: "PARENT" }`;
- active/non-deleted, non-archived Property state;
- one active Property link per transaction;
- unlink-before-relink conflict handling;
- safe state/reason-code audit metadata;
- no mutation of transaction amount, date, merchant/source, category or cashflow treatment.

The implementation can reuse or factor this validation for import-created transactions. Any new helper should preserve the same checks and privacy boundaries.

## Existing import commit support

The existing import commit path already:

- validates a frozen request ID for idempotency;
- creates one durable `ImportBatch`;
- creates imported transactions for `IMPORT` rows;
- creates no transaction for `SKIP` rows;
- records `MERGE` rows against an existing manual transaction target;
- validates owned categories and merge targets;
- sanitises descriptions and merchant names before persistence;
- stores only safe commit metadata and aggregate audit fields.

For Milestone 3, the commit request may carry transient, safe Property-link intentions for eligible `IMPORT` rows only. Those intentions are request payload data, not durable staging records.

## Import / Skip / Merge assessment

### Import rows

`IMPORT` rows are compatible with the existing schema. The commit path already creates a new owned transaction ID for each imported row. The Property link can be created after the transaction row exists and before the commit operation completes, using the same authenticated user and selected active owned Property.

### Skip rows

`SKIP` rows create no transaction and therefore must not create a Property link. No schema support is needed.

### Merge rows

`MERGE` rows point at an existing manual transaction target. They do not create one new future committed transaction, so they remain outside pre-commit Property linking for this milestone under the PR 3C.10 contract.

Users can link the existing transaction through the existing manual Property-link flow after the merge. No schema support or migration is needed.

## Transaction and link write ordering

The preferred implementation is:

1. Validate the import request and any Property-link intentions.
2. Validate chosen Properties are active, non-deleted and owned by the authenticated user.
3. Create imported transaction rows for eligible `IMPORT` rows.
4. Create `PropertyTransactionLink` rows only for successfully created owned transactions.
5. Preserve existing idempotency: retrying an already completed import returns the existing import summary and does not duplicate transactions or active Property links.

The implementation should keep the durable transaction and link writes in the existing safe commit boundary where practical. If a link conflict or validation error is detected before completion, the save should fail safely rather than partly committing hidden supporting metadata.

If implementation later discovers that preserving both idempotency and safe link creation requires durable staging state or a schema change, stop before continuing.

## Manual transaction assessment

Manual transaction create/edit can use the same existing `PropertyTransactionLink` table and unlink-before-relink behaviour if implementation remains limited to:

- create/update the transaction first;
- create, preserve, unlink or relink the supporting Property link only after transaction ownership and active state are validated;
- do not change the transaction amount, date, category, merchant/source or cashflow treatment through Property linking;
- no schema change, migration, durable staging state or new conflict model.

If manual transaction polish requires new durable fields, a migration or a changed conflict model, stop before implementation.

## Privacy and data assessment

No additional durable private fields are required.

The implementation must not persist, log or copy into Property-link metadata:

- raw CSV files;
- raw rows;
- original filenames;
- raw narration or source text;
- account identifiers;
- BSBs;
- card fragments;
- customer IDs;
- loan/lender references;
- masked references;
- exact property addresses;
- balances;
- secrets or connection strings.

The durable link contains only generated IDs and timestamps already approved in Phase 3C Milestone 1.

## No-double-count assessment

The existing reporting/export foundation reads current eligible `PropertyTransactionLink` rows and loan-derived reconciliation paths. Adding Property links for imported everyday transactions will make them appear automatically in Property records/export without creating another cashflow record.

Loan repayments remain analytical/reconciliation records only. No reporting calculation change is required.

## Migration conclusion

No migration is needed for PRs 3C.12-3C.15 if they follow this assessment.

Do not run a Preview migration.

Do not run a Production migration.

## Stop conditions preserved

Stop and ask before continuing if implementation requires:

- a Prisma schema change;
- any migration;
- durable staging state;
- durable import-row Property-choice records;
- Merge-row pre-commit Property linking;
- private source fields;
- automatic Property matching;
- exact addresses;
- tax/deductibility wording;
- transaction allocation or split logic;
- report/export calculation changes;
- a new package, provider, secret or environment change;
- Production migration;
- navigation changes;
- Home dashboard statistics;
- Phase 4 or later modules.
