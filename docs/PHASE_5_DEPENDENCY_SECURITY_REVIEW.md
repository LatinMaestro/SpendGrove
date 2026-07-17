# Phase 5 Dependency and Release Security Review

Status: implemented and technically verified; pending consolidated client acceptance  
Scope: Phase 5 Milestone 4D  
Reviewed: 17 July 2026

## Outcome

SpendGrove now has a committed deterministic npm dependency lockfile and a read-only GitHub Actions production-dependency gate.

The gate:

1. installs the exact locked dependency tree with `npm ci --ignore-scripts`;
2. fails if `package.json` and `package-lock.json` disagree;
3. fails for high or critical advisories in production dependencies;
4. reports the resolved Next.js, React, React DOM and ESLint configuration versions.

No application dependency was upgraded in this review. No force install, legacy peer override, package-provider change, schema change, migration, environment mutation or data access occurred.

## Resolved framework versions

The verified locked tree contains:

- Next.js `15.5.20`;
- React `19.1.8`;
- React DOM `19.1.8`;
- `eslint-config-next` `15.5.20`;
- Clerk Next.js `6.39.5` resolved from the approved compatible range.

No Next.js 14 package is present.

## Lockfile and reproducibility

The repository previously had no committed `package-lock.json`. This allowed transitive versions to change between otherwise identical installs.

GitHub Actions generated the initial lockfile from the accepted `package.json` on Node.js `20.20.2`, without lifecycle scripts and without force or legacy peer-dependency flags. The resulting file is committed and the permanent audit uses `npm ci`.

npm documents that `package-lock.json` is intended for source control to reproduce a dependency tree and that `npm ci` fails when the manifest and lockfile disagree.

## Vulnerability review

### Production dependency gate

Command:

```text
npm audit --omit=dev --audit-level=high
```

Result:

- gate passed;
- no high or critical production advisory was reported;
- three moderate production-tree findings remain;
- all three derive from the same PostCSS advisory path through Next.js/Clerk;
- npm reports no available fix for the resolved Next.js 15 line.

Tracked advisory:

- PostCSS CSS stringify escaping: `GHSA-qx2v-qp2m-jg93`, moderate.

SpendGrove does not accept or generate user-authored CSS. This reduces practical exposure, but the advisory remains tracked and must be rechecked when a supported patched Next.js 15 dependency tree becomes available. Next.js 16 remains outside the approved phase boundary.

### Full dependency tree

The complete development and production tree reports:

- five moderate;
- one high;
- one critical.

The actionable development-tree path reported by npm is:

- `vitest` -> `vite-node` -> `vite` -> `esbuild`;
- advisory `GHSA-67mh-4wv8-2f99`;
- exposure concerns the development server, not the deployed SpendGrove runtime;
- npm proposes `vitest@4.1.10`, a breaking major upgrade, only through `--force`.

That breaking test-tool migration is not justified as a private-beta runtime security fix and was not performed. SpendGrove does not expose the Vite/Vitest development server in Production. The advisory remains a development-tooling maintenance item.

### Unsupported or aging tooling

- ESLint 8 is upstream-unsupported.
- Next.js 15 still supports the existing `next lint` path, although Next.js warns that this command is removed in Next.js 16.
- Migrating ESLint configuration and Vitest to new major versions requires a separate focused compatibility contract.
- GitHub-hosted runners currently force JavaScript actions that target Node 20 to Node 24. The SpendGrove application verification itself continues to use Node `20.20.2`.

These items are recorded maintenance risks, not evidence that the deployed runtime is using vulnerable Next.js 14 code.

## Client and server package boundary

Production packages are limited to framework, authentication, database client, validation and UI-runtime dependencies declared under `dependencies`.

Build, lint, type, Prisma CLI and test tools remain under `devDependencies`. The deployed application does not start Vitest, Vite's development server, ESLint or the Prisma migration CLI.

The production audit deliberately omits development dependencies when deciding the high/critical release gate. The full-tree inventory remains visible for maintenance planning.

## Secret and repository privacy review

Confirmed repository safeguards:

- `.env` and environment-specific files are ignored, except the documented example file;
- private keys and PEM files are ignored;
- real/private bank exports, statements, transaction exports, loan exports and parser dumps are ignored;
- private screenshots and private exports are ignored;
- local databases are ignored;
- raw CSV content is not committed or sent to dependency tooling;
- no secret value, connection string, provider key or Production row was added during this review.

GitHub secret-scanning and push-protection plan availability could not be proven through the connected read-only metadata. This remains an operator dashboard check, not a claimed control.

## Environment separation

The dependency gate uses no Vercel, Clerk, Neon or application secret.

Environment-separation findings remain those in the Phase 5 environment-readiness record:

- Production currently uses a Clerk development/test instance and is blocked for private beta;
- exact Preview/Production Vercel variable mapping remains to be proven;
- distinct Preview/Production Neon mapping remains to be proven;
- no Production migration history or private Production content was queried here.

## Permanent release-security checklist

Before each private-beta release candidate:

- [ ] exact PR head passed application verification;
- [ ] exact PR head passed the production dependency security gate;
- [ ] `npm ci` accepted the committed lockfile;
- [ ] no high or critical production dependency advisory is open;
- [ ] resolved Next.js, React and React DOM versions match the approved supported line;
- [ ] no secret, connection string, private CSV or private screenshot is present in the diff;
- [ ] no unexpected package, provider, environment or schema change is present;
- [ ] Clerk Production credentials and environment scopes are independently verified;
- [ ] Preview and Production database mapping is independently verified;
- [ ] deployment target and commit association are confirmed;
- [ ] private route, authentication, owner-isolation and security-header checks pass;
- [ ] rollback and provider-outage runbooks remain current.

## Remaining decisions and risks

1. Resolve the Clerk development/test credential blocker before private beta.
2. Prove Vercel and Neon Preview/Production separation without copying secrets.
3. Decide later whether to approve a focused Vitest/Vite development-toolchain major upgrade.
4. Recheck the PostCSS advisory whenever Next.js 15 or Clerk publishes a compatible dependency fix.
5. Confirm GitHub secret scanning and push protection in repository security settings.
6. Continue to prohibit `npm audit fix --force` and unsupported/pre-release upgrades without explicit review.

## Official references

Accessed 17 July 2026:

- npm, “package-lock.json”: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/
- npm, “npm ci”: https://docs.npmjs.com/cli/commands/npm-ci/
- npm, “npm audit”: https://docs.npmjs.com/cli/v11/commands/npm-audit/
- GitHub Advisory Database, `GHSA-qx2v-qp2m-jg93`: https://github.com/advisories/GHSA-qx2v-qp2m-jg93
- GitHub Advisory Database, `GHSA-67mh-4wv8-2f99`: https://github.com/advisories/GHSA-67mh-4wv8-2f99
