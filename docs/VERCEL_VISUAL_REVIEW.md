# Vercel Visual Review Workflow

## Purpose

SpendGrove should be reviewed visually at appropriate UI checkpoints, not only through code diffs. Under Autonomous Phase Delivery Mode, Vercel previews support both agent self-review for routine PRs and client user testing at phase-level or major milestone checkpoints.

Preferred phase-level review workflow:

```text
Codex completes approved phase PR sequence
→ checks and Vercel builds pass
→ Phase Summary Report is created
→ final Vercel app link is provided
→ client tests as a user
→ client provides UI/UX/workflow feedback
→ Codex fixes accepted feedback or records deferrals
```

For major new UI patterns, the agent may request earlier client review before continuing if the pattern would be risky to finalise without feedback.

## Required setup

When the project is ready for visual previews:

1. Connect the private GitHub repository to Vercel.
2. Configure Vercel to create preview deployments for pull requests.
3. Enable Vercel Comments / Vercel Toolbar for preview feedback where available.
4. Confirm preview deployments do not expose private CSVs, private screenshots or real financial data.
5. Ensure environment variables are separated between development, preview/staging and production.

## Agent responsibilities

For PRs involving user-facing UI, the agent should provide preview notes in the PR package. For phase-level client testing, the agent must provide:

- GitHub summary/report link;
- Vercel final app or preview link;
- list of screens/workflows to review;
- non-technical user-testing checklist;
- known limitations;
- specific questions for the client;
- confirmation that preview data is synthetic/safe.

If a Vercel preview is unavailable, unclear or failed, the agent must stop before autonomous merge when the status affects safety, and explain why with next steps.

## Client visual comments

The client may comment directly on the preview, including feedback such as:

- move this button;
- reduce screen clutter;
- make this card larger;
- change the wording;
- use more SpendGrove green/teal;
- make the import process less technical;
- make mobile spacing more comfortable;
- simplify this screen for beginner users.

The agent should translate visual comments into implementation changes, update the same PR or a focused stabilisation PR where practical, and return an updated preview.

## Privacy rules for previews

Preview deployments must never include:

- real bank CSV files;
- real account numbers, BSBs, card numbers or customer IDs;
- screenshots containing real financial data;
- raw CSV parser dumps;
- provider secrets or environment variables;
- production user data.

All preview data should be synthetic or explicitly safe demo data unless the client approves a private local testing process outside the public preview.

## Review package addition

Where Vercel is used, the PR or phase review package must include:

| Item | Required content |
|---|---|
| Preview/final link | Vercel preview URL, final app URL or reason unavailable |
| Visual review scope | Screens and flows the client should inspect |
| Comment status | Summary of visual comments addressed, deferred or rejected |
| Privacy confirmation | Confirmation no real CSV/private data appears in the preview |
| Updated preview | Revised preview after change requests, where relevant |

## Autonomous merge rule

A routine PR inside an approved phase may be merged autonomously when Vercel is green, scope and privacy gates pass, and no stop condition is triggered. If Vercel status is missing, failed or unclear, the agent must stop unless the PR is explicitly non-deploying documentation and the exception is safe and documented.
