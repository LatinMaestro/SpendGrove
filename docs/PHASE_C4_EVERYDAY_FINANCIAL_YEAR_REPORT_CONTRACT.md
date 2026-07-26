# Phase C4 Everyday Financial-Year Report and Reconciliation Contract

Date: 26 July 2026  
Status: controlling no-schema financial formula and output contract  
Master-plan alignment: C4.1 — financial-year everyday cashflow, Category reporting and reconciliation  
Depends on: Phase C4 current-state audit and completion contract in PR #259  
Does not authorise: application implementation, schema, migration, Production, provider, tax conclusion or Apple action

## 1. Purpose

Freeze the exact formulas and source-record rules for a future Australian financial-year everyday report before any aggregation helper, API route, user interface, CSV or accountant-pack field is implemented.

The report is an organisational cashflow and record-quality tool. It is not a tax report and does not calculate profit, deductions, tax payable, tax refunds or investment returns.

## 2. Release value

The future report should let a user:

- choose an Australian financial year;
- see Money in and Money out separately;
- see transfer context separately;
- understand Category totals without netting opposite directions;
- see the exact count of source records included;
- understand safely derivable exclusions;
- drill into the owned Transactions behind totals;
- download formula-safe cashflow, Category and reconciliation files;
- add those files to the existing accountant preparation pack without implying tax treatment.

## 3. Source-of-truth hierarchy

The report must apply these rules in order:

1. authenticate the user;
2. query only records owned by that user;
3. restrict records to the selected Australian financial year;
4. exclude inactive and deleted records;
5. exclude split parents when split children are the counted records;
6. preserve a valid non-zero signed amount;
7. give `TRANSFER` type precedence over amount sign for reporting classification;
8. classify all other records by their validated signed direction;
9. preserve the accepted Category attached to the counted Transaction;
10. aggregate integer cents with overflow checks;
11. derive reconciliation from the same source selection as the report;
12. format AUD only at UI or export boundaries.

LoanRepayment, budgets, recurring items, assets, liabilities, documents and provider results are not cashflow source records for this report.

## 4. Financial-year window

For financial year ending `YYYY`:

- `startDate` is `YYYY-1-07-01`;
- `endDate` is `YYYY-06-30`;
- date-only comparisons include both boundary dates;
- a database query may use `date >= startDate` and `date < YYYY-07-01`;
- current default financial year uses Australia/Brisbane time;
- report output uses the label `YYYY-1-YY` such as `2025-26`.

A record dated before 1 July or after 30 June is outside the selected financial year even when it was imported or edited during that year.

## 5. Required input contract

A future pure aggregation helper should receive a safe owner-scoped record shape equivalent to:

```ts
type EverydayFinancialYearRecord = {
  id: string;
  userId: string;
  date: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amountCents: number;
  status: "ACTIVE" | string;
  deletedAt: string | null;
  splitRole: "NONE" | "PARENT" | "CHILD" | string;
  categoryId: string | null;
  categoryName: string | null;
};
```

The helper must not require:

- raw description or bank narration;
- merchant name;
- notes;
- source CSV row or filename;
- account, BSB, card, customer or Loan identifiers;
- Property address;
- provider payload;
- tax classification;
- reconciliation metadata not needed for cashflow classification.

## 6. Eligibility and exclusion order

Each candidate record is evaluated exactly once.

### 6.1 Cross-user

If `record.userId !== authenticatedUserId`:

- exclude it;
- increment `crossUserCount` only in synthetic/internal verification or a safe server-side reconciliation result;
- never expose the other user's ID;
- do not continue evaluating the record.

Production Prisma queries should already prevent cross-user rows from reaching the helper. The helper still fails closed if they do.

### 6.2 Outside period

If the date is before `startDate` or after `endDate`:

- exclude it;
- increment `outsidePeriodCount` when the candidate query intentionally supports exclusion reconciliation;
- do not include it in any direction or Category total.

### 6.3 Deleted or inactive

If `status !== "ACTIVE"` or `deletedAt !== null`:

- exclude it;
- increment `deletedOrInactiveCount` when safely available;
- do not restore or modify it.

### 6.4 Split parent

If `splitRole === "PARENT"`:

- exclude it;
- increment `splitParentCount` when safely available;
- count eligible split children independently;
- never count parent and children together.

### 6.5 Invalid money or direction

For a record reaching aggregation:

- `amountCents` must be a safe non-zero integer;
- `INCOME` must have a positive amount;
- `EXPENSE` must have a negative amount;
- `TRANSFER` may be positive or negative;
- a mismatch must fail the report safely rather than silently reclassify a corrupted durable record.

The normal write paths already enforce direction compatibility. The report remains a last fail-closed boundary.

## 7. Direction formulas

### 7.1 Money in

A counted record is Money in when:

- `type === "INCOME"`;
- `amountCents > 0`.

Formula:

```text
moneyIn.count = number of counted INCOME records
moneyIn.totalCents = sum of amountCents for counted INCOME records
```

The total remains positive integer cents.

### 7.2 Money out

A counted record is Money out when:

- `type === "EXPENSE"`;
- `amountCents < 0`.

Formula:

```text
moneyOut.count = number of counted EXPENSE records
moneyOut.totalCents = sum of absolute amountCents for counted EXPENSE records
```

The output total is a positive magnitude for presentation. The underlying source amount remains negative.

### 7.3 Transfers

A counted record is transfer context when `type === "TRANSFER"`.

The report may return:

- `transfers.count`;
- `transfers.incomingCount` for positive amounts;
- `transfers.outgoingCount` for negative amounts;
- authenticated source IDs for drilldown.

Transfer amounts must not be added to Money in, Money out or Category cashflow totals.

Do not net paired transfers into income or spending. Do not require a TransferLink merely to preserve transfer exclusion.

## 8. Refunds and rebates

A positive refund or rebate is represented by a valid positive `INCOME` Transaction and remains Money in.

It must not:

- reduce a historical Money out Category total;
- mutate the original expense;
- be inferred from merchant text;
- be automatically paired with a prior expense;
- be described as a tax rebate unless the user explicitly created an approved record with professionally reviewed terminology.

A direction-compatible income Category such as `Refunds and rebates` may be shown. The report does not decide whether the amount should be treated differently for accounting or tax purposes.

## 9. Split transactions

The report uses the accepted split hierarchy:

- split parent is a display container and excluded;
- active eligible split children are counted;
- each child retains its own Category;
- each child must have the same direction as the parent under the write-path contract;
- child totals must reconcile to the parent amount within the existing split contract;
- this report does not recalculate or repair the split.

Required reconciliation fields when safely derivable:

- `countedSplitChildCount`;
- `excludedSplitParentCount`.

## 10. Category aggregation

### 10.1 Group key

A Category row is keyed by:

```text
direction + categoryId
```

where direction is `MONEY_IN` or `MONEY_OUT`.

The same Category label appearing in both directions must produce separate rows. A positive refund never reduces a Money out row.

### 10.2 Uncategorized

If `categoryId` or an owned safe Category label is unavailable:

- use `categoryId: null`;
- use `categoryName: "Uncategorised"`;
- preserve the correct direction;
- include it in totals;
- optionally count it in a neutral `needsReviewCount` only when the exact implementation contract says missing Category is the sole rule.

Do not expose a deleted or cross-user Category name.

### 10.3 Formula

For each counted non-transfer record:

```text
row.count += 1
row.totalCents += absolute(amountCents)
```

The row total is a positive magnitude. Direction carries the sign meaning.

### 10.4 Ordering

Recommended deterministic ordering:

1. Money in rows before Money out rows for export contract stability, or separate arrays by direction;
2. descending `totalCents` within direction;
3. `categoryName.localeCompare(..., "en-AU")` as a stable tie-breaker;
4. `categoryId` as a final tie-breaker if required.

The UI may present Money out first for user emphasis only if the response and export contract remain explicit and tested.

### 10.5 Reconciliation

Required identities:

```text
sum(MONEY_IN categoryRows.totalCents) = moneyIn.totalCents
sum(MONEY_OUT categoryRows.totalCents) = moneyOut.totalCents
sum(categoryRows.count) = moneyIn.count + moneyOut.count
```

Any mismatch fails the report.

## 11. Count reconciliation

When the candidate source supports all exclusion diagnostics:

```text
inputTransactionCount
= countedTransactionCount
+ outsidePeriodCount
+ deletedOrInactiveCount
+ splitParentCount
+ crossUserCount
```

and:

```text
countedTransactionCount
= moneyIn.count
+ moneyOut.count
+ transfers.count
```

If the production query pre-filters cross-user, deleted, outside-period or split-parent records, the report must not invent those exclusion counts. It may return:

- only counts actually derived from the query;
- `null` or an explicit unavailable state for counts not queried;
- a truthful source note such as `Only eligible active source records were loaded`.

Zero must not be used to imply that no excluded records exist when they were never queried.

## 12. Loan no-double-count contract

A reconciled Loan repayment may have:

- one everyday Transaction representing cashflow;
- one LoanRepayment representing analytical principal, interest and fee components.

The everyday financial-year report counts only the everyday Transaction.

LoanRepayment values:

- do not enter Money out again;
- do not enter everyday Category totals;
- may appear in the separate Loan report or Property Loan-component summary;
- may be referenced by a reconciliation statement only as an analytical-record count;
- never change the everyday cashflow total.

Required synthetic proof:

```text
one -$1,200.00 everyday Transaction = $1,200.00 Money out
one linked $1,200.00 LoanRepayment = analytical components only
everyday Money out remains $1,200.00, not $2,400.00
```

## 13. Overflow and arithmetic

Every aggregate addition must use a checked integer-cent helper.

Fail with a safe internal code if:

- an amount is not a safe integer;
- a running total stops being a safe integer;
- a count exceeds a supported bounded response;
- Category totals do not reconcile;
- direction and sign disagree.

Do not use floating-point dollars for calculation.

UI formatting uses:

```ts
new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
})
```

CSV rendering divides cents only when producing two decimal places.

## 14. Proposed response contract

A future server response may use:

```ts
type EverydayFinancialYearReport = {
  contract: "spendgrove.everyday-financial-year-report";
  version: 1;
  generatedAt: string;
  financialYear: {
    endingYear: number;
    label: string;
    startDate: string;
    endDate: string;
  };
  currency: "AUD";
  moneyRepresentation: "integer cents";
  moneyIn: { count: number; totalCents: number };
  moneyOut: { count: number; totalCents: number };
  transfers: {
    count: number;
    incomingCount: number;
    outgoingCount: number;
  };
  countedTransactionCount: number;
  countedSplitChildCount: number;
  categoryRows: Array<{
    direction: "MONEY_IN" | "MONEY_OUT";
    categoryId: string | null;
    categoryName: string;
    count: number;
    totalCents: number;
  }>;
  reconciliation: {
    candidateSource: "FULL_DIAGNOSTIC" | "ELIGIBLE_ONLY";
    inputTransactionCount: number | null;
    outsidePeriodCount: number | null;
    deletedOrInactiveCount: number | null;
    splitParentCount: number | null;
    crossUserCount: number | null;
    notices: string[];
  };
  disclaimer: string;
};
```

Do not add a `profit`, `surplus`, `taxableIncome`, `deductibleTotal` or `netReturn` field under this contract.

## 15. CSV contracts

### 15.1 Cashflow CSV

Recommended columns:

- `financial_year`;
- `date`;
- `direction`;
- `amount_aud`;
- `category`;
- `source` (`MANUAL` or `IMPORTED` only if already accepted and safe);
- `transaction_id` for authenticated traceability;
- `spendgrove_notice`.

Do not include raw narration, notes, merchant history, filenames or banking identifiers.

### 15.2 Category CSV

Recommended columns:

- `financial_year`;
- `direction`;
- `category`;
- `transaction_count`;
- `total_aud`;
- `spendgrove_notice`.

### 15.3 Reconciliation JSON or text

May include:

- contract and version;
- selected financial year;
- report counts;
- safely derivable exclusion counts;
- formula notices;
- no-double-count notice;
- generated timestamp.

### 15.4 Formula injection

For every user-controlled text cell:

- prefix values beginning with `=`, `+`, `-` or `@` with an apostrophe before CSV quoting;
- escape quotes by doubling them;
- quote every text field;
- use deterministic CRLF row endings.

SpendGrove must not generate formulas.

## 16. UI contract

A future page may be `/reports/everyday` or another route approved by the existing Reports information architecture.

It must include:

- report title and neutral preparation description;
- financial-year selector;
- Money in and Money out summary cards;
- transfer-context card or notice;
- separate Money in and Money out Category sections;
- counted source-record count;
- reconciliation disclosure;
- transaction drilldown preserving the selected financial year and direction/Category where supported;
- cashflow, Category and reconciliation downloads;
- clear current-data and no-tax-advice notice.

The report must not create a new primary navigation destination without a separate navigation decision.

## 17. Accessibility contract

The implementation must prove:

- 390 px layout without horizontal page scrolling;
- correctly labelled financial-year selector;
- semantic summary descriptions;
- separate headings for Money in, Money out and transfer context;
- table headers or equivalent mobile card labels;
- screen-reader-readable currency values with labels;
- no colour-only direction or review state;
- visible keyboard focus;
- accessible empty, loading and error states;
- download links identify file type and purpose;
- reconciliation disclosure uses native or correctly labelled semantics.

## 18. Privacy and ownership

The service must authenticate before store access.

All queries must include owner `userId`. Cross-user rows fail closed even if a test store returns them.

The response, UI, logs and safe errors must exclude:

- raw descriptions or bank narration;
- merchant names unless a later exact privacy contract allows them;
- notes;
- raw CSV rows or filenames;
- account, BSB, card, customer, member or Loan references;
- exact Property addresses;
- provider payloads;
- secrets and connection strings;
- private audit metadata.

Authenticated transaction IDs are allowed only for owner traceability and exports.

## 19. Synthetic reconciliation fixture

The controlling synthetic fixture is:

- `tests/fixtures/phase-c4-everyday-fy-reconciliation.json`.

It contains wholly invented data covering:

- both financial-year boundary dates;
- records immediately outside the period;
- Money in;
- Money out;
- a positive refund;
- incoming and outgoing transfers;
- one split parent and two split children;
- one deleted record;
- one cross-user record;
- one uncategorised record;
- one reconciled Loan cashflow Transaction;
- one linked analytical LoanRepayment.

Expected result:

- 16 candidate Transactions;
- 11 counted records;
- Money in: 3 records and 513,000 cents;
- Money out: 6 records and 142,000 cents;
- transfer context: 2 records;
- counted split children: 2;
- exclusions: 2 outside period, 1 deleted/inactive, 1 split parent and 1 cross-user;
- linked Loan analytical components do not increase Money out;
- Category rows reconcile exactly by direction.

No real bank, lender, user, filename, narration, account identifier, amount or balance is present.

## 20. Automated acceptance before implementation

The contract package must test:

1. period boundaries and exclusion counts;
2. direction and transfer precedence;
3. positive refund treatment;
4. split-parent exclusion and split-child inclusion;
5. Category separation by direction;
6. exact integer-cent reconciliation;
7. Loan no-double-count;
8. synthetic privacy and prohibited-field checks;
9. contract wording and forbidden metrics.

## 21. Implementation sequence after this contract is green

1. create a pure aggregation helper and safe record types;
2. add exhaustive unit tests using the controlling fixture;
3. add an authenticated owner-scoped store method;
4. prove query and helper reconciliation;
5. add formula-safe cashflow and Category serializers;
6. add a reconciliation serializer;
7. add an authenticated report page and download routes;
8. extend the Reports hub;
9. prepare accountant-pack contract version 2 separately;
10. run exact-head tests, types, lint, build, accessibility and authenticated synthetic QA.

Each step should be a focused PR when the diff or review boundary warrants separation.

## 22. Explicit exclusions

This contract does not authorise:

- application or API implementation;
- schema or migration files;
- persisted report snapshots;
- tax classifications or deductions;
- historical budget reconstruction;
- Property ownership or mixed-use allocation;
- gross-rent or tax-return labels;
- document storage or OCR;
- accountant access;
- provider, package, secret or environment changes;
- Production data or migrations;
- native, Apple, TestFlight, pricing or release actions.

## 23. Exit criteria for C4.1

C4.1 is technically prepared when:

- this contract is committed;
- the synthetic fixture is committed;
- reference tests prove all expected arithmetic and exclusions;
- no prohibited data exists in the fixture;
- the package passes the full existing test/build pipeline;
- PR review confirms no application, schema or provider change;
- future implementation remains blocked until the contract is green and dependency-ready.