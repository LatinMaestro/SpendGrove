# Phase 5 Security Headers and Browser Protections Contract

Status: Phase 5 Milestone 4 implementation contract  
Last reviewed: 17 July 2026

## Objective

Apply a minimum, verifiable browser-protection baseline without changing SpendGrove features, financial rules, authentication ownership checks, persistence, providers or environments.

## Implemented controls

- Clerk's supported strict Content Security Policy mode generates a fresh nonce per matched request.
- The CSP keeps Clerk authentication functional and adds restrictive `base-uri`, `frame-ancestors` and `object-src` directives.
- `X-Frame-Options: DENY` provides legacy clickjacking protection in addition to CSP `frame-ancestors 'none'`.
- `X-Content-Type-Options: nosniff` prevents content-type guessing.
- `Referrer-Policy: strict-origin-when-cross-origin` limits cross-origin referrer detail.
- `Permissions-Policy` disables camera, microphone, geolocation, payment, USB and browsing-topics capabilities because SpendGrove does not use them.
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` retains authentication popup compatibility while isolating unrelated browsing contexts.
- `X-DNS-Prefetch-Control: off` avoids speculative third-party DNS resolution.
- `X-Powered-By` is disabled.
- Protected finance pages, redirects and APIs receive `Cache-Control: private, no-store, max-age=0`, `Pragma: no-cache` and `Expires: 0`.
- Account export and deletion retain their existing explicit private no-store responses.

## HSTS

SpendGrove declares `Strict-Transport-Security: max-age=63072000`, matching Vercel's documented two-year platform default. `includeSubDomains` and preload are deliberately not asserted until the client confirms control of every relevant subdomain.

HSTS is effective only over HTTPS. Vercel deployment verification must confirm the deployed response.

## CSP boundaries

The application uses Clerk's first-party Next.js CSP integration rather than maintaining an environment-specific Clerk frontend API hostname in source control. Strict mode requires dynamic Clerk rendering so Next.js and Clerk can apply request nonces.

No analytics, monitoring, payment, map, CDN script or other third-party origin is added by this work. A future provider requires a separate CSP and privacy review.

## Cache boundaries

Private no-store headers are a defence against browser and intermediary reuse. They do not replace:

- Clerk authentication;
- per-resource server ownership checks;
- route-handler authentication;
- safe error responses.

Public help, privacy, onboarding and authentication pages are not marked as private finance data.

## Error and privacy boundaries

Headers and CSP configuration must not contain or log:

- secret values;
- Clerk secret keys;
- database URLs;
- raw CSV content;
- transaction descriptions, amounts or balances;
- bank, Loan or Property identifiers;
- emails or user IDs.

CSP violation reporting is not enabled because no reporting/monitoring provider is approved.

## Verification

Required before merge:

- exact-head online TypeScript, lint, full test and optimized build;
- authentication and route-policy regressions;
- public sign-in rendering;
- protected-route redirect and no-store behaviour;
- account export/download regression;
- deployed header inspection when a Vercel Preview is available.

## Official sources

Accessed 17 July 2026:

- [Configure Clerk Content-Security-Policy headers](https://clerk.com/docs/guides/secure/best-practices/csp-headers), Clerk: strict CSP support, nonce handling, `dynamic` ClerkProvider requirement and required Clerk directives.
- [Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy), Next.js: nonce behaviour and CSP deployment considerations.
- [Next.js headers configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers), Next.js: supported response-header configuration and cache-control limitations.
- [Next.js poweredByHeader](https://nextjs.org/docs/pages/api-reference/config/next-config-js/poweredByHeader), Next.js: disabling `X-Powered-By`.
- [Vercel response headers](https://vercel.com/docs/headers/response-headers), Vercel: platform HSTS default.

## Exclusions

No schema or migration change, package or lockfile change, provider/environment/secret mutation, monitoring, analytics, CSP reporting endpoint, firewall rule, rate limiter, financial calculation change or Production data access is included.
