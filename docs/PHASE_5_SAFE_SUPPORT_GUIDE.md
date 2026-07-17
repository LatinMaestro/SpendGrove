# Phase 5 safe support and feedback guide

Status: repository guidance; final contact details pending  
Date: 17 July 2026  
Developer: Groveware

## Current posture

SpendGrove has an in-app/public Help page but no support-ticket provider, email-sending integration, attachment upload, chatbot or promised response time.

Central contact placeholder:

> Groveware support contact details will be published before the private beta begins.

Do not replace this with invented details.

## Safe user guidance

A support request may contain:

- public page/route name;
- action attempted;
- expected versus observed behaviour;
- an allowlisted safe error code;
- browser and device family;
- application version/commit where exposed safely;
- synthetic reproduction steps.

A support request must not contain:

- real CSV files or bank statements;
- transaction or budget exports;
- screenshots containing financial history;
- filenames;
- descriptions or merchant history;
- amounts or balances;
- account, BSB, card, customer or loan identifiers;
- Property details or exact addresses;
- email/session/authentication codes;
- passwords, keys, tokens or connection values.

## Safe screenshots

Prefer no screenshot. If one is needed:

1. reproduce with synthetic data;
2. crop to the affected control;
3. hide browser account/profile information;
4. verify no names, amounts, dates linked to real activity, merchants, accounts, Loans or Properties remain;
5. send only through the later approved support channel.

## Bank-format contributions

Never request a real bank CSV.

The contributor should make a synthetic file that:

- keeps only the same header names and column order;
- uses invented dates, descriptions and amounts;
- removes account/customer/card identifiers;
- contains no filename copied from a real statement;
- includes only the minimum rows needed to show the mapping problem;
- is reviewed manually before submission.

A future contribution channel must repeat this warning before accepting a file. No file-upload support channel is approved.

## Operator handling requirements

Before a private-beta support channel is enabled, approve:

- Groveware public contact and privacy contact;
- authorised support operators;
- mailbox/provider and access controls;
- MFA;
- request retention and deletion period;
- escalation for deletion and security incidents;
- breach reporting owner;
- safe error-code catalogue;
- attachment policy, preferably disabled;
- response expectations;
- identity verification for account operations;
- process for removing accidentally supplied private data.

## Triage

### Account access or deletion

Do not ask for passwords or verification codes. Use Clerk's supported account recovery/reverification flow. Escalate partial deletion using only the safe state code and provider/deployment context.

### CSV or import issue

Ask for the supported bank/layout name, safe error code and synthetic reproduction. Never request the real file.

### Suspected security or privacy incident

Stop ordinary troubleshooting, preserve safe operational evidence, avoid copying private content, and follow the Phase 5 incident-response runbook.

### Product suggestion

Record the feature request without financial history. Do not promise delivery, financial outcomes or tax treatment.

## Deferred capabilities

The following require a separate provider/privacy decision:

- support-ticket system;
- email integration;
- attachments;
- crash reporting;
- product analytics;
- public feature voting;
- community forum;
- in-app chat.

## Release gate

The Help page is technically available. Private-beta support readiness remains blocked by the final contact, operator, retention and escalation decisions.
