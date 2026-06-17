# Autonomous Phase Delivery Mode

SpendGrove is developed in approved phases. Once the client approves a phase objective and PR sequence, the agent may deliver that phase autonomously, one focused PR at a time, until a stop condition is reached or the phase is ready for client testing.

## Objective

Reduce routine PR-by-PR client approval. The client should mostly act as a product owner and user tester at phase-level or major milestone checkpoints, while the agent handles technical delivery, self-review, green builds, privacy gates and routine merges inside the approved phase.

## Client role

The client acts as:

- Product Owner.
- UX Reviewer for phase-level or major workflow testing.
- Acceptance Tester.
- Scope Approver.
- Privacy, security, provider and commercial decision maker.

The client should not need to review every technical PR when the work is already inside an approved phase, green, in scope and privacy-safe.

## Agent role

The agent acts as:

- Lead Developer.
- UI Implementer.
- QA Engineer.
- Technical Architect within approved scope.
- Privacy/security gatekeeper.

The agent should make routine technical decisions, create focused PRs, run checks, update review packages, merge passing PRs and continue through the approved phase sequence without unnecessary pauses.

## Approved-phase workflow

For an approved phase, the agent may:

1. Confirm the phase objective and approved PR sequence.
2. Create focused branches and PRs for each step.
3. Implement only the approved PR scope.
4. Run the full relevant tests, build and Vercel checks.
5. Self-review each PR against repository control docs and the master specification.
6. Confirm privacy, security, data ownership and scope gates before merge.
7. Merge routine PRs automatically when green, in scope and not blocked.
8. Continue to the next approved PR in the same phase.
9. Provide concise status updates when useful, without stopping after every routine PR.
10. Stop only when a defined stop condition is triggered.

## Routine PR merge authority

Within an approved phase, the agent may merge a routine PR without additional client approval when all of the following are true:

- The PR is inside the approved phase sequence.
- Tests/build/Vercel checks are green or documented non-blocking exceptions are clearly safe.
- The PR body includes a clear review package.
- Scope has not expanded beyond the approved phase.
- Privacy, security and financial-data integrity gates pass.
- No real/private data, secrets, raw CSVs or excluded modules are introduced.
- No stop condition is triggered.

## Stop conditions

The agent must stop and ask the client before continuing if any of the following occurs:

- A Vercel, test or build failure cannot be fixed safely within scope.
- Scope needs to expand beyond the approved phase.
- A new package, provider or service is required beyond what is already approved.
- Real secrets, API keys or Vercel environment variables must be configured by the client.
- A paid service/account decision is needed.
- A material schema or data-model decision is needed that was not already approved.
- Production auth/database provider decisions change.
- Privacy, security, logging, file-handling or retention rules may be affected.
- Real/private CSVs or user data are needed beyond temporary local structural testing.
- There is a risk of storing or exposing raw CSVs, raw rows, filenames, raw bank descriptions, account identifiers, BSBs, card fragments, customer IDs, loan references, balances or private identifiers.
- Implementation would add Basiq, enhanced merchant lookup, AI, payments, loans, property/tax reports, recurring, budgets or later-phase modules without explicit approval.
- Client visual feedback is needed before finalising a major new UI pattern.
- A PR cannot be merged safely because status, diff, Vercel result, privacy posture or scope is unclear.

## Self-review requirements

Before merging any autonomous PR, the agent must check the PR against:

- `AGENTS.md`.
- `PLAN.md`.
- `docs/BUILD_PLAN.md`.
- `docs/MVP_SCOPE.md` where applicable.
- `docs/REVIEW_GATES.md`.
- `docs/DEFINITION_OF_DONE.md`.
- `docs/CSV_TESTING_PROTOCOL.md` for import/CSV work.
- `docs/DECISION_LOG.md`.
- The master specification and machine-readable companion where relevant.

## Phase-level client review

At the end of each approved phase, the agent must provide the client with:

- A final phase summary.
- Final Vercel app link.
- Non-technical user-testing checklist.
- Screens/workflows to test.
- Questions the client should answer.
- Known limitations and deferred items.
- Recommended UI/UX tweaks or next options.

The client should mainly test as a user:

- Does it look right?
- Can the workflow be completed?
- Is the wording clear?
- Is anything confusing?
- Does it feel simple enough for a beginner budgeting app user?

## Required Phase Summary Report

Before a phase can be recommended for formal closure, the agent must create a complete Phase Summary Report, preferably as a committed Markdown file such as `docs/PHASE_3A_SUMMARY.md`.

The report must be written in plain English so the client can copy it into a ChatGPT project chat to update the development history.

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

## Private CSV handling

Real client CSVs are private local test data only. The agent may inspect them only for safe structural learnings such as column count, header/headerless shape, account type, debit/credit structure, signed amount structure, row count and parser warning patterns.

The agent must not:

- commit private CSVs;
- paste raw rows, filenames or private values into PRs, docs, logs, comments or screenshots;
- create fixtures directly from private values;
- expose filenames/private values in the app UI or PR text;
- upload private CSVs to third-party services;
- store raw descriptions, account numbers, BSBs, card fragments, customer IDs, loan references, balances or private identifiers.

Any learning from private CSVs must be converted into fictional synthetic fixtures before being committed.

## Progress reporting

For long-running work, provide concise updates at meaningful points:

- phase objective confirmed;
- PR opened or merged;
- Vercel/tests green;
- blocker found;
- phase summary ready;
- client user-testing requested.

Avoid low-level file-by-file noise unless it affects scope, privacy, security, testing or a client decision.
