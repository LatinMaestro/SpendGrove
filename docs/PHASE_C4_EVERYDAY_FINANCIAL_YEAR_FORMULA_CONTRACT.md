# Phase C4 Everyday Financial-Year Report Formula and Reconciliation Contract

Date: 26 July 2026  
Status: controlling no-schema financial formula contract; implementation not included  
Master-plan alignment: Phase C4 — Loan, Property and report completion  
Feature-register alignment: REP-01, REP-02, INS-01, INS-02  
Stacked dependency: PR #260, PR #259 and all earlier master-plan and activation dependencies

## 1. Objective

Freeze the exact financial and reconciliation rules for a new Australian financial-year everyday cashflow report and Category report before any aggregation service, API route, page, export or accountant-pack field is implemented.

The future reports must help a user answer:

- what active owned money came in during the selected Australian financial year;
- what active owned money went out during that financial year;
- which Categories contributed to those totals;
- which transfers are present as context but excluded from income and expense totals;
- which records were excluded and why;
- how the report reconciles to its accepted source records;
- how a Loan repayment cashflow remains counted once while Loan components remain analytical only.

These reports are organisational financial records. They do not determine tax treatment, deductibility, claimability, taxable income, tax payable, refunds, allocations or financial advice.

## 2. Authority and relationship to existing rules

This contract applies the existing accepted SpendGrove rules to a financial-year reporting period. It does not introduce a new financial convention.

The controlling hierarchy remains:

1. `AGENTS.md` and the v2.0.1 master specification;
2. the App Store submission master build plan;
3. accepted transaction direction, split and transfer rules;
4. the Phase 8 financial reporting contract;
5. accepted Loan reconciliation and Property reporting rules;
6. this focused formula contract.

Where a future implementation conflicts with this contract, the implementation must fail review rather than silently alter calculations.

## 3. Explicit scope

This contract authorises a later focused no-schema implementation to prepare:

- an authenticated owner-scoped financial-year everyday report service;
- Money in and Money out totals and counts;
- separate incoming and outgoing transfer context counts;
- direction-separated Category totals;
- an uncategorised row where applicable;
- a safe source and exclusion reconciliation statement;
- formula-safe CSV exports;
- a responsive report page and source drilldown links;
- later accountant-pack inclusion through a versioned contract update;
- synthetic financial and accessibility tests.

This contract itself adds no runtime implementation.

## 4. Explicit exclusions

The following are not authorised:

- changing Transaction type, sign, Category or status;
- netting positive refunds against historical expense Categories;
- treating transfers as income or expense;
- adding LoanRepayment totals to everyday cashflow;
- inferring missing Category, Loan, Property, merchant or tax data;
- tax-group, deductible, claimable or taxable calculations;
- ownership-share or mixed-use allocation;
- depreciation, capital works or capital-gains calculations;
- Property yield, profit, equity or valuation;
- forecasts, annualisation, savings rate or advice;
- report snapshots or persisted report state;
- schema or migration files;
- new packages or providers;
- document storage or evidence files;
- Production access, migration or activation;
- Apple, TestFlight, pricing, paywall or real-user actions.

## 5. Report period

### 5.1 Australian financial year

The selected ending year `YYYY` represents:

- start date: `YYYY-1-07-01`;
- end date: `YYYY-06-30`;
- report label: `YYYY-1-YY` using the existing accepted formatter.

The source query should use a half-open UTC date range:

- `date >= YYYY-1-07-01T00:00:00.000Z`;
- `date < YYYY-07-01T00:00:00.000Z`.

A date-only record on 1 July at the beginning of the financial year is included. A date-only record on 30 June at the end is included. A record on the following 1 July is excluded.

### 5.2 Timezone

Financial-year boundaries are Australian date-only boundaries. The existing Brisbane/Australian default may choose the current financial year, but persisted transaction dates must not be shifted by a browser or server timezone during report grouping.

### 5.3 Validation

The ending year must pass the existing bounded financial-year validation. Invalid values fail safely and do not fall through to an unbounded query.

## 6. Authoritative source records

### 6.1 Source entity

Active owned everyday `Transaction` records are the sole cashflow source.

A record is eligible only when all of the following are true:

- `transaction.userId` equals the authenticated user ID;
- `status === "ACTIVE"`;
- `deletedAt === null`;
- the date is within the selected financial year;
- `splitRole !== "PARENT"`;
- amount is a non-zero safe integer number of cents;
- type and signed amount remain compatible under the accepted direction invariant.

The query and the aggregation must both preserve ownership and eligibility. Client-supplied record IDs or totals are never financial authority.

### 6.2 Imported and manual records

Eligible manual and imported Transactions use the same formulas. Import source does not change financial meaning after a row has passed review-before-commit.

### 6.3 Deleted and inactive records

Deleted, inactive, recoverably deleted or cross-user records are excluded from all financial totals, Category totals, transfer counts and counted-source totals.

They may contribute only to a safe aggregate exclusion count where the service intentionally queries a bounded audit/reconciliation source that can prove the exclusion without exposing private content. The initial no-schema implementation may instead report only exclusions observable from its accepted query inputs.

## 7. Direction rules

### 7.1 Money in

A counted Money in record must have:

- `type === "INCOME"`;
- `amountCents > 0`.

Money in total:

```text
sum(amountCents for eligible INCOME records)
```

Money in count is the number of eligible INCOME records.

### 7.2 Money out

A counted Money out record must have:

- `type === "EXPENSE"`;
- `amountCents < 0`.

The report presents a positive magnitude:

```text
sum(abs(amountCents) for eligible EXPENSE records)
```

Money out count is the number of eligible EXPENSE records.

The underlying signed amounts remain unchanged and remain available only through the existing owned source records and permitted exports.

### 7.3 Direction mismatch

A non-transfer record whose type and sign are incompatible must fail closed or be excluded with an explicit safe validation reason. It must not be silently coerced inside reporting.

The future implementation should reuse the accepted transaction direction helper rather than duplicate a weaker rule.

### 7.4 Zero amounts

Zero is not a valid counted cashflow amount. It must not be silently included as income, expense or transfer activity.

## 8. Positive refund rule

The accepted SpendGrove rule remains unchanged:

- a positive reviewed refund/rebate represented as an INCOME Transaction is Money in;
- it is grouped under its current income-compatible Category;
- it is not retroactively subtracted from an expense Category;
- it does not rewrite prior-period spending;
- no tax conclusion is inferred from the word “refund”.

For the synthetic fixture, the positive `Refunds and rebates` record contributes `3,000` cents to Money in and does not reduce Groceries or any other Money out row.

A different future refund-netting model would be a material financial-calculation change requiring a separate contract and explicit review gate.

## 9. Transfer rules

### 9.1 Context only

Eligible `TRANSFER` Transactions are excluded from:

- Money in total and count;
- Money out total and count;
- income Category totals;
- expense Category totals;
- net everyday cashflow if a later presentation derives one.

They may appear only as separately labelled context:

- incoming transfer count where `amountCents > 0`;
- outgoing transfer count where `amountCents < 0`;
- total transfer record count.

The initial report does not need to sum transfer amounts because internal transfers can appear as two sides and summed magnitudes could mislead. Any future amount presentation must preserve pair/link and account-scope semantics through a separate reviewed contract.

### 9.2 Durable transfer links

A durable transfer link provides context only. It does not create, remove or change cashflow and does not affect the financial-year Money in or Money out formulas.

## 10. Split rules

### 10.1 Parent exclusion

A split parent is a display container and must be excluded from:

- Money in and Money out totals;
- Category totals;
- transfer context;
- counted source-record totals.

### 10.2 Child inclusion

Each eligible split child is counted once using its own:

- signed integer-cent amount;
- direction-compatible type;
- Category;
- Property context where relevant.

For the synthetic fixture:

- the `-6,000` cent split parent is excluded;
- the `-4,000` and `-2,000` cent children are counted;
- total Money out receives `6,000` cents exactly once.

### 10.3 Split validation

The report must not repair an invalid split. Existing split validation and transaction lifecycle are authoritative. A parent/child inconsistency must fail safely or surface as a separate source-record problem outside the financial aggregation.

## 11. Loan no-double-count rule

### 11.1 Everyday cashflow

An eligible everyday Transaction representing a Loan payment remains one Money out record and one Category record under its current reviewed Category.

### 11.2 Analytical Loan components

A linked `LoanRepayment` may explain:

- principal;
- interest;
- fees;
- balance;
- reconciliation status.

Those components are not an additional cashflow source. They must not be added to:

- Money out total;
- Category totals;
- transaction count;
- net everyday cashflow.

### 11.3 Reconciliation statement

The report may state safely that:

- one everyday Loan-payment Transaction was counted;
- one analytical LoanRepayment explained that payment;
- zero analytical component cents were added to cashflow.

It must not expose a Loan account reference or infer whether interest or fees are deductible.

## 12. Category report rules

### 12.1 Grouping key

Each eligible INCOME or EXPENSE Transaction belongs to one Category row using the composite key:

```text
(direction, categoryId-or-uncategorised)
```

Direction is mandatory in the key. An identically named income and expense Category must not be combined.

### 12.2 Direction labels

The initial response should use typed direction values:

- `MONEY_IN`;
- `MONEY_OUT`.

Presentation may display plain-English labels, but the typed response remains unambiguous for web/native parity.

### 12.3 Category identity and labels

For an active owned Category:

- use the owned Category ID as grouping identity;
- return its safe display name;
- do not expose parent/internal database details beyond the accepted response.

Where an otherwise eligible Transaction has no available Category:

- use `categoryId: null`;
- use label `Uncategorised`;
- preserve its financial direction and amount;
- do not silently assign a seeded Category.

A subsequently archived Category does not erase the historical Transaction Category relationship. Report treatment must follow the accepted owned-record service and must not silently broaden or drop records.

### 12.4 Category row totals

For `MONEY_IN`:

```text
row.totalCents = sum(amountCents)
```

For `MONEY_OUT`:

```text
row.totalCents = sum(abs(amountCents))
```

Every row total is a non-negative safe integer magnitude. The direction field carries meaning.

### 12.5 Sorting

The recommended deterministic sort is:

1. `MONEY_IN` before `MONEY_OUT` or separate sections;
2. descending `totalCents` within direction;
3. Australian locale Category name as a stable tie-breaker;
4. stable Category ID/null tie-breaker if names are identical.

Sorting does not change totals or source membership.

## 13. Totals and safe-integer handling

All source amounts and aggregate totals use integer cents.

Every addition must use checked safe-integer arithmetic. If an intermediate or final total is not a safe integer, the report fails with a privacy-safe internal reason rather than returning a rounded or corrupted result.

Currency formatting occurs only at presentation/export boundaries.

No floating-point dollars are financial authority. Percentages are not required for the initial financial-year report.

## 14. Reconciliation statement

### 14.1 Purpose

A reconciliation statement proves that report totals derive from the exact accepted source set and that exclusion rules were applied consistently.

### 14.2 Required aggregate fields

The initial typed reconciliation may include:

- selected financial-year label and boundaries;
- input candidate count if available safely;
- counted source-record count;
- Money in count and total cents;
- Money out count and total cents;
- incoming transfer count;
- outgoing transfer count;
- counted split-child count;
- excluded split-parent count;
- excluded outside-period count when evaluated from a supplied bounded fixture or service input;
- excluded inactive/deleted count when evaluated from a supplied bounded fixture or service input;
- owner-denied/cross-owner records must never be returned by the production owner query and should not be exposed as a user-facing count unless a safe security test fixture is being evaluated;
- uncategorised counted-record count;
- Loan analytical record count;
- confirmation that analytical Loan amounts added to cashflow equal zero.

The production service should not query cross-user data merely to populate an exclusion count.

### 14.3 Source IDs

Authenticated downloadable reconciliation evidence may contain accepted owned source Transaction IDs where needed for traceability and accountant pack verification. Normal report summaries should prefer counts and direct owned drilldown links.

Never include:

- raw CSV rows;
- original filenames;
- narration/descriptions;
- account, BSB, card, customer or Loan references;
- exact Property addresses;
- provider payloads;
- private audit metadata.

### 14.4 Core identity

The following must reconcile exactly:

```text
counted source records
  = Money in count
  + Money out count
  + transfer context count
```

For the synthetic fixture:

```text
11 = 3 + 6 + 2
```

Category rows reconcile only to Money in plus Money out records:

```text
sum(category row counts) = 3 + 6 = 9
```

Transfer records are intentionally absent from Category rows.

## 15. Synthetic reconciliation fixture

The controlling fixture is:

`tests/fixtures/phase-c4-everyday-fy-reconciliation.json`

It is wholly fictional and contains no real user, bank, lender, account, filename, merchant narration, balance or private identifier.

### 15.1 Fixture coverage

The fixture includes:

- a record before the selected financial year;
- a record on the first day;
- a record on the last day;
- a record after the period;
- ordinary income;
- a positive refund;
- ordinary expenses;
- a split parent and two children;
- an uncategorised expense;
- incoming and outgoing transfers;
- a deleted record;
- a cross-user denial record for test-only isolation proof;
- an everyday Loan cashflow;
- an analytical LoanRepayment with components.

### 15.2 Expected result

The authoritative expected result is:

- input Transactions: 16;
- counted Transactions: 11;
- Money in: 3 records, `513,000` cents;
- Money out: 6 records, `142,000` cents;
- transfers: 2 records, one incoming and one outgoing;
- counted split children: 2;
- split parent excluded: 1;
- outside-period records excluded: 2;
- inactive/deleted record excluded: 1;
- cross-user record excluded in fixture evaluation: 1;
- Category rows: 9;
- analytical Loan components added to cashflow: false/zero.

## 16. Future typed response contract

A later implementation should define a versioned server response equivalent to:

```ts
type EverydayFinancialYearReport = {
  contract: "spendgrove.everyday-financial-year-report";
  version: 1;
  financialYear: {
    endingYear: number;
    label: string;
    startDate: string;
    endDate: string;
  };
  moneyIn: { count: number; totalCents: number };
  moneyOut: { count: number; totalCents: number };
  transfers: {
    count: number;
    incomingCount: number;
    outgoingCount: number;
  };
  categories: Array<{
    direction: "MONEY_IN" | "MONEY_OUT";
    categoryId: string | null;
    categoryName: string;
    count: number;
    totalCents: number;
  }>;
  reconciliation: {
    countedTransactionCount: number;
    countedSplitChildCount: number;
    uncategorisedCount: number;
    analyticalLoanRepaymentCount: number;
    analyticalLoanAmountAddedToCashflowCents: 0;
  };
  disclaimer: string;
};
```

This shape is illustrative until the implementation PR reviews exact naming. Its financial meaning is fixed by this contract.

## 17. CSV export contract

### 17.1 Everyday summary CSV

Recommended columns:

- `financial_year`;
- `direction`;
- `record_count`;
- `total_aud`;
- `spendgrove_notice`.

Rows:

- Money in;
- Money out;
- Incoming transfer context count;
- Outgoing transfer context count.

### 17.2 Category CSV

Recommended columns:

- `financial_year`;
- `direction`;
- `category`;
- `record_count`;
- `total_aud`;
- `spendgrove_notice`.

### 17.3 Reconciliation CSV or JSON

Recommended fields include counts, safe totals and accepted owned source IDs only where download traceability requires them.

### 17.4 Formula injection

Every user-controlled text cell must be escaped and formula-protected when it begins with:

- `=`;
- `+`;
- `-`;
- `@`.

Money is formatted from integer cents with exactly two decimal places. The export must not use locale thousands separators inside numeric cells.

## 18. User interface and accessibility contract

The later page should:

- live under the existing Reports destination;
- add no primary navigation tab;
- provide a labelled financial-year selector;
- show Money in, Money out and transfer context separately;
- expose Category sections and source drilldowns;
- explain positive refunds as Money in without claiming tax treatment;
- explain that Loan components do not add another cashflow;
- expose a reconciliation disclosure or section;
- provide formula-safe downloads;
- use plain English and neutral preparation language;
- retain usable 390 px layout without horizontal page scrolling;
- provide minimum practical touch targets;
- provide visible keyboard focus;
- use semantic headings, lists/tables and definitions appropriately;
- not rely on colour alone;
- provide loading, empty and safe error states;
- announce material report updates where client-side interaction is later used.

A dense desktop table may supplement, but not replace, an accessible mobile summary.

## 19. Privacy and security contract

The report service and exports must:

- authenticate before persistence access;
- query only the authenticated owner’s records;
- validate the financial year before query construction;
- bound result size and period;
- avoid logging record content, amounts, Categories or source IDs;
- return safe runtime errors;
- exclude raw CSV, filenames and private banking fields;
- not disclose cross-user exclusion information in production;
- preserve account export and deletion treatment;
- remain provider-free.

Synthetic tests may include a fictional cross-user record solely to prove denial.

## 20. Accountant-pack integration boundary

The current accountant preparation pack remains version 1 until a focused future PR explicitly updates its contract.

A future version 2 may add:

- everyday FY summary file;
- Category FY file;
- reconciliation file/section;
- explicit current planning snapshot month and non-historical wording.

It must preserve:

- Loan and Property files;
- account export;
- evidence placeholders until document storage is active;
- no-double-count guidance;
- professional-review disclaimer;
- versioned response semantics.

No current pack field is silently repurposed.

## 21. Professional-review boundary

Qualified Australian tax/accounting review remains required before finalising tax-sensitive terminology, evidence wording or any tax grouping.

Permitted neutral terms include:

- Money in;
- Money out;
- Transfer context;
- Category total;
- Preparation report;
- Source records;
- Needs review;
- Evidence may be needed;
- Ask your registered tax agent or accountant.

Prohibited without explicit professional approval include:

- deductible;
- claimable;
- taxable;
- ATO-ready;
- tax saving;
- tax payable/refund;
- eligible deduction;
- investment return/profit;
- guaranteed reconciliation to a tax return.

The existence of a Category name does not determine tax treatment.

## 22. Required automated tests for implementation

A later implementation must prove at minimum:

1. owner isolation before store access;
2. 1 July and 30 June inclusion;
3. following 1 July exclusion;
4. inactive/deleted exclusion;
5. split-parent exclusion and child inclusion;
6. Money in and Money out exact integer-cent totals;
7. positive refund remains Money in;
8. transfer context exclusion from financial and Category totals;
9. uncategorised row treatment;
10. Category direction separation;
11. Loan analytical no-double-count;
12. overflow failure;
13. formula-safe exports;
14. matching screen/export totals;
15. privacy-safe errors and logs;
16. responsive/accessibility source guards and browser review.

## 23. Exact implementation sequence

After this contract is technically verified:

1. add a pure server aggregation helper and fixture-driven unit tests;
2. add an authenticated owner-scoped report service;
3. add formula-safe everyday and Category exports;
4. add reconciliation response/export;
5. add the existing-navigation report page and accessibility tests;
6. update the accountant pack through an explicit versioned PR;
7. complete consolidated C4 financial, privacy and accessibility QA;
8. leave professional terminology and document integration open until their gates pass.

Each step should use a focused PR where the diff is materially reviewable.

## 24. Mandatory stops

Stop before:

- changing any formula frozen above;
- adding report snapshots or new persisted state;
- adding Property metadata, ownership shares or allocations;
- reactivating dormant tax classification as a mandatory inclusion rule;
- adding document evidence files;
- changing privacy, logging, retention or export scope;
- adding a package, provider, secret or environment variable;
- any Preview or Production migration;
- Production data access or activation;
- Apple, TestFlight, pricing, paywall or real-user activity.

## 25. Contract exit criteria

This planning slice is technically complete when:

- the formula contract is committed;
- the wholly synthetic fixture is committed;
- automated contract tests independently reproduce the expected totals;
- privacy and hard-stop assertions pass;
- exact-head tests, TypeScript, lint and optimized build pass;
- Vercel Preview is READY;
- the diff contains no application formula, schema, migration, package, provider or environment change;
- no unresolved review thread remains;
- all remaining operator, professional and client gates are recorded.

This contract does not by itself implement or close REP-01, REP-02 or Phase C4.
