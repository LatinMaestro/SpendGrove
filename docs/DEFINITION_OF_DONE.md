# Definition of Done

A feature, PR or phase is not complete merely because code exists.

## Feature Definition of Done

A feature is done only when:

- behaviour matches the approved task;
- scope has not silently expanded;
- UI works on iPhone-sized screens where applicable;
- web/desktop layout works where applicable;
- validation is implemented;
- loading, empty and error states are handled where relevant;
- money is stored/calculated in integer cents;
- privacy rules are preserved;
- imported data remains review-before-commit;
- tests/checks pass or exceptions are documented;
- screenshots/previews are provided for UI work where relevant;
- known limitations are documented.

## Autonomous PR Definition of Done

A routine PR inside an approved phase may be merged autonomously only when:

- it is inside the approved phase sequence;
- the PR review package is complete;
- tests/build/Vercel checks are green or documented exceptions are clearly safe;
- privacy, security, data ownership and financial-data integrity gates pass;
- no real/private data, secrets, raw CSVs or excluded modules are introduced;
- no stop condition from `docs/AUTONOMOUS_DELIVERY_MODE.md` is triggered.

## CSV/import Definition of Done

CSV/import work is done only when:

- private fields are detected/excluded;
- raw CSVs are not stored by default;
- original filenames are not stored or displayed by default;
- no private values appear in logs, docs, PRs or screenshots;
- import rows are reviewable;
- Import, Skip and Merge are supported in the relevant layer;
- low-confidence files can be manually mapped or safely rejected;
- import summary/batch metadata is safe and privacy-filtered;
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
- user ownership is enforced for durable records;
- import metadata is not confused with raw private data.

## UI Definition of Done

UI work is done only when:

- mobile screenshot/preview or Vercel review path is available where applicable;
- layout is not clipped on iPhone-sized viewport;
- touch targets are usable;
- wording is plain English;
- accessibility basics are respected;
- visual style follows the SpendGrove green/teal direction;
- client review is completed at the appropriate phase/milestone checkpoint or explicitly deferred.

## Phase Definition of Done

A phase is done only when:

- all approved phase scope is implemented or deferred with reasons;
- all routine PRs are merged or explicitly deferred;
- tests/checks pass or documented exceptions are accepted;
- final main/Vercel build status is known;
- privacy/data/security rules are preserved;
- client change requests are resolved or deferred;
- decision log is updated for material decisions;
- a complete Phase Summary Report exists;
- a non-technical user-testing checklist is provided;
- screens/workflows for client manual testing are listed;
- known limitations and deferred items are recorded;
- the client explicitly approves formal phase closure.

## Phase Summary Report Definition of Done

The required Phase Summary Report is done only when it includes:

1. Phase name and objective.
2. Start and end status.
3. PRs completed during the phase.
4. Merge commits for each PR.
5. Features added.
6. UI/workflow changes.
7. Data model/schema changes.
8. Auth/database/environment changes.
9. Privacy and security controls added or preserved.
10. Testing/build/Vercel results.
11. Known limitations.
12. Deferred items.
13. Decisions made during the phase.
14. Client decisions still required.
15. Final Vercel preview/main deployment link.
16. Recommended user-testing checklist.
17. Screens/workflows the client should manually test.
18. Questions the client should answer as a user/client.
19. Recommended next phase or next options.
