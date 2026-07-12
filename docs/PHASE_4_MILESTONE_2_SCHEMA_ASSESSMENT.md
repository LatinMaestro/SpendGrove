# Phase 4 Milestone 2 Schema and Migration Assessment

Status: complete - no schema change or migration required

Date: 12 July 2026

## Assessment

The existing approved Phase 4 schema supports the full Milestone 2 contract.

RecurringItem already contains:

- generated ID;
- authenticated user ownership;
- optional category;
- safe user-confirmed label;
- transaction type;
- expected integer-cent amount;
- cadence;
- optional next expected date;
- ACTIVE or ARCHIVED status;
- nullable archivedAt;
- created/updated timestamps.

RecurringSuggestionDismissal already contains:

- generated ID;
- authenticated user ownership;
- safe hashed suggestion key;
- dismissedAt;
- created/updated timestamps;
- unique userId and suggestionKey constraint.

CategoryBudget already contains:

- generated ID;
- authenticated user ownership;
- category;
- positive integer-cent amount;
- MONTHLY period;
- ACTIVE or ARCHIVED status;
- nullable archivedAt;
- created/updated timestamps.

## Existing-field implementation

Recurring restore can use:

- status ARCHIVED to ACTIVE;
- archivedAt to null;
- updatedAt for stale-write protection;
- current structured fields for equivalent-active duplicate checks.

Dismissal undo can use:

- owned userId and suggestionKey lookup;
- deletion of the existing non-financial preference row;
- current deterministic evidence to decide whether a dismissed suggestion is still reviewable.

Budget restore can use:

- status ARCHIVED to ACTIVE;
- archivedAt to null;
- updatedAt for stale-write protection;
- category ownership/active/type validation;
- existing period/status/category fields for duplicate-active checks.

## No durable additions

The milestone does not need:

- a new table;
- a new column;
- a new enum value;
- a new relationship;
- a revision table;
- a reminder or notification record;
- a transaction-to-recurring link;
- a durable candidate snapshot;
- a new audit field;
- a data backfill or rewrite.

## Data integrity

Implementation must:

- scope every lifecycle update/delete by userId;
- use updatedAt for stale archive/restore;
- leave all financial and source fields unchanged during restore;
- enforce no equivalent active recurring duplicate;
- enforce no second active monthly budget for the same user/category;
- allow dismissal deletion only for the exact owned preference row;
- write safe audit codes in the same transaction as lifecycle changes;
- never modify transactions, imports, loans, Properties or reports.

## Migration status

- New Preview migration required: no.
- Production migration required: no.
- Existing migration rerun required: no.
- Schema.prisma change required: no.
- Migration SQL change required: no.
- Package/provider/secret/environment change required: no.

The previously applied Phase 4 Preview migration does not need to run again.

## Gate conclusion

PR 4.7 may proceed using the existing schema. Stop immediately if implementation proves any statement in this assessment false.
