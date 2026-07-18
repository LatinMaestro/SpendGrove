# Production Release Checklist

Status: master pre-release checklist; no release authority  
Updated: 18 July 2026

## Product completeness

- [ ] feature register reconciled with the final release selection;
- [ ] no placeholder core screens;
- [ ] guarded capabilities are either proven active or clearly unavailable;
- [ ] consolidated client review completed;
- [ ] known limitations accepted.

## Code and dependencies

- [ ] exact release commit identified;
- [ ] full tests green;
- [ ] TypeScript green;
- [ ] lint green with warnings reviewed;
- [ ] optimized web build green;
- [ ] deterministic native build green;
- [ ] production dependency audit has no high/critical advisory;
- [ ] current supported framework versions recorded;
- [ ] no unexpected package/provider change.

## Financial integrity

- [ ] signed money/type rules;
- [ ] transfer exclusion/linking;
- [ ] split reconciliation/no double count;
- [ ] budgets;
- [ ] recurring/subscriptions;
- [ ] loans and repayment reconciliation;
- [ ] Property and Australian financial-year reporting;
- [ ] accountant exports;
- [ ] advanced finance models;
- [ ] all totals reconcile to source records;
- [ ] professional tax/accounting wording reviewed.

## Authentication and ownership

- [ ] Production Clerk instance;
- [ ] signed-in/out matrix;
- [ ] session expiry/recovery;
- [ ] two-user isolation;
- [ ] Server Action and Route Handler negative tests;
- [ ] household/accountant permissions if activated;
- [ ] browser-local data remains private and unmigrated.

## Data lifecycle

- [ ] complete account export;
- [ ] account deletion;
- [ ] retention/grace decision;
- [ ] backup deletion propagation;
- [ ] future provider/document deletion;
- [ ] Apple token revocation where applicable;
- [ ] no partial-deletion blocker.

## Environment and migrations

- [ ] Preview/Production Vercel scopes proven;
- [ ] Clerk mapping proven;
- [ ] Neon mapping proven;
- [ ] six ordered Preview migrations green;
- [ ] full synthetic Preview regression;
- [ ] separate Production migration approvals;
- [ ] Production migration history healthy;
- [ ] runtime gates match schema;
- [ ] no missing-table query.

## Recovery and operations

- [ ] RPO/RTO approved;
- [ ] backup/history capability proven;
- [ ] synthetic restore rehearsal;
- [ ] incident owner and backup;
- [ ] safe monitoring/alerts;
- [ ] deployment rollback candidate;
- [ ] native rollback/compatibility plan;
- [ ] incident exercise completed.

## Privacy, legal and support

- [ ] legal entity/contact facts;
- [ ] Privacy Policy professionally reviewed;
- [ ] Terms professionally reviewed;
- [ ] provider/subprocessor inventory;
- [ ] support URL/email and operator;
- [ ] security contact;
- [ ] safe feedback warning;
- [ ] no real CSV/private attachment intake;
- [ ] analytics/monitoring disclosures accurate;
- [ ] tax/financial disclaimers reviewed.

## Web QA

- [ ] authenticated route smoke;
- [ ] public route smoke;
- [ ] response headers/CSP/no-store;
- [ ] remove no-index only after launch approval;
- [ ] 390/768/1024/1440 layouts;
- [ ] browser matrix;
- [ ] keyboard/screen reader/text scaling;
- [ ] CSV supported-bank matrix;
- [ ] export/delete downloads;
- [ ] failure recovery.

## Native/App Store

- [ ] architecture implemented;
- [ ] iPhone/iPad layouts;
- [ ] Clerk native auth;
- [ ] secure CSV picker/cleanup;
- [ ] export sharing;
- [ ] deep links;
- [ ] biometrics/passcode if selected;
- [ ] notifications if selected;
- [ ] privacy manifest;
- [ ] App Privacy answers;
- [ ] screenshots/metadata;
- [ ] review account;
- [ ] TestFlight acceptance;
- [ ] explicit submission approval.

## Commercial and optional providers

- [ ] free/paid first-release decision;
- [ ] prices/limits approved if applicable;
- [ ] Apple/web billing decision;
- [ ] GST/refund/support review;
- [ ] Basiq remains disabled or separately approved;
- [ ] AI remains disabled or separately approved;
- [ ] documents remain disabled or storage/malware/privacy gates passed;
- [ ] no live provider without a recorded gate.

## Final authority

- [ ] client approves TestFlight;
- [ ] client approves App Store submission;
- [ ] client approves real-user invitation;
- [ ] client approves public launch;
- [ ] launch and rollback owners confirm readiness.

Unchecked items are blockers, not implied approvals.
