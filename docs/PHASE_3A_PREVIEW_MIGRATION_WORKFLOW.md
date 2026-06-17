# Phase 3A Preview Migration Workflow Guide

This guide explains how to run the first SpendGrove Preview database migration without using local terminal commands.

The migration workflow is manual-only. It does not run automatically on push or pull request.

## What this workflow does

The GitHub Actions workflow applies the already-committed Prisma migrations to the Neon Preview database only.

It runs:

```text
npx prisma migrate deploy --schema prisma/schema.prisma
```

It does not:

- run Production migrations;
- run automatically;
- run `prisma migrate reset`;
- run destructive database commands;
- add product persistence;
- create transactions;
- import CSV rows;
- store raw CSVs or private bank data.

## Secrets required

Add two GitHub repository secrets:

| GitHub secret name | What to use |
|---|---|
| `NEON_PREVIEW_DATABASE_URL` | Neon Preview pooled/runtime connection string. |
| `NEON_PREVIEW_DIRECT_DATABASE_URL` | Neon Preview direct/unpooled migration/admin connection string. |

The workflow maps those secrets internally to Prisma’s expected names:

| Prisma runtime name | GitHub secret source |
|---|---|
| `DATABASE_URL` | `NEON_PREVIEW_DATABASE_URL` |
| `DIRECT_DATABASE_URL` | `NEON_PREVIEW_DIRECT_DATABASE_URL` |

## Important safety rules

Do not paste database values into:

- GitHub PRs;
- GitHub comments;
- repository docs;
- ChatGPT/Codex messages;
- screenshots;
- logs.

Only place the values in GitHub repository secrets.

## Add the GitHub secrets

1. Open the SpendGrove repository on GitHub.
2. Go to **Settings**.
3. In the left sidebar, open **Secrets and variables**.
4. Choose **Actions**.
5. Click **New repository secret**.
6. Add this secret:
   - Name: `NEON_PREVIEW_DATABASE_URL`
   - Secret: paste the Neon Preview pooled/runtime connection string.
7. Click **Add secret**.
8. Click **New repository secret** again.
9. Add this secret:
   - Name: `NEON_PREVIEW_DIRECT_DATABASE_URL`
   - Secret: paste the Neon Preview direct/unpooled migration/admin connection string.
10. Click **Add secret**.

GitHub will hide the secret values after they are saved.

## Run the Preview migration workflow

1. Open the SpendGrove repository on GitHub.
2. Click the **Actions** tab.
3. In the workflow list, choose **Preview Prisma Migration**.
4. Click **Run workflow**.
5. Keep the branch set to `main`.
6. In the confirmation box, type exactly:

```text
RUN PREVIEW MIGRATION
```

7. Click **Run workflow**.
8. Wait for the workflow run to finish.

## Successful result

A successful run should show green checks for steps like:

- required Preview database secrets are present;
- dependencies installed;
- Prisma Client generated;
- Prisma schema validated;
- Preview migrations applied;
- Preview Prisma migration completed successfully.

The log should not show database connection strings or secret values.

## If the workflow fails

Do not paste secrets or full logs into ChatGPT, GitHub comments or PRs.

Safe information to share with Codex:

- the workflow failed;
- which step name failed;
- the short error message with any secret-looking values removed;
- whether the Neon database was new/empty;
- whether the two GitHub secrets were added.

If an error message contains a connection string, password, token, account name, database host, database user or other private value, remove that value before sharing.

## Safe message after success

After the workflow succeeds, send Codex this message:

```text
Preview migration succeeded using the GitHub Actions workflow. Please continue with PR 3A.3 durable manual transactions.
```

Do not include secret values in that message.

## What Codex should do next

After success, Codex should:

1. Verify the GitHub Actions workflow run status without printing secrets.
2. Confirm the Preview migration succeeded.
3. Continue Phase 3A under Autonomous Phase Delivery Mode.
4. Begin PR 3A.3 for durable manual transactions only.

Codex must still not run Production migrations until explicitly approved.
