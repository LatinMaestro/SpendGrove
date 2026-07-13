# Phase 4 Milestone 3 Client-Feedback Acceptance-Hardening Contract

Status: approved and implementation-gated

Last updated: 13 July 2026

## Objective

Address the client's focused usability feedback while keeping Phase 4 Milestones 1, 2 and 3 open pending final client retesting. The hardening makes long histories, import review, category choice, recurring detection, repayment matching and everyday comparisons simpler without adding a new feature phase.

## Impact assessment

Repository truth confirms this work can use existing fields and accepted services.

- No Prisma schema or migration is required.
- No Preview or Production migration is authorised.
- No data rewrite, backfill or hard deletion is required.
- No package, provider, secret or environment change is required.
- Existing budget calculations, recurrence intervals, duplicate scoring, Import/Skip/Merge semantics, Property-link cardinality and report/export rules remain unchanged.
- Existing soft-delete/archive states remain the persistence and recovery mechanism.
- Existing high-confidence repayment validation remains the only automatic reconciliation rule.

Stop before implementation if any statement above proves false.

## Transaction month rules

- Default to the current Australia/Brisbane calendar month.
- Navigate by one calendar month with accessible Previous month and Next month controls.
- The selected month is represented as YYYY-MM and translated to inclusive start/exclusive end UTC date-only boundaries.
- The server returns only active, owned, non-deleted transactions in that window.
- Search and type/category filters apply within the selected month.
- Future month navigation is available only when owned future-dated transactions exist.
- Empty months show a concise next action.
- No transaction value, type, category, split role or cashflow treatment changes.

## Import-review Property control

- Property linking remains optional and defaults off.
- The selector is hidden until Include in property records is checked.
- The transient Property choice may reference one active owned Property by safe nickname.
- Unchecking clears the transient choice.
- Skip and Merge clear or ignore the choice under the accepted contract.
- The durable link is still created only after a new imported transaction commits successfully.
- No automatic Property matching, exact address or cardinality change is allowed.

## Category picker

- Use one catalogue already loaded for the review flow.
- Open a searchable picker with local, case-insensitive matching over category and group labels.
- Show the current/relevant choice first, then the complete filtered catalogue.
- Keep seeded and custom categories and category IDs unchanged.
- Keep keyboard, touch and screen-reader operation.
- Search state belongs to the open picker and must not refetch the catalogue or rerender unrelated rows.
- Show No categories found when appropriate.

## Deterministic category suggestions

Priority is:

1. user-confirmed merchant/category rule;
2. user-confirmed alias or cleaned merchant choice;
3. existing safe grouped merchant history;
4. conservative local keyword/brand rule;
5. no category suggestion when evidence is insufficient.

Rules:

- Suggestions are transient and reviewable until import commit.
- User rules always override generic keywords.
- Matching is case/punctuation normalised and token/word-boundary aware.
- Clear takeaway terms such as pizza, sushi, Red Rooster, KFC, McDonald's, Hungry Jack's, Domino's, Uber Eats, DoorDash and Menulog map to the existing approved food/takeaway category.
- A transfer-style row may use a clear transient purpose such as pizza, rent, gift, day care or utilities.
- Ambiguous transfer text remains Transfer/Needs review.
- No raw description, keyword evidence, filename, row or identifier is persisted or logged.
- No Basiq or AI is used. Future Basiq remains optional fallback-only and is not implemented.

## Recurring merchant identity

- Recurrence still requires exact signed amount, active owned eligible transactions and the approved weekly 6-8 day, fortnightly 13-16 day or monthly 27-34 day windows.
- User-confirmed merchant profiles and aliases remain authoritative.
- A transient stable merchant key may conservatively remove clearly volatile trailing numeric/reference tokens and normalise punctuation/case.
- Stable grouping must not merge unrelated generic merchants.
- Ambiguous identity produces no suggestion.
- Confirmation remains required before a durable recurring item is created.
- Dismissal, archive/restore and suggestion confidence thresholds do not change.

## Repayment reconciliation in both import orders

- Existing everyday-first behaviour remains.
- After a successful everyday import commit, newly created transactions may trigger re-evaluation of current owned, active, unlinked loan repayment breakdowns.
- Automatic linking is allowed only when exactly one candidate passes the existing HIGH rule: exact eligible remaining amount, zero-to-one-day difference, compatible allocation, active owned records and no conflicting link.
- Zero, multiple, medium, manual or override candidates remain manual.
- Each link is revalidated in an isolated safe transaction after the import transaction is durable.
- A reconciliation race or changed candidate never turns a successful import batch into a failed batch.
- The everyday transaction remains the only cashflow record; repayment breakdowns remain analytical and links remain reversible.
- No PropertyTransactionLink is created by reconciliation.
- Audit uses safe method/reason codes only.

## Delete wording

- Normal UI says Delete or Remove for transactions, budgets and confirmed regular payments.
- Existing archive/soft-delete persistence remains unchanged.
- Deleted items and Restore remain secondary recovery controls.
- Suggestion decisions retain Dismiss and Show suggestion again.
- Confirmation explains removal from the active view.
- No hard deletion, retention change or audit weakening is allowed.

## Category month comparisons

- Use the existing current and previous Brisbane calendar-month windows.
- Use the exact existing active-owned everyday-expense eligibility formula.
- Include eligible split children; exclude split parents, income, transfers, deleted/inactive records and analytical loan repayments.
- Compare current and previous totals per category using absolute expense cents.
- Show only useful top current categories with amount and calm absolute-difference wording: less, more, about the same or new this month.
- Do not add percentage overload, net, Property, loan, tax, equity, valuation or net-worth calculations.

## Privacy, ownership and no-double-count

- Revalidate authenticated ownership and active/deleted state on every server read/write.
- Do not persist or log raw CSV files, rows, filenames, narration, private descriptions, account references, BSB/card/customer identifiers, balances, exact addresses, secrets or connection values.
- Everyday transactions remain the only cashflow records.
- Suggestions, recurring items, budgets, repayment breakdowns and links never add spending.
- Safe audit metadata contains state/reason/method codes only.

## Approved delivery sequence

1. PR 4.12 - this contract and impact assessment.
2. PR 4.13 - month-focused transactions, searchable category picker and Property disclosure.
3. PR 4.14 - local category suggestions and recurring merchant normalisation.
4. PR 4.15 - reverse-order high-confidence repayment reconciliation.
5. PR 4.16 - Delete wording and category comparisons.
6. PR 4.17 - full QA and consolidated deferred client package.

Coherent implementation PRs may be combined before one meaningful Vercel verification point, while preserving each rule and test boundary.

## Mandatory stops and exclusions

Stop before schema/migration, hard delete, data rewrite/backfill, changed recurrence thresholds, budget formulas, duplicate scoring, import semantics, Property cardinality, report/export formulas, raw private persistence, package/provider/secret/environment changes, navigation changes, Basiq, AI, payments, tax advice, Property/net-worth/valuation, notifications, household mode or document storage.

After QA, keep Phase 4 Milestones 1, 2 and 3 open. Do not begin another milestone or record client acceptance.
