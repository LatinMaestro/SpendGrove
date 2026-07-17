# Phase 10 Household and Accountant Schema Migration Plan

Date: 17 July 2026  
Migration: `20260717130000_phase_10_household_accountant_foundation`  
Status: proposed additive repository foundation; unexecuted  
Runtime: hard-false before all database access

## Requirement

The owner-only schema cannot represent explicit household membership, selected record sharing, or separate read-only accountant grants. The controlling privacy rules are in `docs/PHASE_10_PRIVACY_PERMISSIONS_CONTRACT.md`.

## Exact proposed models

- `Household`: safe name, creator, ACTIVE/ARCHIVED lifecycle.
- `HouseholdMembership`: household/user, ADMIN/MEMBER, ACTIVE/LEFT/REMOVED.
- `HouseholdInvitation`: household/inviter/optional accepted user, token hash, optional intended-identity hash, role, PENDING/ACCEPTED/REVOKED/EXPIRED, expiry/lifecycle timestamps.
- `HouseholdRecordShare`: household, record owner, approved entity type, opaque source ID, created/revoked lifecycle.
- `AccountantAccessGrant`: record owner, optional accepted accountant, token hash, optional intended-identity hash, PENDING/ACTIVE/REVOKED/EXPIRED, expiry/lifecycle timestamps.
- `AccountantAccessScope`: grant, owner, approved scope type, stable scope key and optional source ID, created/revoked lifecycle.

No model changes ownership of an existing source record.

## Proposed enums

- `HouseholdStatus`: ACTIVE, ARCHIVED.
- `HouseholdRole`: ADMIN, MEMBER.
- `HouseholdMembershipStatus`: ACTIVE, LEFT, REMOVED.
- `CollaborationInvitationStatus`: PENDING, ACCEPTED, REVOKED, EXPIRED.
- `HouseholdShareEntityType`: TRANSACTION, PROPERTY, LOAN_ACCOUNT, CATEGORY_BUDGET, RECURRING_ITEM, SAVINGS_GOAL, NET_WORTH_SNAPSHOT, REPORT.
- `AccountantGrantStatus`: PENDING, ACTIVE, REVOKED, EXPIRED.
- `AccountantScopeType`: REPORT, TRANSACTION, PROPERTY, LOAN_ACCOUNT, CATEGORY_BUDGET, RECURRING_ITEM, SAVINGS_GOAL, NET_WORTH_SNAPSHOT.

Phase 9 entity types remain unavailable at runtime until the fourth migration and Phase 9 activation complete.

## Uniqueness and indexes

- one membership row per household/user, restored through lifecycle updates rather than duplicate insertion;
- unique cryptographic invitation/grant token hashes;
- owner-scoped intended-identity and status/expiry indexes;
- one household share row per household/owner/entity type/source ID;
- one scope row per grant/type/stable scope key;
- owner, household, role/status, grant/status and expiry indexes;
- no globally enumerable user-facing invitation code.

## Foreign keys and deletion

- user/household/grant ownership relations use explicit foreign keys;
- deleting an account cascades its invitations, owned shares/grants/scopes and memberships only according to the accepted account-deletion transaction;
- deleting a household cascades memberships, invitations and shares;
- accepted-user/accountant references become null on identity deletion where retaining the revoked grant lifecycle is required;
- generic source IDs deliberately have no cross-model foreign key; every service must resolve by both owner ID and source ID before sharing or returning data;
- no source financial record is cascade-deleted by collaboration data.

Exact deletion order must preserve the last-administrator and account-deletion contract at service level.

## Privacy

Stored identity restrictions and tokens are cryptographic hashes only. No raw token, email, finance value, description, merchant history, filename, bank identifier, exact address, report content, provider payload, secret or connection string is stored.

Audit additions contain safe collaboration entity codes. Audit metadata may contain reason/role/scope codes, never token or identity hashes.

## Financial integrity

Collaboration records grant purpose-limited reads only. They create no cashflow, do not change transactions/categories/links/calculations, and grant no accountant mutation. Existing no-double-count, split, transfer, budget, recurring, Loan, Property and reporting rules remain unchanged.

## Ordered migration gate

This migration is fifth and may run only after exact success and post-verification of:

1. `20260717090000_phase_6_bulk_operation_foundation`
2. `20260717100000_phase_7_transfer_link_foundation`
3. `20260717110000_phase_7_import_undo_foundation`
4. `20260717120000_phase_9_advanced_personal_finance_foundation`
5. `20260717130000_phase_10_household_accountant_foundation`

The workflow remains on the first pending profile. No profile may advance early.

## Locking and migration treatment

The migration is additive: enum/table/index/foreign-key creation plus safe audit enum additions. It performs no update, delete, copy, backfill or source-table alteration. New tables are empty. Expected Preview execution is short, but exact pre/post evidence is mandatory.

## Runtime activation conditions

No service, route, page, export or account-deletion path may query these tables until:

- all five ordered Preview migrations pass;
- Preview contains synthetic data only;
- full Preview regression and two-/three-user isolation tests pass;
- the hard-false Phase 10 runtime gate is changed only in a focused activation PR;
- the target deployed environment has the required schema;
- Production migration receives separate approval before any Production activation.

Invitation delivery remains separately disabled even after schema activation unless an approved provider/secret or safe operator mechanism exists.

## Failure treatment

On any migration/check failure: stop; do not retry automatically, reset, resolve history, run manual SQL, use `migrate dev`, substitute Production or activate runtime. Diagnose from safe codes and propose a reviewed forward fix.

## Current confirmation

No Preview or Production migration, database access, source-row inspection, data rewrite/backfill, provider/package/secret/environment change, real invitation or public release action is authorised or performed by this plan.
