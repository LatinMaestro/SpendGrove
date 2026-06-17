# Review Gates

Review gates protect SpendGrove’s product direction, privacy model, financial data integrity and UI quality.

## Autonomous Phase Delivery Mode

Within an approved phase, the agent may merge routine PRs without PR-by-PR client approval when:

- the PR is inside the approved phase sequence;
- tests/build/Vercel checks are green;
- scope has not expanded;
- the PR body includes the required review package;
- privacy, security and financial-data integrity gates pass;
- no private data, secrets, raw CSVs or excluded modules are introduced;
- no stop condition from `docs/AUTONOMOUS_DELIVERY_MODE.md` is triggered.

Client review moves primarily to phase-level or major milestone-level user testing. The agent must still stop before continuing when a stop condition is triggered.

## Pull request review gate

Every PR must include a review package, even when the agent may merge it autonomously.

Required PR review package:

1. Summary.
2. Scope confirmation.
3. Phase alignment.
4. Screenshots or preview notes for UI changes.
5. Vercel preview link where available.
6. Data model changes.
7. Privacy impact.
8. Security impact.
9. Testing evidence.
10. Known limitations.
11. Change-request log, including visual comments if applicable.
12. Next recommended task.
13. Confirmation that no stop condition was triggered.

## Stop-condition review gate

The agent must stop and ask the client before proceeding when any of the following applies:

- Vercel, tests or build fail and the fix is not clearly safe and in scope.
- Scope must expand beyond the approved phase.
- A new package, provider, paid service or external account decision is required beyond what was approved.
- Real secrets, API keys or Vercel environment variables must be configured by the client.
- Material unapproved schema/data-model changes are needed.
- Production auth/database provider decisions would change.
- Privacy/security/logging/file-handling/retention rules may be affected.
- Real/private CSVs are needed beyond temporary local structural testing.
- There is any risk of storing or exposing raw CSVs, raw rows, filenames, raw bank descriptions, account identifiers, BSBs, card fragments, customer IDs, loan references, balances or private identifiers.
- The work would add Basiq, enhanced merchant lookup, AI, payments, loans, property/tax reports, recurring, budgets or later-phase modules without approval.
- Client visual feedback is needed before finalising a major new UI pattern.
- PR status, diff, Vercel result, privacy posture or scope is unclear.

## UI review gate

Required when a user-facing screen, workflow or major component pattern is introduced or materially changed.

Under Autonomous Phase Delivery Mode, routine small UI changes inside an approved pattern may be self-reviewed and merged when green. Client visual review is required at phase-level or major milestone checkpoints, and earlier when a major new UI pattern needs feedback before the agent can safely continue.

Agent must provide:

- Vercel preview link where available;
- iPhone-sized screenshot or preview note where practical;
- web/desktop screenshot where relevant;
- empty state if applicable;
- loading/error/warning states where applicable;
- UX reasoning;
- accessibility notes;
- deviations from the design system;
- screens/workflows the client should test at phase review.

Client may request changes to:

- button size/placement;
- card layout;
- colour balance;
- spacing;
- wording;
- navigation labels;
- screen density;
- hierarchy;
- beginner-friendliness.

## Data/privacy review gate

Required before:

- storing new data types;
- changing CSV privacy scanning;
- changing file handling;
- changing logging;
- adding analytics;
- adding monitoring metadata involving user behaviour;
- changing data retention/deletion behaviour;
- adding document storage;
- adding third-party provider calls.

Inside an approved phase, previously approved data/privacy changes may proceed autonomously only when they remain exactly within the approved scope and preserve the documented privacy rules.

## Financial logic review gate

Required before changing:

- money storage/calculation;
- split transaction counting;
- duplicate thresholds;
- import merge rules;
- loan reconciliation;
- tax grouping;
- report calculations;
- budget calculations.

## CSV parser review gate

Required when parser/import behaviour is added or materially changed.

Agent must provide a CSV test report covering:

- fixture files tested;
- account type;
- bank/profile detected;
- private fields found;
- rows parsed;
- rows needing mapping;
- duplicate/merge outcomes;
- import-review issues;
- unsupported format notes;
- synthetic/redacted fixture updates.

Private client CSVs may be used only for temporary local structural testing. Reports must use safe aggregate labels only and must not include private filenames, raw rows, raw descriptions, balances, identifiers or private values.

## User testing gate

Required at phase-level or major milestone-level when the client needs to test the app as a user.

Agent must provide:

- final Vercel app link;
- what screens/workflows to test;
- what file/account types to test where applicable;
- expected results;
- what screenshots are safe/unsafe;
- what information to report back;
- plain-English questions the client should answer;
- reminder not to commit or share private CSVs or screenshots showing private transactions.

## Phase Summary Report gate

Required before a phase can be recommended for formal closure.

The agent must create a complete Phase Summary Report, preferably as a committed Markdown file such as `docs/PHASE_3A_SUMMARY.md`.

The report must include:

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

## Milestone closure gate

A milestone or phase can close only when:

- approved scope works or is explicitly deferred with reasons;
- tests/checks pass or exceptions are documented;
- privacy/data/security rules are preserved;
- UI has been reviewed at the appropriate phase or milestone checkpoint;
- client change requests are resolved/deferred;
- known limitations are recorded;
- the decision log is updated for material decisions;
- the required Phase Summary Report exists;
- the client approves progression or closure.

## Vercel visual review gate

Required for user-facing UI PRs once Vercel is configured.

Agent must provide:

- Vercel preview link;
- screens/workflows requiring review;
- confirmation that preview data is synthetic/safe;
- summary of visual comments received;
- action taken for each visual comment;
- updated preview link or confirmation the same preview has updated.

Under Autonomous Phase Delivery Mode, Vercel previews support agent self-review for routine PRs and client user testing at phase/milestone checkpoints.

If Vercel is not configured or the preview failed, the agent must explain why and provide screenshots or local preview instructions instead. Vercel availability should not block early setup, but unclear Vercel status is a stop condition for autonomous merging.
