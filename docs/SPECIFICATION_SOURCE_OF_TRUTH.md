# Specification Source of Truth

Primary master specification:

- `docs/SpendGrove_v2_0_Master_Specification_Completeness_Checked.docx`

The master specification is the authoritative product and technical brief for SpendGrove. It supersedes earlier v1.x documents and the v2.0 framework/addendum.

## How agents should use it

Before starting any new task, the agent should:

1. Read the relevant sections of the master specification.
2. Read `AGENTS.md`.
3. Read the active phase files in `/docs`.
4. Confirm the task is inside the active approved phase.
5. Build on a feature branch.
6. Provide a review package before merge.

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
