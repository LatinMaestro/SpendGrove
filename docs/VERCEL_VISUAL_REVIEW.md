# Vercel Visual Review Workflow

## Purpose

SpendGrove should be reviewed visually at UI checkpoints, not only through code diffs. The preferred review workflow is:

```text
Codex builds feature branch
→ GitHub pull request opens
→ Vercel creates preview deployment
→ Client opens preview link
→ Client leaves visual comments on the screen
→ Agent implements approved changes in the same PR where practical
```

This workflow supports the client/developer model: the coding agent acts like the app developer, and the client reviews the app interface and requests changes.

## Required setup

When the project is ready for visual previews:

1. Connect the private GitHub repository to Vercel.
2. Configure Vercel to create preview deployments for pull requests.
3. Enable Vercel Comments / Vercel Toolbar for preview feedback where available.
4. Confirm preview deployments do not expose private CSVs, private screenshots or real financial data.
5. Ensure environment variables are separated between development, preview/staging and production.

## Agent responsibilities

For each PR involving user-facing UI, the agent should provide:

- GitHub PR link;
- Vercel preview link, once available;
- list of screens/workflows to review;
- iPhone-sized screenshot where practical;
- desktop/web screenshot where relevant;
- known limitations;
- specific UI areas where client feedback is requested.

If a Vercel preview is unavailable, the agent must state why and provide screenshots or local preview instructions instead.

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

The agent should translate visual comments into implementation changes, update the same PR where practical and return an updated preview.

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

Where Vercel is used, the PR review package must include:

| Item | Required content |
|---|---|
| Preview link | Vercel preview URL or reason unavailable |
| Visual review scope | Screens and flows the client should inspect |
| Comment status | Summary of visual comments addressed, deferred or rejected |
| Privacy confirmation | Confirmation no real CSV/private data appears in the preview |
| Updated preview | Revised preview after change requests, where relevant |

## Do not block Phase 1 on Vercel

Vercel preview deployment is strongly recommended for UI review, but the agent may start Phase 1 before Vercel is configured. Once app shell/UI work exists, Vercel should be connected so subsequent PRs have visual previews.
