# Phase 5 Safe Errors and Operational Logging Contract

Status: Phase 5 Milestone 4 implementation contract  
Last reviewed: 17 July 2026

## Objective

Give users safe recovery paths and define a privacy-minimised operational evidence boundary without enabling a monitoring, analytics or support provider.

## User-facing errors

- Route and rendering failures show short plain-English copy.
- Error objects, stack traces, digests, database messages and provider responses are never rendered.
- Affected users can retry or return to a safe first-party route.
- Error and not-found controls remain keyboard accessible and at least 44 px high.
- API routes continue mapping expected failures to short user-safe messages and status codes.
- Authentication and ownership failures do not disclose whether another user's resource exists.

## Runtime logging baseline

Application runtime source must not add direct `console.log`, `console.info`, `console.warn`, `console.error` or `console.debug` calls. This prevents accidental object or request-body logging while no approved structured monitoring sink exists.

Provider-generated platform logs may still contain framework-level request facts. Operators must not intentionally add private query strings, request bodies or identity details to them.

## Allowed future operational fields

A later approved structured event may contain only allowlisted facts such as:

- stable action code;
- stable outcome/reason code;
- HTTP status class;
- duration bucket;
- route template, not private URL values;
- deployment commit/environment;
- aggregate import row-count bucket;
- synthetic request correlation token.

## Forbidden fields

Never log or attach:

- raw CSV bytes or rows;
- filenames;
- transaction descriptions or merchant-level history;
- amounts, balances or budget values;
- BSB, account, card, customer or Loan references;
- exact Property addresses or private Property details;
- email addresses or user profile fields;
- Clerk tokens, cookies, database URLs or secrets;
- request or response bodies;
- stack traces in user-facing output.

## Audit events

Durable product audit events remain separate from operational logs. They use approved action/entity codes and safe metadata only. No monitoring provider or new audit metadata is introduced here.

## Failure handling

- Preserve no-partial-save transactions and existing idempotency.
- Do not retry destructive or migration operations automatically.
- Do not claim an operation succeeded when a provider or database step failed.
- Account deletion retains its explicit partial-completion state.
- Error pages do not mutate data.

## Provider boundary

Analytics, crash reporting, monitoring and support providers remain off. Adding a sink, package, secret, environment variable, retention setting or alert recipient requires a separate client decision and privacy review.

## Verification

- exact-head online TypeScript, lint, full tests and optimized build;
- source guard against direct runtime console logging;
- error-surface checks for generic copy and no technical detail;
- Vercel runtime error/log inspection using synthetic or aggregate facts only where available.

No schema, migration, provider, secret, environment or Production data change is included.
