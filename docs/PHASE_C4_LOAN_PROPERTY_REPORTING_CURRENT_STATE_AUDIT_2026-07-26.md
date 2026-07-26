# Phase C4 Loan, Property and Reporting Current-State Audit

Date: 26 July 2026  
Status: repository audit; no application, schema, provider or Production change  
Master-plan alignment: C4 — Loan, Property and report completion  
Feature-register coverage: LOAN-01–LOAN-07, PROP-01–PROP-04, TAX-01–TAX-02, REP-01–REP-03

## Purpose

Reconcile the current implementation with the App Store master plan before further Loan, Property, report or accountant-pack work begins.

The controlling principle is to extend verified source-record reporting rather than rebuild already delivered capabilities or silently reactivate tax-sensitive workflows.

## Executive conclusion

The repository already contains substantially more Phase C4 functionality than the 17 July feature register records:

- Australian financial-year Loan reporting;
- formula-safe Loan CSV export;
- Australian financial-year Property reporting;
- Property linked-record CSV export;
- separate Property cashflow and Loan component summaries;
- a versioned accountant preparation-pack manifest;
- a plain-English pack readme;
- individual Loan, Property and account downloads;
- evidence-needed placeholders;
- responsive report pages and focused automated tests.

The remaining work is completion and reconciliation, not foundation creation.

The independently safe next work is:

1. protect the current foundation with a consolidated regression package;
2. define a no-schema financial-year everyday cashflow and Category report contract;
3. add a derived reconciliation statement that identifies source counts and exclusions without persisting a report snapshot;
4. make the accountant-pack current planning snapshot explicitly distinct from the selected financial year;
5. improve report accessibility and source drill-down clarity;
6. prepare the exact professional-review package.

Tax-sensitive terminology, Property metadata expansion, allocations, persisted review state and document evidence remain blocked.

## 1. Current Loan reporting truth

`src/server/loan-reporting.ts` currently provides:

- owned Loan metadata and safe repayment inputs through existing owner-scoped services;
- active-Loan filtering;
- Australian financial-year boundaries;
- repayment, principal, interest and fee totals in integer cents;
- incomplete-component counts;
- matched, needs-review and unmatched reconciliation counts;
- latest recorded balance and date;
- overflow protection;
- formula-safe CSV escaping;
- neutral preparation-report wording.

The report is analytical. A reconciled everyday Transaction remains the sole cashflow record.

### Current limitation

The Loan report does not yet provide:

- source-count reconciliation explaining which repayments were excluded and why;
- a dedicated per-period component detail export beyond the current per-Loan summary;
- direct deep links to a selected Loan's exact source records;
- professionally approved final terminology.

No new Loan formula is required for those no-schema improvements.

## 2. Current Property reporting truth

`src/server/property-financial-reporting.ts` and the accepted linked-record source provide:

- active owned Property selection;
- Australian financial-year boundaries;
- current accepted linked everyday record set;
- one counted cashflow row when manual Property and Loan context overlap;
- split-parent exclusion through the canonical source service;
- separate Money in, Money out, Loan-payment cashflow and transfer context;
- separate Loan interest, fees and principal summaries;
- review flags for missing Category, relationship conflict or archived Loan context;
- no mandatory dormant tax classification.

### Current limitation

The Property report does not yet provide:

- a dedicated reconciliation statement showing source and exclusion counts;
- a financial-year Category summary export;
- explicit refund and transfer-context counts in the main UI;
- secure document evidence links;
- professionally approved final labels;
- any approved additional Property metadata beyond nickname and usage.

Exact addresses are neither required nor justified by the current reporting need.

## 3. Current accountant preparation-pack truth

`src/server/accountant-pack.ts` currently assembles a versioned manifest with:

- contract and version;
- generation timestamp;
- selected financial year;
- AUD and integer-cent declarations;
- Loan summaries;
- Property summaries;
- individual manifest, readme, Loan CSV, Property CSV and full account export links;
- a current planning snapshot;
- safe aggregate import-audit counts;
- Property, Loan-component and document evidence groups;
- explicit no-tax-advice and no-double-count guidance.

This is a real preparation pack, although it is not a single ZIP and does not include documents or accountant access.

### Current limitation

The pack does not yet include the complete original Phase 8 proposal:

- dedicated financial-year everyday cashflow CSV;
- dedicated financial-year Category CSV;
- a separate reconciliation summary file;
- actual document evidence references;
- professionally approved wording.

The `currentPlanningSnapshot` is intentionally current-month data, not a reconstructed historical financial-year snapshot. The UI currently shows active budgets and regular payments but does not state that distinction as clearly as the read model requires.

## 4. Control-document mismatch

The 17 July feature register is stale in several C4 rows:

- `LOAN-07` says the report suite is absent, although Loan FY reporting and CSV export exist;
- `TAX-01` understates the delivered Property FY report foundation;
- `REP-02` says no accountant pack exists, although a versioned multi-download pack is implemented;
- `REP-03` says the evidence list is missing, although placeholder evidence groups exist pending secure documents;
- `REP-01` does not distinguish the delivered monthly views from the still-missing dedicated FY everyday/Category exports.

These entries should be reconciled after this stacked package is dependency-ready. This audit does not rewrite the historical register in isolation because the full control-document stack has not merged.

## 5. No-schema work that is safe now

### C4.1 Foundation regression and traceability

- bind Loan, Property and accountant-pack source boundaries to existing behavioural tests;
- protect FY, integer-cent, no-double-count, formula-injection, privacy and wording boundaries;
- document current feature-register truth.

### C4.2 Everyday financial-year report contract

A later focused contract may define derived, no-schema:

- financial-year Money in and Money out totals;
- Category totals using canonical eligible Transactions;
- positive refunds kept as Money in under the accepted rule;
- transfer context kept separate;
- split children replacing counted parents;
- exact source and excluded-record counts;
- formula-safe CSV output;
- transaction drill-down links.

No tax category or deductible classification may be introduced.

### C4.3 Reconciliation statement

A later no-schema response may show:

- selected period;
- source Transaction count;
- counted split-child count;
- excluded split-parent count;
- deleted/inactive exclusion count where safely derivable;
- transfer-context count;
- reconciled Loan cashflow count;
- incomplete Loan component count;
- exact IDs only in authenticated user-owned downloads or drilldowns;
- no private narration, filenames or bank identifiers.

Persisted snapshots or pack status require a separate schema gate.

### C4.4 Accountant-pack completion

After the exact report contract is accepted, the pack may add:

- financial-year everyday cashflow CSV;
- financial-year Category CSV;
- reconciliation summary JSON or text;
- explicit current-planning-snapshot label and month;
- stronger source-file checklist guidance;
- accessibility and mobile polish.

The contract version must increment if the manifest shape changes.

## 6. Blocked work

### Professional review gate

A qualified Australian tax/accounting reviewer must approve final:

- Loan and Property report terminology;
- evidence-needed wording;
- gross-rent/refund labels if introduced;
- accountant-pack instructions and disclaimer;
- separation of records from tax conclusions.

### Material schema gate

Separate approval is required before:

- ownership shares;
- acquisition or use periods;
- mixed-purpose allocations;
- persisted accountant notes or evidence-needed lifecycle;
- reproducible report-pack snapshots;
- additional Property metadata;
- document evidence relationships beyond the approved Phase 11 metadata foundation.

### Provider and operator gates

Separate approval remains required for:

- secure object storage and malware controls;
- OCR;
- accountant invitation/access delivery;
- Production migrations or runtime activation;
- real documents or real-user workflows.

## 7. Privacy and financial boundaries

All C4 work must preserve:

- authenticated owner-scoped services;
- integer cents;
- Australian financial-year dates;
- active everyday Transactions as the sole cashflow records;
- split-parent exclusion;
- transfer context outside income/expense totals;
- LoanRepayment as analytical components only;
- no inferred missing components;
- principal shown separately and never defaulted as deductible;
- no ownership or mixed-use allocation;
- no raw CSV, filename, narration, account/BSB/card/customer identifiers or exact addresses;
- formula-safe downloads;
- no tax return, deductibility, yield, equity, valuation or advice.

## 8. Recommended focused PR sequence

1. **C4.0 — Current-state audit and consolidated regression** — this package.
2. **C4.1 — FY everyday cashflow/Category formula contract** — documentation and synthetic reconciliation fixtures.
3. **C4.2 — No-schema FY aggregation helpers and exports** — only after formulas are frozen.
4. **C4.3 — Reconciliation statement and report UI/accessibility polish**.
5. **C4.4 — Accountant-pack contract v2 and completion**.
6. **C4.5 — Professional-review package and wording amendments**.
7. **C4.6 — Metadata/evidence schema assessment**, only if still required after professional/client decisions.
8. **C4.7 — Consolidated authenticated QA and deferred client review**.

## 9. Exit criteria

The existing-schema C4 portion is technically ready for dependency-ordered review when:

- the current foundation is regression-protected;
- every new formula reconciles to canonical source IDs and integer-cent totals;
- dedicated FY everyday and Category reports are implemented if retained in release scope;
- accountant-pack contents and current-month planning context are truthful;
- exports are formula-safe and owner-scoped;
- report pages pass responsive and accessibility checks;
- professional-review blockers are recorded without unapproved wording;
- document and schema-dependent items remain fail-closed;
- no Production, provider or Apple action occurs.