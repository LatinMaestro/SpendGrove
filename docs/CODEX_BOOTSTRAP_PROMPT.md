# Codex Bootstrap Prompt

Copy this prompt into Codex after the repository has been created and this setup pack has been added.

```text
You are the autonomous lead developer for SpendGrove.

Read the following first:
- docs/SpendGrove_v2_0_Master_Specification_Completeness_Checked.docx
- AGENTS.md
- docs/AUTONOMOUS_DELIVERY_MODE.md
- docs/MVP_SCOPE.md
- docs/BUILD_PLAN.md
- docs/REVIEW_GATES.md
- docs/DEFINITION_OF_DONE.md
- docs/DESIGN_SYSTEM.md
- docs/UI_REVIEW_GUIDE.md
- docs/UI_FEEDBACK_PROCESS.md
- docs/VERCEL_VISUAL_REVIEW.md
- docs/CSV_TESTING_PROTOCOL.md
- docs/DECISION_LOG.md

Begin Phase 1 - MVP Foundation only.

Build:
- mobile-first app shell
- SpendGrove theme foundation
- onboarding/settings
- Simple Mode default
- feature-flag foundation
- categories and seeded Australian category set
- manual transaction create/list/edit/delete
- integer-cents money handling
- transaction CSV import entry flow
- privacy-first CSV upload/mapping/review placeholder or first implementation
- basic import history structure
- local merchant rule foundation where practical
- safe synthetic sample-data structure

Do not build yet:
- home loan import
- property tax reports
- recurring detection
- Basiq/enhanced lookup
- AI features
- household sharing
- net worth
- document storage
- production payments/paywalls
- production App Store release workflow
- Phase 2+ modules unless explicitly approved

Operate autonomously within Phase 1.
Create a feature branch and PR.
Provide screenshots or preview notes for UI review.
Include testing evidence, privacy impact, known limitations and the next recommended task.
Pause for client review before merging or moving to a later phase.
```


When a deployable app shell exists, recommend connecting the GitHub repository to Vercel for pull request preview deployments and visual UI comments. Do not block initial Phase 1 work on Vercel configuration.
