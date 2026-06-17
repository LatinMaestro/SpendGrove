# Phase 3A Clerk, Neon and Vercel Setup Guide

This guide helps the client prepare the external services needed before SpendGrove can safely continue Phase 3A durable persistence work.

It is written for setup only. Do not paste real secrets, database URLs or private values into GitHub, PR comments, docs, ChatGPT or screenshots.

## Why this setup is needed

Phase 3A moves SpendGrove from browser-local prototype storage toward secure account-based storage.

Before Codex continues with durable manual transactions or database writes, SpendGrove needs:

- Clerk for user sign-in and sign-up.
- Neon Postgres for durable database storage.
- Vercel environment variables so Preview and Production deployments can use those services safely.

Codex must pause before running any live database migration.

## 1. Clerk setup

### Create or open Clerk

1. Go to Clerk and create an account or sign in.
2. Create a new Clerk application for SpendGrove, or select the existing SpendGrove Clerk application if one already exists.
3. Use separate Clerk environments for development/testing and production where Clerk offers that option.

### Recommended sign-in methods for MVP

For the MVP account foundation, keep sign-in simple:

- Email address sign-in.
- Password or email code/magic link, depending on the Clerk project defaults and client preference.

Recommended starting point:

- Enable email-based sign-in.
- Avoid adding many social login providers until the core account/database flow is stable.
- Do not enable enterprise SSO, organisation features or advanced auth options unless separately approved.

### Find the Clerk keys

In the Clerk dashboard, find the API keys for the SpendGrove application.

You need two values:

| SpendGrove environment variable | Clerk value |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key. It usually starts with `pk_`. |
| `CLERK_SECRET_KEY` | Clerk secret key. It usually starts with `sk_`. |

Safety notes:

- The publishable key is client-visible, but still should be managed through Vercel environment variables.
- The secret key must stay private.
- Do not paste either key into GitHub comments, PR text, docs, ChatGPT or screenshots.

## 2. Neon setup

### Create the Neon project/database

1. Go to Neon and create an account or sign in.
2. Create a new Neon project for SpendGrove.
3. Create or select the default database for SpendGrove.
4. Confirm the database is new/empty before Codex runs the first migration.

Important:

- A new/empty database is strongly recommended for the first SpendGrove migration.
- If the database is not empty, stop and tell Codex before any migration is planned.

### Find the connection strings

Neon usually provides different connection options.

SpendGrove needs two connection strings:

| SpendGrove environment variable | Neon value |
|---|---|
| `DATABASE_URL` | Pooled/runtime connection string for the app. This is the connection the deployed app should use during normal runtime. |
| `DIRECT_DATABASE_URL` | Direct database connection string for migrations/admin tasks. This should be used for Prisma migrations, not normal app runtime. |

Safety notes:

- Both values are secrets.
- Do not paste either connection string into GitHub comments, PR text, docs, ChatGPT or screenshots.
- Do not commit them to the repository.

## 3. Vercel setup

### Add environment variables in Vercel

1. Open the SpendGrove project in Vercel.
2. Go to project settings.
3. Open the Environment Variables section.
4. Add these variables:

| Variable | Use |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key. |
| `CLERK_SECRET_KEY` | Clerk secret key. |
| `DATABASE_URL` | Neon pooled/runtime database URL. |
| `DIRECT_DATABASE_URL` | Neon direct migration/admin database URL. |

Add each variable to:

- Preview.
- Production.

If Vercel offers separate Development values, those can be added later for local workflows, but do not paste secrets into repository files.

### Retry or trigger deployment

After adding environment variables:

1. Go to the latest deployment in Vercel.
2. Use Redeploy or Retry Deployment.
3. Confirm the deployment finishes successfully.

If the build fails, do not paste secret values into the error report. Share only the safe error message and deployment status.

## 4. Local development note

For local development, secrets belong only in `.env.local`.

Rules:

- Use `.env.local` for local secrets.
- Do not commit `.env.local`.
- Do not paste `.env.local` contents into PRs, docs, GitHub comments, ChatGPT or logs.
- Do not include real Clerk keys or Neon URLs in screenshots.

The repository may include `.env.example`, but that file must contain placeholders only.

## 5. Client verification checklist

After setup, confirm the following without sharing secret values:

- [ ] Clerk application exists for SpendGrove.
- [ ] Recommended MVP email sign-in method is enabled.
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is added to Vercel Preview.
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is added to Vercel Production.
- [ ] `CLERK_SECRET_KEY` is added to Vercel Preview.
- [ ] `CLERK_SECRET_KEY` is added to Vercel Production.
- [ ] Neon project/database exists for SpendGrove.
- [ ] Neon database is confirmed new/empty.
- [ ] `DATABASE_URL` uses the Neon pooled/runtime connection string.
- [ ] `DATABASE_URL` is added to Vercel Preview.
- [ ] `DATABASE_URL` is added to Vercel Production.
- [ ] `DIRECT_DATABASE_URL` uses the Neon direct migration/admin connection string.
- [ ] `DIRECT_DATABASE_URL` is added to Vercel Preview.
- [ ] `DIRECT_DATABASE_URL` is added to Vercel Production.
- [ ] No secrets have been committed to GitHub.
- [ ] No secrets have been pasted into PRs, docs, comments, logs or ChatGPT.
- [ ] Vercel deployment has been retried or triggered after env vars were added.
- [ ] Vercel build is green.
- [ ] Sign-in page loads.
- [ ] Sign-up page loads.
- [ ] Existing public/browser-local app screens remain accessible where expected.

## 6. Codex continuation instructions

After the client confirms setup is complete, Codex should:

1. Verify Vercel build status.
2. Verify Clerk environment detection without printing secret values.
3. Verify database environment detection without printing connection strings.
4. Confirm whether the Neon database is new/empty.
5. Pause before running any live database migration.
6. Provide the exact Prisma migration plan before executing it.
7. Wait for client approval of that migration plan.
8. Continue Phase 3A under Autonomous Phase Delivery Mode after migration approval.

Codex must not:

- create external accounts unless explicitly authorised;
- ask the client to paste secrets into GitHub, PR text, docs, comments, logs or ChatGPT;
- commit real secrets, database URLs or Clerk keys;
- run live migrations before the migration plan is approved;
- add product persistence before the environment and migration path are approved;
- begin PR 3A.3 before setup is confirmed and the migration plan is approved;
- add loans, property/tax reports, recurring, budgets, Basiq, AI, payments or later-phase modules.

## 7. What to tell Codex when ready

When setup is complete, send a message like:

> Clerk and Neon are configured in Vercel Preview and Production. The Neon database is new/empty. Please verify status and provide the exact migration plan before running any migration.

Do not include the actual keys or connection strings in that message.
