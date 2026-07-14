# Phase 4 Milestone 4 Transaction Sign/Type Integrity Audit

Status: documentation-only audit complete; implementation blocked at a mandatory financial-rule stop gate.

Date: 14 July 2026

## Objective

Audit every current transaction write path before enforcing the approved high-level principle:

> Signed amount and confirmed transfer treatment determine whether money is coming in, going out or transferring. Category selection may describe the transaction but must not reverse its financial direction.

This audit does not authorise code changes, schema changes, migrations, data rewrites, backfills, manual SQL or Production database access.

## Baseline and confirmed defect

The Phase 4 chart-correctness work confirmed that reviewed CSV import currently preserves the parsed signed amount but derives the durable transaction type from the selected category. A positive amount can therefore be stored as `EXPENSE` when an expense-typed fallback or category is selected.

The downstream sign-safe expense eligibility guard correctly excludes that anomaly from the chart, Home spending, category comparisons and budget progress. It does not repair the write path or alter the existing durable record.

## Current write-path audit

| Write path | Signed amount source | Durable type source | Transfer handling | Category effect | Finding |
|---|---|---|---|---|---|
| CSV review | Parsed signed integer cents from the mapped row | No independent durable type is carried by the review row | Transfer-style text may produce a reviewable transfer category suggestion; description is not itself durable authority | The reviewed `categoryId` can be changed without a sign/type compatibility check | Unsafe precursor: direction is not represented independently from category |
| CSV Import commit | Reviewed row `amountCents`, unchanged | `transactionType(category.type)` | A transfer category produces `TRANSFER` | Category directly determines type | Confirmed defect: category can reverse the financial direction implied by the sign |
| CSV Skip | No Transaction is created | None | None | No durable effect | Safe; semantics must remain unchanged |
| CSV Merge | No new Transaction is created; the existing manual transaction is not rewritten | Existing target type is preserved | Existing target treatment is preserved | Reviewed category/amount are stored only on the ImportRow metadata | No current target-direction rewrite; any future merge-field update must revalidate the existing target |
| Merchant/category suggestions | Current transient cleaned merchant/description context | Suggestion supplies a category only | Conservative transfer suggestion may supply transfer category | Learned and keyword rules are not filtered by signed direction | An incompatible high-priority rule can feed the unsafe Import commit path |
| Merchant learning | User-owned safe merchant/profile/rule data persists a category | No transaction type is persisted in the rule itself | Depends on category type at use time | Category has no amount-direction context | Rule priority can remain, but application must reject incompatible direction |
| Manual create | User chooses Money in/out/transfer; amount input is parsed to integer cents | User-selected type, with category type required to match | Transfer preserves the entered signed value | Server validates category type equals selected transaction type | Income/expense create is sign-safe; transfer-sign convention is not fully specified |
| Manual edit, including an imported record | Existing draft is resubmitted through the same validator | User-selected type, with category type required to match | Transfer preserves the entered signed value | Server validates category/type compatibility | Existing positive-`EXPENSE` anomaly can be corrected through Edit; no backfill is required |
| Transaction validation schemas | Caller supplies amount and type | Caller supplies type | No precedence rule is enforced | Category compatibility is not enforced in the generic schema | Generic create/update schemas reject zero but do not enforce sign/type |
| Split validation | Parent and child integer cents are supplied | No direction rule is checked | No split-specific transfer rule | Categories/types are outside `validateSplitTotal` | Only exact child-total reconciliation is enforced; mixed-sign/direction children are not defined |
| Property linking | Does not write amount, type or category | Unchanged | Unchanged | Unchanged | Safe and out of the direction write path |
| Loan reconciliation | Creates/updates reconciliation relationships, not the everyday cashflow direction | Unchanged | Unchanged | Unchanged | Safe; everyday Transaction remains the only cashflow record |
| Fixtures/seeds representing product behaviour | Synthetic values set by tests/seed helpers | Explicit test/seed type | Case-dependent | Explicit | Must adopt the invariant when they exercise production write behaviour; no fixture should redefine the contract |

## Established rules found in repository truth

The following rules are clear enough to preserve:

- money is stored as integer cents;
- zero-value ordinary transactions are rejected by the generic transaction schema, the manual draft validator and import-review readiness;
- manual `EXPENSE` normalises to a negative amount;
- manual `INCOME` normalises to a positive amount;
- manual categories must match the selected manual transaction type;
- transfers are excluded from expense spending and budget progress;
- split parents are excluded where eligible children are counted;
- split child amounts must sum exactly to the parent amount;
- Merge does not create a second cashflow transaction;
- Property linking and loan reconciliation do not change transaction direction;
- existing inconsistent records must not be rewritten automatically.

## Mandatory ambiguities

Repository truth does not fully define all edge cases named in the approval request. Implementation must therefore stop.

### Positive refunds

The category catalogue treats `Refunds / rebates` as `INCOME`, and the budget contract says income-style refunds are not netted against expense progress. This supports storing an ordinary positive refund as money in. However, no permanent write invariant explicitly states whether every positive refund must be `INCOME`, or whether another reviewed treatment is permitted.

Proposed rule: a positive non-transfer refund is `INCOME`; its category describes the source without altering direction; it remains excluded from expense spending under the existing no-netting limitation.

### Negative income adjustments

No approved contract defines whether a negative salary correction, chargeback or income reversal should be stored as `EXPENSE`, as a negative `INCOME`, or blocked for explicit review.

Proposed rule: ordinary negative records remain money out and must not be stored as `INCOME`; an incompatible income category is rejected; the user chooses a compatible money-out category until a separate adjustment contract is approved; no historical record is changed automatically.

### Signed internal transfers

Transfers are excluded from spending, and the manual path currently preserves the entered sign. The permanent records do not explicitly state whether both positive and negative `TRANSFER` values are supported or how their direction is displayed.

Proposed rule: `TRANSFER` takes precedence only after existing accepted transfer confirmation; positive means entering the account, negative means leaving; both remain `TRANSFER` and are excluded from spending and income; category, fallback state, merchant text and Property links cannot convert them.

### Mixed-direction split children

The split contract requires exact cent reconciliation and counts children instead of the parent, but it does not state whether children may have signs/types different from the parent. Current validation accepts mixed signs when their sum equals the parent.

Proposed rule: every split child has the same non-zero sign and compatible type as its parent; mixed-direction splits are rejected; totals continue to reconcile exactly; no allocation or netting feature is introduced.

## Zero-value decision

Zero-value transactions are unsupported and rejected before durable commit. A zero amount has no ordinary transaction direction.

## Smallest safe implementation after approval

If the four proposed rules are approved:

1. add one shared helper that derives or validates direction from signed cents with confirmed transfer precedence;
2. apply it to CSV Import commit, manual create/edit and generic transaction validation;
3. filter category suggestions and choices to compatible types;
4. keep merchant-rule priority, but ignore an incompatible rule for that row;
5. preserve Skip and Merge semantics;
6. add split sign/type validation without changing split totals or counting;
7. show quiet Money in/Money out/Transfer metadata and contextual correction guidance;
8. retain the downstream sign-safe calculation guard;
9. perform no backfill, rewrite, migration or automatic historical reclassification.

## Existing anomaly

The existing positive `EXPENSE` record remains visible in its transaction month, remains excluded from spending/budgets/comparisons, can be corrected through normal Edit, and must not be changed automatically.

## Privacy and safety

The audit used repository code and safe documented facts only. It did not access a database, Production secret, connection value, raw CSV row, narration, filename, account reference or private identifier.

Later validation/audit events must use safe reason codes only and must not log descriptions, amounts, filenames, bank details or account references.

## Gate decision

PR 4.34 implementation is blocked pending explicit client approval of the proposed rules for positive refunds, negative income adjustments, signed internal transfers and mixed-direction split children.

No implementation, schema, migration, data or deployment work may proceed before that decision.
