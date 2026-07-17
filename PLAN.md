# SpendGrove Build Plan

The active build plan is maintained in:

- `docs/BUILD_PLAN.md`
- `docs/COMPLETE_PRODUCT_DELIVERY_ROADMAP.md`

This file is a root-level pointer. It does not replace the master specification or permanent project records.

Agents must also follow:

- `AGENTS.md`
- `docs/SpendGrove_v2_0_Master_Specification_Completeness_Checked.docx`
- `docs/AUTONOMOUS_DELIVERY_MODE.md`
- `docs/REVIEW_GATES.md`
- `docs/DEFINITION_OF_DONE.md`
- `docs/DECISION_LOG.md`
- `docs/CODEX_CURRENT_HANDOFF.md`
- `docs/COMPLETE_PRODUCT_CURRENT_STATE_AUDIT.md`
- `docs/COMPLETE_PRODUCT_FEATURE_REGISTER.md`
- `docs/APP_STORE_END_TO_END_DELIVERY_PLAN.md`
- `docs/REMAINING_CLIENT_AND_OPERATOR_DECISIONS.md`

## Current status

- Phase 5 repository delivery is technically complete, pending deferred client acceptance and not formally closed.
- Whole-product planning PR #165 merged as `8146c37040da98c9e08bac3123c8f78a3ef0caec`.
- The former limited Phase 6–7 ending is superseded by the complete Phase 6–15 roadmap.
- Phase 6 — Desktop Web Platform and Bulk Workflows is active.
- Start with Milestone 6.0: desktop contract, interface inventory, bulk-action safety rules and schema assessment.
- Continue autonomously through the merged roadmap only while every documented financial, privacy, schema, provider, environment and operator gate is satisfied.
- Consolidated client review is deferred until the complete pre-release product is ready.

## Hard boundaries

Do not:

- formally close Phase 5 or any later phase without explicit client acceptance;
- work outside the merged complete-product roadmap;
- purchase or upgrade a provider plan;
- expose or commit secrets;
- run or manually resolve a Production migration;
- access private Production financial rows;
- rewrite/backfill Production financial data without a separate approved contract;
- delete or automatically migrate browser-local financial data;
- change settled financial calculations without a new contract;
- activate live Basiq, paid AI or live payments;
- publish prices, invite real users, publicly launch or submit to the App Store.

Use the consolidated decision register when a repository task reaches a client, operator, professional-review or provider gate.
