# Decision Log

Material decisions should be recorded here. This prevents future agents from re-litigating settled choices.

| Date | Decision | Reason | Approved by | Implementation impact |
|---|---|---|---|---|
| 2026-06-08 | SpendGrove is CSV-first and privacy-first with no default live bank linking | Core product differentiator and user trust model | Client | Import workflow and product copy must reinforce no-bank-login promise |
| 2026-06-08 | Use account-based architecture from inception | Future iOS/iPad/web sync without migration | Client | Data models should include user ownership even during prototype |
| 2026-06-08 | Adopt Household Strategy Option A | Avoid MVP complexity while preserving future household mode | Client | Phase 1 is one account per user; household entities are future-ready only |
| 2026-06-08 | Basiq is optional, sandbox-first, local-first and fallback-only | Preserve privacy and reduce third-party disclosure | Client | Do not implement production Basiq until explicit approval |
| 2026-06-08 | Payments/paywalls require future explicit approval | Avoid premature monetisation complexity | Client | Do not implement payment provider or entitlements without approval |
| 2026-06-08 | Approve Phase 1 technical stack: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma and PostgreSQL | Supports mobile-first web development, Vercel preview workflow, type-safe data modelling and future account-ready architecture | Client | Initialise Phase 1 using this stack; update README commands; use Prisma/PostgreSQL for data model foundation |
| 2026-06-08 | Use stubbed single-user authentication for Phase 1 with no third-party services | Keeps MVP foundation focused while preserving future auth/sync readiness and avoiding premature provider/security complexity | Client | Add user ownership fields and local/dev current-user handling only; do not implement production auth, analytics, Basiq, AI, payments or other third-party services in Phase 1 |

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
