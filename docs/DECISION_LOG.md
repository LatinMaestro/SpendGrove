# Decision Log

Material decisions should be recorded here. This prevents future agents from re-litigating settled choices.

| Date | Decision | Reason | Approved by | Implementation impact |
|---|---|---|---|---|
| 2026-06-08 | SpendGrove is CSV-first and privacy-first with no default live bank linking | Core product differentiator and user trust model | Client | Import workflow and product copy must reinforce no-bank-login promise |
| 2026-06-08 | Use account-based architecture from inception | Future iOS/iPad/web sync without migration | Client | Data models should include user ownership even during prototype |
| 2026-06-08 | Adopt Household Strategy Option A | Avoid MVP complexity while preserving future household mode | Client | Phase 1 is one account per user; household entities are future-ready only |
| 2026-06-08 | Basiq is optional, sandbox-first, local-first and fallback-only | Preserve privacy and reduce third-party disclosure | Client | Do not implement production Basiq until explicit approval |
| 2026-06-08 | Payments/paywalls require future explicit approval | Avoid premature monetisation complexity | Client | Do not implement payment provider or entitlements without approval |

## Template

| Date | Decision | Reason | Approved by | Implementation impact |
|---|---|---|---|---|
| YYYY-MM-DD |  |  |  |  |

## Decisions that must be logged

- Product direction.
- Framework/stack choice.
- Database provider.
- Authentication approach.
- File handling strategy.
- Duplicate scoring thresholds.
- Financial calculation assumptions.
- Third-party providers.
- Payment/subscription model.
- Major navigation changes.
- Privacy/security changes.
