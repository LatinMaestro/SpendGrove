# Phase 5 Request Limits and Abuse-Resistance Contract

Status: Phase 5 Milestone 4 implementation contract  
Last reviewed: 17 July 2026

## Objective

Bound the highest-risk request bodies before JSON parsing and document the controls that are and are not globally enforceable without a new provider or configuration change.

## Existing controls retained

- Raw bank CSV parsing remains browser-local and transient.
- A selected CSV is limited to 5 MiB and 5,000 rows before review.
- Raw CSV rows and private bank fields are not sent to the durable import commit route.
- Reviewed everyday and Loan imports are limited by strict schemas to 5,000 rows.
- Import request IDs retain the existing idempotent commit behaviour.
- Import / Skip / Merge, duplicate scoring, transaction values and financial rules are unchanged.
- Every durable operation still requires Clerk authentication and server-side ownership checks.
- Account export and deletion require Clerk strict reverification.
- Client controls already prevent routine duplicate export and deletion submission.

## New application limits

| Surface | Limit | Behaviour |
|---|---:|---|
| Reviewed everyday import commit | 4 MiB JSON | reject with HTTP 413 before schema or database work |
| Reviewed Loan repayment commit | 4 MiB JSON | reject with HTTP 413 before schema or database work |
| Loan repayment duplicate review | 4 MiB JSON | reject with HTTP 413 before duplicate assessment |
| Account deletion confirmation | 1 KiB JSON | reject with HTTP 413; nothing is deleted |

The bounded reader checks a valid declared content length and also counts streamed bytes. This prevents chunked requests from bypassing the application limit. It returns only safe reason codes and never includes body content in an error or log.

The 4 MiB review ceiling stays below Vercel's documented 4.5 MB Function request/response payload ceiling. The browser's 5 MiB CSV limit is not contradictory: the raw file remains in the browser and the server receives only reviewed safe fields.

## Expensive reads and downloads

- Account export is POST-only, authenticated, strictly reverified and private/no-store.
- Property export is authenticated, owner-scoped, financial-year-scoped and private/no-store.
- Everyday insights and reports use bounded period or owner scopes already defined by their contracts.
- No endpoint accepts a raw file upload.
- The complete account export response must be tested with realistic private-beta account volumes. Vercel's response ceiling is a known operational bound; a later streaming design requires a focused contract if beta volumes approach it.

## Global rate limiting

No global rate limiter is claimed in this milestone.

An in-memory JavaScript counter would be inconsistent across Vercel Function instances and could provide misleading protection. A reliable global control requires an approved platform rule or shared durable store. Neither a provider, paid plan, environment variable nor Vercel Firewall configuration is authorised here.

Before private beta, the operator should decide whether to configure Vercel Firewall rate rules for:

- repeated authentication failures;
- repeated reviewed-import commits;
- repeated account-export requests;
- repeated account-deletion attempts.

Any rule must be tested against legitimate large import review and Clerk authentication flows. It must not key on or log CSV content, merchant data, amounts, account references, email addresses or other financial detail.

## Error and privacy rules

- Oversized requests receive HTTP 413 with short beginner-safe copy.
- Missing or malformed JSON receives HTTP 400.
- No body fragment, raw description, filename, account reference, amount or user identifier enters the error.
- Existing no-partial-save and idempotency behaviour remains intact.
- No automatic retry is introduced.

## Verification

Required before merge:

- exact-head online TypeScript, lint, full tests and optimized build;
- bounded-body unit tests for declared and chunked requests;
- full CSV/import, Loan and account-lifecycle regressions;
- confirmation no raw CSV upload or persistence was introduced;
- Vercel Preview when capacity permits.

## Official source

Accessed 17 July 2026:

- [Vercel Functions limits](https://vercel.com/docs/functions/limitations), Vercel: maximum Function request or response payload is 4.5 MB and oversized payloads return 413.

## Exclusions

No schema, migration, data rewrite, package, provider, secret, environment mutation, firewall change, paid plan, monitoring, analytics, financial-rule, duplicate-scoring or import-semantic change is included.
