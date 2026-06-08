# Definition of Done

A feature, PR or milestone is not complete merely because code exists.

## Feature Definition of Done

A feature is done only when:

- behaviour matches the approved task;
- scope has not silently expanded;
- UI works on iPhone-sized screens;
- web/desktop layout works where applicable;
- validation is implemented;
- loading, empty and error states are handled where relevant;
- money is stored/calculated in integer cents;
- privacy rules are preserved;
- imported data remains review-before-commit;
- tests/checks pass or exceptions are documented;
- screenshots/previews are provided for UI work;
- known limitations are documented.

## CSV/import Definition of Done

CSV/import work is done only when:

- private fields are detected/excluded;
- raw CSVs are not stored by default;
- no private values appear in logs;
- import rows are reviewable;
- Import, Skip and Merge are supported in the relevant layer;
- low-confidence files can be manually mapped or safely rejected;
- import summary/batch metadata is recorded;
- synthetic/regression fixtures cover the behaviour;
- CSV test report is provided.

## Transaction Definition of Done

Transaction work is done only when:

- create/list/edit/delete/duplicate works as scoped;
- amount input is converted to integer cents;
- Australian date/currency display is used;
- category handling works;
- duplicate warning/foundation exists where scoped;
- split rules are preserved when splits are in scope;
- import metadata is not confused with raw private data.

## UI Definition of Done

UI work is done only when:

- mobile screenshot/preview is available;
- layout is not clipped on iPhone-sized viewport;
- touch targets are usable;
- wording is plain English;
- accessibility basics are respected;
- visual style follows the SpendGrove green/teal direction;
- client has reviewed or explicitly deferred review.

## Milestone Definition of Done

A milestone is done only when:

- all approved milestone scope is implemented or deferred with reasons;
- tests/checks pass or documented exceptions are accepted;
- privacy/data/security rules are preserved;
- client change requests are resolved or deferred;
- decision log is updated for material decisions;
- the client approves milestone closure.
