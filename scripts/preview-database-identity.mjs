import { validatePreviewConnectionIdentity } from "./preview-database-identity-core.mjs";

const result = validatePreviewConnectionIdentity({
  databaseUrl: process.env.DATABASE_URL ?? "",
  directDatabaseUrl: process.env.DIRECT_DATABASE_URL ?? "",
  expectedPooledHost: process.env.EXPECTED_PREVIEW_POOLED_HOST ?? "",
  expectedDirectHost: process.env.EXPECTED_PREVIEW_DIRECT_HOST ?? "",
  expectedDatabase: process.env.EXPECTED_PREVIEW_DATABASE ?? "",
});

if (!result.ok) {
  console.error(`Preview database identity check failed: ${result.code}. Connection values are not printed.`);
  process.exitCode = 1;
} else {
  console.log("Preview database identity confirmed for the pinned isolated Neon Preview endpoint. Connection values are not printed.");
}
