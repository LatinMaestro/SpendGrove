# Phase C4 Everyday Financial-Year Reporting Preparation Summary

Date: 26 July 2026  
Status: formula contract, synthetic reconciliation fixture and automated contract tests prepared; exact-head verification pending  
Master-plan alignment: C4 — Loan, Property and report completion  
Feature-register alignment: REP-01 and REP-02  
Stacked dependency: PR #260, PR #259 and all earlier activation/master-plan dependencies

## Objective

Prepare the exact financial formula and reconciliation foundation for dedicated Australian financial-year everyday Money in, Money out and Category reports before implementing aggregation services, routes, UI or accountant-pack fields.

This work follows the current-state audit in PR #259 and the three-way Loan/Property reconciliation transparency implementation in PR #260.

## Files delivered

- `docs/PHASE_C4_EVERYDAY_FINANCIAL_YEAR_FORMULA_CONTRACT.md`;
- `tests/fixtures/phase-c4-everyday-fy-reconciliation.json`;
- `tests/phase-c4-everyday-fy-contract.test.ts`;
- this summary.

## Formula decisions frozen

### Source records

Active owned everyday Transactions remain the sole cashflow source.

A counted record must be:

- owned by the authenticated user;
- active and non-deleted;
- within the selected Australian financial year;
- not a split parent;
- a non-zero safe integer-cent record;
- compatible with its signed direction.

### Money in

- eligible positive INCOME records;
- sum signed positive integer cents;
- positive reviewed refunds/rebates remain Money in;
- refunds do not retroactively reduce expense Categories.

### Money out

- eligible negative EXPENSE records;
- present the sum of absolute integer-cent magnitudes;
- retain the signed source records unchanged.

### Transfers

- excluded from Money in and Money out;
- excluded from Category rows;
- counted only as incoming/outgoing context;
- no transfer amount total is introduced in this first contract.

### Splits

- split parents are display containers and excluded;
- eligible split children count exactly once using their own Category and amount.

### Loans

- the everyday Loan-payment Transaction counts once as Money out;
- LoanRepayment principal, interest, fees and balance remain analytical;
- analytical components add zero to everyday cashflow and Category totals.

### Categories

- group by direction plus Category identity;
- never combine same-named income and expense Categories;
- use `Uncategorised` with `categoryId: null` where no Category is available;
- transfers never appear as Category rows;
- every Category row total is a non-negative integer-cent magnitude with an explicit direction.

## Synthetic reconciliation dataset

The fixture is wholly fictional and covers:

- both financial-year boundaries;
- before-period and after-period exclusions;
- ordinary income and expenses;
- a positive refund;
- a split parent and two children;
- an uncategorised expense;
- transfer in and transfer out;
- a deleted record;
- a fictional cross-user denial record;
- one everyday Loan cashflow;
- one analytical Loan component record.

Expected result:

- 16 input Transactions;
- 11 counted records;
- Money in: 3 records / 513,000 cents;
- Money out: 6 records / 142,000 cents;
- transfers: 2 context records;
- counted split children: 2;
- Category rows: 9;
- outside-period exclusions: 2;
- deleted/inactive exclusions: 1;
- split-parent exclusions: 1;
- fictional cross-user exclusions: 1;
- analytical Loan amount added to cashflow: zero/false.

The core reconciliation is:

```text
11 counted records = 3 Money in + 6 Money out + 2 transfers
9 Category records = 3 Money in + 6 Money out
```

## Automated contract evidence

The new test suite contains eight tests that:

1. validate the versioned synthetic fixture and financial-year dates;
2. independently derive owner/status/date/split eligibility;
3. reproduce Money in and Money out totals;
4. keep transfer context separate;
5. reproduce split and direction-separated Category rows;
6. prove Loan components remain analytical;
7. reproduce the exclusion ledger;
8. guard formula-safe export, neutral terminology and hard stops.

The tests do not import a future report implementation. They prove the contract and fixture before implementation begins.

## Future implementation sequence

After this branch is technically green:

1. pure financial-year aggregation helper with fixture-driven behavioural tests;
2. authenticated owner-scoped report service;
3. formula-safe everyday and Category exports;
4. source/exclusion reconciliation response and export;
5. existing-navigation responsive report page;
6. accountant preparation-pack version 2;
7. consolidated C4 financial/privacy/accessibility package.

Each implementation must remain a focused PR and preserve the formula contract.

## Control-document reconciliation

PR #259 recorded that the 17 July feature register understates current Loan, Property and accountant-pack delivery.

This C4.1 branch further establishes that:

- REP-01 has delivered monthly views but still lacks implemented dedicated financial-year everyday and Category reports;
- REP-02 has a delivered version 1 accountant preparation pack, while version 2 remains future work;
- Loan and Property financial-year foundations are already operational in the stacked source;
- the current formula contract is planning/QA evidence, not an implemented report.

The permanent feature register, build plan, decision log and handoff should be reconciled together once the stacked C4 control package is dependency-ready for ordered merge. Rewriting each historical document independently on parallel open branches would risk contradictory status. Until then, PR #259, PR #260, this formula contract and this summary are the controlling C4 handoff.

## Financial and tax boundary

No application calculation changed in this PR.

No calculation is added for:

- deductibility or claimability;
- taxable income or tax return values;
- ownership or mixed-use allocations;
- depreciation or capital works;
- Property profit, yield, equity or valuation;
- Loan forecasts;
- savings rate or advice.

Qualified Australian tax/accounting review remains required before tax-sensitive terminology or evidence wording is finalised.

## Privacy and security boundary

No real or private data is present.

The fixture and documents contain no:

- real CSV or row;
- filename;
- narration or merchant history;
- account, BSB, card, customer or Loan reference;
- exact Property address;
- provider response, secret or environment value.

The future service must authenticate before persistence access and must not query cross-user records merely to display an exclusion count.

## Schema and environment impact

No change to:

- application runtime;
- Prisma schema or migrations;
- API routes;
- package or lockfile;
- workflow configuration;
- Vercel, Neon or Clerk configuration;
- providers or secrets;
- Preview or Production database state;
- Expo, Apple, TestFlight, pricing or real users.

## Remaining gates

- exact-head tests, TypeScript, lint, optimized build and Vercel Preview for this branch;
- no unresolved review threads;
- authenticated synthetic browser review for the broader stacked UI work;
- executable GitHub Actions after eventual retargeting to `main`;
- ordered merge of activation and master-plan dependencies;
- qualified Australian tax/accounting review;
- explicit schema approval for persisted report/evidence/metadata state;
- document-provider and collaboration gates;
- Production and Apple gates.

## Expected technical baseline

The branch should pass the PR #260 baseline plus one new test file and eight new tests:

- **154 test files / 963 tests**;
- framework dependency verification;
- TypeScript;
- lint, with only the separately documented Import Review memoization warning if unchanged;
- optimized Next.js build;
- route generation and Vercel deployment.

## Next action

Once exact-head verification is green, implement the pure no-schema financial-year aggregation helper against the committed fixture. Do not add routes, UI or accountant-pack fields until the helper independently passes the frozen reconciliation contract.

This preparation does not close REP-01, REP-02 or Phase C4 and triggers no Production or release authority.
