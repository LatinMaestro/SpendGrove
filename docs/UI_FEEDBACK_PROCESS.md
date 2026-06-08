# UI Feedback Process

## Purpose

The client wants to review SpendGrove’s UI and request changes the way a client would with a real app developer.

## Process

### 1. Agent presents UI

For each major screen or workflow, the agent provides:

- Vercel preview link where available;
- screenshot or preview notes;
- what changed;
- what to review;
- known limitations;
- any design-system deviations.

### 2. Client gives feedback

The client can provide feedback in normal language. The agent should not require design jargon.

### 3. Agent implements changes

Where practical, the agent should:

- update the same branch/PR;
- explain what changed;
- re-run relevant checks;
- provide updated screenshot/preview.

### 4. Client approves or requests further changes

The screen/workflow becomes accepted only when:

- the client approves it;
- the PR is approved; or
- the item is explicitly deferred to backlog.

## Agent rules

- Do not build too far ahead on a new UI pattern before review.
- Treat UI feedback as normal change requests, not as a failure.
- If requested changes conflict with privacy, accessibility or financial data integrity, explain the conflict and propose a safer alternative.
- Do not argue subjective style choices unless there is a material usability, accessibility or technical concern.

## UI change-request log

For material UI changes, the PR should include:

| Request | Action taken | Status |
|---|---|---|
| Example: Make primary buttons larger | Increased button height and label weight | Done |


## Preferred visual review method

Once the app has a deployable UI and Vercel is connected, the preferred method is to review the live Vercel preview and leave visual comments directly on the page using the Vercel Toolbar / Comments feature where available.

The agent should:

1. Include the preview link in the PR.
2. State which screens need review.
3. Confirm preview data is synthetic/safe.
4. Wait for client comments or approval.
5. Convert visual comments into implementation tasks.
6. Update the PR and preview.
7. Summarise comments addressed, deferred or rejected.

See `docs/VERCEL_VISUAL_REVIEW.md` for the full process.
