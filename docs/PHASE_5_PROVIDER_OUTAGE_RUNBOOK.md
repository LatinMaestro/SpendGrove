# Phase 5 Provider Outage Runbook

Status: pre-private-beta operational runbook  
Last reviewed: 17 July 2026

## Vercel or deployment outage

- Check the current Production deployment and Vercel status.
- Distinguish build failure, runtime failure, quota limit and provider incident.
- Do not generate no-op commits or repeated deployments.
- If the current release is bad and the database is unchanged, roll back only to a known schema-compatible deployment.
- Keep evidence to deployment IDs, commit SHAs, route templates, HTTP classes and safe error groups.

## Clerk outage or configuration fault

- Keep operational finance routes fail-closed.
- Never enable a demo/stub user or bypass server authentication.
- Public help/privacy/onboarding may remain available if they contain no finance data.
- Confirm the correct Production Clerk instance before private beta; the currently observed development/test instance is a release blocker.
- Key or domain changes require explicit client approval.

## Neon outage or database fault

- Do not switch URLs, branches or roles without approval.
- Stop write testing if integrity is uncertain.
- Check provider status and safe branch/compute metadata.
- Use the backup/recovery runbook for restore decisions.
- Never run reset, manual SQL, backfill or migration resolve.

## GitHub Actions outage

- Do not merge an implementation PR without exact-head online verification.
- Keep the PR open and continue only unrelated documentation/review work.
- Do not substitute an older workflow result for the current head.

## Partial degradation

- CSV review may continue only while its browser-local transient behaviour does not imply a durable save succeeded.
- A failed commit must remain visibly failed and reviewable.
- Account export/deletion must report truthful completion.
- Do not queue hidden automatic retries.

## Return to service

- provider status healthy;
- exact deployed commit identified;
- signed-out and signed-in route matrix checked;
- relevant synthetic workflow passes;
- no private-data logging observed;
- incident record and focused regression complete;
- client authorises beta continuation after SEV-1/SEV-2.

## External communications

No status page, support provider or alert channel is configured. Public statements, user notifications and legal/privacy notifications require client/professional approval.
