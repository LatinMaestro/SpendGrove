# Specification Source of Truth

Primary master specification:

- `docs/SpendGrove_v2_0_Master_Specification_Completeness_Checked.docx`

Machine-readable companion for coding agents:

- `docs/SpendGrove_v2_0_Master_Specification_Completeness_Checked.md`

The Word document remains the primary formatted master specification and authoritative product and technical brief for SpendGrove. It supersedes earlier v1.x documents and the v2.0 framework/addendum.

The Markdown file is the complete machine-readable companion. Coding agents should read it first for implementation and planning decisions because it can be processed reliably without truncated document extraction. It does not replace the Word document. If the two versions appear to conflict, preserve privacy, security and financial integrity, then pause for client confirmation.

## How agents should use it

Before starting any new task, the agent should:

1. Read the relevant sections of the machine-readable Markdown companion.
2. Treat the Word document as the primary formatted master specification.
3. Read `AGENTS.md`.
4. Read the active phase files in `/docs`.
5. Confirm the task is inside the active approved phase.
6. Build on a feature branch.
7. Provide a review package before merge.

## Conflict rule

If a prompt, code comment, previous implementation or repository note conflicts with the master specification, the agent should:

1. Preserve privacy, security and financial data-integrity requirements.
2. Pause if the conflict is material.
3. Present the conflict in the review package.
4. Ask the client to confirm the intended direction before implementing the material change.

## Planning and visual review pointers

- `PLAN.md` is a root-level pointer to `docs/BUILD_PLAN.md`.
- `docs/VERCEL_VISUAL_REVIEW.md` defines the preferred live preview and visual comment workflow once Vercel is connected.
- `.github/pull_request_template.md` standardises review packages for GitHub PRs.
