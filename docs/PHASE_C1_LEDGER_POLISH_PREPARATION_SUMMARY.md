# Phase C1 Transaction Ledger Polish Summary

Date: 26 July 2026  
Status: no-schema responsive ledger polish implemented and technically verified; authenticated browser review and ordered dependency merge remain outstanding  
Master-plan alignment: C1.4 and preparation for C1.5  
Stacked dependency: PR #250 → PR #249 → PR #247 → PR #246 → PR #244 → PR #243 → PR #242 → unresolved activation stack #231–#241

## Objective

Complete the approved no-schema interaction and accessibility improvements for the signed-in Transactions ledger without changing transaction queries, financial calculations, persistence or saved-view scope.

## Contract and implementation

The current-state audit and implementation contract remain recorded in:

- `PHASE_C1_LEDGER_INTERACTION_ACCESSIBILITY_AUDIT.md`;
- `PHASE_C1_LEDGER_POLISH_IMPLEMENTATION_CONTRACT.md`.

The focused implementation is in `components/durable-manual-transactions.tsx` with dedicated regression coverage in `tests/transaction-ledger-polish.test.ts`.

## User-facing changes

### Responsive criteria

- Direction and Category controls are now available below the desktop breakpoint through a native mobile/tablet disclosure.
- The existing always-visible desktop Direction and Category row remains available at `lg` and above.
- Both surfaces use the same state and existing filter semantics.
- A textual count communicates active non-search criteria without relying on colour.
- Mobile guidance states that filters apply only to the displayed month and are not saved.

### Search and result feedback

- Search now uses `type="search"`.
- Search references a stable result-summary element through `aria-describedby`.
- The result region exposes a stable polite live status, `aria-atomic` and loading state.
- Result summaries report the selected month, matching count and bounded active-criteria count.
- Singular and plural transaction and criterion wording is handled explicitly.

### Recovery and state ownership

- One `clearAllCriteria()` operation clears search, Direction, ledger Category and chart-selected Category, and closes the Category breakdown.
- It deliberately does not change the selected month.
- The no-match action is now labelled **Clear search and filters** and explains that criteria apply only to the selected month.
- Desktop and mobile `Clear filters` actions clear only non-search criteria.
- A stale transient ledger Category is reset only after a completed load when that Category is absent from the newly loaded month.
- Direction and Category changes close the Category breakdown before applying the direct ledger criterion.
- Month navigation continues to clear the chart-selected Category and close the breakdown while preserving search and ledger Direction when still meaningful.

## Preserved workflows

The implementation retains:

- authenticated owner-scoped selected-month reads;
- the existing search order after Category and Direction filters;
- mobile transaction cards and desktop semantic table;
- Category-spending chart and drilldown;
- transaction create, edit, duplicate and recoverable delete;
- direction-correction and possible-CSV-match warnings;
- Property links and privacy-safe Activity history;
- Preview bulk-operation integration from the activation stack;
- signed-out browser-local fallback.

No new primary navigation destination or horizontal ledger scrolling was added.

## Financial and privacy integrity

No transaction or reporting rule changed.

The implementation preserves:

- integer cents and Australian money/date presentation;
- signed direction and transfer precedence;
- split-parent exclusion and split-child inclusion;
- review-before-commit;
- existing duplicate thresholds;
- Property record-keeping meaning;
- Loan repayment no-double-count treatment;
- owner isolation;
- current export/deletion behaviour.

No search or filter criteria are persisted to local storage, session storage, URL state, account settings, saved views, audit events, analytics, logs or provider payloads.

## Schema, API and provider impact

No change to:

- server transaction queries or ordering;
- API routes or authorization;
- Prisma schema or migrations;
- database state or backfills;
- packages or lockfile;
- providers, secrets or environment variables;
- Vercel, Neon or Clerk configuration;
- Production;
- Apple, Expo, TestFlight or real users.

Durable cross-device saved views remain separately blocked by the explicit material schema and migration gate in PR #246.

## Automated verification

Exact implementation head: `1980c944b774e77d31fa95254f73008f8770a43b`  
Vercel deployment: `dpl_Cf8nKNsqrvpc1wEtLsxarLNV2cQd` — READY

Verified evidence:

- framework dependency verification passed;
- **147 test files / 910 tests** passed;
- the seven new C1.4 ledger-polish tests passed;
- existing transaction, import, chart, reporting, ownership, privacy and financial regression tests passed;
- optimized Next.js compilation passed;
- TypeScript and lint validity completed with only the pre-existing hook warnings in unrelated files;
- route generation, serverless output and deployment completed successfully.

The first exact-head attempt identified one stale source-string assertion in the existing monthly Category-spending UI test. The application and all new tests were already passing. The assertion was updated to the approved combined search-and-filter wording and structured month handler, after which the complete pipeline passed. No application behaviour was weakened to satisfy the test.

## Preview and accessibility review status

Automated and source-level evidence proves:

- mobile/desktop filter parity;
- no horizontal table replacement below `lg`;
- native disclosure semantics;
- visible focus classes on all new controls;
- text-labelled active criteria;
- polite result announcements;
- accurate empty and no-match recovery;
- preserved table captions, column headers and transaction button labels.

The protected Preview correctly remains non-indexed. The connected fetch tooling could confirm deployment protection and security headers but could not establish an authenticated synthetic Clerk session for full visual interaction review.

## Pull request state

PR #250 is open, mergeable and contains no unresolved review threads.

It remains intentionally stacked and must not merge ahead of PR #249 or the earlier dependency chain.

GitHub Application Verification did not create a run while the pull request targets a non-`main` stacked base. Exact-head GitHub Actions remains required after dependency merge and retargeting.

## Remaining blockers and dependencies

- authenticated synthetic Preview/browser review remains outstanding;
- PRs #231–#241 still require consolidated authenticated QA and executable exact-head GitHub Actions;
- PRs #242–#250 must be reviewed and merged in dependency order;
- saved-view schema remains unapproved;
- no Production migration or runtime activation is authorised.

## Next safe action

Prepare the C1.5 consolidated transaction financial and accessibility regression package, including explicit traceability for manual/imported transactions, direction correction, splits, transfers, bulk operations, Activity history, filters, chart drilldown and lifecycle controls.

Do not add durable saved views, new transaction criteria, Production access or schema work without the relevant explicit gate.
