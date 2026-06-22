# Current Codex Handoff

Last updated: 22 June 2026

## Current state

- Phase 3A — Persistence & Commit Foundation is formally accepted and closed.
- Phase 3B Milestone 1 is approved under Autonomous Phase Delivery Mode.
- PR 3B.0 merged as [#49](https://github.com/LatinMaestro/SpendGrove/pull/49), merge commit `518851d15f07415067c8dfaaeb2d26f7c15cc9ae`.
- PR 3B.1 merged as [#50](https://github.com/LatinMaestro/SpendGrove/pull/50), merge commit `fa1a872c87d15a8c7853819485670e47b2da25ca`.
- PR 3B.1 main deployment: https://vercel.com/latinmaestros-projects/spendgrove/7ahCZopnMku2nWmF8DMbhJVq1syo
- Active state: implementing the approved minimal `CAR_LOAN` amendment before Preview migration.
- PR 3B.1 local verification: Prisma schema validation/generation passed; focused schema tests 1 file / 3 tests passed; full tests 56 files / 319 tests passed; TypeScript and production build passed.
- Migration status: the original schema and migration file are merged to `main`; no Preview or Production migration has run.
- Client approved the Preview-only plan and the exact `CAR_LOAN` amendment.
- Amendment scope: one enum value in Prisma and the still-unexecuted migration SQL only; no table, column, relationship, private field or data rewrite.
- Preview workflow may run once from `main` only after the amendment PR is green and merged.
- PRs 3B.2 and 3B.3 remain authorised only after the client approves the PR 3B.1 migration gate.
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

Verify and merge the exact `CAR_LOAN` amendment. Run the existing Preview-only workflow once from `main` with `RUN PREVIEW MIGRATION`, verify success and confirm Production remains untouched, then continue autonomously through Loans-first PR 3B.2 and PR 3B.3.

## Resume instruction

Resume from repository truth: read `AGENTS.md`, `docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md`, this file, `docs/PHASE_3B_PROPOSAL.md` and `docs/PHASE_3B_FINANCIAL_DATA_CONTRACT.md`; verify GitHub/Vercel; then continue only the approved Milestone 1 sequence and obey the migration gate.
