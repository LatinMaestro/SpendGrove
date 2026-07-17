# SpendGrove

SpendGrove is a privacy-first Australian personal finance app built around user-controlled CSV transaction import, review-before-commit, merchant categorisation, loan/property tracking and future web/mobile account sync.

This repository is to be developed using the **SpendGrove v2.0.1 Master Specification** as the source of truth for implementation decisions:

- `docs/SpendGrove_v2_0_Master_Specification_Completeness_Checked.md`

The formatted Word document remains the human-readable version:

- `docs/SpendGrove_v2_0_Master_Specification_Completeness_Checked.docx`

Repository control files such as `AGENTS.md`, `docs/BUILD_PLAN.md`, `docs/MVP_SCOPE.md` and `docs/REVIEW_GATES.md` exist to make the master specification practical for day-to-day agent work. They do not replace the master specification.

## Current delivery mode

The active delivery mode is **supervised autonomous Codex delivery**.

The agent should:

1. Read the master specification and all control files.
2. Work through the active approved phase autonomously.
3. Create feature branches and pull requests.
4. Provide screenshots or preview notes for UI review.
5. Pause for review gates, user testing, privacy decisions, schema decisions, payment decisions, third-party integrations and milestone approvals.

The client acts as product owner, UX reviewer and acceptance tester.

## Active phase

> **Phase 5 — Production Readiness, pending consolidated client acceptance**

All currently authorised repository work through Phase 5 Milestones 1–6 is implemented. The immediate release target remains an account-based controlled Australian web private beta.

SpendGrove is conditionally ready only after mandatory Clerk Production, environment-separation, migration-health, recovery, Groveware contact and legal-review actions are completed. Phase 5 is not formally closed, Phase 6 is unapproved, and no Production migration, public launch, native package or App Store submission is authorised.

See `docs/PHASE_5_SUMMARY.md` and `docs/PHASE_5_CLIENT_REVIEW_CHECKLIST.md`.

## Required repository files

The repository should include:

```text
AGENTS.md
PLAN.md
README.md
.github/pull_request_template.md
docs/AUTONOMOUS_DELIVERY_MODE.md
docs/MVP_SCOPE.md
docs/BUILD_PLAN.md
docs/REVIEW_GATES.md
docs/DEFINITION_OF_DONE.md
docs/DESIGN_SYSTEM.md
docs/UI_REVIEW_GUIDE.md
docs/UI_FEEDBACK_PROCESS.md
docs/VERCEL_VISUAL_REVIEW.md
docs/CSV_TESTING_PROTOCOL.md
docs/DECISION_LOG.md
docs/CODEX_BOOTSTRAP_PROMPT.md
sample-data/synthetic/
sample-data/private-local/
assets/brand/
```

## Visual review workflow

When the app has a running UI, connect the GitHub repository to Vercel so pull requests can generate preview deployments. The preferred review workflow is:

```text
Codex branch → GitHub PR → Vercel preview → client visual comments → agent updates PR
```

Use `docs/VERCEL_VISUAL_REVIEW.md` with `docs/UI_FEEDBACK_PROCESS.md` for visual review. Vercel is not required to start Phase 1, but it should be connected once the app shell is available so UI review can happen on live previews.

## Privacy and sample data

- Use `sample-data/synthetic/` for safe fictional fixtures that may be committed.
- Use `sample-data/private-local/` only for temporary private bank CSV testing.
- Never commit real bank CSVs, raw parser dumps, private screenshots or unredacted financial data.
- Convert parser learnings from real CSVs into safe synthetic or redacted fixtures.

## Development commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Prisma commands

Copy `.env.example` to a local `.env` and supply a development PostgreSQL connection before running database commands.

```bash
npm run db:format
npm run db:validate
npm run db:generate
npm run db:migrate -- --name phase_1_data_model_foundation
npm run db:seed
```

The normal Next.js build does not connect to a live database and does not run migrations or seeds. `DATABASE_URL` is required for Prisma validation, migrations, seeding and later runtime database access, not for the current static Vercel preview build.

## First Codex task

Use `docs/CODEX_BOOTSTRAP_PROMPT.md` as the initial instruction.
