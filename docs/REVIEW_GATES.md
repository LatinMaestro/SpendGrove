# Review Gates

Review gates protect SpendGrove’s product direction, privacy model, financial data integrity and UI quality.

## Pull request review gate

Every PR must include:

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

## UI review gate

Required when a user-facing screen, workflow or major component pattern is introduced or materially changed.

Agent must provide:

- iPhone-sized screenshot or preview note;
- web/desktop screenshot where relevant;
- empty state if applicable;
- loading/error/warning states where applicable;
- UX reasoning;
- accessibility notes;
- deviations from the design system.

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

## User testing gate

Required when the client needs to test the app with real bank/account CSVs.

Agent must provide:

- what to test;
- which file types to test;
- expected results;
- what screenshots are safe/unsafe;
- what information to report back;
- reminder not to commit or share private CSVs.

## Milestone closure gate

A milestone can close only when:

- approved scope works;
- tests/checks pass or exceptions are documented;
- privacy/data integrity rules are preserved;
- UI has been reviewed where relevant;
- client change requests are resolved/deferred;
- known limitations are recorded;
- client approves progression.


## Vercel visual review gate

Required for user-facing UI PRs once Vercel is configured.

Agent must provide:

- Vercel preview link;
- screens/workflows requiring review;
- confirmation that preview data is synthetic/safe;
- summary of visual comments received;
- action taken for each visual comment;
- updated preview link or confirmation the same preview has updated.

If Vercel is not configured or the preview failed, the agent must explain why and provide screenshots or local preview instructions instead. Vercel availability should not block early Phase 1 setup, but should be connected once the app shell exists.
