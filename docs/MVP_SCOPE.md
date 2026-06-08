# MVP Scope Lock — Phase 1

## Active phase

**Phase 1 - MVP Foundation**

The agent is authorised to work autonomously inside Phase 1 only.

## Phase 1 goal

Create the SpendGrove app foundation so the client can:

- see the mobile-first SpendGrove UI direction;
- add, edit, delete and view manual transactions;
- use Australian seeded categories;
- see Simple Mode and feature flags;
- begin the transaction CSV import flow;
- privacy-scan CSV structure;
- map/review/import/skip/merge rows where practical;
- view basic import history;
- see local merchant-rule foundations where practical.

## Included in Phase 1

- App shell and navigation.
- SpendGrove theme foundation.
- Onboarding / first-run privacy positioning.
- Settings foundation.
- Simple Mode default.
- Feature-flag structure.
- Australian category seed data.
- Manual transaction CRUD.
- Integer-cents money handling.
- Transaction list and transaction detail/edit flow.
- Future CSV match hint field/foundation.
- Basic duplicate detection foundation.
- CSV import entry flow.
- Privacy-first CSV upload/scanning foundation.
- Bank detection/profile foundation where practical.
- Manual mapping foundation where practical.
- Import review foundation with Import, Skip and Merge model/UX direction.
- Import history structure.
- Basic local merchant cleanup/rules foundation where practical.
- Synthetic CSV fixtures.
- Safe sample-data folder structure.
- Testing foundations.

## Excluded from Phase 1 unless explicitly approved

- Home loan CSV import implementation.
- Personal loan CSV import implementation.
- Property tax reports.
- Full property management.
- Recurring/subscription detection.
- Full budgets module.
- Advanced insights/charts.
- Basiq/enhanced merchant lookup.
- AI features.
- Household sharing.
- Net worth module.
- Document/receipt storage.
- Production payments/paywalls.
- Production App Store submission workflow.
- Live bank linking/open banking.
- Raw CSV archival.
- PDF bank statement parsing.

## Allowed placeholders

The agent may create disabled route stubs, feature flags or navigation placeholders for future modules only where they improve product structure and do not mislead the user into thinking unfinished features are complete.

## Phase 1 exit criteria

Phase 1 is complete only when:

- manual transaction CRUD works;
- money is stored/calculated as integer cents;
- Australian categories are seeded;
- app shell is mobile-first and client-reviewed;
- CSV import foundation preserves privacy-first review-before-commit rules;
- basic import history exists or is structurally ready;
- relevant tests/checks pass or exceptions are documented;
- client change requests are resolved/deferred;
- client approves progression to Phase 2.
