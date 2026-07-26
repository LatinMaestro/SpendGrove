# Phase C4 Loan, Property and Reporting Completion Contract

Date: 26 July 2026  
Status: controlling existing-schema completion contract  
Applies to: LOAN-01–LOAN-07, PROP-01–PROP-04, TAX-01–TAX-02, REP-01–REP-03  
Does not authorise: schema, migration, Production, provider, real-document, accountant-access or tax-sensitive finalisation

## 1. Objective

Complete the release-required Loan, Property, everyday financial-year reporting and accountant preparation-pack workflows using the current canonical records and accepted financial rules.

Users must be able to trace every total to owned source records without SpendGrove deciding tax treatment.

## 2. Existing foundation accepted by this contract

The following existing implementation is the baseline and must not be rebuilt or weakened:

- Australian financial-year Loan summaries;
- repayment, principal, interest, fee and recorded-balance totals;
- reconciliation counts and incomplete-component counts;
- formula-safe Loan CSV;
- accepted Property linked-record set;
- separate Property cashflow and Loan component summaries;
- Property linked-record CSV;
- versioned accountant-pack manifest and readme;
- individual Loan, Property and full-account downloads;
- evidence placeholders;
- neutral no-tax-advice wording;
- owner-scoped services and exports;
- existing automated behavioural tests.

## 3. Source-of-truth hierarchy

Every C4 report must apply this order:

1. authenticated owner context;
2. active owned everyday Transactions as cashflow;
3. eligible split children replacing counted split parents;
4. explicit PropertyTransactionLink for manual Property context;
5. accepted Loan reconciliation plus Loan Account Property for Loan cashflow context;
6. LoanRepayment for analytical components only;
7. user-confirmed Category and Loan purpose labels for organisation only;
8. current source records unless a later approved snapshot model exists.

No report may derive cashflow directly from LoanRepayment.

## 4. Australian financial-year rules

For financial year ending `YYYY`:

- start date: 1 July `YYYY-1`;
- end date: 30 June `YYYY`;
- dates are compared as accepted date-only values;
- Brisbane timezone determines the current financial-year default;
- integer cents are authoritative;
- AUD formatting occurs only at presentation or export boundaries.

## 5. Everyday financial-year report contract

A future no-schema implementation may add a selected-financial-year everyday report with the following structure.

### 5.1 Summary fields

- `financialYear`;
- `moneyIn.count` and `moneyIn.totalCents`;
- `moneyOut.count` and `moneyOut.totalCents`;
- `transferContextCount`;
- `countedTransactionCount`;
- `countedSplitChildCount`;
- `excludedSplitParentCount` where safely derivable;
- `needsReviewCount` based only on an exact non-tax record-quality rule;
- Category rows;
- source reconciliation.

### 5.2 Eligibility

Count only Transactions that are:

- owned by the authenticated user;
- active and not deleted;
- inside the selected financial year;
- not a counted split parent;
- accepted by the existing canonical everyday-report eligibility.

### 5.3 Direction

- positive eligible amounts remain Money in;
- negative eligible amounts remain Money out;
- positive refunds remain Money in under the accepted rule;
- transfer records remain context and do not enter Money in or Money out;
- a Category never reverses signed direction.

### 5.4 Category totals

Category totals must:

- use counted eligible Transactions only;
- preserve the Transaction's accepted Category;
- keep uncategorised/Needs review explicit;
- not apply tax groupings;
- not offset positive refunds against expense Categories;
- sum exactly to the corresponding directional source rows.

### 5.5 No profit or advice metric

The report may show Money in and Money out separately. It must not label their difference as:

- taxable profit;
- rental profit;
- investment return;
- tax result;
- deductible total;
- claimable amount.

A neutral net-cashflow figure requires a separate explicit formula and wording review before introduction.

## 6. Reconciliation statement contract

A derived reconciliation statement may accompany each report and pack.

### 6.1 Required fields

- report contract and version;
- generated timestamp;
- selected period;
- source service/version identifier where available;
- counted source count;
- counted split-child count;
- excluded split-parent count where safely derivable;
- transfer-context count;
- Property manual-link count;
- Loan-context cashflow count;
- Loan repayment analytical-record count;
- incomplete Loan component count;
- relationship-conflict count;
- archived-context count;
- formula and boundary notices.

### 6.2 Identifier treatment

User-owned source IDs may appear only:

- in an authenticated drilldown;
- in an authenticated owner export;
- in the versioned accountant-pack manifest where currently accepted.

They must not appear in public pages, logs, error strings, analytics or provider payloads.

### 6.3 Persistence

The first reconciliation statement must be derived on demand. Do not persist:

- report snapshots;
- pack status;
- accountant notes;
- reconciliation approval;
- tax classifications.

Any reproducible snapshot requirement triggers a material-schema gate.

## 7. Loan report completion

A no-schema Loan report may add:

- explicit selected-period source counts;
- excluded archived/out-of-period counts where safely derivable;
- component-completeness explanation;
- a per-Loan source-record drilldown;
- formula-safe component-detail CSV;
- accessible table/card parity.

It must continue to:

- preserve Loan identity;
- keep total repayment, principal, interest and fees separate;
- leave missing components absent;
- show latest balance only when recorded;
- never forecast;
- never present principal, interest or fees as automatically deductible;
- never add linked everyday cashflow again.

## 8. Property report completion

A no-schema Property report may add:

- Category summary for the accepted linked-record set;
- refund and transfer-context counts;
- source and exclusion reconciliation;
- direct transaction drilldown;
- clearer relationship-conflict and archived-context guidance;
- formula-safe financial-year Category CSV;
- responsive and screen-reader improvements.

It must not:

- require dormant PropertyReportReview classification for inclusion;
- infer legal ownership;
- store or require exact addresses;
- allocate shared ownership or mixed use;
- calculate depreciation, capital works, yield, equity or profit;
- decide evidence sufficiency or deductibility.

## 9. Accountant-pack contract v2 preparation

The current manifest remains version 1 until an exact shape change is implemented.

A later approved version 2 may add:

- financial-year everyday cashflow CSV;
- financial-year Category CSV;
- reconciliation summary JSON or text;
- explicit current-planning-snapshot month and label;
- clearer download checklist;
- safe report contract versions;
- document evidence references only after secure document activation.

Changing the manifest requires:

1. version increment;
2. old-version compatibility decision;
3. exact response and export tests;
4. UI wording update;
5. account export/deletion review if persisted state is introduced;
6. authenticated exact-head QA.

No ZIP package or external file service is required for version 2.

## 10. Current planning snapshot truth

The accountant pack currently includes current budgets and recurring items.

The UI and readme must state:

- the snapshot month;
- that it is current planning information;
- that it is not reconstructed for the selected financial year;
- that it does not alter the financial-year reports.

The pack must not imply that current budgets or recurring items existed throughout the selected financial year.

## 11. Evidence-needed states

Before secure documents activate, evidence guidance remains a checklist only.

Permitted groups:

- source Property records needing review;
- Loan repayments with incomplete recorded components;
- document evidence placeholder.

Permitted wording:

- `Evidence may be needed`;
- `Check the source record`;
- `Check the lender statement`;
- `Ask your registered tax agent or accountant what evidence is appropriate`.

Prohibited wording without professional approval:

- evidence sufficient;
- substantiated deduction;
- ATO compliant;
- claim ready;
- tax-return ready.

## 12. Accessibility contract

Every report page must prove:

- usable 390 px layout without horizontal page scrolling;
- visible keyboard focus for links, selects and buttons;
- labelled period and Property controls;
- semantic headings and description lists;
- text labels for needs-review and incomplete states;
- accessible empty, loading and error states;
- no colour-only meaning;
- touch targets of practical size;
- currency values announced with nearby labels;
- download controls identify file purpose;
- screen-reader users can understand cashflow versus Loan components.

A future dense desktop table must have an equivalent mobile card presentation or responsive alternative.

## 13. Formula-safe export contract

All CSV exports must:

- use deterministic column order;
- preserve integer-cent calculations and render two decimal places;
- escape quotes and commas;
- protect user-controlled text beginning with `=`, `+`, `-` or `@`;
- exclude raw narration, filenames and banking identifiers;
- include a neutral preparation notice;
- reconcile to the on-screen report built from the same response.

No spreadsheet formula is generated by SpendGrove.

## 14. Privacy and security

Prohibited from report UI, public surfaces, logs and unsafe exports:

- raw CSV rows or files;
- original filenames;
- raw bank narration;
- account number, BSB, card, customer or Loan references;
- exact Property addresses;
- provider payloads and secrets;
- private audit metadata;
- cross-user source IDs.

Authenticated owner downloads may include accepted record IDs needed for traceability, but not the prohibited raw source fields.

## 15. Professional review gate

Before final tax-sensitive wording or release closure, a qualified Australian tax/accounting professional must review:

- Loan component labels;
- Property cashflow and Category labels;
- refund/rebate language;
- evidence-needed guidance;
- accountant-pack instructions;
- disclaimers;
- whether additional ownership/use facts are required for the intended product purpose;
- clear separation between record organisation and tax conclusions.

The reviewer does not approve software security, privacy or data retention; those remain separate reviews.

## 16. Material schema gate

Stop and request explicit approval before adding:

- ownership shares;
- acquisition dates or use periods;
- mixed-purpose percentages;
- persisted evidence-needed or accountant-review state;
- report-pack snapshots;
- document evidence relationships beyond already approved foundations;
- new Property identifiers or addresses;
- report approval workflows.

The schema proposal must define minimisation, ownership, export, deletion, retention, Preview migration and Production approval.

## 17. Explicit exclusions

This contract does not authorise:

- tax calculations or lodgement;
- automatic deductibility;
- ATO integration;
- Property valuation, equity, yield or return;
- Loan forecasting;
- missing component inference;
- Production database inspection or migration;
- real documents;
- accountant invitations or access;
- provider, package, secret or environment changes;
- native, Apple, TestFlight or release actions.

## 18. Automated acceptance

Each implementation must retain or add tests for:

- FY boundary dates;
- archived and out-of-period exclusion;
- integer overflow rejection;
- split no-double-count;
- Property and Loan context de-duplication;
- Loan component separation;
- refund and transfer treatment;
- Category sum reconciliation;
- formula-injection protection;
- owner isolation;
- safe export fields;
- current-planning-snapshot truth;
- no-tax-advice wording;
- accessibility source/interaction boundaries.

## 19. Exit criteria

The existing-schema C4 scope is technically complete when:

- dedicated retained release reports are implemented;
- every total reconciles to canonical owned source records;
- no Loan cashflow is counted twice;
- current planning information is labelled truthfully;
- accountant-pack files and manifest agree;
- exports are formula-safe;
- report accessibility tests pass;
- no dormant classification becomes mandatory;
- professional-review items remain blocked until reviewed;
- schema/document/provider/Production gates remain fail-closed;
- authenticated synthetic QA and ordered dependency review are complete.