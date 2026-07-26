# Preview Activation Resumption — 26 July 2026

## Purpose

Resume the approved Preview-only activation sequence after the historical Vercel daily build-rate limit expired, while preserving the exact migration, privacy, financial-integrity and Production boundaries recorded in `PREVIEW_FOUNDATION_ACTIVATION_QA.md`.

## Live preflight

- `main` remains at `e99c0f756d40868777ff2d3f3091e5cff1fce770`.
- Activation PRs #231–#240 and consolidated QA PR #241 remain open and mergeable.
- The final implementation head remains `e5519769ea7fd07720144067104f3c897eb73d23`.
- All activation exact heads previously passed GitHub verification, culminating in 156 test files / 961 tests plus TypeScript, lint and optimized build success.
- The isolated Preview database previously passed verify-only migration run `29669320110`; all 12 expected migrations were healthy and the six controlled Phase 6–11 profiles were recorded exactly once.
- No SpendGrove deployment has been created since the Vercel rate-limit failures on 19 July 2026.

## Authorised resumption action

This documentation-only commit is a substantive resumption record and is intended to trigger one fresh Vercel Preview build of the complete corrected stacked QA head. It is not a no-op retry and must not be followed by repeated deployment-trigger commits.

## Preserved safeguards

- Do not rerun the migration workflow.
- Do not run or propose a Production migration from this sequence.
- Do not change Production environment variables, providers, secrets, data or runtime gates.
- Use only the existing isolated synthetic Preview environment.
- Do not use real CSVs, real financial data, private screenshots or real-user invitations.
- Do not merge any activation PR unless the new exact-head Preview is green and the deployed stack is reviewed against the synthetic QA register.

## Next gate

1. Inspect the new exact-head Vercel deployment and safe build logs.
2. If green, complete the synthetic Preview QA and cross-feature regression in `PREVIEW_FOUNDATION_ACTIVATION_QA.md`.
3. Record factual evidence, then review and merge PRs #231–#240 and #241 in order only when every applicable gate is satisfied.
4. Keep Production activation, provider enablement, real invitations, storage, OCR, push, TestFlight and public release separately gated.
