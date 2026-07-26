# Phase C3 Merchant Merge and History Preparation Summary

Date: 26 July 2026  
Status: contract and material schema assessment complete; implementation and migration not authorised  
Master-plan alignment: Phase C3 — Merchant and category completion  
Stacked dependency: Phase C1 transaction regression package → unresolved master-plan and activation stacks

## Objective

Prepare the exact product, financial, privacy, ownership, lifecycle and reversible-operation boundary for:

- merging one owned merchant identity into another;
- preserving aliases, deterministic rules and historical merchant relationships;
- exact-state partial undo;
- a separate explicit apply-category-to-history workflow.

This work advances independent repository preparation while authenticated Preview QA, ordered dependency merges and Production gates remain unresolved.

## Documents delivered

- `PHASE_C3_MERCHANT_MERGE_AND_HISTORY_CONTRACT.md`;
- `PHASE_C3_MERCHANT_MERGE_SCHEMA_ASSESSMENT.md`;
- this summary.

## Current-state findings

SpendGrove already supports:

- owner-scoped MerchantProfiles, MerchantAliases and MerchantRules;
- cleaned merchant identity and deterministic local rules;
- profile edit, remove and restore;
- alias/rule lifecycle management;
- durable Transaction merchant-profile relations;
- Category application to selected merchant Transactions through the guarded bulk-operation framework;
- safe Activity history, account export and deletion foundations.

The existing bulk-operation journal is suitable for Category and Property changes but not merchant identity merging. It contains no source/destination merchant profiles, no before/after Transaction merchant relationship, and no alias/rule/profile lifecycle snapshots.

The existing snapshot merchant service can reassign records, but it cannot provide bounded per-entity outcomes, optimistic concurrency or exact-state undo for a profile merge.

## Principal product decision

Merchant identity merge and historical Category application are separate user actions.

### Merchant identity merge

May change only:

- Transaction `merchantProfileId` relationships;
- alias merchant-profile relationships;
- rule merchant-profile relationships where conflict checks pass;
- creation of a safe source-name alias;
- source profile active state;
- dedicated merge operation/item history.

It must not change:

- amounts, direction, type, dates or source;
- Categories;
- split structure;
- Property or Loan relationships;
- transfer links;
- import relationships;
- recurring links;
- report, budget or tax meaning.

### Apply category to history

Remains a separate explicit preview-and-confirm action using the existing `APPLY_MERCHANT_CATEGORY` bulk operation, including:

- owner and merchant identity checks;
- active/non-deleted and non-split-parent eligibility;
- direction-compatible Category checks;
- 250-item cap;
- optimistic concurrency;
- 30-minute exact-state undo.

Neither operation automatically triggers or undoes the other.

## Merge preview and conflict posture

The contract requires a fresh server preview showing safe aggregate counts only:

- source and destination display names;
- Transaction counts by lifecycle state;
- aliases and rules affected;
- source-name alias outcome;
- conflict counts;
- clear statements that Categories and financial totals will not change;
- undo window.

Raw transaction narration, amounts, balances, dates, filenames, banking identifiers, normalized patterns and Property/Loan details are prohibited.

The first implementation fails closed on:

- alias/profile identity ambiguity;
- materially different duplicate rules;
- stale profile/alias/rule/Transaction versions;
- another running operation involving either profile;
- missing or cross-user entities.

It does not guess conflict resolution.

## Undo posture

The initial contract uses a 30-minute exact-state undo window.

Undo restores only unchanged applied items:

- Transaction merchant profile;
- alias merchant profile and lifecycle;
- rule merchant profile, Category, priority and lifecycle;
- source profile active/deleted state;
- operation-created source-name alias where unchanged.

Changed items remain untouched and are reported as undo-blocked. No force overwrite, manual SQL or silent retry is permitted.

## Schema conclusion

A material additive schema is required.

Rejected:

- AuditEvent as an undo journal;
- current BulkOperation tables unchanged;
- one unjournalled profile-wide `updateMany`;
- arbitrary JSON before/after snapshots;
- browser-local undo;
- overloading Category/Property journal fields.

Recommended:

- dedicated `MerchantMergeOperation`;
- typed `MerchantMergeTransactionItem`;
- typed `MerchantMergeAliasItem`;
- typed `MerchantMergeRuleItem`;
- dedicated status/reason enums;
- a safe aggregate AuditEntityType;
- explicit owner/index/export/deletion treatment;
- hard-false runtime before migration.

Typed item tables are preferred over one polymorphic nullable journal because they make versions, foreign keys, validation and undo state clearer and safer.

## Financial integrity

The contract preserves:

- integer cents;
- Australian date and financial-year rules;
- signed direction and transfer precedence;
- split-parent no-double-count treatment;
- review-before-commit;
- current duplicate thresholds;
- everyday Transaction as the sole cashflow record for Loan reconciliation;
- no automatic tax, deductibility or financial advice;
- no merchant rule that silently reverses transaction direction.

Merchant merge identity changes do not change report totals.

## Privacy and security

The preparation requires:

- authentication before persistence access;
- owner scope on every entity;
- bounded preview and operation sizes;
- optimistic versions for profiles and every child record;
- neutral cross-user errors;
- no raw narration, alias/rule patterns, financial values or private identifiers in audit/logs;
- no household or accountant merge authority in the initial release;
- safe account export and dependency-ordered deletion;
- no analytics/provider copy of operation history.

## Repository impact

Documentation only.

No change to:

- application or server source;
- Prisma schema;
- migration SQL;
- database state;
- packages or lockfile;
- workflows;
- providers, secrets or environments;
- Preview or Production database;
- Apple, Expo, TestFlight or real users.

No private data or real CSV was used.

## Future implementation sequence

1. Explicitly approve or amend the material schema assessment.
2. Commit exact Prisma models/enums, generated SQL, verifier profile and hard-false runtime gate.
3. Run repository checks with no database access.
4. Apply the additive migration to the retained isolated synthetic Preview database only after approval.
5. Verify database identity and exact expected objects.
6. Implement owner-scoped preview, confirmation, item journalling and undo.
7. Integrate safe export, deletion and Activity history.
8. Add responsive Settings workflow and accessibility evidence.
9. Integrate separate apply-to-history controls using existing bulk operations.
10. Complete authenticated synthetic Preview QA.
11. Prepare and obtain approval for a separate Production migration and activation.

## Required decisions at material schema gate

- dedicated operation and typed-item model structure;
- final enum/model names;
- profile relation deletion treatment;
- conservative maximum affected entity count;
- exact duplicate-rule behaviour;
- source-name alias requirement;
- same-profile operation locking approach;
- undo window;
- export fields and deletion order;
- migration identity and isolated Preview execution plan.

## Remaining blockers

- merchant merge schema is not approved;
- no migration exists or may be run;
- authenticated synthetic Preview QA remains unavailable through connected tooling;
- PRs #231–#241 remain blocked on their consolidated activation gates;
- stacked master-plan work cannot merge ahead of its dependencies;
- no Production migration or activation is authorised.

## Next safe action

Continue Phase C3 with an independently safe audit of merchant rule provenance, conflict/correction wording and Settings accessibility using the existing schema only.

Do not implement merchant merge models, migration or runtime until the explicit material schema gate is satisfied.
