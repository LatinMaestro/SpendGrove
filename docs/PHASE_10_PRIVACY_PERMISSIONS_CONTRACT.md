# Phase 10 Household and Accountant Privacy and Permissions Contract

Date: 17 July 2026  
Status: implementation contract  
Runtime target: fail closed until ordered Preview migrations and focused activation  
Client review: deferred until the consolidated pre-release review

## Objective

Add explicit, revocable household and accountant collaboration without changing ownership of existing records or exposing personal/browser-local data.

## Architecture decision

SpendGrove will use application-owned household, membership, invitation and access-grant records linked to existing Clerk-backed `User` identities.

Clerk remains the authentication provider. Clerk Organizations are not required for Phase 10. This avoids an unapproved provider-plan dependency and keeps record-level privacy rules inside SpendGrove's owner-scoped server boundary.

Invitation delivery is provider-independent. Repository state and secure acceptance may be prepared, but no email provider, real-user invitation or live delivery is activated without a later operator gate.

## Non-negotiable privacy model

1. Every existing record remains owned by its current `userId`.
2. Creating or joining a household shares nothing automatically.
3. Existing records are never converted into household-owned records.
4. Browser-local prototype data is never shared, uploaded, merged or exposed.
5. Sharing is an explicit owner action for a selected record or selected report.
6. A household administrator manages the household and membership, not another member's personal records.
7. Only the record owner may share, unshare, edit, delete or export their underlying record.
8. Revocation must take effect on the next authorised server read.
9. Every resource read revalidates authentication, membership/grant state, scope and owner.
10. Client-side visibility is never the security boundary.

## Roles

### Household administrator

May:

- rename or archive the household;
- create and revoke household invitations;
- remove members subject to last-administrator safeguards;
- promote or demote members subject to at least one administrator remaining;
- view records that their owners explicitly shared with the household.

May not:

- view unshared member records;
- edit or delete another member's records;
- share another member's records;
- access browser-local data;
- override a record owner's revocation.

### Household member

May:

- view records explicitly shared with their accepted active household;
- share or unshare their own eligible records;
- leave the household, subject to last-administrator safeguards.

May not manage other members or access unshared records.

### Accountant

Accountant access is separate from household membership.

Default permissions:

- read-only;
- selected reports or selected records only;
- time-bounded where an expiry is set;
- revocable immediately;
- no transaction create/edit/delete;
- no category, merchant, Property, Loan, budget, recurring, goal or valuation mutation;
- no unrelated account or household visibility;
- no browser-local data;
- no onward sharing.

An accountant role is an access relationship, not a statement that the person is a registered tax agent, accountant or adviser. User-facing wording must remain neutral.

## Invitation lifecycle

Household and accountant invitations use separate invitation types and states:

- PENDING;
- ACCEPTED;
- REVOKED;
- EXPIRED.

Rules:

- invitation tokens are random, single-use and stored only as a cryptographic hash;
- raw tokens appear only in the one-time acceptance link/state and never in logs or audit metadata;
- invitations have an expiry;
- acceptance requires an authenticated SpendGrove account;
- acceptance revalidates intended invitation identity where an email restriction is used;
- an accepted/revoked/expired token cannot be reused;
- invitation acceptance creates no shared scope automatically beyond the explicitly recorded invitation/grant;
- delivery status is separate from invitation validity;
- no real invitation is sent during repository preparation.

If email delivery is later approved, the provider receives only the minimum account-operation fields. No finance data is included.

## Proposed additive schema

The exact migration proposal must define:

### Household

- owner-independent household identity and safe display name;
- status and archive timestamps;
- creator user;
- created/updated timestamps.

### HouseholdMembership

- household;
- user;
- ADMIN or MEMBER;
- ACTIVE, LEFT or REMOVED lifecycle;
- joined/left/removed timestamps;
- unique active membership treatment.

### HouseholdInvitation

- household;
- inviter owner;
- optional intended-email hash or approved minimum identity restriction;
- token hash;
- role;
- status;
- expiry and accepted/revoked timestamps;
- accepted user when complete.

Do not store a raw invitation token.

### HouseholdRecordShare

- household;
- record owner;
- approved share entity type;
- opaque record ID;
- created/revoked timestamps;
- unique active owner/household/entity scope.

The service must validate the referenced record by both `ownerUserId` and record ID before creating or returning a share. Generic IDs are never trusted by themselves.

Initial eligible share types should be limited to established owner-scoped records and reports. New Phase 9 types remain unavailable until their migration and runtime activation complete.

### AccountantAccessGrant

- owner user;
- accepted accountant user when available;
- invitation token hash and optional intended-identity restriction;
- PENDING, ACTIVE, REVOKED or EXPIRED status;
- expiry, accepted and revoked timestamps;
- read-only invariant.

### AccountantAccessScope

- grant;
- owner user;
- approved report/record scope type;
- opaque scope ID where required;
- created/revoked timestamps;
- unique active grant/scope treatment.

## Record-scope rules

Initial household sharing may cover only explicitly contracted types such as:

- Transaction;
- Property;
- Loan Account;
- Category Budget;
- Recurring Item;
- Savings Goal;
- Net Worth Snapshot;
- a versioned report selection.

A scope is available only when its source model exists in the target environment.

Relationships do not imply sharing:

- sharing a Property does not automatically share all Transactions or Loans;
- sharing a Loan does not automatically share its Property;
- sharing a report shares only the report scope and permitted drilldowns defined by that grant;
- sharing a parent transaction does not bypass existing split ownership/no-double-count rules.

If a coherent report requires several records, the owner selects the report scope explicitly and the server derives only the records allowed by that report contract.

## Server authorisation algorithm

Every shared read must:

1. require an authenticated current user;
2. load an active membership or active unexpired accountant grant for that user;
3. load an active, unrevoked scope;
4. load the source record using both the recorded owner ID and source record ID;
5. apply the source model's existing active/deleted and privacy rules;
6. return a purpose-limited view, not an unrestricted Prisma record;
7. emit only safe access/audit reason codes where required.

Do not implement “member can read any record whose ID they know”.

All mutations continue through the source owner's existing owner-scoped service. Shared-read services never reuse mutation privileges.

## Revocation and concurrency

- revoked scope, membership or grant is denied immediately on the next request;
- stale acceptance, role and sharing mutations use version/status predicates;
- last-administrator removal or departure is blocked;
- duplicate active memberships, invitations, shares and scopes are prevented;
- partial invitation delivery failure does not activate access;
- revocation is safe even if delivery or client refresh fails;
- audit records contain IDs and reason codes, not emails, tokens or financial content.

## Account export and deletion

Account export must eventually include:

- households created by the user;
- memberships;
- invitations created/received in a safe form without token hashes;
- active and revoked shares owned by the user;
- accountant grants and scopes in a safe form.

Account deletion rules:

- never delete another user's underlying records;
- revoke grants and shares owned by the deleting user;
- end the deleting user's memberships;
- transfer household administration only through an explicit pre-deletion action, otherwise block deletion when the user is the last administrator;
- remove token hashes and pending invitations according to the account-deletion transaction;
- preserve only safe audit evidence under the existing accepted retention contract.

Deletion order and foreign-key treatment require exact migration review.

## Audit and privacy

Safe audit events may record:

- entity type;
- entity ID;
- action;
- reason code;
- role/scope enum;
- safe aggregate count where already approved.

Never record:

- raw invitation token;
- email address or hash;
- finance values;
- descriptions or merchant history;
- filenames;
- account/BSB/card/customer identifiers;
- Property address;
- report contents;
- provider payloads or secrets.

## UI principles after activation

- household and accountant controls remain secondary account-management workflows;
- personal/private is the default and is stated clearly;
- sharing requires an explicit selection and confirmation;
- show who can see the selected item in plain English;
- revoke is always reachable;
- no control is shown as available before schema/runtime activation;
- accountant wording says “read-only access to selected information”;
- no provider-delivery promise is shown while delivery is unavailable.

## Migration and runtime order

Phase 10 schema work is additive and must be the fifth migration after:

1. Phase 6 bulk operations;
2. Phase 7 transfer links;
3. Phase 7 import undo;
4. Phase 9 advanced personal finance.

The exact migration must be unexecuted until the deferred operator gate is completed. A hard-false Phase 10 runtime gate must prevent missing-table access. Production migration requires a separate proposal and approval.

## Tests required before activation

- signed-out denial;
- two-user and three-user isolation;
- no automatic sharing of pre-existing records;
- owner-only share/unshare;
- administrator/member boundaries;
- last-administrator safeguard;
- invitation token hashing, expiry, single use and revocation;
- household and accountant invitation separation;
- read-only accountant enforcement;
- selected-scope enforcement;
- direct-ID and cross-owner attack tests;
- immediate revocation;
- stale/concurrent mutation handling;
- account export/deletion treatment;
- browser-local non-sharing;
- safe audit metadata;
- no financial-calculation or source-record mutation;
- no missing-table query while disabled.

## Activation and external gates

Repository-side schema, services and disabled UI may proceed.

External/operator gates remain for:

- ordered Preview migration execution;
- Production migration;
- real invitation delivery;
- email provider/account/secret if delivery is selected;
- inviting real users;
- professional review of accountant-role wording where required.

## Mandatory stops

Stop before:

- automatic sharing or ownership conversion;
- changing source-record ownership;
- exposing browser-local data;
- granting accountant write access;
- enabling a provider or adding a secret;
- sending real invitations;
- Production migration;
- data backfill/rewrite;
- changing financial calculations;
- weakening owner checks;
- public launch or App Store action.

## Current confirmation

This contract authorises only the roadmap-defined repository preparation. It does not activate household/accountant access, send invitations, run migrations, change providers or invite real users.
