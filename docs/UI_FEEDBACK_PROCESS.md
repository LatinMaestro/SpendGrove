# UI Feedback Process

## Purpose

The client wants to review SpendGrove’s UI as a user/client, not as a technical PR reviewer. Under Autonomous Phase Delivery Mode, routine PR-by-PR UI approval is reduced. Client UI review happens mainly at phase-level or major milestone checkpoints, with earlier review only when a major new UI pattern needs feedback before the agent can safely continue.

## Process

### 1. Agent builds within the approved phase

For routine UI work inside an approved phase, the agent may:

- implement the approved workflow;
- self-review mobile and desktop behaviour;
- run tests/build/Vercel checks;
- merge green, in-scope, privacy-safe PRs;
- continue to the next approved PR.

### 2. Agent presents phase-level UI for testing

At the phase or major milestone review point, the agent provides:

- final Vercel app link;
- what changed;
- screens/workflows to test;
- known limitations;
- safe testing instructions;
- non-technical user-testing checklist;
- questions the client should answer.

### 3. Client gives feedback

The client can provide feedback in normal language. The agent should not require design jargon.

Useful feedback includes:

- “This is confusing.”
- “The button is hard to find.”
- “The wording feels too technical.”
- “This flow feels too busy.”
- “This screen feels right.”

### 4. Agent implements approved feedback

Where practical, the agent should:

- update the relevant branch/PR or create a focused stabilisation PR;
- explain what changed;
- re-run relevant checks;
- provide updated preview notes.

### 5. Client approves closure or requests changes

The phase or milestone becomes accepted only when:

- the client approves it;
- requested changes are resolved; or
- open items are explicitly deferred to a later phase/backlog.

## When to stop early for UI feedback

The agent must stop before finalising a UI direction when:

- a major new workflow pattern is being introduced;
- the UI choice materially affects beginner usability;
- the pattern would be expensive to unwind later;
- the client explicitly requested visual review before continuing;
- a design decision conflicts with privacy, accessibility or financial-data integrity.

## Agent rules

- Keep UI simple, mobile-first and plain-English.
- Treat UI feedback as normal change requests, not as a failure.
- If requested changes conflict with privacy, accessibility or financial data integrity, explain the conflict and propose a safer alternative.
- Do not argue subjective style choices unless there is a material usability, accessibility or technical concern.
- Do not expose real CSVs, real financial data, private screenshots or secrets in preview deployments.

## UI change-request log

For material UI changes, the PR or phase report should include:

| Request | Action taken | Status |
|---|---|---|
| Example: Make primary buttons larger | Increased button height and label weight | Done |

## Preferred visual review method

Once Vercel is connected, the preferred method is to review the live Vercel preview or final phase deployment and leave visual comments directly on the page using the Vercel Toolbar / Comments feature where available.

The agent should:

1. Include the preview/final link.
2. State which screens need review.
3. Confirm preview data is synthetic/safe.
4. Provide a non-technical testing checklist.
5. Convert visual comments into implementation tasks.
6. Summarise comments addressed, deferred or rejected.

See `docs/VERCEL_VISUAL_REVIEW.md` for the full process.
