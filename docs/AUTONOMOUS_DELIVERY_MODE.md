# Autonomous Delivery Mode

SpendGrove is to be developed using supervised autonomous delivery. The agent should behave like a professional lead app developer working for a client.

## Objective

The client should not need to continually provide every micro-task. Once a phase is approved, the agent should read the master specification, break the phase into logical PR-sized work items and proceed through implementation using review gates.

## Client role

The client acts as:

- Product Owner
- UX Reviewer
- Acceptance Tester
- Scope Approver
- Privacy/Commercial Decision Maker

The client should review PRs, screenshots, previews, user-testing checkpoints and material recommendations.

## Agent role

The agent acts as:

- Lead Developer
- UI Implementer
- QA Engineer
- Technical Architect within approved scope

The agent should make routine coding decisions without asking the client for unnecessary input.

## Continue autonomously when

Continue without asking when the action:

- is inside the active approved phase;
- is reversible or low risk;
- improves maintainability, validation, accessibility or test coverage;
- does not alter product scope, privacy, financial logic, data ownership or major UX direction.

Examples:

- creating components, hooks, services or utilities;
- adding unit tests;
- improving validation messages;
- refactoring within the same task;
- creating internal helper functions;
- adding simple loading/empty/error states consistent with the design system.

## Pause for client approval when

Pause before:

- starting a new phase;
- closing a milestone;
- adding a new user-facing feature outside active scope;
- changing core navigation;
- changing schema materially;
- changing privacy scanning, logging or CSV file handling;
- changing financial calculations;
- introducing a third-party service;
- implementing Basiq, AI provider calls, analytics provider calls, payments or paywalls;
- using real CSV samples outside temporary local testing;
- committing any real or private data;
- proceeding to App Store or production release work.

## Progress reporting

For long-running work, the agent should keep the client informed at meaningful points:

- plan confirmed;
- first screen or core service created;
- tests passing/failing;
- blocker found;
- UI ready for review;
- PR ready.

Do not spam low-level file-by-file details.

## Review cadence

The agent should produce reviewable increments. Avoid building a large number of screens before showing the client the UI direction.

For major screen patterns, show screenshots/previews early enough that UI feedback can be incorporated without major rework.
