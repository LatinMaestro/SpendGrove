# Phase 15 Pre-release Readiness Contract

Contract date: 18 July 2026  
Repository baseline: `fd4817aa50e0a0c89296c3ddbf17cbf98b382e1b`  
Status: approved complete-product roadmap execution; repository-safe Phase 15 work only  
Release authority: no TestFlight upload, App Store submission, real-user invitation or public launch

## Objective

Prepare SpendGrove for a truthful, secure and reviewable pre-release decision by closing every independently safe repository gap, documenting every external gate, and preserving all existing privacy, ownership and financial-integrity rules.

Phase 15 does not itself authorise release. It produces the evidence, runbooks and operator decisions needed before a later client-approved TestFlight and public-release gate.

## User value

- finance data remains private, owner-scoped and recoverable;
- the pre-release application has a clear security and operational baseline;
- account export, deletion, CSV import and authenticated finance routes remain dependable;
- support, privacy and release disclosures accurately describe the shipped product;
- Apple review preparation reflects the final application rather than placeholders;
- failures have a safe response and rollback plan.

## Current posture

The accepted responsive web product and repository foundations are substantial. The repository is not yet release-ready because six Preview migrations remain unexecuted, native implementation is not bootstrapped, Production mapping/recovery proof is incomplete, and legal, support, monitoring, Apple and final client gates remain open.

The controlling audit is `docs/PHASE_15_PRE_RELEASE_CURRENT_STATE_AUDIT.md`.

## Scope

### Phase 15A — Audit and contract

- current-state security, environment, privacy, operations, native and release audit;
- official-source requirement review;
- exact release blockers and evidence ownership;
- this contract and permanent roadmap updates.

### Phase 15B — Provider-free security hardening

Permitted only where it does not change product behaviour or require a provider:

- keep all pre-release web surfaces out of search indexes until explicit launch approval;
- add or tighten safe response headers where compatible with Clerk and current application flows;
- preserve strict CSP, authenticated route posture and private caching;
- add focused regression tests;
- verify exact-head response headers, authentication, CSV and export behaviour where connected tooling permits.

### Phase 15C — Operations, legal-input and release runbooks

- security incident response;
- backup and restore rehearsal;
- privacy-safe monitoring and alert design;
- privacy factual disclosure inputs;
- App Store metadata and privacy worksheet;
- TestFlight, launch and rollback runbooks;
- provider/operator/professional-review responsibilities;
- no activation of a provider, paid plan, secret or external release action.

### Phase 15D — QA, handoff and consolidated pre-release package

- full exact-head automated verification for source changes;
- web route, narrow-width, accessibility and header evidence;
- preserved migration/runtime gate evidence;
- full provider/operator/professional-review register;
- consolidated feature, schema, migration, deployment and client-testing status;
- truthful release-readiness recommendation.

## Inclusions

- documentation and provider-free repository safeguards;
- current official Apple, Next.js, Vercel, Neon and Clerk requirements where relevant;
- regression tests for changed security configuration;
- safe connected deployment and public-response metadata;
- migration-name and false-runtime-gate verification;
- runbooks and operator checklists;
- complete unresolved-risk register.

## Exclusions

- Production database access, migration, reset, resolution, rewrite or backfill;
- Preview migration execution while the operator credential gate remains deferred;
- provider purchase, upgrade, secret entry or dashboard mutation;
- monitoring, analytics, crash-reporting or support-provider activation;
- native package bootstrap without a deterministic online dependency workflow;
- Apple Developer enrolment, signing, EAS setup, TestFlight or App Store submission;
- live Basiq, paid AI, payments, published prices or commercial activation;
- real-user invitation or public launch;
- final legal, tax, accounting, accessibility or penetration-test approval;
- new financial calculations, navigation, product modules or schema.

## Security rules

- server authentication and owner checks remain the security boundary;
- protected responses remain private and non-cacheable;
- audit and operational metadata use safe reason codes only;
- no raw CSV, transaction narration, merchant history, amounts, balances, filenames, banking identifiers, exact Property/Loan details or unnecessary email may enter monitoring or incident records;
- no security failure may be hidden by weakening tests, TypeScript, lint or CSP;
- pre-release search indexing remains disabled until explicit public-launch approval.

## Environment and migration rules

The retained isolated Preview environment remains:

- Neon project `cold-field-54187673`;
- branch `br-sweet-flower-aj2ng7ix`;
- separate from Production;
- synthetic-only when later used.

The following migrations remain unexecuted and ordered:

1. `20260717090000_phase_6_bulk_operation_foundation`
2. `20260717100000_phase_7_transfer_link_foundation`
3. `20260717110000_phase_7_import_undo_foundation`
4. `20260717120000_phase_9_advanced_personal_finance_foundation`
5. `20260717130000_phase_10_household_accountant_foundation`
6. `20260717140000_phase_11_document_metadata_foundation`

All dependent runtime gates remain false. No missing-table query, export dependency or user-facing availability claim is permitted before migration proof and focused activation PRs.

## Provider/package/environment assessment

No new package, provider, secret or environment variable is required for Phase 15A, the provider-free part of 15B, or the documentation part of 15C.

Separate client/operator decisions are required for:

- WAF/rate-limit configuration if not available in the existing plan;
- monitoring and alert transport;
- Production Neon retention, protection and recovery capabilities;
- document storage and malware controls;
- invitation/support delivery;
- native build and signing infrastructure;
- commercial, Basiq and AI providers.

## Review gates

1. Audit/contract PR must be documentation-only and clean.
2. Any security-header PR must pass the full suite, TypeScript, lint, optimized build and exact-head Vercel verification.
3. Runbook PR must contain no secrets, private values, provider activation or legal claims presented as professional advice.
4. Final handoff must distinguish implemented evidence from operator, provider, professional and client actions.
5. No release action occurs without a separate explicit client gate.

## Mandatory stop conditions

Stop before:

- payment or provider-plan upgrade;
- entering, rotating or exposing a secret;
- modifying Production provider configuration;
- Preview or Production migration execution;
- destructive database action or manual migration-history resolution;
- Production financial-row access or copying;
- schema change, data rewrite or backfill;
- live monitoring/analytics, Basiq, paid AI or payments;
- Apple enrolment, signing, TestFlight or submission;
- real-user invitation or public launch;
- changing settled financial rules;
- final professional legal, tax, accounting or security approval.

An external blocker that does not create material risk must be recorded while independent repository work continues.

## Exit criteria

Repository-safe Phase 15 work is complete only when:

- the current-state audit and contract are merged;
- provider-free security changes are verified at exact head;
- release runbooks and factual disclosure worksheets are complete;
- all six migration and false-runtime gates are reconciled;
- current test/type/lint/build evidence is recorded;
- public response-header and route evidence is recorded where available;
- the consolidated pre-release package identifies every guarded feature;
- every provider/operator/professional/client action has a named gate;
- no secret, private data, migration, provider activation or release action occurred;
- the release recommendation truthfully states whether TestFlight readiness has been reached.

## Acceptance status

Phase 15 repository work may proceed under the complete-product autonomous authority. Phase 15 is not client accepted or closed. TestFlight, App Store submission and public launch remain separately unapproved.
