# Phase 2 QA Report — Import Refinement

Date: 2026-06-17
Status: QA report prepared for client review
Phase: Phase 2 — Import Refinement

## Executive summary

Phase 2 PRs A–E have been audited against the approved Phase 2 sequence and scope. The implemented work remains focused on privacy-first CSV import refinement: parser hardening, browser-local saved mappings, inline browser-local categories, local merchant aliases/rules and review-only duplicate/merge guidance.

The post-merge `main` Vercel deployment after PR #14 is green. No Phase 3 work has started.

Recommendation: Phase 2 appears ready for client closure review after this PR F documentation/stabilisation report is reviewed. No product-code stabilisation defect was identified during this pass.

## Deployment and check status

- Main merge checked: PR #14 merge commit `6c55fc7e0246f352d65c93ae32b7689ad19f9177`.
- Post-merge main Vercel status: green / success.
- Vercel deployment details: `https://vercel.com/latinmaestros-projects/spendgrove/4g1iyTkvkoZdkNp1XDbX2Yfznq4f`.
- Build command: `npm run build`.
- Build coverage from `package.json`: `npm run test && next build`.
- Type/lint coverage: Next.js production build performs build-time validation; a separate `npm run lint` script exists but was not run locally in this connector-only QA pass.
- Runtime database: no live database dependency is required for the Phase 2 browser-local import refinement flow.

## Phase 2 scope audit

| Approved work package | PR | QA result |
|---|---:|---|
| PR A — Parser regression hardening, safe profile contract and generic mapping improvements | #10 | Complete and merged |
| PR B — Browser-local saved import profiles | #11 | Complete and merged |
| PR C — Inline browser-local category creation | #12 | Complete and merged |
| PR D — Merchant aliases, stronger local rules and apply-to-same-merchant refinement | #13 | Complete and merged |
| PR E — Duplicate scoring and merge-target selection foundation | #14 | Complete and merged |
| PR F — Integration stabilisation, documentation and Phase 2 QA | current | Documentation/report pass only |

Scope remains within the approved Phase 2 import refinement objective. No database writes, schema migrations, transaction creation, import commit execution, production auth, Basiq, enhanced merchant lookup, AI, payments, loans, property/tax reports, recurring module, budgets or Phase 3+ modules were added.

## End-to-end CSV flow QA

Covered flow:

1. Upload CSV.
2. Match columns.
3. Apply or save browser-local mapping.
4. Review the three-row mapping preview.
5. Continue to transaction review.

Observed/confirmed behaviour:

- Upload screen uses simple privacy-first copy and does not display original filenames.
- Files are read in browser memory and are not uploaded.
- Headerless files keep the first transaction row and use generic column labels.
- Manual mapping uses plain-English labels including `Transaction amount`, `Money out / Debit` and `Money in / Credit`.
- Mapping must be valid and confirmed before continuing.
- Three-row preview uses cleaned mapped fields only.
- Review rows are transient and non-committing.
- Import / Skip / Merge are review intentions only.

## Saved import profiles QA

Verified from implementation, PR checks and synthetic tests:

- `Save this mapping` appears only after valid mapping confirmation.
- Saved profiles are browser-local prototype data only.
- Saved profile matching uses safe structural metadata.
- Matched profiles are previewed before review.
- Profile actions include use, rename, disable/enable, delete and reset.
- Stale, corrupted, unsupported or unavailable storage recovers safely.

Stored safe profile metadata is limited to profile name, optional generic bank/account type, header mode, column role/index mapping, private/ignored column indexes, date/amount format metadata, enabled state, version and safe timestamps.

Saved profiles do not store filenames, raw headers where unsafe, sample values, raw rows, balances, account identifiers, BSBs, card fragments, customer IDs, loan references, private descriptions or private identifiers.

## Inline custom category QA

Verified from implementation, PR checks and synthetic tests:

- Users can create a category inside import review without leaving the flow.
- New categories appear under normal groups: Everyday, Bills and household, Financial / transfers, Income / refunds, Work / tax or Review.
- No separate bottom-level `Custom category` section is used.
- Duplicate names are prevented across seeded and custom categories using normalised comparison.
- Seeded categories remain immutable.
- Custom categories support rename, archive and restore.
- Archived categories disappear from new selections but remain recognisable where already selected in the current transient review.
- Category names containing private banking identifiers are rejected.

Stored custom category metadata is limited to safe generated ID, category name, selected group, derived type, archive state, version and safe timestamps.

## Merchant alias/rule QA

Verified from implementation, PR checks and synthetic tests:

- First visible transaction names are short, useful merchant/counterparty names where deterministic extraction is possible.
- Fuller safe context appears under More options as `Description with private details removed`.
- Merchant rule and alias storage is browser-local prototype only.
- Saved rules and aliases store only safe cleaned merchant names, matching keys, category IDs, enabled/archive state, version and safe timestamps/IDs.
- Raw/full bank descriptions, filenames, dates, amounts, balances and private banking identifiers are rejected from merchant storage.
- Conflict handling requires explicit user choice.
- Apply to same merchant shows affected row counts, matches cleaned merchant identity, excludes skipped rows and preserves Import / Skip / Merge intentions.
- One-level undo is available for the latest apply-to-same-merchant action.

## Duplicate scoring and merge-target QA

Verified from implementation, PR checks and synthetic tests:

- Duplicate information is surfaced in review cards using plain-English labels.
- Approved scoring weights are implemented:
  - exact amount in cents: 35 points;
  - date proximity: up to 25 points;
  - merchant/counterparty similarity: up to 20 points;
  - safe description similarity: up to 10 points;
  - category/direction/source consistency: up to 10 points.
- Thresholds are implemented:
  - 85–100: Likely match;
  - 70–84: Possible match;
  - below 70: no prominent duplicate suggestion.
- Likely matches require exact amount, compatible money direction and same/very-close date.
- Same-import duplicates are shown only as `Possible duplicate in this import`.
- Same-import rows cannot be selected as merge targets.
- Existing browser-local manual transactions are the only selectable merge targets.
- Merge target selection requires confirmation and remains review-only.
- Same merchant/same amount transactions 25–35 days apart are treated as recurring-style spacing and are not flagged as duplicates.
- No recurring/subscription module was added.

## Browser-local storage privacy inspection

Phase 2 browser-local storage remains limited to approved prototype metadata:

| Storage area | Key | Safe contents |
|---|---|---|
| Saved import profiles | `spendgrove.phase2.import-profiles.v1` | safe mapping/profile metadata only |
| Custom categories | `spendgrove.phase2.custom-categories.v2` | safe category metadata only |
| Merchant aliases/rules | `spendgrove.phase2.merchant-rules.v2` | safe merchant names, keys and category IDs only |
| Import review history | `spendgrove.phase1.import-history.v1` | aggregate summary counts and timestamps only |
| Duplicate/merge selection | none | current-review memory only |

Confirmed exclusions:

- no raw CSV persistence;
- no raw row storage;
- no original filename storage/display;
- no raw bank description storage;
- no account numbers, BSBs, card fragments, customer IDs, loan references, balances or private identifiers;
- no server upload or third-party processing;
- no database writes.

## Synthetic CSV regression report

Committed CSV regression coverage uses fictional/synthetic fixtures only.

| Fixture or scenario | QA coverage |
|---|---|
| `commbank-everyday.csv` | known signed-amount profile and private-column exclusion |
| `westpac-split-amounts.csv` | debit/credit mapping and amount parsing |
| `generic-headered-signed.csv` | generic headered mapping with signed amount |
| `generic-headered-debit-credit.csv` | generic separate debit/credit mapping |
| `headerless-signed-amount.csv` | first row preserved as data and generic column labels |
| `unknown-manual-mapping.csv` | value-assisted mapping and manual review path |
| `inconsistent-columns.csv` | inconsistent-column warning |
| `unsupported-two-column.csv` | unsupported/incomplete warning path |
| private-column patterns | account/BSB/card/customer/loan-like columns excluded |
| mixed description/narration | cell-level cleaning rather than whole-column exclusion |
| saved profiles | safe serialization, match, rename, disable, delete, reset and corruption recovery |
| custom categories | create, group placement, duplicate prevention, archive/restore and privacy rejection |
| merchant rules | priority, aliases, conflict handling, safe display names, storage privacy and undo |
| duplicate scoring | likely/possible match, same-import warning-only, manual merge targets and recurring false-positive guard |

No private client CSVs, private-derived rows, private screenshots or real financial data are committed as fixtures or tests.

## Mobile UI review notes

- Upload, mapping and review remain separated into beginner-friendly steps.
- Primary controls use large touch targets.
- Mapping preview is compact and appears before full review.
- Review cards prioritise merchant, date, amount, category, tax flag and Import / Skip / Merge intention.
- Advanced actions remain behind More options where practical.
- Saved mappings, custom categories and merchant management remain secondary and labelled as browser-local.
- Duplicate/merge guidance appears as compact plain-English chips and detail rows, not raw scores.

## Desktop UI review notes

- Cards and setup panels have enough spacing for scanability.
- Saved mappings and management sections are grouped in calm secondary panels.
- Category groups support a longer catalogue without hiding important Phase 2 categories.
- Merchant/rule controls are visible when useful but do not dominate the transaction review flow.
- Duplicate details appear inside More options with clear warnings and non-committing copy.

## Known limitations

- Phase 2 persistence is browser-local only and does not sync across devices or accounts.
- Import actions still do not create transactions or commit import rows.
- Merge target selection is review-only and non-persistent.
- Saved mappings can be imperfect for structurally similar but unrelated files and must remain reviewable.
- Merchant matching is deterministic/local and may require user correction.
- No runtime database import persistence is approved yet.
- No production authentication is implemented.
- No loan/property/tax/recurring/budget/payment/AI/Basiq modules are implemented.

## Deferred items

- Runtime database persistence and account sync for imports, categories, rules and profiles.
- Import commit execution that creates/updates/merges transactions after explicit approval.
- Saved import profile cloud sync after production auth is approved.
- Full duplicate/merge persistence and audit trail.
- Expanded bank-profile library based on future synthetic/redacted formats.
- Phase 3 loan/property/tax work only after explicit approval.
- Phase 4 recurring/budget/insight work only after explicit approval.

## Defects found

No blocking Phase 2 product-code defects were identified during this QA pass.

Documentation gap found and addressed: this Phase 2 QA report did not previously exist and is added by PR F.

## Closure recommendation

Phase 2 is ready for client closure review after PR F is reviewed and merged, provided the client accepts the documented limitations and deferred items.

Do not close Phase 2 or begin Phase 3 until the client explicitly approves Phase 2 closure.
