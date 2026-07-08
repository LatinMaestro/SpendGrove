# Current Codex Handoff

Last updated: 8 July 2026

## Current phase and status

- Phase 3A is formally accepted and closed.
- Phase 3B Milestones 1, 2 and 3 are formally accepted and closed.
- Phase 3C Milestone 1 - Property-Linked Record-Keeping Foundations is formally accepted and closed.
- Phase 3C Milestone 2 - Property/EOFY Reporting Contract and Foundations is formally accepted and closed by the client on 7 July 2026 after Vercel retesting completed with no further acceptance comments.
- Phase 3C Milestone 3 - Import-review Property Linking and Property-Record Workflow Polish was approved by the client on 8 July 2026 under Autonomous Phase Delivery Mode.
- Active approved sequence: PR 3C.10 import-review Property-linking contract; PR 3C.11 schema and migration assessment; PR 3C.12 import-review Property link UI; PR 3C.13 commit integration and safety checks; PR 3C.14 manual transaction and workflow polish; PR 3C.15 QA and client review package.
- PR 3C.10 merged in [#99](https://github.com/LatinMaestro/SpendGrove/pull/99) as `96262b347c5ae0d99366bd4d0ab73e2e54f45ef7`.
- PR 3C.11 merged in [#100](https://github.com/LatinMaestro/SpendGrove/pull/100) as `b47adba443d6cd475e2011b234bb15c9d951476a`.
- PR 3C.12 merged in [#101](https://github.com/LatinMaestro/SpendGrove/pull/101) as `38572d6b8620ec7a82bc982092353b97d970a58a`.
- PR 3C.13 merged in [#102](https://github.com/LatinMaestro/SpendGrove/pull/102) as `be1234c37c6213e12abf1b8fb526828aa1728aa1`.
- PR 3C.14 is in progress: manual transaction and workflow polish for optional Property record links from manual create/edit.

## Latest accepted delivery

Phase 3C Milestone 2 is accepted as a simple current-state Property record/export foundation.

Accepted behaviour:

- current eligible manually Property-linked transactions appear automatically;
- current eligible loan-reconciliation-derived transactions appear automatically when every path resolves clearly to the selected Property;
- split parents are excluded;
- eligible split children are included;
- deleted/inactive records are excluded;
- ambiguous cross-Property loan paths are excluded;
- the everyday transaction remains the only cashflow record;
- loan repayment breakdowns remain analytical/reconciliation records only;
- no report-only classification is required for summary or export.

Accepted export columns:

1. `record_id`
2. `financial_year`
3. `property_nickname`
4. `transaction_date`
5. `transaction_type`
6. `amount_aud`
7. `category_label`
8. `connection_source`
9. `spendgrove_notice`

The export excludes `record_classification`, merchant descriptions, narration, filenames, raw rows, account references, identifiers, exact addresses, balances, emails, audit data, hidden columns and totals.

This milestone is not tax advice, an ATO-ready report, accountant-certified output, a deductible/claimable calculator, a tax lodgement workflow, a Property profit/loss report, a Home dashboard statistic, or a net-worth/valuation feature.

## Phase 3C Milestone 2 delivery evidence

| Work | PR | Merge commit |
|---|---|---|
| 3C.5 reporting and financial-rules contract | [#87](https://github.com/LatinMaestro/SpendGrove/pull/87) | `8410f785f53a32f673319143883bcb1468d0e7b5` |
| 3C.6 schema foundation and Preview migration plan | [#88](https://github.com/LatinMaestro/SpendGrove/pull/88) | `7e7e918872bcfece6acb566beee86a55d4d89e3d` |
| Preview workflow integrity hardening | [#90](https://github.com/LatinMaestro/SpendGrove/pull/90) | `ceefe0a5df3e1fb59d42cda0339d59f0ff72b2d3` |
| Preview verification correction | [#91](https://github.com/LatinMaestro/SpendGrove/pull/91) | `563498c1095baffedbcc3d12d0645c81dceb496a` |
| Permanent Preview verification handoff | [#92](https://github.com/LatinMaestro/SpendGrove/pull/92) | `46eb30f795e1334a73a21d92eed1cc1b2ccb239d` |
| 3C.7 Property record review foundation | [#93](https://github.com/LatinMaestro/SpendGrove/pull/93) | `4432d2ac615127ac853edcdf0445a4dd5d149002` |
| 3C.8 approved summary/export foundation | [#94](https://github.com/LatinMaestro/SpendGrove/pull/94) | `9fd5dfab86d462666d490adc9c69d807950e77c1` |
| 3C.9 QA and client review package | [#95](https://github.com/LatinMaestro/SpendGrove/pull/95) | `86d039f69f6dc70a30fd13f4e4430edb93acbcfb` |
| Classification-suggestion hardening, superseded in normal workflow | [#96](https://github.com/LatinMaestro/SpendGrove/pull/96) | `6e70c8906cdd7f38e751ff2f0b257ab03b20136c` |
| Final linked-record reporting simplification | [#97](https://github.com/LatinMaestro/SpendGrove/pull/97) | `3fa62d4f2ee387754198a317ca112314aad4725f` |

Final accepted deployment evidence:

- PR #97 merge commit: `3fa62d4f2ee387754198a317ca112314aad4725f`.
- Final main Vercel deployment: https://vercel.com/latinmaestros-projects/spendgrove/BXE1ynjLmCEuxDXL8NhZc79bSsBr
- Live alias: https://spendgrove.vercel.app
- Live route checks passed for `/`, `/loans` and `/transactions`: HTTP 200, no internal server error.

Final accepted testing evidence:

- 76 test files / 458 tests passed.
- TypeScript type-check passed.
- Clean production build passed.
- Client retesting confirmed Property reporting/export worked.
- Client retesting confirmed another bank CSV mapped, reached review and imported successfully.
- Client accepted PR #97 simplified linked-record reporting/export after Vercel review.

## Schema and migration status

- Phase 3C Milestone 2 Preview deploy run `28639135158` applied the approved migration once.
- Verification-only run `28657045177` confirmed the exact enum/table/index/foreign-key schema, an empty `PropertyReportReview` table at verification time and unchanged existing aggregate counts.
- No new Preview migration ran during PR #97.
- No Production migration has run.
- The Preview-only `PropertyReportReview` table remains dormant and untouched. It is not dropped, backfilled, rewritten or required by the normal workflow.

## Active Phase 3C Milestone 3 objective

Make the accepted Property reporting workflow easier by letting users link transactions to Properties earlier, especially during everyday CSV import review, while preserving user control, privacy-first CSV handling and the no-tax-advice boundary.

Target workflow:

1. Upload bank CSV.
2. Review transactions.
3. Categorise transactions.
4. Link relevant transactions to a Property during review where appropriate.
5. Commit reviewed rows.
6. Property records/reports automatically include linked records later.
7. Loan CSV repayments continue to reconcile to everyday transactions and appear in Property records where the Loan Account belongs to that Property.

Current PR:

- PR 3C.14 adds the same neutral `Include in property records` control to manual transaction create/edit, where it fits the accepted contract without schema changes.
- Manual transaction save still creates/updates the everyday transaction first, then uses the existing authenticated Property-link endpoint to link, unlink or relink one active owned Property.
- If the transaction saves but the optional Property-link update cannot be completed safely, the app shows a safe aggregate warning and leaves the existing transaction available for later manual linking from transaction details.
- Property links are not created from raw CSV rows, filenames, narration, account identifiers, exact addresses, balances or private source fields.
- Assessment conclusion from PR 3C.11 remains active: existing `PropertyTransactionLink` can support import-review Property linking after transaction commit without a Prisma schema change, migration, durable staging table or data rewrite.
- No Preview migration or Production migration is required or authorised.

## Future direction notes preserved from Milestone 2

Future import-review workflow direction now active for Phase 3C Milestone 3, subject to the contract and stop conditions:

- during everyday CSV import review, the user could link a transaction to a Property before commit;
- a neutral user-controlled flag may be considered later, such as `Include in property records`, `Potential property tax record` or `For accountant review`;
- avoid the phrase `tax deductible` until a separate tax/EOFY contract is explicitly approved;
- linked transactions should automatically appear in Property records/reports without another classification step;
- loan CSV repayments should continue to reconcile to everyday transactions and then appear in linked Property records automatically where the Loan Account belongs to that Property.

Future navigation idea:

- keep Property reporting inside **Loans** for now;
- later, prefer a dedicated **Reports** area before a standalone **Properties** tab;
- a future Reports area could contain Property/EOFY exports and future everyday reports;
- reconsider a standalone Properties tab only if Property management becomes a major app pillar;
- do not add a new tab until a separately approved navigation/design milestone.

## Exact next action

Complete, publish and merge PR 3C.14 as manual transaction Property-link polish, then continue to PR 3C.15 QA and client review package unless a stop condition is triggered.

## Explicit exclusions

Do not begin a Production migration, new Preview migration, schema change, table drop, data backfill, data rewrite, durable staging state, tax advice, automatic deductibility, deductible percentage, ATO integration, pre-filled tax return, tax lodgement workflow, Property profit/yield/equity/valuation/net-worth feature, Home dashboard statistic, automatic Property matching, transaction allocation/splitting, documents/receipts/storage, Basiq, AI, payments, household mode, Phase 4 implementation, recurring/budget/insight implementation, new navigation tab or later module without explicit client approval.

## Resume instruction

Resume from repository truth: read `AGENTS.md`, `docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md`, this file, `docs/PHASE_3C_MILESTONE_3_IMPORT_PROPERTY_LINKING_CONTRACT.md`, `docs/BUILD_PLAN.md` and `docs/DECISION_LOG.md`. Continue the approved Phase 3C Milestone 3 sequence only. Stop if schema, migration, durable staging state, Production migration, private source fields, automatic Property matching, tax wording, navigation changes, Home dashboard statistics, Phase 4 or later modules enter scope.
