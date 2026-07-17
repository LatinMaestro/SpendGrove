# Phase 7 Import Coverage and Data Quality Contract

Status: active contract for Phase 7 Milestone 7.0  
Date: 17 July 2026  
Phase 5 status: technically complete, pending deferred client acceptance  
Phase 6 status: active and partially delivered; bulk actions remain blocked by the isolated Preview database gate

## Objective

Complete the accepted Australian CSV coverage and data-quality foundations using deterministic, privacy-first parsing. Unknown or unevidenced formats must remain reviewable through generic/manual mapping rather than being labelled as supported.

## Current repository truth

- Everyday CSV parsing is browser-local and implemented in `lib/csv-import.ts`.
- Confirmed named profile definitions currently exist for CommBank, ANZ, NAB and Westpac.
- Generic headered, debit/credit, signed-amount and headerless layouts fall back to manual confirmation.
- File limits are 5 MiB and 5,000 rows.
- Raw CSV files and original filenames are not retained.
- Private account, BSB, card, customer and loan identifier columns are excluded from mapping and preview.
- Saved mappings use the existing owner-scoped `BankImportProfile` contract.
- Review-before-commit, Import / Skip / Merge, signed direction and duplicate scoring are already implemented and are not changed by this contract.
- Loan CSV review supports generic component-column and row-event-ledger modes, not a complete named lender matrix.
- No parser-quality manifest currently distinguishes confirmed profiles from generic-only targets.

## Evidence hierarchy

A bank format may be marked confirmed only when all of the following exist:

1. a format source that is safe to use, such as official provider documentation plus a client-verified layout description, or a private sample inspected without committing its contents;
2. a newly written synthetic fixture containing no copied private values, names, identifiers, filenames or narration;
3. an exact profile definition covering headers, amount direction and date format;
4. positive and false-detection regression tests;
5. privacy-field exclusion tests;
6. generic/manual fallback remains available when detection confidence is insufficient;
7. the complete exact-head verification suite is green.

Brand relationship, logo similarity, corporate ownership or an assumed shared banking platform is not enough evidence. St George, BankSA and Bank of Melbourne, and Bendigo Bank and Adelaide Bank, must remain separate support entries until each observed layout is proven.

## Support states

- **Confirmed profile** — exact layout has synthetic regression evidence and may be named in the UI.
- **Confirmed family variants** — multiple evidenced layouts for one target, each versioned separately.
- **Generic-only** — the bank is a specification target, but users must confirm mapping.
- **Blocked by format evidence** — no safe source establishes the exact export layout.
- **Retired alias** — historical brand/export remains relevant only after evidence and a deliberate compatibility decision.

The UI and Help content must never say a generic-only target is fully supported.

## Parser and confidence rules

- Profile detection remains deterministic.
- Required headers must all be present before high-confidence automatic selection.
- Optional headers may raise confidence but cannot compensate for a missing direction/date/description requirement.
- A profile with ambiguous overlap must return to manual confirmation.
- Signed amount and confirmed debit/credit columns determine direction; category or merchant logic cannot reverse it.
- Date parsing remains Australian-first and must reject invalid calendar dates.
- Zero-value ordinary transactions remain invalid.
- Multiple non-empty direction columns in one row remain a review error.
- Unknown columns default to ignored unless safely mapped.
- Private columns are locked to private/excluded and cannot be remapped.
- No description keyword may identify a bank format by itself.

No existing confidence threshold, duplicate score or financial rule changes in Milestone 7.0.

## Fixture standard

Every committed bank fixture must:

- be entirely synthetic;
- use fictional dates and amounts;
- avoid real person names;
- avoid real BSB, account, card, customer and loan identifiers;
- use obvious synthetic placeholders only in dedicated privacy-exclusion tests;
- contain positive and negative direction cases where the format supports both;
- include quoted commas and blank optional values where relevant;
- cover date-format and sign conventions;
- include a companion test that proves the original filename is not exposed;
- avoid copying narration or row order from a private source.

Private samples, if used to learn structure, remain outside GitHub and must be reduced to a safe structural observation before a synthetic fixture is authored.

## Generic/manual fallback

Unknown, changed or low-confidence formats must:

- retain every data row, including the first row of headerless files;
- suggest safe roles only when confidence is adequate;
- require the user to confirm mapping;
- show plain-English issues;
- preserve private-column locks;
- never silently choose a named bank;
- remain bounded by current file and row limits.

A parser regression must not make an unknown file unimportable when manual mapping can safely handle it.

## Transfer boundary

Phase 7 parser work may preserve or improve direction-safe transfer review, but must not change transfer classification thresholds or create durable transfer pairs without a separate contract.

A durable one-to-one transfer link requires an additive owner-scoped schema proposal covering:

- both transaction references;
- uniqueness and direction;
- ambiguity and conflict handling;
- unlink/correction;
- split transactions;
- export/deletion;
- audit metadata;
- Preview migration and rollback/forward-fix.

Stop before schema implementation or migration unless that contract is approved within the merged roadmap and the Preview environment gate is resolved.

## Import undo boundary

Import undo is not simple deletion. A separate contract must define:

- eligible committed batches;
- records created by the batch;
- merged rows;
- subsequent edits, splits, links, reconciliations and Property records;
- idempotency;
- ownership revalidation;
- operation audit and recovery;
- account export/deletion;
- additive schema and migration.

Until then, import history remains read-only evidence and no undo action is shown.

## Merchant intelligence boundary

Local merchant intelligence remains ordered:

1. user-confirmed compatible rule;
2. confirmed alias/profile;
3. existing safe history;
4. conservative local keyword rule;
5. Needs review.

Merchant merge or apply-to-history must be explicit, previewed, owner-scoped and reversible where promised. Raw narration, private identifiers and external enrichment remain excluded. Basiq and AI are not part of Phase 7.

## Phase 7 PR sequence

1. **7.0A — contract and bank register**: this documentation gate.
2. **7.1A — parser profile registry and quality manifest**: move profile metadata into a testable internal registry; no new support claim.
3. **7.1B–7.1E — evidenced everyday-bank batches**: add only formats whose exact layout can be proven safely, with synthetic fixtures and full regressions.
4. **7.2A — loan/account format matrix**: document lender evidence and extend generic diagnostics without inventing lender profiles.
5. **7.3A — transfer-link contract and exact schema assessment**: stop before migration.
6. **7.4A — import-undo contract and exact schema assessment**: stop before migration.
7. **7.5A — merchant profile/merge completion contract**: reuse existing models first; gate any additive schema.
8. **7.6A — parser quality, Help matrix and QA package**: supported/generic-only status, safe contribution guidance and consolidated client checks.

Batches may be combined when coherent, but support evidence and exact-head verification remain per changed profile set.

## Schema and environment assessment

Milestones 7.0, 7.1 parser profiles/fixtures and generic diagnostic improvements require no Prisma schema change, migration, provider, package, secret or environment change.

Durable transfer links, import undo and richer merchant history may require additive schema. They remain contract gates. No Preview migration may run while the isolated Preview destination remains unresolved. No Production migration is authorised.

## Privacy and ownership

- Parser components receive transient source data only in the browser.
- Server commits receive reviewed structured values only.
- No raw CSV rows, filenames, bank identifiers or private narration enter logs or audit metadata.
- Saved profiles remain owned and validated server-side.
- Import history and committed records remain owner-scoped.
- Synthetic fixtures are public repository artefacts and therefore must contain no transformed client values that could be reidentified.

## Required tests

For every profile or parser change:

- exact supported profile detection;
- false-positive rejection against similar layouts;
- generic/manual fallback;
- signed and debit/credit direction;
- Australian date variants and invalid dates;
- quoted fields and inconsistent columns;
- private header and value exclusion;
- headerless first-row preservation;
- file and row limits;
- review-before-commit;
- Import / Skip / Merge non-regression;
- duplicate-score non-regression;
- signed type/category compatibility;
- no raw filename/source exposure;
- current mobile and desktop import UI non-regression.

## Stop conditions

Stop before:

- claiming support without safe format evidence;
- changing signed-money, transfer, refund, split or duplicate rules;
- changing Import / Skip / Merge semantics;
- storing raw CSV or private bank fields;
- schema or migration work not covered by an exact approved contract;
- any Preview migration while environment separation is unresolved;
- Production migration or private Production data access;
- new package, provider, secret or environment variable;
- Basiq, AI, payments, public launch or App Store action.

## Exit criteria

Phase 7 exits only when:

- every specification target is truthfully labelled confirmed or generic-only with a documented blocker;
- every confirmed profile has synthetic regression evidence;
- unknown formats retain safe mapping;
- supported loan formats have an equally explicit matrix;
- transfer linking, undo and merchant completion are either implemented through their gates or recorded as unresolved release blockers;
- Help content accurately describes support and safe contribution rules;
- full financial/privacy regression, desktop/mobile review and consolidated client testing evidence are complete.
