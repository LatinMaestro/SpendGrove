# Current Codex Handoff

Last updated: 23 June 2026

## Current state

- Phase 3A — Persistence & Commit Foundation is formally accepted and closed.
- Phase 3B Milestone 1 implementation is complete and stopped for client review.
- PR 3B.0 merged as [#49](https://github.com/LatinMaestro/SpendGrove/pull/49), merge commit `518851d15f07415067c8dfaaeb2d26f7c15cc9ae`.
- PR 3B.1 merged as [#50](https://github.com/LatinMaestro/SpendGrove/pull/50), merge commit `fa1a872c87d15a8c7853819485670e47b2da25ca`.
- PR 3B.1 main deployment: https://vercel.com/latinmaestros-projects/spendgrove/7ahCZopnMku2nWmF8DMbhJVq1syo
- PR #53 merged the approved minimal `CAR_LOAN` amendment as `3938a0c2ef872553fa18df1c9b41832f83516e44`.
- Preview migration workflow run [27958341458](https://github.com/LatinMaestro/SpendGrove/actions/runs/27958341458) completed successfully from `main`.
- PR 3B.2 merged as [#54](https://github.com/LatinMaestro/SpendGrove/pull/54), merge commit `52406a62318741b339a1ddc6371eb5c7f9fd17f1`.
- PR 3B.3 merged as [#55](https://github.com/LatinMaestro/SpendGrove/pull/55), merge commit `8eb07b0f6f24e577f14c90cf68968762ca0430d1`.
- Final Milestone 1 main deployment: https://vercel.com/latinmaestros-projects/spendgrove/6gadsxgV1Xh7Epj23aEb5FWAh7Bn
- Final verification: focused PR 3B.3 tests 3 files / 9 tests passed; full tests 60 files / 334 tests passed; TypeScript and production build passed.
- Mobile browser verification: `/loans/import` rendered without horizontal overflow or console errors at 390×844 and preserved all five primary navigation items.
- PR 3B.1 local verification: Prisma schema validation/generation passed; focused schema tests 1 file / 3 tests passed; full tests 56 files / 319 tests passed; TypeScript and production build passed.
- Migration status: Phase 3B foundation applied to Preview only. No Production migration has run.
- Client approved the Preview-only plan and the exact `CAR_LOAN` amendment.
- Amendment scope: one enum value in Prisma and the still-unexecuted migration SQL only; no table, column, relationship, private field or data rewrite.
- Preview workflow confirmation, Preview secret presence, Prisma generation/validation, migration deployment and completion steps all passed.
- Client review package: `docs/PHASE_3B_MILESTONE_1_SUMMARY.md`.
- PR 3B.4, Milestone 2, Phase 4, Home dashboard statistics and later modules are not authorised.

## Final Phase 3A evidence

- Final functional PR: [#46](https://github.com/LatinMaestro/SpendGrove/pull/46)
- Functional merge commit: `c4af1e4aa906b35f3d3803d0e7ff18e3237d7563`
- Final functional main deployment: https://vercel.com/latinmaestros-projects/spendgrove/AzCUGVjQY4N3K4nxxtsrJTfQMbgF
- Latest verified main documentation deployment before formal closure: https://vercel.com/latinmaestros-projects/spendgrove/rnbphLdHCi6sNukAPoM3irKz9PYf
- Production alias: https://spendgrove.vercel.app
- Production `/import` route: HTTP 200 after the final functional merge.
- Full tests: 55 files / 316 tests passed.
- TypeScript type-check: passed.
- Next.js production build: passed.
- Vercel preview and merged-main deployments: Ready / green.
- Client signed-in retesting: completed and accepted on 22 June 2026.

## Accepted Phase 3A behaviour

- Successful authenticated imports navigate to Transactions and show the imported count.
- Signed-in duplicate analysis finishes before review rows appear.
- Existing imported and manual transactions participate in duplicate detection.
- Likely existing duplicates default to Skip; partially overlapping files warn while new rows remain importable.
- Existing imported transactions remain warning-only and cannot become Merge targets.
- Existing manual transactions remain valid Merge targets.
- MetLifeInsurance narration containing changing `MetLifePN_...` references groups under the stable `metlifeinsurance` merchant.
- Generic transfer/payment descriptions remain protected from unsafe bulk grouping.
- Imported transactions remain visible, editable and soft-deletable.
- Atomic, batched and idempotent account import commit remains in place.

## Privacy, migration and scope status

- CSV parsing, private-field scanning, mapping and source-detail review remain browser-local.
- Raw CSV files, raw rows, original filenames, raw bank narration, balances, account identifiers, BSBs, card fragments, customer IDs, loan references, secrets and connection strings are not durably persisted.
- Duplicate comparison uses only user-owned cleaned transaction fields.
- Durable duplicate outcomes contain safe action/status/warning metadata only.
- No Preview migration was required or run for the final Phase 3A acceptance-hardening PRs.
- No Production migration has been run.
- No Phase 4 or later module has started.
- Home dashboard expense/income statistics were not implemented.

## Accepted known limitations

- Automated signed-in end-to-end browser testing was unavailable because it requires the client’s protected authenticated session; the client completed that retesting manually.
- Signed-out review remains browser-local and cannot compare against saved account transactions.
- Standalone `next lint` remains unconfigured for non-interactive use and opens Next.js’s first-time setup prompt; the production build’s lint/type validation passed.
- Phase 3A does not include loans, properties, tax reports, recurring detection, budgets, dashboard insights, Basiq, AI, payments or later modules.

## Exact next action

Client retesting of Phase 3B Milestone 1 on the final main deployment. Do not begin PR 3B.4 or Milestone 2 until the client approves the next milestone.

## Resume instruction

Resume from repository truth: read `AGENTS.md`, `docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md`, this file, `docs/PHASE_3B_MILESTONE_1_SUMMARY.md`, `docs/PHASE_3B_PROPOSAL.md` and `docs/PHASE_3B_FINANCIAL_DATA_CONTRACT.md`. Milestone 1 is stopped for client review; do not implement Milestone 2 without explicit approval.
