# Phase 7 Import Coverage, Merchant Intelligence and Data Quality — Delivery Summary

Date: 17 July 2026  
Status: partially delivered and technically verified; consolidated client review deferred

## Objective

Improve import truthfulness, supported-format guidance and safe merchant management without overstating bank support, changing accepted financial rules or bypassing the isolated Preview migration gate.

## Delivered PR chain

| PR | Scope | Merge |
|---|---|---|
| #177 | Phase 7 import/data-quality contract and bank-format register | `ac991f099ca3492d492f9c5b1eaf777bbc0ab9ab` |
| #178 | Typed everyday-bank registry and parser quality boundaries | `52006395aeebdae9078e02e3ce929f016a7a838f` |
| #179 | Truthful supported-bank Help guidance | `1d1ba3bc8d2ffbae6bfd637cb0e99916ff820e90` |
| #180 | Loan CSV format matrix | `875610adbcdd59724d4c8f8e5cd1ce21900c48d9` |
| #181 | Typed loan structural-mode registry and Help guidance | `e703f180de624c1b524913fead7f14be3587668d` |
| #182 | Transfer-link and import-undo schema contracts | `e4f5e2842a72f860d4f73139857e84e276efa02c` |
| #183 | Merchant-profile completion contract | `c98904d72060f1a30c9fe6dc3f04dc2b47b3a6da` |
| #184 | Safe merchant-profile edit and reversible remove/restore | `4798a09059931e703195677b265958bc245f8b6a` |

## Delivered behaviour

### Everyday imports

- The registry distinguishes verified named profiles from generic/manual mapping.
- CommBank, ANZ, NAB and Westpac retain named, fixture-backed profiles.
- The remaining 15 master-spec banks remain generic/manual-mapping only; SpendGrove does not claim exact layouts without safe evidence.
- Help copy explains privacy-safe preparation and never asks users to send real CSV files.

### Loan imports

- Loan CSV support is described as two structural modes: repayment component columns and row-event ledgers.
- No lender-branded profile is claimed.
- Existing component tolerance, duplicate handling, reconciliation and no-double-count rules are unchanged.

### Merchant profiles

- Users can edit an owned profile's safe cleaned merchant name and future suggestion category.
- Removing a profile sets the existing inactive state; it suppresses future suggestions without deleting transactions, aliases or rules.
- Removed profiles are secondary and can be restored.
- Alias and rule active states survive profile remove/restore.
- Category availability and ownership are revalidated on the server.
- No merchant edit recategorises historical transactions.

## Contracted but blocked implementation

### Durable transfer links

The exact contract proposes an owner-scoped, user-confirmed link only when signed amounts are exact opposites, both records are confirmed transfers, the Australian calendar dates are within two days, neither record is a split, and the candidate is unique. No automatic durable link is approved.

### Import undo

The exact contract covers future imports only, using a per-row operation journal. Skip and Merge remain no-change. Later edits, links or reconciliation block affected undo rows. Existing imports receive no backfill.

Both features require additive schema and ordered Preview migrations. Implementation is blocked until:

1. an isolated Neon Preview branch/database exists;
2. GitHub Preview-only secrets are proven to point to it;
3. the earlier Phase 6 bulk-operation migration is safely applied and verified in Preview.

Preview run `29555735427` stopped at `DATABASE_CHECK_FAILED` before migration deployment. It was not retried. No migration ran.

## Verification

Latest exact-head application verification for PR #184:

- commit `f11c2bc4638ad56a1b592342fa99a1f4e81b513e`;
- GitHub Actions run `29560669053`;
- 119 test files / 722 tests passed;
- TypeScript passed;
- Next.js lint passed with only the already documented warnings;
- optimized production build passed.

The first automatic Vercel Preview for the pre-correction head failed at the same TypeScript compatibility issue found by GitHub. The focused correction passed exact-head GitHub verification. No second automatic Preview appeared after one observation window, and no redundant deployment was forced.

## Preserved boundaries

- no new Prisma schema or migration file in the delivered no-schema implementation;
- no Preview or Production migration;
- no data rewrite, backfill or manual SQL;
- no Production database content access;
- no package, lockfile, provider, secret or environment change;
- no duplicate-scoring, transfer, split, import, Property, Loan, report/export or financial-calculation change;
- no raw CSV row, filename, narration, account reference or private identifier stored or exposed;
- no Basiq, AI, payment, notification, household, document or native work.

## Remaining Phase 7 gaps

- exact verified layouts and synthetic fixtures for 15 target banks;
- named lender profiles and additional lender fixtures;
- isolated Preview environment and safe Preview migration execution;
- durable transfer-link implementation;
- future-import undo implementation;
- reversible bulk-operation journal;
- merchant merge and all-history correction workflow;
- privacy-safe parser-quality/support contribution process.

These items remain active roadmap work, not completed claims. Phase 7 is not formally accepted or closed.

## Deferred client review

The consolidated checklist remains in `docs/DEFERRED_CLIENT_RETESTING.md`. Client review is deferred until the complete pre-release product is ready.
