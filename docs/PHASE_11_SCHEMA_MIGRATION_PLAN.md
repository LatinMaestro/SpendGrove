# Phase 11 Document Metadata Schema Migration Plan

Date: 17 July 2026  
Migration: `20260717140000_phase_11_document_metadata_foundation`  
Status: proposed additive repository foundation; unexecuted  
Runtime: hard-false before all database and provider access

## Requirement

The existing schema has no owner-scoped metadata or link model for receipts, statements and report evidence. File bytes must remain outside PostgreSQL. The controlling storage/privacy rules are in `docs/PHASE_11_DOCUMENT_STORAGE_PRIVACY_CONTRACT.md`.

## Exact proposed models

- `Document`: owner, safe display label, category, lifecycle status, content type, byte size, optional SHA-256 checksum, optional opaque provider/object key, optional document date/financial year and lifecycle timestamps.
- `DocumentLink`: document owner, document, approved target type, stable target key, optional opaque owner-scoped source ID and created/revoked lifecycle.

No file bytes, OCR text, raw filename, public URL or provider credential is stored.

## Proposed enums

- `DocumentStatus`: PENDING_UPLOAD, QUARANTINED, AVAILABLE, FAILED, DELETED.
- `DocumentCategory`: RECEIPT, INVOICE, LOAN_STATEMENT, PROPERTY_RECORD, REPORT_EVIDENCE, OTHER.
- `DocumentLinkTargetType`: TRANSACTION, PROPERTY, LOAN_ACCOUNT, LOAN_REPAYMENT, IMPORT_BATCH, REPORT, FINANCIAL_YEAR.

Audit additions are `DOCUMENT` and `DOCUMENT_LINK`.

## Uniqueness and indexes

- optional provider/object key pair is unique;
- owner/status/creation, owner/category/deletion and owner/financial-year indexes;
- one link row per document/target type/stable key, restored through lifecycle updates;
- owner/revocation/type and document/revocation indexes.

## Generic source links

Generic target IDs deliberately have no cross-model foreign key. Every service must resolve the source by both `userId` and target ID before linking or returning metadata. A link never implies related records or Phase 10 sharing.

## Foreign keys and deletion

- Document owner references User with account-deletion cascade.
- DocumentLink owner references User with account-deletion cascade.
- DocumentLink references Document with cascade.
- Provider-object deletion is a separate external operation and cannot be proven by a database cascade.
- Account deletion must later coordinate provider erasure before claiming completion.

## Privacy

No file bytes, OCR text, raw filename, email, finance amount, description, merchant history, bank identifier, exact address, provider token, callback payload, secret or connection string is added.

`displayName` is a user-controlled safe label, not a requirement to retain the original filename. Object keys are opaque and must contain no private identity or financial content.

## Financial integrity

Documents and links are evidence metadata only. They create no cashflow, do not change Transactions, splits, transfers, Loans, Properties, budgets, recurring items or reports, and do not imply deductibility or advice.

## Ordered migration gate

This migration is sixth and may run only after exact success and post-verification of:

1. `20260717090000_phase_6_bulk_operation_foundation`
2. `20260717100000_phase_7_transfer_link_foundation`
3. `20260717110000_phase_7_import_undo_foundation`
4. `20260717120000_phase_9_advanced_personal_finance_foundation`
5. `20260717130000_phase_10_household_accountant_foundation`
6. `20260717140000_phase_11_document_metadata_foundation`

The workflow remains on the first pending profile. No profile may advance early.

## Locking and migration treatment

The migration is additive: safe audit enum additions, three new enums, two empty tables, indexes and owner/document foreign keys. It performs no update, delete, copy, backfill or source-table alteration. Exact secret-safe pre/post evidence remains mandatory.

## Runtime activation conditions

No service, route, page, export or account-deletion path may query these tables until:

- all six ordered Preview migrations pass;
- Preview contains synthetic data only;
- full Preview owner/link/privacy regression passes;
- provider and malware-control decisions are approved;
- storage environments are isolated and mapped;
- the hard-false Phase 11 runtime gate changes only in a focused activation PR;
- Production migration receives separate approval before Production activation.

Schema activation alone does not authorise file upload or storage-provider access.

## Failure treatment

On any migration/check failure: stop; do not retry automatically, reset, resolve history, run manual SQL, use `migrate dev`, substitute Production or activate runtime. Diagnose from safe codes and propose a reviewed forward fix.

## Current confirmation

No Preview or Production migration, database/storage access, file upload, data rewrite/backfill, provider/package/secret/environment change, OCR/AI or public release action is authorised or performed by this plan.
