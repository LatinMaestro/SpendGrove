# Phase 7 Merchant Profile Completion Contract

Status: approved roadmap implementation boundary  
Prepared: 17 July 2026  
Schema assessment: no change

## Objective

Complete the everyday merchant-profile management that the current schema and account APIs already support, while leaving historical transaction mutation and merchant merging behind the blocked reversible-operation gate.

## Current repository truth

Implemented:

- owner-scoped MerchantProfile, MerchantAlias and MerchantRule models;
- cleaned merchant names and conservative aliases;
- exact, contains and starts-with rules;
- user-confirmed category learning;
- conflict prompts;
- profile rename;
- alias/rule disable, restore and recoverable delete lifecycle;
- account-backed Settings management;
- safe browser-local preservation when account storage is unavailable;
- private identifier and raw narration rejection.

Incomplete:

- changing a profile's default category from Settings;
- temporarily removing/restoring a whole profile without deleting its aliases/rules;
- clear profile-level status wording;
- focused profile lifecycle regression coverage.

Blocked:

- merging two merchant profiles;
- applying a profile/category across all historical transactions;
- changing existing transaction merchant/category relationships in bulk;
- durable undo for those mutations.

## Approved no-schema behaviour

### Edit profile

One `Edit merchant` control reveals only the selected profile's:

- cleaned display name;
- default suggestion category.

Save updates the profile and its exact merchant rules to the same chosen category so suggestions remain consistent. Cancel changes nothing.

The category must be an active available seeded or owned custom category. The server remains authoritative. Changing a profile category changes future review suggestions only; it does not recategorise an existing transaction.

### Remove and restore profile

User-facing `Remove merchant` sets only `MerchantProfile.isActive = false`.

- associated aliases and rules retain their own current active states;
- no profile, alias, rule or transaction is hard-deleted;
- inactive profiles do not produce suggestions;
- `Restore merchant` reactivates the profile and preserves prior alias/rule choices.

This is a reversible profile-level visibility/suggestion lifecycle, not a database erasure.

### Alias and rule lifecycle

Existing Rename, Disable, Restore and Delete controls remain. Profile inactivity takes precedence over active children.

### Clear all

Existing `Clear saved suggestions` remains an explicit secondary account action. It is outside the new profile-level lifecycle and must retain its current confirmation/safety treatment. No new clear behaviour is introduced.

## Category compatibility

Profile category changes remain review suggestions. They must:

- use an existing available category;
- never change transaction signed amount or type;
- never override transfer precedence;
- be ignored at suggestion time when incompatible with transaction direction;
- preserve user review before import commit.

Custom categories follow their stored type. No category is created automatically.

## Merchant merge and history boundary

No merchant merge is implemented in this milestone.

A future merge/all-history operation must first have:

- previewed target counts;
- explicit source and destination profiles;
- owner-scoped transaction selection;
- alias/rule conflict rules;
- direction-compatible category handling;
- per-record outcomes;
- exact-state undo;
- account export/deletion coverage;
- safe audit metadata.

The pending Phase 6 bulk-operation journal and isolated Preview migration gate are prerequisites. Raw narration and substring-only identity are prohibited.

## Privacy

Persist only the existing cleaned profile name, normalized safe key, category ID, active state and existing relation IDs. Do not add raw CSV, narration, filenames, account references, bank identifiers, amounts or balances.

No new audit metadata is required. Existing safe account export/deletion must continue covering MerchantProfile, MerchantAlias and MerchantRule.

## Ownership and concurrency

Every route requires authentication and owner-scoped entity lookup. Snapshot writes remain one short transaction and revalidate categories. Cross-user IDs return the same safe unavailable response.

An update request must contain at least one supported change. Unknown fields are rejected.

## User experience

- Keep merchant management inside Settings; no navigation item.
- Keep profiles collapsed behind the existing secondary management section.
- Use one profile editor at a time.
- Use `Edit merchant`, `Remove merchant` and `Restore merchant`.
- Do not expose normalized keys, rule enums, IDs or database terminology.
- Removed profiles remain visible only in a compact `Removed merchants` section.
- Important actions use text labels and accessible controls.

## Required tests

- change cleaned name only;
- change seeded and owned custom category;
- reject missing, archived or cross-user category;
- profile and exact rules stay category-consistent;
- remove profile suppresses rule and alias suggestions;
- restore profile returns prior active child behaviour;
- inactive child alias/rule remains inactive after profile restore;
- cancel causes no write;
- cross-user profile ID blocked;
- no existing transaction changed;
- transfer/sign/category compatibility remains enforced at suggestion application;
- no raw/private source data persisted;
- no schema, migration, package, provider, secret or environment change;
- Settings remains responsive and keyboard accessible.

## PR sequence

1. **7.5A — this contract**.
2. **7.5B — merchant profile edit/remove/restore**: shared helper, server route, Settings UI and focused tests.
3. **7.6A — Phase 7 QA/status package**: record evidence and remaining bank/schema blockers.

## Stop conditions

Stop before merchant merge, all-history mutation, automatic recategorisation, transaction relation rewrites, schema/migration work, browser-local automatic upload, new package/provider/secret/environment, Basiq, AI or Production data access.

## Exit

This profile milestone exits when future suggestion management is complete using existing models, while merge/history remains truthfully blocked by the reversible-operation and Preview environment gates.
